/* =========================================================================
   CONFIG DO CLIENTE — este é o ÚNICO arquivo que você edita por cliente.
   index.html, app.js, estilo.css e paises.js nunca são tocados.

   Funil: PERFILOPLASTIA (GreenHub → profissional de perfiloplastia)
   Público: dentista de HOF e cirurgião plástico, sem separar.
   Corte: quem fatura até 30k por mês não vê o calendário (nível C).

   Regras da casa que já estão embutidas aqui:
   - copy nunca cita preço, parcelamento ou desconto (isso é assunto do WhatsApp)
   - a capa segue o checklist: headline + bullets + rodapé de corte + CTA
   - bullets são nowrap: até ~30 caracteres, senão encolhem no celular
   ========================================================================= */

const CONFIG = {

  /* ---------- 1. IDENTIDADE ---------- */
  marca: {
    titulo: "Especialistas em Perfiloplastia",
    descricao: "Formulário de qualificação",
    fonte: {
      familia: "Lato",
      url: "https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,300;0,400;0,700;0,900;1,400&display=swap",
      pilha: "'Lato', 'Helvetica Neue', Helvetica, Arial, sans-serif"
    }
  },

  /* ---------- 2. CORES ----------
     Azul petróleo: lê como clínico/premium e não se confunde com o taupe
     da biomédica (#7A5747) nem com o rosé das maquiadoras (#8E4A63).
     Se a campanha tiver criativo próprio, trocar estas duas linhas. */
  cores: {
    texto: "#2E2621",
    fundo: "#ffffff",
    primaria: "#1F3A4D",
    destaque: "#DCE7EE"
  },

  /* ---------- 3. RASTREIO ----------
     Reaproveitado do funil-shark-v2: container já publicado e funcionando.
     O pixel 1001727392691930 já é a tag base deste GTM — não colar no HTML.
     Custo: relatório no Meta precisa ser separado por URL. */
  tracking: {
    // Container do funil-shark-v2, ja publicado. Os acionadores dele escutam
    // exatamente os nomes que o motor dispara (iniciou_formulario,
    // colocou_nome, colocou_instagram, colocou_telefone, colocou_faturamento,
    // colocou_investimento, lead_nivel_a/b/c, visualizou_calendario) — nao
    // mexer nos nomes. "Etapa1_IniciouForm" e companhia sao o nome do evento
    // do outro lado da tag, ja no Meta, nao o nome do acionador.
    // Conferido ao vivo em producao em 28/08/2026.
    gtmId: "GTM-K5K5SFP4"
  },

  /* ---------- 4. CRM (webhook) ----------
     Mesmo tenant/pipeline do Shark — os leads caem no mesmo pipeline. */
  crm: {
    ativo: true,
    url: "https://miezatcdfldmqmxgpkwr.supabase.co/functions/v1/receive-lead",
    tenantId: "8320459c-6a66-4b35-8e98-a237209ade7b",
    key: "276f6f75-446f-458b-b602-42ecbc7393b9",
    pipelineId: "bef88278-3275-406f-b53c-a7782f527569",
    campos: {
      nome_e_sobrenome: "nome",
      instagram: "instagram",
      whatsapp: "whatsapp",
      qual_seu_faturamento_medio_mensal: "faturamento",
      investiria_1000_reais_em_anuncio: "investimento"
    }
  },

  /* ---------- 5. AGENDAMENTO ----------
     Evento próprio deste funil. O slug ainda carrega o nome do evento de onde
     ele foi clonado ("...injetaveis-clone"), mas o TÍTULO já está certo —
     "🏆Especialistas em Perfiloplastia - Green Hub" (conferido em 29/08/2026),
     e é o título que o lead lê. O motor manda nome e WhatsApp na query string
     (name e a1); o objeto prefill do widget não chega no iframe. */
  calendly: {
    ativo: true,
    url: "https://calendly.com/assessoriagreenlab/especialistas-em-injetaveis-clone"
  },

  /* ---------- 5b. ORIGEM DO LEAD ----------
     Vai na 1a linha do aviso de WhatsApp/Telegram e como source_campaign no
     CRM. Varios funis dividem os mesmos numeros e o mesmo pipeline, entao sem
     isso ninguem sabe de qual funil o lead veio. */
  origem: "PERFILOPLASTIA",

  /* ---------- 6. AVISO DE LEAD NO WHATSAPP (CallMeBot) ---------- */
  whatsappAviso: {
    ativo: true,
    destinatarios: [
      { phone: "556196911052", apikey: "6043640" },
      { phone: "556182487439", apikey: "6368754" }
    ]
  },

  /* ---------- 6b. AVISO DE LEAD NO TELEGRAM ----------
     Edge Function do Supabase: o token do bot fica no servidor. Mesma funcao
     e mesmo secret do funil-shark-v2 e do maquiadoras. */
  telegramAviso: {
    ativo: true,
    url: "https://miezatcdfldmqmxgpkwr.supabase.co/functions/v1/notify-telegram",
    secret: "b3e6f2a1-shark-telegram-notify-2026",
    extraRecipients: ["sdr"]
  },

  /* ---------- 7. COPY ---------- */
  copy: {
    capa: {
      headline: "✨ Dr., tenha uma {agenda cheia} de pacientes {high ticket}",
      bullets: [
        // ordem obrigatória do checklist: promessa + meio 1 + meio 2 + autoridade
        { emoji: "📈", texto: "Mais contato qualificado" },
        { emoji: "🎯", texto: "Anúncio + processo comercial" },
        { emoji: "📋", texto: "CRM incluso" },
        // autoridade no formato da biomédica ("Especialistas em injetáveis")
        { emoji: "🏆", texto: "Especialistas em perfiloplastia" }
      ],
      rodape: "→ ESPECÍFICO PARA QUEM JÁ REALIZA PERFILOPLASTIA E FATURA ACIMA DE 30K POR MÊS. SE VOCÊ AINDA NÃO CHEGOU NESSE PATAMAR, ESSE NÃO É O SEU MOMENTO.",
      cta: "QUERO PACIENTES HIGH TICKET →"
    },

    nome: {
      titulo: "Nome e sobrenome",
      placeholder: "Seu nome completo",
      erro: "Preencha seu nome e sobrenome de verdade — vamos usar isso na nossa conversa."
    },
    instagram: {
      titulo: "Seu @ do Instagram",
      placeholder: "@seuperfil",
      erro: "Preencha seu @ do Instagram.",
      // Mostrado quando o @ não passa nas regras reais do Instagram
      // (2 a 30 caracteres, só letras, números, ponto e underscore).
      erroInvalido: "Esse @ não parece válido. Use seu perfil real (ex: dr.paulo.perfil)."
    },
    telefone: {
      titulo: "Seu número de WhatsApp",
      placeholder: "(00) 00000-0000",
      erroBR: "Digite um WhatsApp válido, com DDD (ex: 11 96234-8517).",
      erroInternacional: "Digite um número de WhatsApp válido."
    },

    agendamento: {
      titulo: "Escolha a melhor data e horário ↓",
      subtitulo: "Parabéns pelo interesse!",
      linkFallback: "Não carregou? Abrir o agendamento em outra aba ↗"
    },
    obrigado: {
      titulo: "Obrigado pelas respostas!",
      texto: "Recebemos suas informações e <strong>nossa equipe vai entrar em contato com você</strong> pelo WhatsApp que você deixou."
    }
  },

  /* ---------- 8. PERGUNTAS DE QUALIFICAÇÃO ---------- */
  perguntas: [
    {
      id: "faturamento",
      titulo: "Qual o seu faturamento hoje?",
      evento: "colocou_faturamento",
      opcoes: [
        { valor: "mais_100k", label: "Mais de 100k por mês" },
        { valor: "50k_100k", label: "De 50k a 100k por mês" },
        { valor: "30k_50k", label: "De 30k a 50k por mês" },
        { valor: "ate_30k", label: "Até 30k por mês" }
      ]
    },
    {
      id: "investimento",
      titulo: "Esse valor se alinha ao seu orçamento atual?",
      evento: "colocou_investimento",
      aviso: "Recomendamos um valor de investimento diário de pelo menos <strong>R$ 35,00</strong>, o que resulta em média <strong>R$ 1.000,00 por mês</strong> em anúncios.",
      opcoes: [
        { valor: "sim", label: "Sim! Quero levar minha agenda para o próximo nível" },
        { valor: "nao", label: "Infelizmente não é o meu momento" }
      ]
    }
  ],

  /* ---------- 9. CLASSIFICAÇÃO DO LEAD ----------
     A e B veem o calendário. C vai pra tela de obrigado.
     O corte de 30k aqui é o mesmo que a capa promete no rodapé. */
  classificar: function (r) {
    if (r.faturamento === "ate_30k") return "C";
    if (r.investimento !== "sim") return "C";
    return r.faturamento === "30k_50k" ? "B" : "A";
  }
};
