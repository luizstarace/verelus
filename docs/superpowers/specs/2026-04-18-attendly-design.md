# Attendly — Design Spec

**Data:** 2026-04-18
**Status:** Aprovado
**Produto:** Attendly (produto dentro da plataforma Verelus)

---

## 1. Visao Geral

Attendly e um atendente IA para PMEs brasileiras. Responde clientes via WhatsApp e widget de chat no site, 24/7, com voz opcional (ElevenLabs). O dono do negocio cadastra servicos, precos e horarios; a IA aprende e atende como se fosse ele.

**Marca:** Verelus e a marca guarda-chuva (generica, multi-produto). Attendly e o primeiro produto. Cada produto tem identidade propria mas herda a paleta da Verelus.

**Publico-alvo:** PMEs generalistas — clinicas, restaurantes, saloes, lojas. Qualquer negocio que recebe mensagens de clientes e precisa atender fora do horario.

**Modelo de negocio:** SaaS com billing hibrido (assinatura base + excedente por uso).

---

## 2. Identidade Visual (Rebrand Verelus)

Paleta otimizada para conversao (baseada em dados):

| Funcao | Cor | Hex | Razao |
|--------|-----|-----|-------|
| Primaria | Azul escuro | #1e3a5f | Confianca, seriedade — PME confia |
| Trust/Tech | Azul medio | #3b82f6 | Modernidade, tecnologia, IA |
| CTA/Acao | Laranja | #f59e0b | Maximo contraste com azul. Melhor cor pra CTA em A/B tests |
| Fundo | Branco/cinza claro | #f8fafc | Legibilidade pro publico nao-tech |
| Texto | Quase-preto | #0f172a | Contraste alto, leitura confortavel |

- Fundo claro converte melhor pra PME (Nielsen Norman Group)
- Azul = cor #1 em confianca (Journal of Business Research)
- Laranja CTA = contraste maximo contra azul (HubSpot A/B tests)
- Mesma formula: Stripe, HubSpot, Intercom

---

## 3. Estrutura de Paginas

```
verelus.com/                        → Homepage neutra (vitrine de produtos)
verelus.com/attendly                → Landing page do Attendly
verelus.com/attendly/pricing        → Pricing (ou inline na landing)
verelus.com/login                   → Auth compartilhado (ja existe)
verelus.com/dashboard/attendly      → Dashboard do cliente
  /dashboard/attendly/setup         → Onboarding wizard
  /dashboard/attendly/inbox         → Conversas do atendente
  /dashboard/attendly/settings      → Configuracoes
  /dashboard/attendly/billing       → Plano e uso
```

- Rotas de propostas (`/dashboard/proposals/*`) desativadas, codigo permanece
- Auth e Stripe compartilhados entre produtos
- Padrao futuro: `/produto` (landing) + `/dashboard/produto` (app)

---

## 4. Schema Supabase

### attendly_businesses

```sql
CREATE TABLE attendly_businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL UNIQUE,
  name text NOT NULL,
  category text,
  phone text,
  address text,
  services jsonb DEFAULT '[]',        -- [{name, price_cents, duration_min, description}]
  hours jsonb DEFAULT '{}',           -- {mon: {open: "08:00", close: "18:00"}, ...}
  faq jsonb DEFAULT '[]',             -- [{question, answer}]
  ai_context text,                    -- gerado pelo Claude a partir dos dados acima
  voice_id text DEFAULT 'default',
  widget_config jsonb DEFAULT '{}',   -- {color, position, greeting}
  whatsapp_number text,
  onboarding_step int DEFAULT 1,        -- passo atual do wizard (1-7), null = completo
  status text DEFAULT 'setup' CHECK (status IN ('setup', 'active', 'paused')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS: usuario so ve seu negocio
ALTER TABLE attendly_businesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_only" ON attendly_businesses
  FOR ALL USING (auth.uid() = user_id);
```

### attendly_conversations

```sql
CREATE TABLE attendly_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES attendly_businesses NOT NULL,
  channel text NOT NULL CHECK (channel IN ('widget', 'whatsapp', 'voice')),
  customer_name text,
  customer_phone text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'human_needed', 'closed')),
  message_count int DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  satisfaction smallint CHECK (satisfaction IS NULL OR satisfaction BETWEEN 1 AND 5)
);

CREATE INDEX idx_conv_business_date ON attendly_conversations (business_id, started_at DESC);
CREATE INDEX idx_conv_business_status ON attendly_conversations (business_id, status);

ALTER TABLE attendly_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_via_business" ON attendly_conversations
  FOR ALL USING (
    business_id IN (SELECT id FROM attendly_businesses WHERE user_id = auth.uid())
  );
```

### attendly_messages

```sql
CREATE TABLE attendly_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES attendly_conversations NOT NULL,
  role text NOT NULL CHECK (role IN ('customer', 'assistant', 'human')),
  content text NOT NULL,
  audio_url text,
  tokens_used int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_msg_conv_date ON attendly_messages (conversation_id, created_at);

ALTER TABLE attendly_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_via_conversation" ON attendly_messages
  FOR ALL USING (
    conversation_id IN (
      SELECT c.id FROM attendly_conversations c
      JOIN attendly_businesses b ON c.business_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );
```

### attendly_usage

```sql
CREATE TABLE attendly_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES attendly_businesses NOT NULL,
  period date NOT NULL,                -- primeiro dia do mes (2026-05-01)
  text_messages int DEFAULT 0,
  voice_seconds int DEFAULT 0,
  tokens_total int DEFAULT 0,
  cost_cents int DEFAULT 0,
  overage_notified boolean DEFAULT false,
  UNIQUE (business_id, period)
);

ALTER TABLE attendly_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_via_business" ON attendly_usage
  FOR ALL USING (
    business_id IN (SELECT id FROM attendly_businesses WHERE user_id = auth.uid())
  );
```

### attendly_logs

```sql
CREATE TABLE attendly_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid,
  endpoint text NOT NULL,
  channel text,
  tokens_used int DEFAULT 0,
  latency_ms int DEFAULT 0,
  status_code int,
  error text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_logs_date ON attendly_logs (created_at DESC);
CREATE INDEX idx_logs_business ON attendly_logs (business_id, created_at DESC);
```

Notas:
- `role: 'human'` em messages distingue resposta do dono vs resposta da IA
- `status: 'human_needed'` em conversations marca conversas que precisam atencao
- attendly_logs nao tem RLS — tabela interna de observabilidade
- Reutiliza tabela `subscriptions` existente com `product='attendly'`

---

## 5. Fluxos de Dados

### 5.1 Onboarding (self-service)

```
Dashboard /attendly/setup (wizard com checklist)
  Passo 1: Dados do negocio (nome, categoria, telefone)
  Passo 2: Servicos (nome, preco, duracao)
  Passo 3: Horarios de funcionamento
  Passo 4: FAQ (perguntas frequentes)
  → POST /api/attendly/setup
  → Salva em attendly_businesses
  → Claude API gera ai_context a partir dos dados
  → Salva ai_context
  Passo 5: Preview do atendente (cliente testa ANTES de ativar)
  → Cliente faz perguntas teste, ve como IA responde
  → Ajusta se necessario
  Passo 6: Instalar widget (codigo pra copiar)
  Passo 7: Conectar WhatsApp (QR code)
  → status: setup → active
```

### 5.2 Chat (endpoint unico — widget + WhatsApp)

```
POST /api/attendly/chat
  ← body: {business_id, conversation_id?, message, channel}
  → Valida business_id, verifica status='active'
  → Cria ou recupera conversation
  → Carrega ai_context do business
  → Envia pra Claude API com streaming (SSE)
  → Salva mensagem do cliente em attendly_messages
  → Salva resposta da IA em attendly_messages
  → Incrementa message_count na conversation
  → Incrementa text_messages + tokens em attendly_usage
  → Checa limite do plano:
    → Se >80% e !overage_notified: email alerta
    → Se excedeu: continua funcionando (cobra excedente)
  → Detecta transferencia:
    → Se resposta contem [TRANSFER] ou cliente digitou keyword:
      → Muda status pra 'human_needed'
      → Notifica dono (WhatsApp + email + dashboard)
      → Para de responder IA nessa conversa
  → Loga em attendly_logs (latency, tokens, status)
  → Retorna resposta via SSE stream
```

### 5.3 WhatsApp (n8n como ponte)

```
Cliente manda msg no WhatsApp
  → Evolution API recebe
  → Webhook → n8n
  → n8n extrai: numero, mensagem, identifica business_id
  → n8n chama POST /api/attendly/chat {channel: 'whatsapp'}
  → Recebe resposta
  → n8n envia resposta via Evolution API
  → Cliente recebe no WhatsApp

Media (foto/audio/documento):
  → MVP: "Recebi seu arquivo! Consigo te ajudar melhor por texto."
  → Arquivo salvo no Supabase Storage pra dono ver
  → Pos-MVP: Claude Vision (imagens), Whisper (audio)
```

### 5.4 Voz (ElevenLabs)

```
POST /api/attendly/voice
  ← body: {message_id, text}
  → Verifica se plano permite voz
  → Envia texto pra ElevenLabs API (text-to-speech)
  → Recebe audio (mp3)
  → Salva no Supabase Storage
  → Atualiza audio_url na mensagem
  → Incrementa voice_seconds em attendly_usage
  → Retorna URL do audio
```

### 5.5 Transferencia Humana

```
Deteccao (logica hibrida):
  1. Prompt: ai_context instrui Claude a responder [TRANSFER]
     quando nao souber ou assunto fora do escopo
  2. Keywords do cliente: "humano", "atendente", "pessoa",
     "gerente", "falar com alguem"
  3. Backend detecta [TRANSFER] ou keyword

Fluxo:
  → Muda conversation.status = 'human_needed'
  → Msg pro cliente: "Vou transferir para [nome]. Um momento..."
  → Notifica dono:
    ├── WhatsApp pessoal (via Evolution API)
    ├── Email (Resend) com link direto pra conversa
    └── Dashboard: badge vermelho no inbox
  → IA para de responder nessa conversa
  → Dono responde pelo dashboard (role: 'human')
  → Botao "Devolver pra IA" → status volta pra 'active'
```

---

## 6. Planos e Pricing

| | Starter | Pro | Business |
|---|---|---|---|
| Preco | R$147/mes | R$297/mes | R$597/mes |
| Mensagens | 500/mes | 2.500/mes | 10.000/mes |
| Canais | Widget + WhatsApp | Widget + WhatsApp | Widget + WhatsApp |
| Voz (ElevenLabs) | — | 30 min/mes | 120 min/mes |
| Voz customizada | — | — | Clone de voz do dono |
| Analytics | Basico (msgs/dia) | Completo + satisfacao | Completo + export CSV |
| Excedente texto | R$0,12/msg | R$0,08/msg | R$0,05/msg |
| Excedente voz | — | R$0,70/min | R$0,50/min |
| Trial | 7 dias gratis | 7 dias gratis | 7 dias gratis |

### Margens

| | Starter | Pro | Business |
|---|---|---|---|
| Custo estimado | ~R$7 | ~R$42 | ~R$142 |
| Receita | R$147 | R$297 | R$597 |
| Margem | 95% | 86% | 76% |

### Billing

- Stripe subscriptions + usage-based billing (metered)
- Trial: 7 dias, sem cartao de credito
- Excedente: calculado no fim do mes via attendly_usage, invoice item adicional no Stripe
- Excedente nunca bloqueia atendente — continua funcionando, cobra depois
- Toggle anual na pricing page: 2 meses gratis
  - Starter anual: R$1.470/ano (R$122,50/mes efetivo, economia R$294)
  - Pro anual: R$2.970/ano (R$247,50/mes efetivo, economia R$594)
  - Business anual: R$5.970/ano (R$497,50/mes efetivo, economia R$1.194)

---

## 7. Widget Embeddable

### Instalacao

```html
<script src="https://verelus.com/widget/BUSINESS_ID.js" async></script>
```

### Comportamento

- **Fechado:** bolha flutuante (canto inferior direito), pulse 3x em 5s, notch com preview da greeting
- **Pre-chat:** captura nome (obrigatorio) + telefone (opcional) antes da primeira mensagem. Lead capturado mesmo sem conversao.
- **Chat ativo:** baloes coloridos, typing indicator, streaming SSE (palavra por palavra), botao voz (se plano permite), timestamps discretos
- **Mobile:** fullscreen (bottom sheet), teclado nao cobre input, swipe down pra minimizar
- **Powered by Attendly:** com referral tracking (?ref=widget_BUSINESS_ID)

### Estados especiais

- **Transferencia:** "Transferindo para [nome]..." + indicador de espera
- **Erro de conexao:** retry automatico com backoff (3s, 6s, 12s)
- **Fora do horario:** mensagem customizada + "Deixe seu contato que retornamos"
- **Rate limit:** max 30 msgs por sessao (anti-abuse)

### Tecnico

- ~12KB gzipped, vanilla JS, zero dependencias
- Shadow DOM (isolamento CSS total)
- SSE pra streaming, REST pra envio
- localStorage: persiste conversa por 24h
- Lazy load apos DOMContentLoaded
- ARIA labels + keyboard nav
- CSP-safe

---

## 8. Integracao WhatsApp

### Provider

**MVP:** Evolution API (self-hosted, gratis, VPS ~R$20/mes)
- Risco: protocolo nao-oficial
- Mitigacao: rate limiting 200 msgs/hora, delay humano 1-3s, apenas respostas (sem spam)

**Pos-100 clientes:** Migration path pra Meta Business API (oficial, pago por msg, sem risco)

### Conexao

1. Cliente clica "Conectar WhatsApp" no dashboard
2. Backend cria instancia na Evolution API
3. QR code no dashboard (60s validade, refresh auto)
4. Cliente escaneia → status "Conectado"
5. Health check n8n cron a cada 5 min:
   - Conectado: noop
   - Desconectado: 3 tentativas reconexao → se falha: email + alerta dashboard

### Media

- MVP: resposta texto "Recebi seu arquivo! Consigo te ajudar melhor por texto."
- Arquivo salvo no Supabase Storage pra dono ver
- Pos-MVP: Claude Vision (imagens), Whisper (audio)

---

## 9. Homepage Verelus

```
verelus.com
├── Nav: Logo Verelus | Attendly | Sobre | Login
├── Hero: "Produtos com IA que trabalham enquanto você descansa"
├── Produto Destaque: card Attendly (grande, CTA "Conhecer →")
├── "Em breve": texto + input email "Quero ser avisado"
└── Rodape minimalista
```

- Homepage curta e direcional (1 produto por enquanto)
- "Em breve" captura leads em vez de mostrar cards vazios
- Grid de produtos sera dinamico (Supabase) quando houver 3+

---

## 10. Landing Page Attendly

```
/attendly
├── Hero: "Seu negócio atendendo clientes 24/7"
│   CTA: "Testar 7 dias grátis →" + "Sem cartão de crédito"
│   Video/GIF demonstrativo
├── Comparacao: Atendente humano vs Attendly (tabela)
│   R$1.500-3.000/mes vs R$147/mes
│   8h/dia vs 24/7
│   1 conversa vs ilimitadas
├── Como Funciona: 3 passos visuais
├── Diferenciais: WhatsApp+Site, Voz natural, Transfere pra humano, Aprende com tempo
├── Quem Usa: categorias (clinica, restaurante, salao, loja) com caso de uso
├── Pricing: 3 cards inline, Pro destacado em laranja, toggle anual
├── FAQ: 4 objecoes reais (programar? errar? cancelar? seguro?)
├── CTA Final: "Seu concorrente já está atendendo 24/7. E você?"
└── Rodape
```

---

## 11. Dashboard Attendly

### Onboarding Wizard (primeira vez)

Checklist visual persistente: Criar conta → Dados do negocio → Revisar atendente → Instalar widget → Conectar WhatsApp

"Revisar atendente" permite testar a IA antes de ativar.

### Visao Geral (/dashboard/attendly)

- Cards: msgs hoje | msgs mes | uso do plano (%) | nota media
- Alertas (banner topo): "IA nao soube responder X perguntas", "Uso em 80%", "WhatsApp desconectado"
- Grafico: msgs/dia ultimos 7 dias
- Ultimas 5 conversas

### Conversas (/dashboard/attendly/inbox)

- Lista com filtros: canal, status, "IA nao soube"
- Badge vermelho em conversas que precisam atencao
- Detalhe: historico + botao "Responder como humano"
- Polling 30s pra novas msgs (SSE pos-MVP)

### Configuracoes (/dashboard/attendly/settings)

- **Dados do negocio:** editar servicos, precos, horarios, FAQ. Ao salvar → ai_context regenera automaticamente. Toast: "Atendente atualizado ✓"
- **Widget:** preview ao vivo + codigo 1 linha pra copiar
- **WhatsApp:** guia passo a passo com screenshots, QR code, status conectado/desconectado
- **Voz:** lista de vozes com player preview. "Voz personalizada" → upgrade Business
- **Transferencia humana:** config gatilho + canal de notificacao + mensagem automatica

### Plano & Uso (/dashboard/attendly/billing)

- Barra de progresso visual: verde (<60%) | amarelo (60-85%) | vermelho (>85%)
- Previsao: "No ritmo atual, 100% em X dias"
- Historico faturas (Stripe Customer Portal)
- Upgrade com comparacao lado a lado

---

## 12. Stack Tecnica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14, Tailwind CSS, Vercel |
| Widget | Vanilla JS, Shadow DOM, SSE |
| Backend | Next.js API Routes |
| IA | Claude API (streaming) |
| Voz | ElevenLabs API |
| Database | Supabase (PostgreSQL + Auth + Storage + RLS) |
| Payments | Stripe (subscriptions + usage metering) |
| Email | Resend |
| Automacao | n8n (ponte WhatsApp, health checks, crons) |
| WhatsApp | Evolution API (self-hosted) |

### APIs

```
POST   /api/attendly/setup                    → cria business + gera ai_context
GET    /api/attendly/business                 → dados do negocio
PATCH  /api/attendly/business                 → atualiza + regenera ai_context
POST   /api/attendly/chat                     → chat (SSE stream)
POST   /api/attendly/voice                    → text-to-speech
GET    /api/attendly/conversations            → lista com filtros
GET    /api/attendly/conversations/[id]       → detalhe + mensagens
POST   /api/attendly/conversations/[id]/reply → resposta humana
PATCH  /api/attendly/conversations/[id]/status → fechar/devolver pra IA
GET    /api/attendly/widget/[id].js           → script embeddable
POST   /api/attendly/widget/lead              → captura pre-chat
POST   /api/attendly/whatsapp/connect         → gera QR code
GET    /api/attendly/whatsapp/status          → status conexao
POST   /api/attendly/whatsapp/webhook         → recebe msgs Evolution API
GET    /api/attendly/usage                    → uso periodo atual
POST   /api/attendly/checkout                 → sessao Stripe
GET    /api/health/attendly                   → health check
```

### Observabilidade

- `GET /api/health/attendly` checa: Supabase, Claude API, ElevenLabs, Evolution API
- n8n cron (10min): chama health endpoint, email se falha
- Logs estruturados em `attendly_logs`: business_id, endpoint, channel, tokens, latency_ms, status_code
- Alertas automaticos: WhatsApp desconectado, uso 80%, IA sem resposta

---

## 13. Notificacoes

| Evento | Canal | Frequencia |
|--------|-------|-----------|
| IA nao soube responder | Email (Resend) | Diario, agregado |
| Uso em 80% do limite | Email + Dashboard | Uma vez por periodo |
| Resumo semanal | Email | Segunda 8h |
| WhatsApp desconectado | Email | Imediato |
| Novo cliente aceitou trial | Email pra voce (admin) | Imediato |
| Saude do sistema | Email pra voce (admin) | Quando falha |

---

## 14. Decisoes Arquiteturais

| Decisao | Alternativa descartada | Razao |
|---------|----------------------|-------|
| Monolito expandido | Multi-repo, Monorepo | Solo founder, velocidade > purismo |
| Vercel | Cloudflare Pages | Next.js nativo, zero incompatibilidade, MCP conectado |
| Evolution API | Meta Business API, Z-API | Gratis, self-hosted. Meta API como fallback futuro |
| Self-service onboarding | Done-for-you, Hibrido | Unico que escala sem intervencao manual |
| Billing hibrido | Fixo, Pay-per-use | Previsibilidade pro cliente + margem protegida |
| SSE streaming no chat | REST sincrono | UX moderna, expectativa de mercado 2026 |
| Shadow DOM no widget | iframe | Mais leve, melhor performance, SEO-safe |
| ai_context auto-regenera | Botao manual "Regenerar" | Cliente esquece = atendente desatualizado = churn |

---

## 15. Fora do Escopo (MVP)

- Integracao telefonica (Twilio/VAPI)
- Google Calendar (agendamento automatico)
- Canva (materiais de marketing)
- Claude Vision pra imagens no WhatsApp
- Whisper pra transcrever audios
- Dashboard admin (/admin)
- Multi-idioma no atendente (so portugues)
- App mobile nativo
