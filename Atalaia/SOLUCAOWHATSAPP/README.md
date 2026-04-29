# Solução WhatsApp — Atalaia

Como o Atalaia provisiona números WhatsApp para clientes Pro/Business sem que eles precisem usar o WhatsApp pessoal.

## TL;DR

- **Pro/Business** → número novo oficial Meta via **Zenvia BSP** (Verelus master account + sub-accounts). Sem risco de banimento, NF-e BRL.
- **Starter** → cliente conecta o próprio número via QR code (**Evolution API** self-hosted, igual hoje).
- **Cliente Pro/Business que prefere usar próprio número** → link discreto no onboarding "Já tenho um número" → cai no fluxo Evolution (BYO).
- **Gap KYC** (3-7 dias entre compra e número oficial pronto) → Atalaia provisiona Evolution temporário, migra automaticamente quando KYC aprova.

Decisão estratégica detalhada: `/Users/luizsfap/.claude/plans/gosto-da-opcao-a-resilient-falcon.md`.

---

## Arquitetura em 1 diagrama

```
                          ┌────────────────────┐
                          │  atalaia_businesses │
                          │  whatsapp_provider  │
                          │  (evolution|zenvia) │
                          └──────────┬──────────┘
                                     │
              ┌──────────────────────┴──────────────────────┐
              │                                              │
   provider='evolution'                              provider='zenvia'
   (Starter, BYO, ponte temp)                        (Pro/Business pós-KYC)
              │                                              │
   ┌──────────▼─────────┐                       ┌────────────▼──────────┐
   │ Evolution API      │                       │ Zenvia BSP            │
   │ wa.verelus.com     │                       │ api.zenvia.com        │
   │ self-hosted Hetzner│                       │ master + sub-accounts │
   └──────────┬─────────┘                       └────────────┬──────────┘
              │                                              │
   webhook /api/atalaia/                       webhook /api/atalaia/
   whatsapp/webhook                            whatsapp/zenvia/webhook
              │                                              │
              └──────────────────┬───────────────────────────┘
                                 │
                       /api/atalaia/chat (SSE)
                                 │
                          Claude Haiku 4.5
```

---

## Estado atual (Phase 1 — 2026-04-29)

| Componente | Status |
|-----------|--------|
| Migration `014_atalaia_whatsapp_provider.sql` | ✅ aplicada em prod (Supabase verelus) |
| Provider abstraction (`lib/atalaia/whatsapp/`) | ✅ commit `440f4bb` |
| `POST /api/atalaia/whatsapp/zenvia/webhook` | ✅ código em prod, NÃO testado em runtime |
| `POST /api/atalaia/whatsapp/provision` | ✅ código em prod, NÃO testado em runtime |
| Health check Zenvia probe | ✅ ativo, falha enquanto env vars não setadas |
| Notifications BSP (provisioning + approved) | ✅ |
| **Branch** `feat/whatsapp-zenvia-bsp` | ⏳ NÃO pushed; CF Pages só builda do `origin/main` |
| **Env vars CF Pages** | ❌ pendente — bloqueia testes reais |
| **Zenvia partner contract** | ❌ pendente — bloqueia provisionamento |
| **Webhook URL no painel Zenvia** | ❌ pendente |
| Phase 2 (Stripe → auto-provision, cron poll, wizard UI) | ❌ não iniciada (depende de Phase 1 validar com 1 cliente real) |

---

## Como ativar — passo a passo

### 1. Conta Zenvia (manual, fora do código)

Verelus precisa virar parceiro Zenvia. Caminho típico:

1. Abrir conta business Zenvia: <https://www.zenvia.com>.
2. Pedir contrato **partner** ou **WhatsApp Business API com sub-accounts** (modelo white-label). Isso libera os endpoints `/v2/accounts/*` e `/v2/channels/whatsapp/numbers` que o código depende.
3. Submeter KYC da Verelus (CNPJ + business owner + comprovantes). KYC da Verelus é único e cobre todas as sub-accounts dos clientes.
4. Pegar:
   - **Token master** (header `X-API-TOKEN`) → `ZENVIA_API_KEY`
   - **CNPJ Verelus** → `VERELUS_CNPJ`
   - Definir um **secret HMAC** para webhook → `ZENVIA_WEBHOOK_SECRET` (gerar via `openssl rand -hex 32`)
5. Confirmar com suporte Zenvia os paths exatos dos endpoints partner-tier (paths default no código estão com TODO em `subaccounts.ts`/`numbers.ts`). Override via `ZENVIA_SUBACCOUNT_PATH` e `ZENVIA_NUMBERS_PATH` se precisar.

### 2. Env vars no Cloudflare Pages

Painel CF → Pages → projeto `tunesignal-bandbrain` → Settings → Environment variables. Adicionar em **Production E Preview**:

```
ZENVIA_API_URL=https://api.zenvia.com
ZENVIA_API_KEY=<token master>          (Encrypted)
ZENVIA_WEBHOOK_SECRET=<hex 64 chars>   (Encrypted)
VERELUS_CNPJ=<14 dígitos sem máscara>  (Encrypted)
```

Opcionais (só se Zenvia confirmar paths diferentes):
```
ZENVIA_SUBACCOUNT_PATH=/v2/accounts        (default)
ZENVIA_NUMBERS_PATH=/v2/channels/whatsapp/numbers   (default)
```

### 3. Webhook no painel Zenvia

URL: `https://verelus.com/api/atalaia/whatsapp/zenvia/webhook`
Método: `POST`
Content-Type: `application/json`
Auth: HMAC-SHA256 do raw body usando `ZENVIA_WEBHOOK_SECRET`. Header esperado (na ordem de tentativa): `X-Zenvia-Signature` → `X-Hub-Signature-256` → `X-Signature`. Aceita `sha256=<hex>` ou `<hex>` puro.

Subscriba em: `MESSAGE` (eventos de inbound). Receipts/delivery são ignorados sem erro.

### 4. Push do branch + merge

```bash
cd "/Users/luizsfap/Desktop/Claude CODE Projects/verelus"
git push -u origin feat/whatsapp-zenvia-bsp
# Abrir PR pra main, mergear, CF Pages auto-builda em ~2min.
```

CF Pages só faz auto-deploy do `origin/main` — push isolado em branch não dispara.

### 5. Smoke test em produção

#### 5a. Health check
```bash
curl https://verelus.com/api/health/atalaia | jq '.checks.zenvia, .env_missing'
# Espera: { ok: true, latency_ms: < 1000 } e env_missing: []
```

#### 5b. Provision manual (1 cliente real Pro/Business)
```bash
curl -X POST https://verelus.com/api/atalaia/whatsapp/provision \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"business_id":"<uuid_de_um_cliente_pro>"}'
# Espera: 200 com bsp_subaccount_id no response
```

Verifica no Supabase:
```sql
SELECT id, name, bsp_kyc_status, bsp_subaccount_id, bsp_evolution_bridge_until
FROM atalaia_businesses
WHERE id = '<uuid>';
-- Espera: bsp_kyc_status='pending', bsp_subaccount_id preenchido,
-- bsp_evolution_bridge_until ~14d no futuro

SELECT event, details, created_at
FROM atalaia_bsp_provisioning_log
WHERE business_id = '<uuid>'
ORDER BY created_at;
-- Espera: subaccount_created, kyc_submitted, evolution_bridge_started
```

Cliente recebe email "estamos preparando seu número oficial" (template `buildBSPProvisioningEmail`).

#### 5c. Aprovação KYC manual (Phase 1 — sem cron poll ainda)

Aguarde Zenvia aprovar (3-7 dias). Quando aprovar, painel Zenvia mostra o número novo. Atualize manualmente no SQL:

```sql
UPDATE atalaia_businesses
SET
  bsp_kyc_status='approved',
  bsp_kyc_decided_at=now(),
  bsp_phone_number_id='<id_zenvia>',
  bsp_provisioned_at=now(),
  bsp_active_at=now(),
  whatsapp_provider='zenvia',
  whatsapp_number='<numero_e164_sem_+>',
  bsp_evolution_bridge_until=now() + interval '7 days'
WHERE id='<uuid>';

INSERT INTO atalaia_bsp_provisioning_log (business_id, event, details)
VALUES
  ('<uuid>', 'kyc_approved', '{}'::jsonb),
  ('<uuid>', 'phone_provisioned', '{"e164":"<numero>","phone_number_id":"<id>"}'::jsonb),
  ('<uuid>', 'migrated_from_evolution', '{}'::jsonb);
```

(Phase 2 automatiza isso via cron `bsp-kyc-poll` + endpoint `/migrate`.)

#### 5d. Inbound real

Do seu celular, manda "oi" pro número novo Zenvia. Espera:

1. Webhook Zenvia recebe POST → valida HMAC → dedupe.
2. Resolve business via `bsp_phone_number_id` ou `whatsapp_number`.
3. Chama `/api/atalaia/chat` (channel='whatsapp') → SSE stream.
4. `zenvia.sendText` envia resposta da IA → você recebe no WhatsApp.

Verificação:
```sql
SELECT event_id, processed_at FROM atalaia_zenvia_events_processed
ORDER BY processed_at DESC LIMIT 3;
-- Espera: 1 event_id pra mensagem que mandou

SELECT * FROM atalaia_logs
WHERE endpoint = '/api/atalaia/whatsapp/zenvia/webhook'
ORDER BY created_at DESC LIMIT 5;
-- Sem erros
```

---

## Decisões já fechadas (não revisitar sem novo contexto)

- BSP = Zenvia (NF-e BRL, KYC simples, suporte PT-BR). Twilio/360dialog/Gupshup descartados.
- Custo BSP embutido em Pro/Business; Starter fica Evolution-only pra preservar margem.
- Verelus = master account; cliente nem sabe que existe Zenvia. KYC só da Verelus (1 vez).
- Default Pro/Business = Zenvia. BYO Evolution = link discreto, não bloqueado.
- Bridge Evolution após approved = 7 dias de grace (rollback se Zenvia falhar). Cron `bsp-bridge-cleanup` apaga depois.

---

## Schema de referência (após migration 014)

```
atalaia_businesses
├─ whatsapp_provider     'evolution' | 'zenvia'              (default 'evolution')
├─ whatsapp_byo          boolean                             (default false)
├─ bsp_kyc_status        'pending'|'approved'|'rejected'|null
├─ bsp_kyc_started_at    timestamptz
├─ bsp_kyc_decided_at    timestamptz
├─ bsp_kyc_rejection_reason text
├─ bsp_waba_id           text
├─ bsp_phone_number_id   text   (UNIQUE quando NOT NULL)
├─ bsp_subaccount_id     text
├─ bsp_provisioned_at    timestamptz
├─ bsp_active_at         timestamptz
└─ bsp_evolution_bridge_until timestamptz   (até quando Evolution ainda atende durante KYC ou grace)

atalaia_zenvia_events_processed (event_id PK)         — idempotência inbound
atalaia_bsp_provisioning_log (business_id, event)     — audit trail KYC/provision
```

Índices: `idx_biz_kyc_pending` (parcial pendente), `idx_biz_provider`, `uq_biz_bsp_phone_number_id` (parcial).

---

## Roadmap

### Phase 1 (✅ entregue 2026-04-29)
Foundation + provisionamento manual. 1 cliente Pro/Business pode usar Zenvia em produção, founder dispara `/provision` via curl, processa KYC manual no SQL.

### Phase 2 (não iniciada)
- Stripe webhook `checkout.session.completed` chama `/provision` automático
- Cron `bsp-kyc-poll` (4h) detecta KYC approved + chama `/migrate`
- Cron `bsp-bridge-cleanup` (diário) deleta instância Evolution após 7d
- Wizard `SetupWizard` provider-aware (pending/approved/rejected/byo/starter)
- Settings tab WhatsApp provider-aware
- Link "Já tenho um número" → BYO no checkout
- Notifications: `buildBSPMigrationCompleteEmail`, `buildBSPRejectedEmail`

### Phase 3 (opcional)
- Refactor Evolution dentro da interface provider (eliminar duplicação `sendText`)
- Dashboard admin founder-only com KYC counts
- Template messages WhatsApp (janela 24h+)
- Política downgrade Pro→Starter (libera número Zenvia)
- E2E Playwright cobrindo wizard

---

## Riscos conhecidos

| Risco | Mitigação |
|-------|-----------|
| Paths Zenvia partner-tier divergem dos defaults | Override via env `ZENVIA_SUBACCOUNT_PATH` / `ZENVIA_NUMBERS_PATH` sem recompilar |
| KYC reprovado | Cliente fica Evolution permanente; email com motivo; pode reabrir ticket |
| Cliente cancela durante KYC pending | `customer.subscription.deleted` pausa business; sub-account Zenvia órfã (cleanup mensal manual) |
| Evolution offline durante bridge | Email atual `buildWhatsAppDisconnectedEmail` cobre; banner no dashboard explica |
| Race condition na transição de provider | Dedupe em tabelas separadas (zenvia/evolution). `sendOutboundMessage` lê `whatsapp_provider` no momento do envio |
| Limite de sub-accounts por master Verelus | Validar com Zenvia antes de Phase 2 (auto-provision pode bater limite) |

---

## Arquivos do código

```
src/lib/atalaia/whatsapp/
├── provider.ts            BusinessProviderContext + resolveProvider()
├── send.ts                sendOutboundMessage() com switch evolution|zenvia
├── evolution/messaging.ts sendText() Evolution (extraído do webhook) + toJid()
└── zenvia/
    ├── client.ts          ZenviaClient + getZenviaClient()
    ├── messaging.ts       sendText() + parseInbound()
    ├── subaccounts.ts     createSubaccount, submitKyc, fetchKycStatus  ⚠️ partner-tier
    └── numbers.ts         provisionPhoneNumber, releasePhoneNumber     ⚠️ partner-tier

src/app/api/atalaia/whatsapp/
├── webhook/route.ts       Evolution (modificado: importa evolutionSendText)
├── provision/route.ts     POST cria sub-account + KYC (idempotente, CRON_SECRET)
└── zenvia/webhook/route.ts POST inbound Zenvia (HMAC + dedupe + chat + sendText)

src/__tests__/lib/atalaia/whatsapp-provider.test.ts   7 cases p/ resolveProvider
supabase/migrations/014_atalaia_whatsapp_provider.sql migration aplicada
```
