# Solução WhatsApp — Atalaia

Como o Atalaia provisiona um **número WhatsApp Business oficial** pra cada cliente Pro/Business, automaticamente, sem usar o WhatsApp pessoal dele e sem o fundador encostar em nada.

## TL;DR

- **Pro/Business** → cliente paga → sistema aluga um número brasileiro novo na **Twilio** → submete pra aprovação WhatsApp/Meta → cliente recebe email com o número ativo em **3-5 dias úteis**.
- **Starter** → cliente conecta o próprio número via QR (**Evolution API** self-hosted, igual hoje).
- **Cliente Pro/Business que prefere usar próprio número** → link "Já tenho um número" no onboarding cai no fluxo Evolution (BYO).
- **Cancela assinatura** → número Twilio é liberado automaticamente em segundos.
- **Custo da Twilio sai do dinheiro do cliente:** Stripe paga você em ~7 dias, Twilio cobra em ~30 dias. Você não tira do bolso.

Plano técnico detalhado: `/Users/luizsfap/.claude/plans/gosto-da-opcao-a-resilient-falcon.md`.

---

## Arquitetura, em palavras simples

```
1. Cliente PME compra Pro (R$297) ou Business (R$597) no checkout Stripe.

2. Stripe nos avisa via webhook ("checkout.session.completed").

3. Sistema do Atalaia chama a Twilio:
     a) Aluga 1 número brasileiro (DDD da preferência do cliente, tipo 11 ou 21).
     b) Submete esse número pra aprovação como WhatsApp Business Sender.
     A Twilio repassa pra Meta validar (3-5 dias úteis).

4. Sistema dispara 2 emails de onboarding:
     a) Imediato: "sua atendente está em preparação, vamos treinar ela".
        Link pra preencher serviços, horários, FAQ, tom de voz.
     b) Agendado +24h via Resend: "regras de transferência humana".
        Link pra configurar quando a IA deve te chamar.

5. Cliente preenche os dados no dashboard durante a espera.
   A IA aprende o negócio dele.

6. Cron de hora em hora consulta a Twilio. Quando aprovam:
     - Sistema marca cliente como ativo.
     - Email "Seu número está ativo: +55 11 99XXX-XXXX".
     - Cliente coloca esse número no site, Instagram, cartão.

7. Cliente final do PME manda mensagem WhatsApp pro número novo.
   Webhook chega no nosso sistema → IA do Claude responde →
   resposta volta via Twilio. Tudo em segundos.

8. Se cliente cancela assinatura na Stripe:
     - Sistema desregistra o Sender (Meta).
     - Sistema libera o número (deixa de cobrar Twilio).
     - Email "número liberado, dados preservados 90 dias".
```

## Por que Twilio (e não Zenvia ou Cloud API direto)

**Comparação que fizemos:**

| | Twilio | Zenvia (descartado) | Cloud API direto Meta |
|---|---|---|---|
| Mensalidade fixa, mesmo sem cliente | **R$0** | R$300-1.000 | R$0 |
| Aluguel por número | ~R$8 | ~R$60-150 | só o do provedor (Twilio) |
| Por conversa | ~R$0,14 | ~R$0,40 | ~R$0 (1000 grátis) ou ~R$0,14 |
| Tempo pra aprovar número novo | 3-5 dias úteis | ~7 dias | minutos (mas precisa Meta Business verificado) |
| Aceita CPF brasileiro | sim | sim | só com limite 250 conv/dia |
| Suporte | inglês | PT-BR | docs Meta |
| Nota fiscal | fatura USD | NF-e BRL | fatura USD |

**Twilio venceu** porque: zero custo fixo (cabe no perfil "0 cliente hoje"), aceita CPF imediatamente (não precisa CNPJ pra começar), e o "intermediário" Twilio remove a complexidade de verificar Meta Business Manager separadamente.

Limitação aceita: 3-5 dias de espera pra número aprovar. Mitigado com a estratégia de **2 emails de onboarding** que treinam a IA durante essa janela — cliente engaja em vez de esperar parado.

## Fluxo do dinheiro (importante)

A Twilio cobra de **alguém** todo mês. Esse alguém é a sua conta cadastrada na Twilio. Não existe API pra Twilio "debitar da Stripe" — são empresas separadas.

Mas a contagem do tempo te protege:

```
Dia D     | Cliente paga Stripe R$297 (Pro)
Dia D+7   | Stripe deposita ~R$289 na sua conta cadastrada
            (CPF agora, MEI Verelus quando você abrir)
Dia D+30  | Twilio cobra ~R$15-40 do cartão cadastrado
            Mas o dinheiro do cliente já está há 23 dias
            na conta. Saldo positivo.
```

**Cap de gasto Twilio (R$200/mês recomendado):** se algo bugar e o sistema tentar alugar 50 números num loop, a Twilio trava em R$200. Risco financeiro limitado.

## Estado atual (Phase 1, entregue 2026-04-29)

| Componente | Status |
|------------|--------|
| Migration 015 (provider enum + campos Twilio) | ✅ aplicada em prod Supabase |
| Lib Twilio (`src/lib/atalaia/whatsapp/twilio/`) | ✅ 4 arquivos: client, numbers, sender, messaging |
| Endpoint `/provision` (idempotente) | ✅ código pronto |
| Endpoint `/deprovision` (idempotente) | ✅ código pronto |
| Endpoint `/twilio/webhook` (inbound, HMAC validado) | ✅ código pronto |
| Cron `twilio-approval-poll` (1h) | ✅ código pronto |
| Stripe webhook → trigger provision/deprovision | ✅ código pronto |
| 5 emails (provisioning, approved, rejected, deprovisioned, onboarding-day-2) | ✅ código pronto |
| Resend `scheduledAt` (envio agendado de email +24h) | ✅ implementado |
| Health check probe Twilio | ✅ código pronto |
| Tests (16 novos pra Twilio) | ✅ 142/142 verde |
| Build CF Workers | ✅ 4 rotas novas compiladas |
| Branch `feat/whatsapp-zenvia-bsp` (nome legado) | ⏳ NÃO pushed |
| Conta Twilio Verelus | ❌ pendente operador |
| Sender Profile Verelus aprovado pela Twilio | ❌ pendente operador (~1-2d após submeter) |
| Env vars Twilio no CF Pages | ❌ pendente operador |
| Cron `twilio-approval-poll` registrado no scheduler | ❌ pendente operador |
| Phase 2 (UI provider-aware no setup wizard, dashboard admin) | ❌ não iniciada |

## Como ativar — passo a passo

### 1. Criar conta Twilio (~10min)

1. Vai em <https://www.twilio.com/try-twilio>
2. Preenche email + telefone + valida SMS
3. Cadastro pessoal com CPF (até abrir MEI/CNPJ; depois migra)
4. Adiciona método de pagamento — cartão pessoal OU débito automático
5. **CRÍTICO:** vai em **Account → Billing → Spending Limits** e seta `Monthly Spend Limit = $40 USD` (~R$200). Sem isso, é risco aberto.
6. Copia `Account SID` e `Auth Token` da home do Console (vai precisar).

### 2. Submeter Sender Profile Verelus (~1-2 dias pra aprovar)

Antes de cada número virar WhatsApp Business, a Twilio precisa aprovar uma vez o "Sender Profile" da Verelus (sua marca). Faz uma vez só.

1. Twilio Console → **Messaging → Senders → Configure WhatsApp Sender**
2. Preenche: nome da empresa (Verelus), website (verelus.com), email, descrição.
3. Submete. Twilio aprova em ~1-2 dias úteis.
4. Quando aprovar, copia o `Sender Profile SID` (`MGxxxx...`).

### 3. Comprar 1 número de teste (R$8) pra validar a integração antes do primeiro cliente real

1. Console → **Phone Numbers → Manage → Buy a Number**
2. Filtros: Country = Brazil, Capabilities = WhatsApp + SMS
3. Compra 1 número. Custa ~$1.50 USD/mês = R$8.
4. Anota o `Phone Number SID` (PNxxx).

(Esse número pode ficar parado depois do teste; cancela manualmente se não usar.)

### 4. Configurar env vars no Cloudflare Pages

Painel CF → Pages → projeto `tunesignal-bandbrain` → **Settings → Environment variables**. Adicionar em **Production E Preview**:

```
TWILIO_ACCOUNT_SID=AC...                       (Plain text)
TWILIO_AUTH_TOKEN=<token do passo 1>           (Encrypted)
TWILIO_SENDER_PROFILE_SID=MG...                (Plain text)
TWILIO_WEBHOOK_VALIDATION_TOKEN=<mesmo Auth Token>  (Encrypted)
```

`TWILIO_WEBHOOK_VALIDATION_TOKEN` é redundante mas explícito — pode ser exatamente o mesmo valor do `TWILIO_AUTH_TOKEN`. Usado pra validar HMAC do webhook.

### 5. Configurar webhook URL na Twilio (acontece automaticamente no provision)

O endpoint `/provision` no nosso sistema **já passa a URL do webhook** quando submete cada Sender:

```
https://verelus.com/api/atalaia/whatsapp/twilio/webhook
```

Você só precisa garantir que o endpoint está acessível publicamente (CF Pages cuida disso após merge na main).

### 6. Configurar cron `twilio-approval-poll`

Esse cron de hora em hora consulta a Twilio pra ver se um Sender aprovou. Sem ele, números aprovados não são marcados como ativos no sistema.

**Opção A — Cloudflare Cron Triggers (recomendado, já no CF):**

Adicionar em `wrangler.toml` (criar se não existe):
```toml
[triggers]
crons = ["0 * * * *"]
```

E criar handler que faz `fetch` pro endpoint. (Verificar template existente do projeto pra padrão.)

**Opção B — GitHub Actions:**

Criar `.github/workflows/twilio-poll.yml`:
```yaml
on:
  schedule:
    - cron: '0 * * * *'
jobs:
  poll:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -X POST https://verelus.com/api/atalaia/cron/twilio-approval-poll \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

### 7. Push do branch + merge

```bash
cd "/Users/luizsfap/Desktop/Claude CODE Projects/verelus"
git push -u origin feat/whatsapp-zenvia-bsp
# Abrir PR pra main, mergear, CF Pages auto-deploya em ~2min.
```

CF Pages só faz auto-deploy do `origin/main`.

### 8. Smoke test em produção

```bash
# 1. Health check inclui Twilio + env vars setadas
curl https://verelus.com/api/health/atalaia | jq '.checks.twilio, .env_missing'
# Espera: { ok: true, latency_ms: < 1000 } e env_missing: []

# 2. Provision manual num cliente Pro/Business de teste
# (compra 1 plano com cartão de teste Stripe 4242...)
# Deve aparecer logs no Stripe webhook + atalaia_bsp_provisioning_log

# Verificar SQL:
SELECT id, name, whatsapp_provider, twilio_phone_sid, twilio_sender_sid,
       bsp_kyc_status, onboarding_email_1_sent_at
FROM atalaia_businesses
WHERE id='<uuid>';
# Espera: provider='twilio', phone_sid+sender_sid preenchidos,
# kyc_status='pending', email_1_sent_at preenchido

SELECT event, details, created_at
FROM atalaia_bsp_provisioning_log
WHERE business_id='<uuid>'
ORDER BY created_at;
# Espera: twilio_number_rented, twilio_sender_submitted,
# onboarding_email_1_sent, onboarding_email_2_scheduled

# 3. Cliente recebe email "preparando seu número" imediato.
# 24h depois: email 2 "regras de transferência" via Resend scheduled.

# 4. Esperar 3-5 dias.
# Cron de hora em hora detecta aprovação → marca approved.
# Verificar logs cron:
SELECT event, created_at FROM atalaia_bsp_provisioning_log
WHERE event IN ('twilio_sender_approved', 'phone_provisioned')
ORDER BY created_at DESC LIMIT 5;

# 5. Cliente recebe email "número ativo: +55..."
# Coloca no site/Instagram, recebe mensagens reais.

# 6. Cancelar assinatura via Stripe Customer Portal:
# Verifica que customer.subscription.deleted dispara deprovision.
SELECT event FROM atalaia_bsp_provisioning_log
WHERE business_id='<uuid>' AND event IN
  ('twilio_sender_deregistered', 'twilio_number_released');
# Twilio Console: número não aparece mais como ativo.
```

## Quando abrir o MEI

Não há urgência absoluta — o sistema funciona com Twilio CPF. Mas vale abrir MEI quando:

1. **Você tem 2-3 clientes pagantes** — receita já justifica os R$70/mês de DAS.
2. **Cliente PME pede NF-e formal** — só PJ emite NF-e válida.
3. **Caixa Verelus precisa separar do pessoal** — controle financeiro fica caótico misturado.

Quando abrir, migra os 2 cadastros (Stripe + Twilio) pra PJ Verelus em ~1h. Stripe e Twilio aceitam mudança de entidade sem dor.

## Schema (após migration 015)

```
atalaia_businesses
├─ whatsapp_provider          'evolution' | 'zenvia' | 'twilio'  (default 'evolution')
├─ whatsapp_byo               boolean (cliente trouxe próprio número)
├─ whatsapp_number            E.164 do número ativo (qualquer provider)
├─ bsp_kyc_status             'pending' | 'approved' | 'rejected' | null
├─ bsp_kyc_started_at, bsp_kyc_decided_at, bsp_kyc_rejection_reason
├─ twilio_phone_sid           PNxxx — UNIQUE quando NOT NULL
├─ twilio_sender_sid          XExxx — UNIQUE quando NOT NULL
├─ onboarding_email_1_sent_at TIMESTAMPTZ
└─ onboarding_email_2_scheduled_at TIMESTAMPTZ

atalaia_twilio_events_processed (event_id PK)         — idempotência inbound
atalaia_bsp_provisioning_log (business_id, event)     — audit trail completo
```

## Roadmap

### Phase 1 (✅ entregue 2026-04-29)
Foundation completa. End-to-end automatizado: compra → provision → emails → cron → approval → mensagens → cancel → deprovision.

### Phase 2 (não iniciada)
- UI provider-aware no SetupWizard (mostra "preparando seu número" durante pending)
- Settings tab WhatsApp mostra status do sender por estágio
- Link discreto "Já tenho um número" → fluxo BYO Evolution
- Dashboard admin founder-only com counts por status (pending, approved, rejected)
- Suporte a portar número existente do cliente (em vez de comprar novo)
- Política de retorno cliente cancelado dentro de 30 dias (reativa mesmo número)

### Phase 3 (opcional)
- Pool de números pré-aprovados (R$80/mês ocioso) pra ativação instantânea premium
- Refactor Evolution dentro da interface provider (eliminar duplicação)
- Template messages WhatsApp pra notificar fora da janela 24h
- Migração automática para WhatsApp Business Cloud API direto Meta quando MEI virar ME ou LTDA (pra reduzir custo por conversa em volume alto)

## Riscos conhecidos

| Risco | Mitigação |
|-------|-----------|
| Cap Twilio R$200 estoura por bug/spike | Notificação Twilio + halt automático. Cap protege bolso. |
| KYC rejeitado pela Meta (raro, motivo: business não verificado) | Email pro cliente com motivo + abrir ticket. Cliente fica em Evolution permanente até resolver. |
| Cliente cancela durante KYC pending | Stripe webhook deleted dispara deprovision; sub-account Twilio orfã ainda paga aluguel. Operador limpa manualmente via Console se ficar muito tempo. |
| Twilio fora do ar | Fallback: cliente sem WhatsApp por horas/dias. Health check captura, alerta operador. Sem migração automática pra Evolution porque número Twilio é único. |
| Twilio API muda estrutura de Senders | Endpoints com TODO no código (`subaccounts.ts` partner-tier). Operador atualiza paths via env vars sem rebuild. |
| Race condition cancel + inbound chegando | Dedupe via `MessageSid`; webhook responde 200 mesmo se business já deprovisionado (mensagem cai no vazio, comportamento esperado). |
| Limite Twilio sub-accounts por master | Twilio aceita milhares de sub-accounts num master. Não é bottleneck próximo. |

## Arquivos do código

```
src/lib/atalaia/whatsapp/
├── provider.ts            BusinessProviderContext + resolveProvider() — recognize 'twilio'
├── send.ts                sendOutboundMessage() — branch twilio antes de zenvia/evolution
├── evolution/messaging.ts sendText() Evolution (legado, ainda usado pra Starter/BYO)
├── zenvia/                4 arquivos (DORMENTE — referência futura, não roda)
└── twilio/
    ├── client.ts          REST wrapper + Basic Auth
    ├── numbers.ts         rentBrazilianNumber, releaseNumber, extractAreaCode
    ├── sender.ts          requestSenderApproval, fetchSenderStatus, deregisterSender
    └── messaging.ts       sendText, parseInbound (form-encoded webhook)

src/app/api/atalaia/whatsapp/
├── webhook/route.ts        Evolution (legado)
├── zenvia/webhook/         (dormente)
├── twilio/webhook/route.ts INBOUND Twilio: HMAC validado, dedupe MessageSid, chama /chat
├── provision/route.ts      POST cria sub-account + KYC; idempotente; dispara emails
├── deprovision/route.ts    POST libera Twilio + volta provider pra evolution; idempotente
├── connect/route.ts        Evolution (legado)
└── status/route.ts         Status atual

src/app/api/atalaia/cron/
├── trial-reminder/         existente
└── twilio-approval-poll/   NOVO — 1h cron, walk pending, approve/reject

src/app/api/webhook/stripe/route.ts
  - checkout.session.completed → triggerProvision (Pro/Business)
  - customer.subscription.updated → triggerProvision (upgrade) OU triggerDeprovision (downgrade)
  - customer.subscription.deleted → triggerDeprovision (Pro/Business)

src/lib/atalaia/notifications.ts
  - notifyOwnerEmail estendido com scheduledAt opcional
  - buildTwilioProvisioningEmail, buildTwilioApprovedEmail,
    buildTwilioRejectedEmail, buildTwilioDeprovisionedEmail,
    buildOnboardingTrainingEmail2

src/__tests__/lib/atalaia/whatsapp-twilio.test.ts   16 cases
supabase/migrations/015_atalaia_twilio_provider.sql aplicada em prod
```
