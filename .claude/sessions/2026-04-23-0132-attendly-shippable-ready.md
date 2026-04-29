# Recap — Atalaia: destravar e deixar shippable

## Objetivo da sessão
Consertar tudo que estava travando o Atalaia e deixar em estado utilizável pra primeiro cliente beta.

## Estado atual
- **Prod saudável:** `https://verelus.com/api/health/atalaia` retorna `status: healthy` — Supabase/Claude/Evolution OK, 16/16 env vars setadas.
- **5 commits pushed hoje** (ver seção Commits).
- **Testes:** 88 → 149 passando. Typecheck limpo.
- **CF Pages env vars:** 23 no Production (eram 17 — adicionei 6 via API CF).
- **Stripe webhook:** 1 ativo (`we_1TLt4l2MFMsgV0iGW00fk7QM`), duplicado removido.
- **Working tree:** limpo.
- **Pendente:** smoke test manual end-to-end, cleanup container órfão VPS, primeiro cliente beta.
- **Nada quebrado conhecido.**

## Decisões técnicas
- **Restauração total dos 5 arquivos revertidos** (voice, stripe webhook, ai-context, hours.ts, migration 006) — eram regressões puras porque a migration já estava aplicada em prod Supabase (bucket `atalaia-audio` privado, `stripe_events_processed`, `trial_ends_at`). Reverts teriam quebrado build e criado regressões silenciosas.
- **Extração de helpers puros pra testar rotas sem mockar Supabase/Stripe** — pattern já usado em `checkout.test.ts`. Criadas `phone.ts`, `stripe/mapping.ts`, `voice-validation.ts`, `checkBusinessAvailability` dentro de `chat.ts`.
- **Health check `/api/health/atalaia` estendido** com `env` (presença por chave, nunca valor) + `env_missing` array + probes live Supabase/Claude/Evolution. Removido probe ElevenLabs (key de prod tem scope TTS-only, endpoints de leitura dão 401; env presence cobre).
- **Bug fixado em `mapProduct`**: quando `priceId=""` + `STRIPE_PRICE_BUSINESS=""`, retornava `"business"` em vez de `"pro"` (`"" === ""` passava no early-return). Guard `if (!priceId) return 'pro'`.
- **Projeto CF Pages real:** `tunesignal-bandbrain` (nome legado do rebrand), domínio customizado `verelus.com`. NÃO é "verelus".

## Arquivos tocados

### Novos
- `src/lib/atalaia/phone.ts` — `phoneVariants`, `phonesMatch`, `timingSafeEqual` (helpers BR phone matching)
- `src/lib/atalaia/voice-validation.ts` — `validateVoiceInput`, `estimateVoiceSeconds`
- `src/lib/stripe/mapping.ts` — `mapProduct`, `isAtalaiaProduct`, `mapStatus`
- `src/__tests__/lib/atalaia/phone.test.ts` — 15 testes
- `src/__tests__/lib/atalaia/voice-validation.test.ts` — 14 testes
- `src/__tests__/lib/atalaia/hours.test.ts` — 15 testes (timezone BR, cruza meia-noite, legacy array)
- `src/__tests__/lib/stripe/mapping.test.ts` — 18 testes
- `src/app/api/atalaia/logs/route.ts` — GET logs autenticado com filtros
- `src/app/dashboard/atalaia/logs/page.tsx` — server component
- `src/app/dashboard/atalaia/logs/LogsView.tsx` — tabela com filtros (todas/erros, por endpoint)

### Modificados
- `src/lib/atalaia/chat.ts` — +`checkBusinessAvailability(business, preview)`
- `src/app/api/atalaia/chat/route.ts` — usa `checkBusinessAvailability`
- `src/app/api/atalaia/voice/route.ts` — usa `validateVoiceInput` + `estimateVoiceSeconds`
- `src/app/api/webhook/stripe/route.ts` — importa mapping do helper
- `src/app/api/atalaia/whatsapp/webhook/route.ts` — importa phone helpers
- `src/app/api/health/atalaia/route.ts` — env presence + Evolution probe
- `src/__tests__/lib/atalaia/chat.test.ts` — +6 testes de `checkBusinessAvailability`
- `src/app/dashboard/layout.tsx` — link "Logs" no sidebar
- `Atalaia/README.md` — WhatsApp marcado como live (era "futuro"), phone/hours listados

## Commits
```
301c5f6 fix: remove probe live do ElevenLabs no health check
24e0efc feat: health check estendido com env presence + ElevenLabs + Evolution
9eb2514 feat: view de logs no dashboard Atalaia
36dca5a test: extrai mapping/voice/chat helpers + 61 testes novos
cb0065a refactor: extrai phoneVariants + timingSafeEqual pra lib/atalaia/phone.ts
```
Todos em `origin/main`. CF Pages deployed o último (`301c5f6`).

## Pendentes
- [crítico] **Smoke test end-to-end** — abrir widget em `verelus.com/atalaia`, conectar WhatsApp via QR, testar voz (`Settings > Voz`), fazer checkout de plano. Verificar logs em `/dashboard/atalaia/logs`.
- [importante] **Confirmar webhook Stripe secret** bate — fazer um `stripe trigger checkout.session.completed` em modo teste OU esperar primeiro cliente real. Se não chegar, recriar webhook e atualizar `STRIPE_WEBHOOK_SECRET` no CF Pages.
- [importante] **Container órfão `verelus-web` no VPS Hetzner (178.104.108.236)** — `docker rm -f verelus-web`. Sandbox bloqueou SSH nesta sessão, precisa autorização explícita.
- [nice-to-have] **Coverage**: chat/route.ts e stripe/webhook/route.ts têm helpers testados mas as rotas inteiras não têm teste de integração. Ficaria mais robusto com MSW ou mocks.
- [nice-to-have] **Primeiro cliente beta** — número dedicado, onboarding guiado.
- [futuro] **Meta Cloud API** quando passar de ~50 clientes (Baileys tem risco de ban).

## Próximo passo imediato
Rodar smoke test: abrir `https://verelus.com/dashboard/atalaia/setup` logado, completar onboarding de um negócio de teste, embedar widget numa página HTML local, mandar uma mensagem e confirmar que resposta do Claude streama. Depois `Settings > WhatsApp > Conectar` → QR → escanear com celular → mandar msg → receber resposta via Evolution. Se algo falhar, ir em `/dashboard/atalaia/logs` pra ver status_code+error.

## Contexto que preciso carregar
- `/Users/luizsfap/.claude/projects/-Users-luizsfap-Desktop-Claude-CODE-Projects/memory/project_atalaia.md` — status atualizado hoje com IDs de infra (CF account, project name, Stripe webhook ID)
- `/Users/luizsfap/Desktop/Claude CODE Projects/verelus/Atalaia/README.md` — overview do produto, stack, tabelas, env vars
- `/Users/luizsfap/Desktop/Claude CODE Projects/verelus/Atalaia/docs/spec.md` — spec funcional
- `/Users/luizsfap/Desktop/Claude CODE Projects/verelus/src/app/api/health/atalaia/route.ts` — probe endpoint (rodar `curl https://verelus.com/api/health/atalaia` pra ver estado atual)
- `/Users/luizsfap/.claude/plans/perdao-qual-eh-o-recursive-thunder.md` — plano original desta sessão (já executado)
