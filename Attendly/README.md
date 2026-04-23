# Attendly

Atendente IA 24/7 para PMEs brasileiras. Primeiro produto da plataforma Verelus.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14 (App Router) |
| Styling | Tailwind CSS (azul #1e3a5f + laranja #f59e0b) |
| Database | Supabase PostgreSQL + RLS |
| Auth | Supabase Auth + Google OAuth |
| IA | Claude Haiku 4.5 (streaming SSE) |
| Voz | ElevenLabs API (Pro/Business) |
| Pagamentos | Stripe (subscriptions + trial 7 dias) |
| Email | Resend |
| WhatsApp | Evolution API self-hosted (VPS Hetzner) + Cloudflare Tunnel (`wa.verelus.com`) |
| Widget | Vanilla JS ~12KB, Shadow DOM |

## Planos

| Plano | Preco | Msgs/mes | Voz |
|-------|-------|----------|-----|
| Starter | R$147 | 500 | - |
| Pro | R$297 | 2.500 | 30 min |
| Business | R$597 | 10.000 | 120 min + clone |

## Estrutura de arquivos

```
src/
  lib/
    attendly/
      ai-context.ts    — Gera system prompt do Claude a partir dos dados do negocio
      chat.ts          — Helpers: message history, role mapping, period
      transfer.ts      — Deteccao de [TRANSFER] tag + keywords
      plans.ts         — Config de planos, precos, limites
      usage.ts         — Tracking de uso (RPC atomico)
      notifications.ts — Emails via Resend (transfer, usage, trial)
      cors.ts          — CORS headers para endpoints publicos
      rate-limit.ts    — Rate limiting in-memory por IP
      phone.ts         — Variantes de numero BR + timingSafeEqual (whitelist WhatsApp)
      hours.ts         — Normalizacao de horario + check "dentro do horario"
    types/
      attendly.ts      — Interfaces TypeScript do dominio

  app/
    api/attendly/
      setup/           — POST criar negocio
      business/        — GET/PATCH dados do negocio
      chat/            — POST chat SSE com Claude Haiku
      conversations/   — CRUD conversas + reply + status
      usage/           — GET uso do periodo atual
      voice/           — POST text-to-speech ElevenLabs
      checkout/        — POST criar sessao Stripe
      widget/          — Config + lead capture (publico)
      whatsapp/        — Connect + status + webhook (futuro)
    health/attendly/   — GET health check (Supabase + Claude)
    cron/health/       — Cron cada 5min com alerta email

    attendly/          — Landing page publica
    dashboard/attendly/
      page.tsx         — Overview com stats
      setup/           — Wizard 5 passos
      inbox/           — Lista + detalhe de conversas
      settings/        — Config negocio, widget, WhatsApp, notificacoes
      billing/         — Plano atual, uso, upgrade

public/
  widget.js            — Widget embeddable (Shadow DOM + SSE)

supabase/migrations/
  004_attendly.sql     — 5 tabelas + 3 RPCs + RLS
```

## Tabelas (Supabase)

- `attendly_businesses` — Dados do negocio, ai_context, widget_config, status
- `attendly_conversations` — Conversas (widget/whatsapp/voice), status, satisfaction
- `attendly_messages` — Mensagens (customer/assistant/human), tokens, audio_url
- `attendly_usage` — Uso mensal: text_messages, voice_seconds, tokens_total
- `attendly_logs` — Observabilidade: endpoint, latency, errors (sem RLS)

## RPCs

- `increment_message_count(conv_id)` — Incrementa message_count atomicamente
- `increment_usage(p_business_id, p_tokens)` — Upsert uso texto atomico
- `increment_voice_usage(biz_id, period_date, seconds_to_add)` — Upsert uso voz atomico

## Env vars necessarias

```
# Ja configuradas
ANTHROPIC_API_KEY=sk-ant-...
RESEND_API_KEY=re_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=https://verelus.com
CRON_SECRET=c80e...
FOUNDER_EMAIL=luizsfap@gmail.com

# Attendly-especificas
STRIPE_PRICE_ATTENDLY_STARTER=price_1TOgy42MFMsgV0iG4weI9yYy
STRIPE_PRICE_ATTENDLY_PRO=price_1TOgy42MFMsgV0iGPMxHJiHr
STRIPE_PRICE_ATTENDLY_BUSINESS=price_1TOgy52MFMsgV0iGwxgrl0gI
ELEVENLABS_API_KEY=sk_93e...

# WhatsApp (Evolution API exposta via Cloudflare Tunnel)
EVOLUTION_API_URL=https://wa.verelus.com
EVOLUTION_API_KEY=<64-hex, mesmo do VPS /opt/evolution/.env>
```

## Docs

- [Spec completo](docs/spec.md)
- [Plano de implementacao (18 tasks)](docs/implementation-plan.md)
- [Migration SQL](sql/004_attendly.sql)
