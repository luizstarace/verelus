# Atalaia monitoring & alerting

Minimal setup pra saber quando algo quebrou em prod sem ter que abrir o dashboard.

## Health endpoint

`GET https://atalaia.verelus.com/api/health/atalaia`

Retorna JSON com probes de:
- Supabase (query contra `atalaia_businesses`)
- Claude (ping na Messages API)
- Evolution API (via CF Tunnel em `wa.verelus.com`)
- 16 env vars obrigatórias presentes
- ElevenLabs (env presence apenas — key é TTS-only)

Status HTTP reflete saúde agregada:
- `200` — tudo OK
- `503` — pelo menos um probe falhou

## Uptime monitor — GitHub Actions cron (ativo)

Configurado em `.github/workflows/uptime.yml`. Roda a cada hora (free tier safe: ~720 min/mês). Probe `GET https://atalaia.verelus.com/api/health/atalaia`. Se HTTP != 200 ou status != "healthy":

- Abre **issue automática** com label `uptime-incident` (ou comenta na issue aberta existente)
- Notificação chega por email do GitHub (settings → notifications)
- Quando recupera, comenta "Service recovered" e fecha a issue

Trigger manual: GitHub Actions tab → "Uptime Monitor" → "Run workflow".

### Limitações
- Granularidade hora (não 5min) — trade-off de cost
- Sem SLA de notificação (depende do GitHub email)

### Migrar pra Better Stack quando escalar

Quando primeiro cliente pagante chegar:
1. Criar conta gratuita em <https://betterstack.com/uptime>
2. Novo monitor HTTP: URL `https://atalaia.verelus.com/api/health/atalaia`, intervalo 3min, aceitar 2xx, timeout 10s
3. Email alerts pra `luizsfap@gmail.com`
4. Desativar workflow `uptime.yml` (ou deixar como redundância)

## Logs de aplicação

- `atalaia_logs` (Supabase, 90 dias TTL via `cron.job = atalaia_cleanup_daily`)
- Dashboard: `/dashboard/atalaia/logs` filtra por endpoint, status_code, só erros.

## Cloudflare Pages logs

- Real-time: `wrangler pages deployment tail` (se instalado) ou dashboard CF → Pages → `tunesignal-bandbrain` → Functions → Logs.
- Analytics: CF Pages Analytics (requests, errors, latency p50/p95/p99).

## Alerting manual (fora do escopo do uptime monitor)

| Situação | Onde ver | Ação |
|---|---|---|
| Spike de erros em `atalaia_logs` | `/dashboard/atalaia/logs?only_errors=1` | Investigar endpoint com mais erros |
| Webhook Stripe atrasando | Stripe Dashboard → Developers → Webhooks | Re-enviar eventos pendentes |
| Evolution desconectou | `/dashboard/atalaia/settings` → WhatsApp | Reconectar QR |
| Trial expirando hoje | `atalaia_businesses WHERE trial_ends_at BETWEEN now() AND now() + interval '1 day'` | Contato proativo |

## Pré-beta checklist

Antes de ligar o primeiro cliente real:

- [x] Uptime monitor ativo (GitHub Actions cron 1x/hora, abre issue se cair)
- [ ] Confirmado que email de alerta chega (teste: trigger manual workflow_dispatch + simular falha)
- [x] `/api/health/atalaia` retorna `200` + todos os serviços `ok` (validado 2026-04-29)
- [ ] Logs em `atalaia_logs` estão preenchendo
- [x] Cron `atalaia_cleanup_daily` listado em `cron.job` (validado 2026-04-29)
