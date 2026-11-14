/**
 * Escudo Delta no Vercel (Routing Middleware). Só registra e bloqueia IP banido.
 *
 * - Varredura (.env, .git, wp-admin, injeção, scanner...) vai para a Edge
 *   Function `escudo-ingest` do CRM, que decide a nota com as mesmas regras de
 *   `supabase/functions/_shared/escudo.ts`. Nada é banido por aqui.
 * - IP com banimento manual ativo recebe 403 (lista em memória, renovada em
 *   segundo plano a cada 1 min; a renovação é também o "sinal de vida" do painel).
 * - Fail-open: sem ESCUDO_CHAVE, ingest fora do ar ou qualquer erro = segue normal.
 * - Plano Hobby: não usa o firewall da Vercel; a lógica mora aqui.
 * Regras: nucleo\conhecimento\seguranca\09-escudo-delta.md
 */
const INGEST = 'https://miezatcdfldmqmxgpkwr.supabase.co/functions/v1/escudo-ingest'

const ROTA = [
  /(\.\.\/|%2e%2e|\/etc\/passwd|union(\s|%20|\+)+select|<script|cmd=)/i,
  /(^|\/)\.(env|git|aws|ssh|svn|hg|htpasswd|npmrc|DS_Store|docker)(\/|$|\.|\b)/i,
  /(config\.(py|json|js|ya?ml|php)|secrets?\.(json|ya?ml)|credentials|id_rsa|\.cursor|mcp\.json|\.vscode|docker-compose)/i,
  /(wp-admin|wp-login|xmlrpc\.php|phpmyadmin|\.php(\?|$))/i,
]
const UA_SCANNER = /(sqlmap|nikto|nuclei|zgrab|masscan|nmap|gobuster|dirbuster|ffuf|wpscan|acunetix|nessus)/i
const TELEGRAM = [[0x959aa000, 0xfffff000], [0x5b6c0400, 0xfffffc00]] // 149.154.160.0/20, 91.108.4.0/22

function ipTelegram(ip) {
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(ip)) return false
  const n = ip.split('.').reduce((a, p) => (a << 8) + Number(p), 0) >>> 0
  return TELEGRAM.some(([base, mask]) => ((n & mask) >>> 0) === base)
}

// Vercel sobrescreve x-real-ip / x-forwarded-for na borda: o cliente não forja.
function ipDo(req) {
  return (req.headers.get('x-real-ip') || (req.headers.get('x-forwarded-for') || '').split(',')[0] || '').trim() || null
}

const chamar = (chave, corpo) => fetch(INGEST, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-escudo-chave': chave },
  body: JSON.stringify(corpo),
  signal: AbortSignal.timeout(2000),
})

let banidos = new Set()
let banidosEm = 0
async function renovar(chave) {
  try {
    const r = await chamar(chave, { acao: 'banidos' })
    if (r.ok) {
      const j = await r.json()
      if (Array.isArray(j.banidos)) banidos = new Set(j.banidos)
    }
  } catch { /* fail-open: mantém a lista anterior */ }
}

/**
 * @param {Request} req
 * @param {{ waitUntil?: (p: Promise<unknown>) => void } | undefined} ctx
 * @param {string[]} [ignorar] caminhos REAIS do projeto que casariam uma regra (ex.: '/config.js')
 * @returns {Promise<Response | undefined>} 403 para IP banido; undefined = segue
 */
export async function escudo(req, ctx, ignorar = []) {
  const chave = process.env.ESCUDO_CHAVE
  if (!chave) return undefined
  try {
    const depois = (p) => (ctx && typeof ctx.waitUntil === 'function' ? ctx.waitUntil(p) : p.catch(() => {}))
    if (Date.now() - banidosEm > 60_000) { banidosEm = Date.now(); depois(renovar(chave)) }

    const ip = ipDo(req)
    if (ip && !ipTelegram(ip) && banidos.has(ip)) return new Response('forbidden', { status: 403 })

    const url = new URL(req.url)
    if (ignorar.includes(url.pathname)) return undefined
    let caminho = url.pathname
    try { caminho = decodeURIComponent(url.pathname) } catch { /* analisa crua */ }
    const rota = caminho + (url.search.length < 300 ? url.search : '')
    const ua = req.headers.get('user-agent') || ''
    const suspeito = ROTA.some((re) => re.test(rota)) || UA_SCANNER.test(ua) ||
      (/telegrambot/i.test(ua) && !(ip && ipTelegram(ip)))
    if (suspeito) depois(chamar(chave, { acao: 'evento', ip, rota, metodo: req.method, ua: ua.slice(0, 300) }).catch(() => {}))
  } catch { /* fail-open */ }
  return undefined
}
