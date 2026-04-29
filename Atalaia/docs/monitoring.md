# Atalaia monitoring & alerting

Minimal setup pra saber quando algo quebrou em prod sem ter que abrir o dashboard.

## Health endpoint

`GET https://verelus.com/api/health/atalaia`

Retorna JSON com probes de:
- Supabase (query contra `atalaia_businesses`)
- Claude (ping na Messages API)
- Evolution API (via CF Tunnel em `wa.verelus.com`)
- 16 env vars obrigatórias presentes
- ElevenLabs (env presence apenas — key é TTS-only)

Status HTTP reflete saúde agregada:
- `200` — tudo OK
- `503` — pelo menos um probe falhou

## Uptime monitor externo

Configurar em **Better Stack** (free tier: 10 monitors) ou **UptimeRobot** (free tier: 50 monitors).

### Better Stack (recomendado)

1. Criar conta gratuita em <https://betterstack.com/uptime>.
2. Novo monitor:
   - Tipo: **HTTP(S)**
   - URL: `https://verelus.com/api/health/atalaia`
   - Intervalo: **3 min** (free tier permite 30s mas 3min basta)
   - Aceitar 2xx apenas
   - Timeout: 10s
3. Canal de notificação: email (`luizsfap@gmail.com` ou `founder@verelus.com`).
4. Opcional: Slack/WhatsApp quando escalar.

### UptimeRobot (alternativa)

1. Conta em <https://uptimerobot.com/>.
2. Novo monitor HTTP(s) com a mesma URL.
3. Intervalo mínimo free: **5 min**.
4. Email alerts (free tier suporta múltiplos contatos).

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

- [ ] Better Stack monitor ativo e disparou pelo menos um ping verde
- [ ] Confirmado que email de alerta chega (teste: derrubar Supabase ou apagar env temporariamente)
- [ ] `/api/health/atalaia` retorna `200` + todos os serviços `ok`
- [ ] Logs em `atalaia_logs` estão preenchendo
- [ ] Cron `atalaia_cleanup_daily` listado em `cron.job` e `active = true`
