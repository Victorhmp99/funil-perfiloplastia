  // =========================================================
  // MOTOR — não edite. Tudo que muda por cliente está no config.js.
  // =========================================================

  const PERGUNTAS = CONFIG.perguntas || [];
  const ETAPAS_FIXAS = 3; // nome, instagram, telefone
  const totalSteps = ETAPAS_FIXAS + PERGUNTAS.length;
  let stepIndex = 0;

  // Respostas: os 3 campos fixos + uma chave por pergunta do config.
  const answers = { nome: '', instagram: '', whatsapp: '', nivel: '' };
  PERGUNTAS.forEach(p => { answers[p.id] = ''; answers[p.id + 'Label'] = ''; });

  const screens = ['screen-cover', 'screen-name', 'screen-instagram', 'screen-phone']
    .concat(PERGUNTAS.map(p => 'screen-' + p.id))
    .concat(['screen-agendar', 'screen-thanks']);

  function nivelDoLead() {
    return CONFIG.classificar(answers);
  }

  // ---------- Montagem da interface a partir do config ----------
  function escaparHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Na headline, {texto entre chaves} vira a tarja de destaque.
  function headlineComDestaque(txt) {
    return escaparHtml(txt).replace(/\{([^}]+)\}/g, '<span class="hl">$1</span>');
  }

  function montarInterface() {
    const c = CONFIG.copy;

    // GTM noscript
    const nos = document.getElementById('gtmNoscript');
    if (nos && CONFIG.tracking.gtmId) {
      nos.src = 'https://www.googletagmanager.com/ns.html?id=' + CONFIG.tracking.gtmId;
    }

    // Capa
    document.getElementById('coverHeadline').innerHTML = headlineComDestaque(c.capa.headline);
    document.getElementById('coverBullets').innerHTML = c.capa.bullets.map(b =>
      '<li><span class="b-emoji">' + escaparHtml(b.emoji) + '</span>' + escaparHtml(b.texto) + '</li>'
    ).join('');
    document.getElementById('coverFooter').textContent = c.capa.rodape;
    document.getElementById('btn-cover-start').textContent = c.capa.cta;

    // Etapas fixas
    const marcaObrigatorio = ' <span class="required-mark">*</span>';
    document.getElementById('nameTitle').innerHTML = escaparHtml(c.nome.titulo) + marcaObrigatorio;
    document.getElementById('nameInput').placeholder = c.nome.placeholder;
    document.getElementById('instagramTitle').innerHTML = escaparHtml(c.instagram.titulo) + marcaObrigatorio;
    document.getElementById('instagramInput').placeholder = c.instagram.placeholder;
    document.getElementById('phoneTitle').innerHTML = escaparHtml(c.telefone.titulo) + marcaObrigatorio;
    document.getElementById('whatsappInput').placeholder = c.telefone.placeholder;

    // Rótulo "Etapa N de M" das telas fixas
    document.querySelectorAll('.step-label[data-step]').forEach(el => {
      el.textContent = 'Etapa ' + el.dataset.step + ' de ' + totalSteps;
    });

    // Telas de pergunta
    const alvo = document.getElementById('perguntas');
    alvo.innerHTML = PERGUNTAS.map((p, i) => {
      const numero = ETAPAS_FIXAS + i + 1;
      const anterior = i === 0 ? 'screen-phone' : 'screen-' + PERGUNTAS[i - 1].id;
      const aviso = p.aviso ? '<div class="rec-card"><p>' + p.aviso + '</p></div>' : '';
      const letras = 'ABCDEFGH';
      const opcoes = p.opcoes.map((o, j) =>
        '<button type="button" class="letter-option" data-value="' + escaparHtml(o.valor) + '">' +
        '<span class="letter-badge">' + letras[j] + '</span>' +
        '<span class="option-label">' + escaparHtml(o.label) + '</span></button>'
      ).join('');
      return '<div class="screen" id="screen-' + p.id + '">' +
        '<button type="button" class="back-btn" data-target="' + anterior + '">← Voltar</button>' +
        '<p class="step-label">Etapa ' + numero + ' de ' + totalSteps + '</p>' +
        aviso +
        '<h1 class="light-heading">' + escaparHtml(p.titulo) + marcaObrigatorio + '</h1>' +
        '<div class="letter-options">' + opcoes + '</div>' +
        '</div>';
    }).join('');

    // Telas finais
    document.getElementById('agendarTitulo').textContent = c.agendamento.titulo;
    document.getElementById('btnAgendar').textContent = c.agendamento.linkFallback;
    document.getElementById('thanksTitulo').innerHTML = '<strong>' + escaparHtml(c.obrigado.titulo) + '</strong>';
    document.getElementById('thanksTexto').innerHTML = c.obrigado.texto;
  }

  montarInterface();

  function showScreen(id) {
    screens.forEach(s => {
      const el = document.getElementById(s);
      if (el) el.classList.remove('active');
    });
    document.getElementById(id).classList.add('active');
    window.scrollTo(0, 0);
  }

  function updateProgress() {
    const pct = Math.min((stepIndex / totalSteps) * 100, 100);
    document.getElementById('progressBar').style.width = pct + '%';
  }



  // ---------- Eventos de dataLayer por etapa do formulário ----------
  function pushDataLayerEvent(eventName, extra) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: eventName }, extra || {}));
  }

  // ---------- Rastreio do Meta que viaja junto com o lead ----------
  // O CRM precisa do fbc/fbp pra conseguir casar o lead com o clique no
  // anuncio. Sem isso o lead chega orfao de atribuicao.
  const FBCLID_STORAGE_KEY = 'gh_fbclid';

  function lerCookie(nome) {
    const m = document.cookie.match(new RegExp('(?:^|;\\s*)' + nome + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : null;
  }

  // Roda na entrada. O fbclid so aparece na URL de quem veio do anuncio, e
  // guardamos com o horario da PRIMEIRA vez que o vimos — e esse timestamp que
  // o Meta espera dentro do fbc, nao o do envio.
  (function capturarFbclid() {
    try {
      const fbclid = new URLSearchParams(location.search).get('fbclid');
      if (!fbclid) return;
      const salvo = JSON.parse(localStorage.getItem(FBCLID_STORAGE_KEY) || 'null');
      // So sobrescreve se for um clique diferente (voltou por outro anuncio).
      if (salvo && salvo.fbclid === fbclid) return;
      localStorage.setItem(FBCLID_STORAGE_KEY, JSON.stringify({ fbclid: fbclid, ts: Date.now() }));
    } catch (_) { /* navegador sem localStorage nao pode quebrar o funil */ }
  })();

  function getFbc() {
    // 1o: o cookie que o proprio Pixel cria. E a fonte mais confiavel — ja vem
    // no formato certo e com o indice de subdominio correto.
    const doCookie = lerCookie('_fbc');
    if (doCookie) return doCookie;
    // 2o: montamos a partir do fbclid guardado na entrada (caso o Pixel ainda
    // nao tenha rodado ou o cookie tenha sido bloqueado).
    try {
      const salvo = JSON.parse(localStorage.getItem(FBCLID_STORAGE_KEY) || 'null');
      if (salvo && salvo.fbclid) return 'fb.1.' + salvo.ts + '.' + salvo.fbclid;
    } catch (_) { /* sem localStorage, segue sem fbc */ }
    return null;
  }

  // _fbp e criado pelo Pixel sozinho e identifica o navegador.
  function getFbp() {
    return lerCookie('_fbp');
  }

  // ---------- Notificações de novo lead (Telegram + WhatsApp) ----------

  // Uma fonte unica pro texto: Telegram e WhatsApp mandam exatamente a mesma
  // coisa, e a primeira linha diz de qual funil veio — varios funis dividem os
  // mesmos numeros e o mesmo pipeline, entao sem a origem ninguem sabe.
  function buildLeadMessage(nivel) {
    const rotulo = { A: "NIVEL A - QUALIFICADO", B: "NIVEL B - QUALIFICADO", C: "NIVEL C - DESQUALIFICADO" };
    const status = rotulo[nivel] || nivel;
    // As linhas das perguntas saem do config: adicionar uma pergunta lá já
    // faz ela aparecer no aviso, sem mexer aqui.
    const linhasPerguntas = PERGUNTAS.map(p =>
      p.titulo.toUpperCase().replace(/[?:]/g, '') + " : " + (answers[p.id + 'Label'] || '')
    ).join("\n");

    return "NOVO LEAD - " + (CONFIG.origem || 'SEM ORIGEM') + "\nSTATUS : " + status + "\n\n" +
      "NOME : " + (answers.nome || '') + "\n" +
      "TELEFONE : " + (answers.whatsapp || '') + "\n" +
      "INSTAGRAM : " + (answers.instagram || '') + "\n" +
      linhasPerguntas;
  }

  function sendWhatsAppNotification(nivel) {
    if (!CONFIG.whatsappAviso.ativo) return;
    const message = buildLeadMessage(nivel);
    CONFIG.whatsappAviso.destinatarios.forEach(r => {
      const url = "https://api.callmebot.com/whatsapp.php?phone=" + encodeURIComponent(r.phone) +
        "&text=" + encodeURIComponent(message) + "&apikey=" + encodeURIComponent(r.apikey);
      fetch(url, { mode: 'no-cors' }).catch(err => console.error('Erro ao notificar WhatsApp:', err));
    });
  }

  // Edge Function do Supabase: o token do bot fica no servidor, aqui so viaja
  // o secret de chamada.
  function sendTelegramNotification(nivel) {
    const t = CONFIG.telegramAviso || {};
    if (!t.ativo || !t.url) return;
    fetch(t.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: t.secret,
        message: buildLeadMessage(nivel),
        extra_recipients: t.extraRecipients || []
      })
    }).catch(err => console.error('Erro ao notificar Telegram:', err));
  }

  // ---------- Envio pro CRM ----------
  // Dispara em 2 momentos: depois do telefone (cria o lead — o CRM dedupe pelo
  // número) e no final, depois do investimento (atualiza o mesmo card).
  let webhookQueue = Promise.resolve();
  function sendToWebhook() {
    webhookQueue = webhookQueue.then(() => sendToWebhookNow());
    return webhookQueue;
  }

  async function sendToWebhookNow() {
    if (!CONFIG.crm.ativo || !CONFIG.crm.url) return;
    const hpValue = (document.getElementById('hpField') || {}).value || '';

    // Monta os campos personalizados a partir de CONFIG.crm.campos:
    // { nome_do_campo_no_crm: "id_da_resposta" }
    const custom = {};
    Object.keys(CONFIG.crm.campos || {}).forEach(campoCrm => {
      const id = CONFIG.crm.campos[campoCrm];
      if (id === 'whatsapp') {
        custom[campoCrm] = Number(answers.whatsapp) || answers.whatsapp;
      } else if (Object.prototype.hasOwnProperty.call(answers, id + 'Label')) {
        // Pergunta de múltipla escolha: manda o texto da opção, não o código.
        // Fica vazio quando a pessoa larga o formulário antes de responder.
        custom[campoCrm] = answers[id + 'Label'] || '';
      } else {
        custom[campoCrm] = answers[id] || '';
      }
    });

    try {
      await fetch(CONFIG.crm.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: CONFIG.crm.tenantId,
          webhook_key: CONFIG.crm.key,
          pipeline_id: CONFIG.crm.pipelineId,
          name: answers.nome,
          phone: answers.whatsapp,
          source_campaign: CONFIG.origem || null,
          // Rastreio do Meta. Enviado em toda chamada: na 1a cria o lead com o
          // fbc, nas seguintes o CRM so reaproveita o que ja tem.
          fbc: getFbc(),
          fbp: getFbp(),
          _hp: hpValue,
          custom_fields: custom
        })
      });
    } catch (err) {
      console.error('Erro ao enviar pro webhook:', err);
    }
  }

  // ---------- Capa ----------
  document.getElementById('btn-cover-start').addEventListener('click', () => {
    stepIndex = 1;
    updateProgress();
    pushDataLayerEvent('iniciou_formulario');
    carregarCalendly(); // baixa o widget bem antes da tela final
    showScreen('screen-name');
    document.getElementById('nameInput').focus();
  });

  // ---------- Validação anti-teste/anti-curioso ----------
  const FAKE_NAME_STEMS = [
    'teste', 'testand', 'testar', 'testad', 'testing', 'tester',
    'valid', 'verific', 'checand', 'checagem', 'conferind', 'conferir',
    'exempl', 'amostr', 'sample', 'demonstr', 'rascunh', 'provand',
    'simul', 'dummy', 'placehold', 'generic', 'padrao',
    'lorem', 'ipsum', 'falso', 'falsa', 'mentira', 'brincadeir', 'brincand',
    'temporari', 'xpto', 'foobar',
    'fulano', 'ciclano', 'beltrano', 'seunome'
  ];
  const FAKE_NAME_EXACT = new Set([
    'demo', 'temp', 'foo', 'bar', 'abc', 'abcd', 'abcde', 'abcdef',
    'asdf', 'asdfg', 'asdfgh', 'qwerty', 'qwe',
    'nao', 'naosei', 'sei', 'sla', 'oi', 'ola', 'kkk', 'kkkk',
    'nada', 'vazio', 'embranco', 'qualquer', 'aaa', 'bbb', 'ccc',
    'nome', 'sobrenome', 'xxxx', 'yyyy', 'zzzz',
    // teclado amassado que passa nas outras regras por ter vogal
    'asd', 'asda', 'asdas', 'asdasd', 'asdasda', 'sda', 'sad', 'dsa',
    'zxc', 'zxcv', 'qaz', 'wsx', 'edc', 'lkj', 'lkjh', 'poiu', 'aoi'
  ]);

  // Linhas do teclado: usadas pra detectar sequência digitada de enfiada
  // (asdf, qwer, zxcv…). Nome real nunca tem 4 teclas vizinhas em sequência.
  const KEYBOARD_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm', '1234567890'];
  const VOWELS = new Set(['a', 'e', 'i', 'o', 'u', 'y']);
  // Partículas de nome — curtas e sem vogal suficiente, ficam fora das checagens
  const NAME_PARTICLES = new Set(['de', 'da', 'do', 'dos', 'das', 'e', 'di', 'du', 'del', 'la', 'van', 'von', 'bin', 'al']);

  function hasKeyboardRun(word) {
    if (word.length < 4) return false;
    for (const row of KEYBOARD_ROWS) {
      const rev = row.split('').reverse().join('');
      for (let i = 0; i <= word.length - 4; i++) {
        const chunk = word.slice(i, i + 4);
        if (row.includes(chunk) || rev.includes(chunk)) return true;
      }
    }
    return false;
  }

  function maxConsonantRun(word) {
    let run = 0, max = 0;
    for (const ch of word) {
      if (/[a-z]/.test(ch) && !VOWELS.has(ch)) { run++; if (run > max) max = run; }
      else run = 0;
    }
    return max;
  }

  function isRepeatedDigits(s) {
    return /^(\d)\1+$/.test(s);
  }

  function isSequentialDigits(s) {
    let asc = true, desc = true;
    for (let i = 1; i < s.length; i++) {
      if (+s[i] !== +s[i - 1] + 1) asc = false;
      if (+s[i] !== +s[i - 1] - 1) desc = false;
    }
    return asc || desc;
  }

  function isFakeName(rawName) {
    const norm = normalizeText(rawName.trim());
    if (!norm) return true;
    const compact = norm.replace(/\s+/g, '');
    if (compact.length < 4) return true;
    if (!/[a-z]/.test(compact)) return true;
    if (/^(.)\1+$/.test(compact)) return true;
    const words = norm.split(/\s+/).filter(Boolean);
    if (words.length < 2) return true; // exige nome + sobrenome
    const strippedWords = words.map((w) => w.replace(/[0-9]+$/, ''));
    if (strippedWords.some((w) => FAKE_NAME_EXACT.has(w))) return true;
    if (strippedWords.some((w) => FAKE_NAME_STEMS.some((stem) => w.includes(stem)))) return true;

    // Mesma palavra repetida ("asdas asdas"): ninguém se chama assim.
    const significant = strippedWords.filter((w) => w.length >= 3 && !NAME_PARTICLES.has(w));
    if (significant.length >= 2 && new Set(significant).size === 1) return true;

    for (const w of significant) {
      // Toda palavra de nome real tem vogal — "sdfg", "jkl" não têm.
      if (![...w].some((ch) => VOWELS.has(ch))) return true;
      // Sequência de teclas vizinhas: asdf, qwer, zxcv…
      if (hasKeyboardRun(w)) return true;
      // 5+ consoantes seguidas não existe nem em sobrenome estrangeiro
      // (o pior caso real, "Szczepan"/"Schwartz", chega a 4).
      if (maxConsonantRun(w) >= 5) return true;
    }
    return false;
  }

  // ---------- Instagram ----------
  // Regras reais do @: 2 a 30 caracteres, só letras, números, ponto e underscore,
  // sem ponto no começo/fim e sem dois pontos seguidos. Antes o campo aceitava
  // qualquer coisa — "@meu perfil", "@joão", "@!!!" passavam direto.
  const INSTAGRAM_HANDLE_RE = /^(?!\.)(?!.*\.\.)(?!.*\.$)[A-Za-z0-9._]{2,30}$/;

  // Muita gente cola o link do perfil em vez do @ — extraímos o usuário do link
  // em vez de reclamar (evita perder lead por causa de formato).
  function normalizeInstagramHandle(raw) {
    let v = String(raw || '').trim();
    const fromUrl = v.match(/(?:instagram\.com|instagr\.am)\/+([^/?#\s]+)/i);
    if (fromUrl) v = fromUrl[1];
    return v.replace(/^@+/, '').trim();
  }

  // Propositalmente conservador: só pega o que é inequivocamente lixo.
  // NÃO usamos FAKE_NAME_STEMS aqui — perfil real do nicho pode conter "teste"
  // dentro de outra palavra (ex: @testosterona.clinic).
  function isFakeInstagram(handle) {
    const core = normalizeText(handle).replace(/[._0-9]/g, '');
    if (!core) return true;                      // só pontos, números ou underscore
    if (FAKE_NAME_EXACT.has(core)) return true;  // @asdas, @qwerty, @demo
    if (hasKeyboardRun(core)) return true;       // @asdfgh
    return false;
  }

  const VALID_BR_DDDS = new Set([
    11, 12, 13, 14, 15, 16, 17, 18, 19,
    21, 22, 24, 27, 28,
    31, 32, 33, 34, 35, 37, 38,
    41, 42, 43, 44, 45, 46, 47, 48, 49,
    51, 53, 54, 55,
    61, 62, 63, 64, 65, 66, 67, 68, 69,
    71, 73, 74, 75, 77, 79,
    81, 82, 83, 84, 85, 86, 87, 88, 89,
    91, 92, 93, 94, 95, 96, 97, 98, 99
  ]);

  function isFakePhone(digits, isBrazil) {
    if (digits.length < 8) return true;
    if (isRepeatedDigits(digits)) return true;
    if (digits.length >= 6 && isSequentialDigits(digits)) return true;
    if (isBrazil) {
      if (digits.length !== 10 && digits.length !== 11) return true;
      const ddd = Number(digits.slice(0, 2));
      if (!VALID_BR_DDDS.has(ddd)) return true;
      const local = digits.slice(2);
      if (isRepeatedDigits(local)) return true;
      if (digits.length === 11 && local[0] !== '9') return true;
      const localCore = digits.length === 11 ? local.slice(1) : local;
      if (localCore.length >= 5 && (isRepeatedDigits(localCore) || isSequentialDigits(localCore))) return true;
    }
    return false;
  }

  // ---------- Nome ----------
  document.getElementById('nameSubmit').addEventListener('click', submitName);
  document.getElementById('nameInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') submitName();
  });

  function submitName() {
    const nameInput = document.getElementById('nameInput');
    const errorEl = document.getElementById('nameError');
    const value = nameInput.value.trim();

    if (isFakeName(value)) {
      errorEl.textContent = CONFIG.copy.nome.erro;
      errorEl.style.display = 'block';
      return;
    }
    errorEl.style.display = 'none';
    answers.nome = value;
    stepIndex = 2;
    updateProgress();
    pushDataLayerEvent('colocou_nome');
    showScreen('screen-instagram');
    document.getElementById('instagramInput').focus();
  }

  // ---------- Instagram ----------
  document.getElementById('instagramSubmit').addEventListener('click', submitInstagram);
  document.getElementById('instagramInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') submitInstagram();
  });

  function submitInstagram() {
    const instagramInput = document.getElementById('instagramInput');
    const errorEl = document.getElementById('instagramError');
    const handle = normalizeInstagramHandle(instagramInput.value);

    if (!handle) {
      errorEl.textContent = CONFIG.copy.instagram.erro;
      errorEl.style.display = 'block';
      return;
    }
    if (!INSTAGRAM_HANDLE_RE.test(handle) || isFakeInstagram(handle)) {
      errorEl.textContent = CONFIG.copy.instagram.erroInvalido
        || 'Esse @ não parece válido. Use seu perfil real (ex: dra.marina.silva).';
      errorEl.style.display = 'block';
      return;
    }
    errorEl.style.display = 'none';
    // Devolve o @ já limpo pro campo: se a pessoa colou o link do perfil,
    // ela vê exatamente qual usuário foi entendido.
    instagramInput.value = '@' + handle;
    answers.instagram = '@' + handle;
    stepIndex = 3;
    updateProgress();
    pushDataLayerEvent('colocou_instagram');
    showScreen('screen-phone');
    document.getElementById('whatsappInput').focus();
  }

  // ---------- Telefone: seletor de país ----------
  let selectedCountry = PAISES[0];

  function flagEmoji(iso2) {
    return String.fromCodePoint(...[...iso2.toUpperCase()].map(ch => 127397 + ch.charCodeAt(0)));
  }

  function normalizeText(str) {
    return str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  function renderCountryList(filter) {
    const list = document.getElementById('countryList');
    const q = normalizeText((filter || '').trim());
    const filtered = PAISES.filter(c => normalizeText(c.name).includes(q) || c.code.includes(q));
    list.innerHTML = filtered.map(c => `
      <button type="button" class="country-option" data-iso="${c.iso}">
        <span><span class="cflag">${flagEmoji(c.iso)}</span>${c.name}</span>
        <span class="ccode">${c.code}</span>
      </button>
    `).join('');
    list.querySelectorAll('.country-option').forEach(btn => {
      btn.addEventListener('click', () => selectCountry(btn.dataset.iso));
    });
  }

  function selectCountry(iso) {
    const c = PAISES.find(x => x.iso === iso);
    if (!c) return;
    selectedCountry = c;
    document.getElementById('countryFlag').textContent = flagEmoji(c.iso);
    document.getElementById('countryCode').textContent = c.code;
    closeDropdown();
    document.getElementById('whatsappInput').focus();
  }

  function openDropdown() {
    document.getElementById('countryDropdown').classList.add('open');
    document.getElementById('countrySearch').value = '';
    renderCountryList('');
    document.getElementById('countrySearch').focus();
  }

  function closeDropdown() {
    document.getElementById('countryDropdown').classList.remove('open');
  }

  document.getElementById('countryBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('countryDropdown').classList.contains('open') ? closeDropdown() : openDropdown();
  });
  document.getElementById('countrySearch').addEventListener('input', (e) => {
    renderCountryList(e.target.value);
  });
  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('countryDropdown');
    if (!dropdown.contains(e.target) && e.target.id !== 'countryBtn') closeDropdown();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDropdown();
  });

  // ---------- Telefone ----------
  document.getElementById('phoneSubmit').addEventListener('click', submitPhone);
  document.getElementById('whatsappInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') submitPhone();
  });

  function submitPhone() {
    const phoneInput = document.getElementById('whatsappInput');
    const errorEl = document.getElementById('phoneError');
    const digits = phoneInput.value.replace(/\D/g, '');
    const isBrazil = selectedCountry.iso === 'BR';

    if (isFakePhone(digits, isBrazil)) {
      errorEl.textContent = isBrazil
        ? CONFIG.copy.telefone.erroBR
        : CONFIG.copy.telefone.erroInternacional;
      errorEl.style.display = 'block';
      return;
    }
    errorEl.style.display = 'none';
    answers.whatsapp = selectedCountry.code.replace('+', '') + digits;
    stepIndex = 4;
    updateProgress();
    pushDataLayerEvent('colocou_telefone');
    // Primeiro envio: cria o lead no CRM com nome, instagram e telefone
    sendToWebhook();
    // Sem perguntas de qualificação no config, o lead já fecha aqui.
    if (!PERGUNTAS.length) { fecharLead(nivelDoLead()); return; }
    showScreen('screen-' + PERGUNTAS[0].id);
  }

  // ---------- Perguntas de qualificação (vindas do config) ----------
  // A cada resposta o CRM é atualizado: se a pessoa largar o formulário no
  // meio, o card já fica com o que ela respondeu até ali.
  // Na última pergunta, em vez de avançar, o lead é fechado e classificado.
  PERGUNTAS.forEach((p, i) => {
    const ultima = i === PERGUNTAS.length - 1;
    document.querySelectorAll('#screen-' + p.id + ' .letter-option').forEach(btn => {
      btn.addEventListener('click', () => {
        answers[p.id] = btn.dataset.value;
        answers[p.id + 'Label'] = btn.querySelector('.option-label').textContent;

        stepIndex = ETAPAS_FIXAS + i + 1;
        updateProgress();

        const dados = {};
        dados[p.id] = answers[p.id];
        pushDataLayerEvent(p.evento || ('respondeu_' + p.id), dados);

        if (ultima) {
          fecharLead(nivelDoLead());
          return;
        }
        sendToWebhook();
        showScreen('screen-' + PERGUNTAS[i + 1].id);
      });
    });
  });

  // ---------- Fecha o lead: classifica, avisa todo mundo e mostra a tela final ----------
  async function fecharLead(nivel) {
    answers.nivel = nivel;
    stepIndex = totalSteps;
    updateProgress();

    // Um evento por nível (acionador direto no GTM) + um genérico com o nível
    // como parâmetro, pra quem preferir resolver com uma tag só.
    // As respostas de todas as perguntas do config vão junto.
    const dados = { nivel: nivel };
    PERGUNTAS.forEach(p => { dados[p.id] = answers[p.id] || null; });
    pushDataLayerEvent('lead_nivel_' + nivel.toLowerCase(), dados);
    pushDataLayerEvent('lead_classificado', dados);

    // Atualiza o card no CRM com as respostas finais
    await sendToWebhook();

    // Notifica o time sobre o novo lead
    sendWhatsAppNotification(nivel);
    sendTelegramNotification(nivel);

    if (nivel === 'C') {
      showScreen('screen-thanks');
      return;
    }
    // Sem Calendly configurado, todo mundo cai na tela de obrigado.
    if (!CONFIG.calendly.ativo || !CONFIG.calendly.url) {
      showScreen('screen-thanks');
      return;
    }
    mostrarAgendamento(CONFIG.copy.agendamento.subtitulo);
  }

  // ---------- Calendly embutido ----------
  // Estratégia de velocidade:
  //   1. preconnect no <head> — DNS + TLS já resolvidos;
  //   2. script do widget baixado assim que a pessoa clica no CTA da capa.
  // Quando a tela final aparece só falta o documento do Calendly (~0,6s).
  // Montar o iframe antes da hora não adianta: o navegador não renderiza
  // iframe fora da tela, e o Calendly aparece em branco quando é revelado —
  // testado, não use. Enquanto carrega, o esqueleto abaixo segura a tela.
  let calendlyScript = null;
  function carregarCalendly() {
    if (!calendlyScript) {
      calendlyScript = new Promise((resolve, reject) => {
        const tag = document.createElement('script');
        tag.src = 'https://assets.calendly.com/assets/external/widget.js';
        tag.async = true;
        tag.onload = resolve;
        tag.onerror = reject;
        document.head.appendChild(tag);
      });
    }
    return calendlyScript;
  }

  // Monta a URL do Calendly já com os dados do lead. O objeto `prefill` do
  // widget não chega no iframe — quem preenche de verdade é a query string
  // (name = nome; a1 = 1ª pergunta personalizada do evento, o WhatsApp).
  // primary_color deixa o Calendly na cor do formulário.
  function urlCalendly() {
    const params = new URLSearchParams({
      hide_gdpr_banner: '1',
      primary_color: String(CONFIG.cores.primaria).replace('#', ''),
      name: answers.nome,
      a1: '+' + answers.whatsapp
    });
    return CONFIG.calendly.url + (CONFIG.calendly.url.includes('?') ? '&' : '?') + params.toString();
  }

  // O "carregando" sai quando o Calendly avisa que pintou a tela dele — o
  // evento `load` do iframe não serve: dispara antes da interface aparecer
  // (medido: ~1s de diferença). O timeout de 8s é só rede de segurança.
  function esconderEsqueleto() {
    document.getElementById('calendlySkeleton').classList.add('fim');
  }

  // Se em 12s o Calendly não deu sinal de vida (rede, adblock, embed bloqueado),
  // o esqueleto vira um caminho de saída: agendar em outra aba. Melhor do que
  // deixar a pessoa olhando pra um retângulo vazio.
  function esqueletoVirouSaida() {
    const esqueleto = document.getElementById('calendlySkeleton');
    if (esqueleto.classList.contains('fim')) return; // o calendário apareceu
    esqueleto.classList.add('erro');
    esqueleto.textContent = '';

    const aviso = document.createElement('p');
    aviso.style.margin = '0';
    aviso.textContent = 'O calendário não abriu aqui. Sem problema — dá pra agendar na página do Calendly.';

    const botao = document.createElement('a');
    botao.className = 'primary-btn';
    botao.href = urlCalendly();
    botao.target = '_blank';
    botao.rel = 'noopener';
    botao.textContent = 'AGENDAR EM OUTRA ABA \u2197';
    botao.addEventListener('click', () => {
      pushDataLayerEvent('clicou_agendar', { nivel: answers.nivel });
    });

    esqueleto.appendChild(aviso);
    esqueleto.appendChild(botao);
  }

  function montarCalendly() {
    const box = document.getElementById('calendlyBox');
    if (box.dataset.pronto === '1') return;
    box.dataset.pronto = '1';
    carregarCalendly().then(() => {
      window.Calendly.initInlineWidget({
        url: urlCalendly(),
        parentElement: box,
        prefill: {
          name: answers.nome,
          customAnswers: { a1: '+' + answers.whatsapp }
        }
      });
      setTimeout(esqueletoVirouSaida, 12000);
    }).catch(() => {
      // bloqueado (adblock/rede): sobra o link de abrir em outra aba
      box.dataset.pronto = '';
      console.warn('Calendly não carregou — usando o link externo.');
    });
  }

  function mostrarAgendamento(subtitulo) {
    document.getElementById('agendarSubtitulo').textContent = subtitulo;
    document.body.classList.add('tela-agendamento');
    showScreen('screen-agendar');
    montarCalendly();
  }

  let calendarioVisto = false;
  // O Calendly avisa por postMessage quando a reunião é marcada de verdade.
  window.addEventListener('message', (e) => {
    if (typeof e.origin !== 'string' || !/^https:\/\/([a-z0-9-]+\.)*calendly\.com$/.test(e.origin)) return;
    const evento = e.data && e.data.event;
    if (typeof evento !== 'string' || evento.indexOf('calendly.') !== 0) return;

    // qualquer aviso do Calendly já significa que a interface dele apareceu
    esconderEsqueleto();

    // Evento de "viu o calendário" — dispara uma vez só, e só quando o
    // calendário está de fato na tela (não quando a tela final aparece).
    if (!calendarioVisto) {
      calendarioVisto = true;
      pushDataLayerEvent('visualizou_calendario', { nivel: answers.nivel });
    }

    if (evento !== 'calendly.event_scheduled') return;
    pushDataLayerEvent('agendou_reuniao', { nivel: answers.nivel });
  });

  // ---------- Clique no link de agendar (fallback) ----------
  document.getElementById('btnAgendar').addEventListener('click', (e) => {
    e.currentTarget.href = urlCalendly();
    pushDataLayerEvent('clicou_agendar', { nivel: answers.nivel });
  });

  // ---------- Botão Voltar ----------
  const stepIndexByScreen = { 'screen-name': 1, 'screen-instagram': 2, 'screen-phone': 3 };
  PERGUNTAS.forEach((p, i) => { stepIndexByScreen['screen-' + p.id] = ETAPAS_FIXAS + i + 1; });
  document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      if (stepIndexByScreen[target]) {
        stepIndex = stepIndexByScreen[target];
        updateProgress();
      }
      showScreen(target);
    });
  });

  updateProgress();
