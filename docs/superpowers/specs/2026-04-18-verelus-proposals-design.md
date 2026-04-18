# Verelus — Propostas Comerciais para Freelancers Digitais BR

## Visão

Plataforma onde freelancers digitais criam propostas comerciais profissionais em 2 minutos, enviam como link rastreável, e sabem exatamente quando o cliente abriu, quanto tempo ficou, e se aceitou.

**Cliente ideal:** Freelancer digital BR (designer, dev, social media, copywriter, editor de vídeo).

**Problema central:** Freelancer manda proposta por WhatsApp em texto corrido. Parece amador, perde cliente pra quem manda material profissional, e não sabe se o cliente sequer leu.

**Solução:** Proposta bonita (link web, estilo clean minimal) + tracking detalhado (quantas vezes abriu, duração, horário) + aceite digital com 1 clique.

## Modelo de negócio

**Freemium:**

| Feature | Free | Pro R$29/mês |
|---------|------|-------------|
| Propostas/mês | 3 | Ilimitado |
| Tracking | Abriu/não abriu | Detalhado (vezes, duração, horários) |
| Sugestão IA (escopo) | Não | Sim |
| Marca "Feito com Verelus" | Sim (viral) | Não |
| Aceite digital | Sim | Sim |
| Templates (v2) | Básico | Premium |

**Meta financeira:** 250 clientes Pro = R$7.250/mês (R$250/dia).

**Viral loop:** Cada proposta free tem "Feito com Verelus" no rodapé. O cliente do freelancer vê, clica, vira user. Mesmo mecanismo do Calendly.

## Fluxo do usuário

```
1. Freelancer cria conta (Google ou email)
2. Preenche perfil (nome, título, contato)
3. Clica "Nova proposta"
4. Preenche formulário de 5 campos (~2 min)
5. Vê preview da proposta (link web, clean minimal)
6. Copia link e envia pro cliente
7. Cliente abre link → tracking registra silenciosamente
8. Dashboard mostra: "João abriu 3x · 4min total · última vez há 12min"
9. Cliente clica "Aceitar proposta" → freelancer recebe notificação por email
10. Dashboard atualiza status para "Aceita" com data/hora
```

## Stack técnica

Reusar 100% da infra Verelus existente:

- **Frontend:** Next.js 14 (app router, edge runtime)
- **Auth:** Supabase Auth (Google OAuth + email/password)
- **DB:** Supabase PostgreSQL + RLS
- **Pagamento:** Stripe (checkout + webhooks)
- **CSS:** Tailwind CSS com design tokens existentes
- **Deploy:** Cloudflare Pages
- **IA:** Claude API (sugestão de escopo — apenas Pro)

**Sem pdf-lib no MVP.** Proposta é link web. PDF como feature "Baixar PDF" entra na v2.

## Modelo de dados

### profiles
```
id: uuid (PK)
user_id: uuid (FK → auth.users, unique)
display_name: text (nome exibido na proposta)
title: text (ex: "Designer UI/UX")
email: text (contato profissional)
phone: text (opcional)
avatar_url: text (opcional)
website: text (opcional)
created_at: timestamptz
```

### proposals
```
id: uuid (PK)
user_id: uuid (FK → auth.users)
slug: text (unique, usado na URL pública /p/[slug])
client_name: text
client_email: text (opcional)
project_title: text
scope: text (escopo + entregáveis)
price_cents: integer (preço em centavos)
deadline_days: integer
valid_until: date
payment_terms: text (opcional, ex: "50% entrada + 50% na entrega")
status: enum (draft, sent, viewed, accepted, expired)
created_at: timestamptz
updated_at: timestamptz
```

### proposal_views
```
id: uuid (PK)
proposal_id: uuid (FK → proposals)
viewer_ip: text (anonimizado: primeiros 3 octetos)
user_agent: text
viewed_at: timestamptz
duration_seconds: integer (calculado por heartbeats)
```

### proposal_accepts
```
id: uuid (PK)
proposal_id: uuid (FK → proposals, unique)
acceptor_name: text (quem clicou "aceitar")
acceptor_ip: text
accepted_at: timestamptz
```

**RLS:** Proposals visíveis apenas pelo user_id dono. Página pública `/p/[slug]` usa service role pra ler sem auth.

## Páginas

### 1. `/` — Landing page
Rebranding do Verelus atual. Mesmo layout, novo copy:
- Hero: "Propostas que fecham. Em 2 minutos."
- CTA: "Criar conta grátis"
- Seções: como funciona (3 passos), exemplo de proposta, preços, FAQ

### 2. `/login` — Auth
Reusar 100%. Google OAuth + email/password.

### 3. `/dashboard` — Lista de propostas
- Resumo no topo: "X propostas abertas · R$Y em pipeline · Z% taxa de aceite"
- Lista de cards, cada um mostrando:
  - Título + cliente + R$ valor
  - Status badge (rascunho / enviada / visualizada / aceita / expirada)
  - Tracking: "Visualizada 3x · 4min total · última vez há 12min"
  - Botão copiar link
- Botão "Nova proposta" (destaque)
- Se free user com 3 propostas no mês: UpgradeGate no botão

### 4. `/dashboard/new` — Criar proposta
Formulário com 5 campos:

| Campo | Tipo | Obrigatório | Notas |
|-------|------|-------------|-------|
| Nome do cliente | text | Sim | |
| Título do projeto | text | Sim | Ex: "Redesign do App Mobile" |
| Escopo + entregáveis | textarea | Sim | Botão "Sugerir com IA" (Pro) |
| Preço (R$) | number | Sim | Input em reais, salva centavos |
| Prazo (dias) | number | Sim | |

Campos opcionais (colapsáveis):
- Email do cliente (pra notificações)
- Condições de pagamento (textarea)
- Validade da proposta (date, default +15 dias)

Botão "Criar e visualizar" → vai pra preview.

### 5. `/dashboard/[id]` — Detalhe da proposta
- Preview da proposta como o cliente vê (iframe ou render inline)
- Painel lateral de analytics:
  - Total de visualizações
  - Tempo total na página
  - Lista de acessos com horário e duração
  - Status atual
- Ações: copiar link, editar, marcar como enviada, excluir

### 6. `/p/[slug]` — Proposta pública (sem auth)
O que o cliente vê. Estilo clean minimal:

```
┌─────────────────────────────────────────────┐
│  [Avatar] Nome do Freelancer                │
│           Título · email · site             │
│                                             │
│  ─────────────────                          │
│  PROPOSTA COMERCIAL                         │
│  Redesign do App Mobile — v2.0              │
│  Para TechStartup Ltda                      │
│                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │R$ 8.500  │ │ 21 dias  │ │Válida até│    │
│  │Investim. │ │ Prazo    │ │ 02/05    │    │
│  └──────────┘ └──────────┘ └──────────┘    │
│                                             │
│  O QUE ESTÁ INCLUÍDO                        │
│  → Pesquisa com 5 usuários                  │
│  → Wireframes de 12 telas                   │
│  → Design system (Figma)                    │
│  → Protótipo interativo                     │
│  → 2 rodadas de revisão                     │
│                                             │
│  Condições: 50% entrada, 50% na entrega     │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │       ACEITAR PROPOSTA              │    │
│  └─────────────────────────────────────┘    │
│           Baixar PDF (v2)                   │
│                                             │
│        Feito com Verelus (free tier)        │
└─────────────────────────────────────────────┘
```

**Tracking:** Ao carregar a página, dispara `POST /api/track/view` com proposal_id. Heartbeat a cada 30s via `navigator.sendBeacon` pra calcular duração. Não usa cookies, não pede consentimento (é analytics first-party do dono da proposta, não do visitante).

### 7. `/p/[slug]/accept` — Tela de aceite
Após clicar "Aceitar proposta":
- Mostra resumo (projeto, valor, prazo)
- Campo: "Seu nome completo" (obrigatório)
- Botão "Confirmar aceite"
- Salva em proposal_accepts, atualiza status pra "accepted"
- Envia email pro freelancer: "João aceitou sua proposta de R$8.500!"
- Mostra tela de confirmação pro cliente: "Proposta aceita! [Nome do freelancer] entrará em contato."

### 8. `/dashboard/profile` — Perfil do freelancer
Formulário com dados que aparecem no cabeçalho de toda proposta:
- Nome, título profissional, email, telefone, website, avatar

## API Routes

```
POST /api/proposals/create      → cria proposta, gera slug
GET  /api/proposals/list        → lista propostas do user
GET  /api/proposals/[id]        → detalhe + analytics
PUT  /api/proposals/[id]        → editar proposta
DEL  /api/proposals/[id]        → excluir proposta

GET  /api/proposals/public/[slug]   → dados da proposta (sem auth, service role)
POST /api/proposals/accept/[slug]   → registra aceite

POST /api/track/view            → registra visualização (sem auth)
POST /api/track/heartbeat       → atualiza duração (sem auth)

POST /api/ai/suggest-scope      → IA sugere escopo (Pro only)

GET  /api/user/profile          → perfil do freelancer
PUT  /api/user/profile          → atualiza perfil

POST /api/stripe/checkout       → cria sessão Stripe (upgrade Pro)
POST /api/webhook/stripe        → webhook (reusar existente)
```

## Notificações por email

Via Resend (já integrado):

1. **Proposta visualizada** — "João abriu sua proposta 'Redesign App Mobile'"
2. **Proposta aceita** — "João aceitou sua proposta de R$8.500!"
3. **Proposta expirando** — "Sua proposta pra João vence em 2 dias" (cron job)

## Distribuição e growth

### Viral loop (custo zero)
Cada proposta free tem "Feito com Verelus" no rodapé com link. O cliente do freelancer vê, clica, vira user. 300 propostas/mês de 100 free users → 6-18 novos signups orgânicos/mês crescendo exponencialmente.

### SEO (custo zero, 2-3 meses)
Blog posts otimizados para:
- "modelo proposta comercial prestação de serviço"
- "como cobrar freelancer"
- "proposta freelancer template"
Cada post com CTA "Crie grátis no Verelus".

### Comunidades (custo zero, imediato)
Participar em grupos Facebook/Discord/Telegram de freelancers BR. Postar antes/depois (proposta WhatsApp vs Verelus). Pedir feedback.

### Conteúdo curto (Reels/TikTok)
1 vídeo/semana "antes vs depois" de proposta. Alcance orgânico alto pra nicho.

### Product Hunt (lançamento)
200-500 signups no dia 1, alimenta viral loop.

## O que NÃO entra no MVP

- Editor visual de proposta (tipo Canva)
- Download PDF
- Múltiplos templates de visual
- Cronograma/fases na proposta
- Integração WhatsApp
- CRM/pipeline avançado
- Multi-usuário (agência)
- Seção "Sobre mim" / portfólio na proposta
- Assinatura eletrônica com certificado ICP-Brasil

## Reuso de código Verelus

| Componente | Reuso |
|-----------|-------|
| Auth (Supabase + Google OAuth) | 100% |
| Middleware (session refresh) | 100% |
| Stripe billing + webhooks | 100% |
| UpgradeGate / UpgradeModal | 100% |
| Toast / HelpTooltip / UI components | 100% |
| Tailwind config + design tokens | 100% |
| Landing page layout | ~60% (novo copy) |
| Dashboard layout + sidebar | ~70% (novos nav items) |
| API route pattern (requireUser, errorResponse) | 100% |
| Email sending (Resend) | 100% |

**Código novo:** formulário de proposta, página pública `/p/[slug]`, tracking (view + heartbeat), dashboard de propostas, API de sugestão IA.

**Estimativa:** ~70% infra reusada. Core novo é ~30% do código total.
