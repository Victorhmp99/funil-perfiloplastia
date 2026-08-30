# Funil — Perfiloplastia (GreenHub)

Formulário de qualificação de leads para **tráfego pago a profissional de
perfiloplastia** — dentista de harmonização orofacial e cirurgião plástico,
sem separar.

**No ar:** <https://funil-perfiloplastia.vercel.app>
(Vercel, escopo `greenhub1`. Deploy por CLI, sem repositório git ligado.)

## Como mexer

Só se edita **`config.js`**. `index.html`, `app.js`, `estilo.css` e `paises.js`
são o motor compartilhado, gerado a partir do `funil-template` — mexer neles
aqui faz esta pasta divergir do motor.

```bash
# rodar local
python3 -m http.server 8226 --directory .

# publicar
vercel --prod --yes --scope greenhub1
```

`capas.html` e `bullets.html` são ferramentas internas de comparação de copy:
renderizam as versões descartadas na largura real do celular e medem se algum
bullet estoura. Estão no `.vercelignore`, não vão pro ar.

## Fluxo

Capa → nome → @ do Instagram → WhatsApp → faturamento → investimento →
agendamento (nível A e B) ou tela de obrigado (nível C).

## Régua de qualificação

| Faturamento | Investimento | Nível | O que vê |
|---|---|---|---|
| acima de 50k | sim | **A** | calendário |
| 30k a 50k | sim | **B** | calendário |
| até 30k | qualquer | **C** | tela de obrigado |
| qualquer | não | **C** | tela de obrigado |

O corte em 30k é o mesmo que o rodapé da capa promete. Quem fatura até 30k não
vê o calendário.

## Rastreio

GTM **`GTM-K5K5SFP4`** e pixel **`1001727392691930`** — os mesmos do
funil-shark-v2, do maquiadoras e do mamoplastia.

**O pixel não fica no HTML.** Ele já é a tag base do container; colar no HTML
duplica PageView.

Os acionadores do container escutam o nome que o motor dispara, e o nome do
evento no Meta é outro, do outro lado da tag:

| dataLayer (acionador) | Meta |
|---|---|
| `iniciou_formulario` | Etapa1_IniciouForm |
| `colocou_nome` | Etapa2_Nome |
| `colocou_instagram` | Etapa3_Instagram |
| `colocou_telefone` | Etapa4_WhatsApp |
| `colocou_faturamento` | Etapa5_Faturamento |
| `colocou_investimento` | Etapa6_Investimento |
| `lead_nivel_a` / `b` / `c` | LeadNivelA / B / C |
| `visualizou_calendario` | VisualizouCalendario |

**Não renomear os eventos do dataLayer.** Sem acionador no container:
`lead_classificado`, `agendou_reuniao` e `clicou_agendar`.

Como quatro funis dividem o mesmo pixel, **o relatório no Meta tem que ser
separado por URL**.

## CRM, WhatsApp e Telegram

Webhook do Green Hub, no **mesmo pipeline** do shark/maquiadoras/mamoplastia.
Dispara três vezes (depois do telefone, depois do faturamento e no final);
o backend faz dedupe pelo número, não duplica card.

O payload leva `source_campaign: "PERFILOPLASTIA"` e o rastreio do Meta
(`fbc`/`fbp`) — sem esses dois o lead chega órfão de atribuição e não dá pra
casar com o clique no anúncio.

Cada lead classificado avisa **WhatsApp** (CallMeBot, dois números) e
**Telegram** (Edge Function do Supabase). Os dois recebem o mesmo texto, e a
primeira linha diz a origem:

```
NOVO LEAD - PERFILOPLASTIA
STATUS : NIVEL A - QUALIFICADO
...
```

## Agendamento

Evento próprio: `assessoriagreenlab/especialistas-em-injetaveis-clone`.
O slug ficou com o nome do evento de origem, mas o **título está certo** —
"🏆Especialistas em Perfiloplastia - Green Hub", que é o que o lead lê.

O motor manda `name` e `a1` (o WhatsApp) na query string. O objeto `prefill`
do widget não chega no iframe — tem que ser query string.

## Pendências

- [ ] Repositório git e Vercel ligada nele (hoje o deploy é manual por CLI)
- [ ] Confirmar no celular que o calendário abre embutido (não consegui validar
      o embed no ambiente de teste; se não abrir, `visualizou_calendario`
      também não dispara)
- [ ] Apontar a campanha pra URL
- [ ] Logo em PNG, se a capa for usar

## Cuidado

`config.js` é servido público e expõe a webhook key do CRM, o tenant, o
pipeline, as apikeys do CallMeBot e o secret do Telegram. **São as mesmas
credenciais já expostas nos outros funis** — publicar aqui não somou exposição
nova, mas a proposta de mover o webhook pra uma função serverless continua de
pé.
