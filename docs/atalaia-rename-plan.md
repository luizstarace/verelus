# Rename — Attendly → Atalaia

**Data**: 2026-04-29
**Branch**: `rename/attendly-to-atalaia`
**Pré-requisito**: nome **Atalaia** validado (ver `naming-research.md`).

## Escopo executado

- **89 arquivos** com referência a "attendly" → todos substituídos pra "atalaia" (case-preserving)
- **7 pastas renomeadas via `git mv`** (preserva histórico):
  - `Attendly/` → `Atalaia/`
  - `src/app/attendly/` → `src/app/atalaia/`
  - `src/app/dashboard/attendly/` → `src/app/dashboard/atalaia/`
  - `src/app/api/attendly/` → `src/app/api/atalaia/`
  - `src/app/api/health/attendly/` → `src/app/api/health/atalaia/`
  - `src/lib/attendly/` → `src/lib/atalaia/`
  - `src/__tests__/lib/attendly/` → `src/__tests__/lib/atalaia/`
- Memória do agente `project_attendly.md` → `project_atalaia.md`

## Migration SQL (ainda a aplicar manualmente)

`Atalaia/sql/010_rename_attendly_to_atalaia.sql` — renomeia 6 tabelas + 2 funções + recria cron `atalaia_cleanup_daily`.

**Aplicar em produção via Supabase SQL Editor**, dentro de transação (BEGIN/COMMIT). Snapshot recomendado antes.

## Pendências manuais (você executa)

### 1. Banco Supabase
- Aplicar `Atalaia/sql/010_rename_attendly_to_atalaia.sql` no SQL Editor (produção)
- Regerar tipos TypeScript: `supabase gen types typescript` → atualizar `src/types/database.ts`

### 2. Cloudflare
- DNS: criar registro `atalaia.verelus.com` (CNAME → mesmo target do CF Pages atual)
- Pages: adicionar custom domain `atalaia.verelus.com` ao project `tunesignal-bandbrain`
- (Opcional) redirect 301 de `verelus.com/attendly/*` → `atalaia.verelus.com/*` se houver tráfego antigo

### 3. Stripe
- Renomear display names dos produtos: "Attendly Starter/Pro/Business" → "Atalaia Starter/Pro/Business"
- **NÃO mexer** em IDs `price_*` / `prod_*` (quebraria checkout existente)
- Webhook `we_1TLt4l2MFMsgV0iGW00fk7QM`: atualizar URL pra `atalaia.verelus.com/api/webhook/stripe` se houver tráfego ativo (sem isso, eventos param de chegar)

### 4. Email sender (Resend)
- Já atualizado no código (`src/lib/atalaia/notifications.ts` agora usa "Atalaia <contato@verelus.com>")

### 5. Push e deploy
- `git push -u origin rename/attendly-to-atalaia` (ou merge direto na main)
- CF Pages auto-deploya em ~2min quando HEAD em `origin/main`

## Verificação end-to-end (após push + CF rebuild)

1. `atalaia.verelus.com/dashboard` carrega
2. `/api/health/atalaia` retorna verde (Supabase + Claude + Evolution)
3. Setup wizard funciona — cliente cria conta + define nome próprio da SUA atendente
4. WhatsApp QR gera + escaneia + msg real recebe e processa
5. Cron `atalaia_cleanup_daily` rodou 1x sem erro nas 24h seguintes (03:15 UTC)
6. Email transacional chega com sender "Atalaia <contato@verelus.com>"
7. Stripe checkout abre com "Atalaia Starter/Pro/Business"

## Pontos de atenção

- **CF Pages auto-deploy**: só dispara quando HEAD em `origin/main` — push na branch não basta, precisa merge.
- **Pages Stripe**: NÃO mexer em IDs `price_*` / `prod_*` (só display names).
- **Variáveis env CF Pages** (Production): `EVOLUTION_API_URL` e `EVOLUTION_API_KEY` — não mexer.
- **`setInterval` em rate-limit**: regressão conhecida (`f80fc44`) — confirmar que após rename os imports continuam carregando lazy.
