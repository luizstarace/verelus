# Atalaia Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Atalaia — an AI customer service agent for Brazilian SMBs — as the first product inside the Verelus multi-product platform.

**Architecture:** Monolith expansion of the existing Next.js 14 Verelus app. Atalaia lives under `/atalaia` (landing) and `/dashboard/atalaia` (app). Shares auth, Stripe, and Supabase with the existing codebase. Chat uses Claude Haiku 4.5 via SSE streaming. Widget is a vanilla JS embeddable with Shadow DOM. WhatsApp integration via n8n + Evolution API.

**Tech Stack:** Next.js 14 (App Router), Supabase (PostgreSQL + Auth + Storage + RLS), Stripe (subscriptions + usage metering), Claude Haiku 4.5 (streaming), ElevenLabs API, Resend, n8n, Evolution API, Tailwind CSS, Vanilla JS (widget).

**Spec:** `Atalaia/docs/spec.md`

---

## File Structure

### New files to create:

```
# Database
supabase/migrations/004_atalaia.sql

# Types
src/lib/types/atalaia.ts

# API Routes
src/app/api/atalaia/setup/route.ts
src/app/api/atalaia/business/route.ts
src/app/api/atalaia/chat/route.ts
src/app/api/atalaia/voice/route.ts
src/app/api/atalaia/conversations/route.ts
src/app/api/atalaia/conversations/[id]/route.ts
src/app/api/atalaia/conversations/[id]/reply/route.ts
src/app/api/atalaia/conversations/[id]/status/route.ts
src/app/api/atalaia/widget/lead/route.ts
src/app/api/atalaia/widget/[id]/config/route.ts
src/app/api/atalaia/whatsapp/connect/route.ts
src/app/api/atalaia/whatsapp/status/route.ts
src/app/api/atalaia/whatsapp/webhook/route.ts
src/app/api/atalaia/usage/route.ts
src/app/api/atalaia/checkout/route.ts
src/app/api/health/atalaia/route.ts

# Atalaia helpers
src/lib/atalaia/ai-context.ts
src/lib/atalaia/chat.ts
src/lib/atalaia/usage.ts
src/lib/atalaia/transfer.ts
src/lib/atalaia/plans.ts
src/lib/atalaia/notifications.ts

# Pages
src/app/page.tsx                              (modify — homepage rebrand)
src/app/atalaia/page.tsx                     (landing page)
src/app/dashboard/atalaia/page.tsx           (overview)
src/app/dashboard/atalaia/setup/page.tsx
src/app/dashboard/atalaia/setup/SetupWizard.tsx
src/app/dashboard/atalaia/inbox/page.tsx
src/app/dashboard/atalaia/inbox/InboxView.tsx
src/app/dashboard/atalaia/inbox/ConversationDetail.tsx
src/app/dashboard/atalaia/settings/page.tsx
src/app/dashboard/atalaia/settings/SettingsView.tsx
src/app/dashboard/atalaia/billing/page.tsx
src/app/dashboard/atalaia/billing/BillingView.tsx
src/app/dashboard/atalaia/OverviewDashboard.tsx

# Widget
public/widget.js

# Tests
src/__tests__/api/atalaia/setup.test.ts
src/__tests__/api/atalaia/chat.test.ts
src/__tests__/api/atalaia/business.test.ts
src/__tests__/api/atalaia/conversations.test.ts
src/__tests__/api/atalaia/usage.test.ts
src/__tests__/lib/atalaia/ai-context.test.ts
src/__tests__/lib/atalaia/chat.test.ts
src/__tests__/lib/atalaia/transfer.test.ts
src/__tests__/lib/atalaia/plans.test.ts
```

### Files to modify:

```
tailwind.config.ts                            (rebrand colors + fonts)
src/app/layout.tsx                            (font + theme changes)
src/app/dashboard/layout.tsx                  (add Atalaia sidebar items)
src/lib/translations.ts                       (add Atalaia translations)
src/lib/use-user-tier.ts                      (extend for Atalaia plans)
```

---

## Task 1: Foundation — Schema, Types, Tailwind Rebrand

**Files:**
- Create: `supabase/migrations/004_atalaia.sql`
- Create: `src/lib/types/atalaia.ts`
- Create: `src/lib/atalaia/plans.ts`
- Modify: `tailwind.config.ts`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Write Atalaia types**

```typescript
// src/lib/types/atalaia.ts

export interface AtalaiaBusiness {
  id: string;
  user_id: string;
  name: string;
  category: string | null;
  phone: string | null;
  address: string | null;
  services: AtalaiaService[];
  hours: Record<string, { open: string; close: string }>;
  faq: AtalaiaFaq[];
  ai_context: string | null;
  voice_id: string;
  widget_config: WidgetConfig;
  whatsapp_number: string | null;
  owner_whatsapp: string | null;
  owner_notify_channel: 'email' | 'whatsapp' | 'both';
  onboarding_step: number | null;
  status: 'setup' | 'active' | 'paused';
  created_at: string;
  updated_at: string;
}

export interface AtalaiaService {
  name: string;
  price_cents: number;
  duration_min: number;
  description: string;
}

export interface AtalaiaFaq {
  question: string;
  answer: string;
}

export interface WidgetConfig {
  color?: string;
  position?: 'bottom-right' | 'bottom-left';
  greeting?: string;
}

export interface AtalaiaConversation {
  id: string;
  business_id: string;
  channel: 'widget' | 'whatsapp' | 'voice';
  customer_name: string | null;
  customer_phone: string | null;
  status: 'active' | 'human_needed' | 'closed';
  message_count: number;
  started_at: string;
  ended_at: string | null;
  satisfaction: number | null;
}

export interface AtalaiaMessage {
  id: string;
  conversation_id: string;
  role: 'customer' | 'assistant' | 'human';
  content: string;
  audio_url: string | null;
  tokens_used: number;
  created_at: string;
}

export interface AtalaiaUsage {
  id: string;
  business_id: string;
  period: string;
  text_messages: number;
  voice_seconds: number;
  tokens_total: number;
  cost_cents: number;
  overage_notified: boolean;
}

export type AtalaiaPlan = 'starter' | 'pro' | 'business';

export interface AtalaiaPlanLimits {
  text_messages: number;
  voice_seconds: number;
  voice_enabled: boolean;
  voice_clone: boolean;
  overage_text_cents: number;
  overage_voice_cents: number;
}

export interface ChatRequest {
  business_id: string;
  conversation_id?: string;
  message: string;
  channel: 'widget' | 'whatsapp';
  customer_name?: string;
  customer_phone?: string;
  preview?: boolean;
}
```

- [ ] **Step 2: Write plan limits config**

```typescript
// src/lib/atalaia/plans.ts

import { AtalaiaPlan, AtalaiaPlanLimits } from '@/lib/types/atalaia';

export const ATALAIA_PLANS: Record<AtalaiaPlan, AtalaiaPlanLimits> = {
  starter: {
    text_messages: 500,
    voice_seconds: 0,
    voice_enabled: false,
    voice_clone: false,
    overage_text_cents: 12,  // R$0,12/msg
    overage_voice_cents: 0,
  },
  pro: {
    text_messages: 2500,
    voice_seconds: 1800,     // 30 min
    voice_enabled: true,
    voice_clone: false,
    overage_text_cents: 8,   // R$0,08/msg
    overage_voice_cents: 70,  // R$0,70/min (per 60s)
  },
  business: {
    text_messages: 10000,
    voice_seconds: 7200,     // 120 min
    voice_enabled: true,
    voice_clone: true,
    overage_text_cents: 5,   // R$0,05/msg
    overage_voice_cents: 50,  // R$0,50/min
  },
};

export const ATALAIA_PRICES = {
  starter_monthly: 14700,    // R$147
  pro_monthly: 29700,        // R$297
  business_monthly: 59700,   // R$597
  starter_annual: 147000,    // R$1.470
  pro_annual: 297000,        // R$2.970
  business_annual: 597000,   // R$5.970
} as const;

export const TRIAL_DAYS = 7;

export function getPlanFromSubscription(product: string | null): AtalaiaPlan {
  if (product === 'atalaia_business') return 'business';
  if (product === 'atalaia_pro') return 'pro';
  return 'starter';
}

export function getPlanLimits(plan: AtalaiaPlan): AtalaiaPlanLimits {
  return ATALAIA_PLANS[plan];
}
```

- [ ] **Step 3: Write the test for plans.ts**

```typescript
// src/__tests__/lib/atalaia/plans.test.ts

import { describe, it, expect } from 'vitest';
import { getPlanFromSubscription, getPlanLimits, ATALAIA_PLANS } from '@/lib/atalaia/plans';

describe('Atalaia Plans', () => {
  it('returns starter for null product', () => {
    expect(getPlanFromSubscription(null)).toBe('starter');
  });

  it('returns correct plan for product strings', () => {
    expect(getPlanFromSubscription('atalaia_pro')).toBe('pro');
    expect(getPlanFromSubscription('atalaia_business')).toBe('business');
    expect(getPlanFromSubscription('unknown')).toBe('starter');
  });

  it('starter has no voice', () => {
    const limits = getPlanLimits('starter');
    expect(limits.voice_enabled).toBe(false);
    expect(limits.voice_seconds).toBe(0);
  });

  it('pro has 30min voice', () => {
    const limits = getPlanLimits('pro');
    expect(limits.voice_enabled).toBe(true);
    expect(limits.voice_seconds).toBe(1800);
  });

  it('business has voice clone', () => {
    const limits = getPlanLimits('business');
    expect(limits.voice_clone).toBe(true);
    expect(limits.voice_seconds).toBe(7200);
  });

  it('all plans have text messages', () => {
    expect(ATALAIA_PLANS.starter.text_messages).toBe(500);
    expect(ATALAIA_PLANS.pro.text_messages).toBe(2500);
    expect(ATALAIA_PLANS.business.text_messages).toBe(10000);
  });
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/luizsfap/Desktop/Claude\ CODE\ Projects/verelus && npx vitest run src/__tests__/lib/atalaia/plans.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Write the Supabase migration**

```sql
-- supabase/migrations/004_atalaia.sql

-- ============================================
-- Atalaia: AI Customer Service Agent for SMBs
-- ============================================

-- Businesses
CREATE TABLE atalaia_businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL UNIQUE,
  name text NOT NULL,
  category text,
  phone text,
  address text,
  services jsonb DEFAULT '[]',
  hours jsonb DEFAULT '{}',
  faq jsonb DEFAULT '[]',
  ai_context text,
  voice_id text DEFAULT 'default',
  widget_config jsonb DEFAULT '{}',
  whatsapp_number text,
  owner_whatsapp text,
  owner_notify_channel text DEFAULT 'email' CHECK (owner_notify_channel IN ('email', 'whatsapp', 'both')),
  onboarding_step int DEFAULT 1,
  status text DEFAULT 'setup' CHECK (status IN ('setup', 'active', 'paused')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON atalaia_businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE atalaia_businesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_only" ON atalaia_businesses
  FOR ALL USING (auth.uid() = user_id);

-- Conversations
CREATE TABLE atalaia_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES atalaia_businesses NOT NULL,
  channel text NOT NULL CHECK (channel IN ('widget', 'whatsapp', 'voice')),
  customer_name text,
  customer_phone text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'human_needed', 'closed')),
  message_count int DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  satisfaction smallint CHECK (satisfaction IS NULL OR satisfaction BETWEEN 1 AND 5)
);

CREATE INDEX idx_conv_business_date ON atalaia_conversations (business_id, started_at DESC);
CREATE INDEX idx_conv_business_status ON atalaia_conversations (business_id, status);

ALTER TABLE atalaia_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_via_business" ON atalaia_conversations
  FOR ALL USING (
    business_id IN (SELECT id FROM atalaia_businesses WHERE user_id = auth.uid())
  );

-- Messages
CREATE TABLE atalaia_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES atalaia_conversations NOT NULL,
  role text NOT NULL CHECK (role IN ('customer', 'assistant', 'human')),
  content text NOT NULL,
  audio_url text,
  tokens_used int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_msg_conv_date ON atalaia_messages (conversation_id, created_at);

ALTER TABLE atalaia_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_via_conversation" ON atalaia_messages
  FOR ALL USING (
    conversation_id IN (
      SELECT c.id FROM atalaia_conversations c
      JOIN atalaia_businesses b ON c.business_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );

-- Usage tracking
CREATE TABLE atalaia_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES atalaia_businesses NOT NULL,
  period date NOT NULL,
  text_messages int DEFAULT 0,
  voice_seconds int DEFAULT 0,
  tokens_total int DEFAULT 0,
  cost_cents int DEFAULT 0,
  overage_notified boolean DEFAULT false,
  UNIQUE (business_id, period)
);

ALTER TABLE atalaia_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_via_business" ON atalaia_usage
  FOR ALL USING (
    business_id IN (SELECT id FROM atalaia_businesses WHERE user_id = auth.uid())
  );

-- Logs (no RLS — internal observability)
CREATE TABLE atalaia_logs (
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

CREATE INDEX idx_logs_date ON atalaia_logs (created_at DESC);
CREATE INDEX idx_logs_business ON atalaia_logs (business_id, created_at DESC);
```

- [ ] **Step 6: Apply migration to Supabase**

Run: `cd /Users/luizsfap/Desktop/Claude\ CODE\ Projects/verelus && npx supabase db push`
Expected: Migration applied successfully. Verify tables exist in Supabase dashboard.

If `supabase` CLI is not configured, apply manually via Supabase SQL Editor (Dashboard → SQL Editor → paste migration → Run).

- [ ] **Step 7: Rebrand Tailwind config**

Modify `tailwind.config.ts` — replace the brand colors section:

```typescript
// Replace the existing brand colors with the new Atalaia palette
colors: {
  brand: {
    primary: "#1e3a5f",      // Azul escuro — confianca
    trust: "#3b82f6",        // Azul medio — tech/IA
    cta: "#f59e0b",          // Laranja — CTA acao
    bg: "#f8fafc",           // Fundo claro
    text: "#0f172a",         // Texto principal
    success: "#22c55e",      // Sucesso, conectado
    error: "#ef4444",        // Erro, desconectado
    warning: "#f59e0b",      // Alertas (=cta)
    border: "#e2e8f0",       // Bordas, divisores
    surface: "#f1f5f9",      // Cards, hover
    muted: "#64748b",        // Texto secundario
  },
},
fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],
  mono: ['JetBrains Mono', 'monospace'],
},
```

- [ ] **Step 8: Update root layout for new fonts and theme**

Modify `src/app/layout.tsx`:
- Change Google Fonts link to Inter (400, 500, 700) + JetBrains Mono (400)
- Change `<html>` class from `"dark"` to `""`
- Change `<body>` class from dark theme to `"font-sans antialiased bg-brand-bg text-brand-text"`
- Update metadata title to `"Verelus — Produtos com IA para o seu negócio"`

- [ ] **Step 9: Commit foundation**

```bash
git add supabase/migrations/004_atalaia.sql src/lib/types/atalaia.ts src/lib/atalaia/plans.ts src/__tests__/lib/atalaia/plans.test.ts tailwind.config.ts src/app/layout.tsx
git commit -m "feat: atalaia foundation — schema, types, plans, tailwind rebrand"
```

---

## Task 2: AI Context Generator

**Files:**
- Create: `src/lib/atalaia/ai-context.ts`
- Create: `src/__tests__/lib/atalaia/ai-context.test.ts`

- [ ] **Step 1: Write the test for ai-context generation**

```typescript
// src/__tests__/lib/atalaia/ai-context.test.ts

import { describe, it, expect } from 'vitest';
import { buildAiContext } from '@/lib/atalaia/ai-context';

const mockBusiness = {
  name: 'Clínica Saúde Plena',
  category: 'clinica',
  phone: '11999887766',
  address: 'Rua das Flores, 123',
  services: [
    { name: 'Consulta Geral', price_cents: 15000, duration_min: 30, description: 'Consulta médica geral' },
    { name: 'Exame de Sangue', price_cents: 8000, duration_min: 15, description: 'Coleta e análise de sangue' },
  ],
  hours: {
    mon: { open: '08:00', close: '18:00' },
    tue: { open: '08:00', close: '18:00' },
    wed: { open: '08:00', close: '18:00' },
    thu: { open: '08:00', close: '18:00' },
    fri: { open: '08:00', close: '17:00' },
  },
  faq: [
    { question: 'Aceitam convênio?', answer: 'Sim, aceitamos Unimed e Amil.' },
  ],
};

describe('buildAiContext', () => {
  it('includes business name', () => {
    const ctx = buildAiContext(mockBusiness);
    expect(ctx).toContain('Clínica Saúde Plena');
  });

  it('includes services with formatted prices', () => {
    const ctx = buildAiContext(mockBusiness);
    expect(ctx).toContain('Consulta Geral');
    expect(ctx).toContain('R$ 150,00');
    expect(ctx).toContain('30 minutos');
  });

  it('includes business hours', () => {
    const ctx = buildAiContext(mockBusiness);
    expect(ctx).toContain('08:00');
    expect(ctx).toContain('18:00');
  });

  it('includes FAQ', () => {
    const ctx = buildAiContext(mockBusiness);
    expect(ctx).toContain('Aceitam convênio?');
    expect(ctx).toContain('Unimed e Amil');
  });

  it('includes transfer instruction with [TRANSFER] tag', () => {
    const ctx = buildAiContext(mockBusiness);
    expect(ctx).toContain('[TRANSFER]');
  });

  it('includes phone for contact fallback', () => {
    const ctx = buildAiContext(mockBusiness);
    expect(ctx).toContain('11999887766');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/lib/atalaia/ai-context.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement ai-context.ts**

```typescript
// src/lib/atalaia/ai-context.ts

interface BusinessData {
  name: string;
  category: string | null;
  phone: string | null;
  address: string | null;
  services: { name: string; price_cents: number; duration_min: number; description: string }[];
  hours: Record<string, { open: string; close: string }>;
  faq: { question: string; answer: string }[];
}

const DAY_NAMES: Record<string, string> = {
  mon: 'Segunda', tue: 'Terça', wed: 'Quarta',
  thu: 'Quinta', fri: 'Sexta', sat: 'Sábado', sun: 'Domingo',
};

function formatCents(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
}

export function buildAiContext(business: BusinessData): string {
  const sections: string[] = [];

  // Identity
  sections.push(`Você é o atendente virtual de "${business.name}".`);
  sections.push(`Seu objetivo é ajudar os clientes com informações sobre serviços, preços, horários e dúvidas frequentes.`);
  sections.push(`Responda sempre em português brasileiro, de forma educada, clara e objetiva.`);
  sections.push(`Nunca invente informações. Use apenas os dados abaixo.`);

  // Category
  if (business.category) {
    sections.push(`\nCategoria do negócio: ${business.category}`);
  }

  // Contact
  if (business.phone) {
    sections.push(`\nTelefone para contato direto: ${business.phone}`);
  }
  if (business.address) {
    sections.push(`Endereço: ${business.address}`);
  }

  // Services
  if (business.services.length > 0) {
    sections.push(`\n## Serviços oferecidos:`);
    for (const s of business.services) {
      sections.push(`- ${s.name}: ${formatCents(s.price_cents)} (${s.duration_min} minutos) — ${s.description}`);
    }
  }

  // Hours
  const hourEntries = Object.entries(business.hours);
  if (hourEntries.length > 0) {
    sections.push(`\n## Horário de funcionamento:`);
    for (const [day, time] of hourEntries) {
      const dayName = DAY_NAMES[day] || day;
      sections.push(`- ${dayName}: ${time.open} às ${time.close}`);
    }
  }

  // FAQ
  if (business.faq.length > 0) {
    sections.push(`\n## Perguntas frequentes:`);
    for (const f of business.faq) {
      sections.push(`P: ${f.question}\nR: ${f.answer}`);
    }
  }

  // Transfer rules
  sections.push(`\n## Regras de transferência:`);
  sections.push(`Quando você NÃO souber a resposta, quando o assunto fugir dos serviços cadastrados acima, ou quando o cliente pedir explicitamente para falar com uma pessoa, responda EXATAMENTE com o marcador [TRANSFER] seguido da razão.`);
  sections.push(`Exemplo: "[TRANSFER] Cliente quer negociar desconto especial."`);
  sections.push(`NUNCA invente respostas. Se não tem a informação acima, use [TRANSFER].`);

  return sections.join('\n');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/lib/atalaia/ai-context.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/atalaia/ai-context.ts src/__tests__/lib/atalaia/ai-context.test.ts
git commit -m "feat: ai-context generator for Atalaia businesses"
```

---

## Task 3: Transfer Detection & Chat Helpers

**Files:**
- Create: `src/lib/atalaia/transfer.ts`
- Create: `src/lib/atalaia/chat.ts`
- Create: `src/__tests__/lib/atalaia/transfer.test.ts`
- Create: `src/__tests__/lib/atalaia/chat.test.ts`

- [ ] **Step 1: Write transfer detection tests**

```typescript
// src/__tests__/lib/atalaia/transfer.test.ts

import { describe, it, expect } from 'vitest';
import { detectTransfer, TRANSFER_KEYWORDS } from '@/lib/atalaia/transfer';

describe('detectTransfer', () => {
  it('detects [TRANSFER] in AI response', () => {
    const result = detectTransfer({
      aiResponse: '[TRANSFER] Cliente quer falar sobre desconto.',
      customerMessage: 'quanto custa?',
    });
    expect(result.shouldTransfer).toBe(true);
    expect(result.reason).toBe('Cliente quer falar sobre desconto.');
    expect(result.source).toBe('ai');
  });

  it('detects customer keyword "humano"', () => {
    const result = detectTransfer({
      aiResponse: 'Posso ajudar com algo?',
      customerMessage: 'quero falar com um humano',
    });
    expect(result.shouldTransfer).toBe(true);
    expect(result.source).toBe('keyword');
  });

  it('detects customer keyword "atendente"', () => {
    const result = detectTransfer({
      aiResponse: 'Claro!',
      customerMessage: 'me passe para o atendente por favor',
    });
    expect(result.shouldTransfer).toBe(true);
  });

  it('does not trigger on normal messages', () => {
    const result = detectTransfer({
      aiResponse: 'Nosso horário é das 8 às 18.',
      customerMessage: 'qual o horário?',
    });
    expect(result.shouldTransfer).toBe(false);
  });

  it('is case insensitive for keywords', () => {
    const result = detectTransfer({
      aiResponse: 'ok',
      customerMessage: 'QUERO FALAR COM PESSOA',
    });
    expect(result.shouldTransfer).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/lib/atalaia/transfer.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement transfer.ts**

```typescript
// src/lib/atalaia/transfer.ts

export const TRANSFER_KEYWORDS = [
  'humano', 'atendente', 'pessoa', 'gerente',
  'falar com alguem', 'falar com alguém',
  'atendimento humano', 'pessoa real',
];

const TRANSFER_TAG = '[TRANSFER]';

interface TransferInput {
  aiResponse: string;
  customerMessage: string;
}

interface TransferResult {
  shouldTransfer: boolean;
  reason: string;
  source: 'ai' | 'keyword' | 'none';
}

export function detectTransfer(input: TransferInput): TransferResult {
  // Check AI response for [TRANSFER] tag
  if (input.aiResponse.includes(TRANSFER_TAG)) {
    const reason = input.aiResponse
      .substring(input.aiResponse.indexOf(TRANSFER_TAG) + TRANSFER_TAG.length)
      .trim();
    return { shouldTransfer: true, reason, source: 'ai' };
  }

  // Check customer message for keywords
  const lowerMsg = input.customerMessage.toLowerCase();
  for (const keyword of TRANSFER_KEYWORDS) {
    if (lowerMsg.includes(keyword)) {
      return {
        shouldTransfer: true,
        reason: `Cliente usou palavra-chave: "${keyword}"`,
        source: 'keyword',
      };
    }
  }

  return { shouldTransfer: false, reason: '', source: 'none' };
}
```

- [ ] **Step 4: Run transfer tests**

Run: `npx vitest run src/__tests__/lib/atalaia/transfer.test.ts`
Expected: All PASS

- [ ] **Step 5: Write chat helper tests**

```typescript
// src/__tests__/lib/atalaia/chat.test.ts

import { describe, it, expect } from 'vitest';
import { buildMessageHistory, getCurrentPeriod } from '@/lib/atalaia/chat';

describe('buildMessageHistory', () => {
  it('returns last 20 messages', () => {
    const messages = Array.from({ length: 30 }, (_, i) => ({
      role: i % 2 === 0 ? 'customer' as const : 'assistant' as const,
      content: `Message ${i}`,
    }));
    const result = buildMessageHistory(messages);
    expect(result).toHaveLength(20);
    expect(result[0].content).toBe('Message 10');
    expect(result[19].content).toBe('Message 29');
  });

  it('returns all messages if less than 20', () => {
    const messages = [
      { role: 'customer' as const, content: 'oi' },
      { role: 'assistant' as const, content: 'olá!' },
    ];
    const result = buildMessageHistory(messages);
    expect(result).toHaveLength(2);
  });

  it('filters out human role messages for AI context', () => {
    const messages = [
      { role: 'customer' as const, content: 'oi' },
      { role: 'human' as const, content: 'resposta do dono' },
      { role: 'customer' as const, content: 'obrigado' },
    ];
    const result = buildMessageHistory(messages);
    expect(result).toHaveLength(2);
    expect(result.every(m => m.role !== 'human')).toBe(true);
  });
});

describe('getCurrentPeriod', () => {
  it('returns first day of current month', () => {
    const period = getCurrentPeriod();
    expect(period).toMatch(/^\d{4}-\d{2}-01$/);
  });
});
```

- [ ] **Step 6: Implement chat.ts**

```typescript
// src/lib/atalaia/chat.ts

interface MessageForHistory {
  role: 'customer' | 'assistant' | 'human';
  content: string;
}

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

const MAX_HISTORY = 20;

export function buildMessageHistory(messages: MessageForHistory[]): MessageForHistory[] {
  // Filter out human messages (not relevant to AI context)
  const aiMessages = messages.filter(m => m.role !== 'human');
  // Take last 20
  return aiMessages.slice(-MAX_HISTORY);
}

export function toClaudeMessages(messages: MessageForHistory[]): ClaudeMessage[] {
  return messages.map(m => ({
    role: m.role === 'customer' ? 'user' : 'assistant',
    content: m.content,
  }));
}

export function getCurrentPeriod(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}
```

- [ ] **Step 7: Run all chat tests**

Run: `npx vitest run src/__tests__/lib/atalaia/chat.test.ts`
Expected: All PASS

- [ ] **Step 8: Commit**

```bash
git add src/lib/atalaia/transfer.ts src/lib/atalaia/chat.ts src/__tests__/lib/atalaia/transfer.test.ts src/__tests__/lib/atalaia/chat.test.ts
git commit -m "feat: transfer detection and chat helpers for Atalaia"
```

---

## Task 4: API — Business Setup & CRUD

**Files:**
- Create: `src/app/api/atalaia/setup/route.ts`
- Create: `src/app/api/atalaia/business/route.ts`

- [ ] **Step 1: Implement POST /api/atalaia/setup**

```typescript
// src/app/api/atalaia/setup/route.ts
export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api-auth';
import { errorResponse } from '@/lib/api-auth';
import { buildAiContext } from '@/lib/atalaia/ai-context';

export async function POST(request: Request) {
  try {
    const { userId, supabase } = await requireUser();
    const body = await request.json();

    const { name, category, phone, address, services, hours, faq } = body;
    if (!name) {
      return NextResponse.json({ error: 'Nome do negócio é obrigatório' }, { status: 400 });
    }

    // Check if business already exists
    const { data: existing } = await supabase
      .from('atalaia_businesses')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Negócio já cadastrado. Use PATCH para atualizar.' }, { status: 409 });
    }

    // Build AI context
    const businessData = { name, category, phone, address, services: services || [], hours: hours || {}, faq: faq || [] };
    const ai_context = buildAiContext(businessData);

    const { data, error } = await supabase
      .from('atalaia_businesses')
      .insert({
        user_id: userId,
        name,
        category: category || null,
        phone: phone || null,
        address: address || null,
        services: services || [],
        hours: hours || {},
        faq: faq || [],
        ai_context,
        onboarding_step: 2,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ business: data }, { status: 201 });
  } catch (err) {
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
```

- [ ] **Step 2: Implement GET & PATCH /api/atalaia/business**

```typescript
// src/app/api/atalaia/business/route.ts
export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { requireUser, errorResponse } from '@/lib/api-auth';
import { buildAiContext } from '@/lib/atalaia/ai-context';

export async function GET() {
  try {
    const { userId, supabase } = await requireUser();

    const { data, error } = await supabase
      .from('atalaia_businesses')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) {
      return NextResponse.json({ business: null });
    }

    return NextResponse.json({ business: data });
  } catch (err) {
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId, supabase } = await requireUser();
    const body = await request.json();

    const { data: existing } = await supabase
      .from('atalaia_businesses')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Negócio não encontrado. Use POST /api/atalaia/setup.' }, { status: 404 });
    }

    // Merge updates
    const updates: Record<string, unknown> = {};
    const fields = ['name', 'category', 'phone', 'address', 'services', 'hours', 'faq',
      'voice_id', 'widget_config', 'whatsapp_number', 'owner_whatsapp',
      'owner_notify_channel', 'onboarding_step', 'status'] as const;

    for (const field of fields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    // Regenerate ai_context if business data changed
    const dataFields = ['name', 'category', 'phone', 'address', 'services', 'hours', 'faq'];
    const dataChanged = dataFields.some(f => body[f] !== undefined);
    if (dataChanged) {
      const merged = { ...existing, ...updates };
      updates.ai_context = buildAiContext({
        name: merged.name,
        category: merged.category,
        phone: merged.phone,
        address: merged.address,
        services: merged.services,
        hours: merged.hours,
        faq: merged.faq,
      });
    }

    const { data, error } = await supabase
      .from('atalaia_businesses')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ business: data });
  } catch (err) {
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
```

- [ ] **Step 3: Test manually with curl or dev server**

Run: `npm run dev`

Test setup:
```bash
# After logging in and getting a session cookie, test:
curl -X POST http://localhost:3000/api/atalaia/setup \
  -H "Content-Type: application/json" \
  -H "Cookie: <session_cookie>" \
  -d '{"name": "Teste Clínica", "category": "clinica", "services": [{"name": "Consulta", "price_cents": 15000, "duration_min": 30, "description": "Geral"}]}'
```

Expected: 201 with business object including generated `ai_context`

- [ ] **Step 4: Commit**

```bash
git add src/app/api/atalaia/setup/route.ts src/app/api/atalaia/business/route.ts
git commit -m "feat: business setup and CRUD API for Atalaia"
```

---

## Task 5: API — Chat Endpoint with Claude Streaming

**Files:**
- Create: `src/app/api/atalaia/chat/route.ts`
- Create: `src/lib/atalaia/usage.ts`

- [ ] **Step 1: Implement usage tracking helper**

```typescript
// src/lib/atalaia/usage.ts

import { SupabaseClient } from '@supabase/supabase-js';
import { getCurrentPeriod } from './chat';
import { AtalaiaPlan } from '@/lib/types/atalaia';
import { getPlanLimits } from './plans';

export async function incrementUsage(
  supabase: SupabaseClient,
  businessId: string,
  tokensUsed: number
) {
  const period = getCurrentPeriod();

  // Upsert: create row if not exists, increment if exists
  const { data: existing } = await supabase
    .from('atalaia_usage')
    .select('id, text_messages, tokens_total')
    .eq('business_id', businessId)
    .eq('period', period)
    .single();

  if (existing) {
    await supabase
      .from('atalaia_usage')
      .update({
        text_messages: existing.text_messages + 1,
        tokens_total: existing.tokens_total + tokensUsed,
      })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('atalaia_usage')
      .insert({
        business_id: businessId,
        period,
        text_messages: 1,
        tokens_total: tokensUsed,
      });
  }
}

export async function checkUsageLimit(
  supabase: SupabaseClient,
  businessId: string,
  plan: AtalaiaPlan
): Promise<{ withinLimit: boolean; percentage: number }> {
  const period = getCurrentPeriod();
  const limits = getPlanLimits(plan);

  const { data } = await supabase
    .from('atalaia_usage')
    .select('text_messages')
    .eq('business_id', businessId)
    .eq('period', period)
    .single();

  const used = data?.text_messages || 0;
  const percentage = Math.round((used / limits.text_messages) * 100);

  return {
    withinLimit: used < limits.text_messages,
    percentage,
  };
}
```

- [ ] **Step 2: Implement POST /api/atalaia/chat**

```typescript
// src/app/api/atalaia/chat/route.ts
export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { buildMessageHistory, toClaudeMessages } from '@/lib/atalaia/chat';
import { detectTransfer } from '@/lib/atalaia/transfer';
import { incrementUsage } from '@/lib/atalaia/usage';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  const startTime = Date.now();
  const supabase = getServiceSupabase();

  try {
    const body = await request.json();
    const { business_id, conversation_id, message, channel, customer_name, customer_phone, preview } = body;

    if (!business_id || !message || !channel) {
      return NextResponse.json({ error: 'business_id, message, and channel are required' }, { status: 400 });
    }

    // Load business
    const { data: business, error: bizErr } = await supabase
      .from('atalaia_businesses')
      .select('*')
      .eq('id', business_id)
      .single();

    if (bizErr || !business) {
      return NextResponse.json({ error: 'Negócio não encontrado' }, { status: 404 });
    }

    // Check status
    if (business.status === 'paused') {
      return NextResponse.json({
        response: `Este atendente está temporariamente indisponível. Entre em contato diretamente: ${business.phone || 'sem telefone cadastrado'}`,
        paused: true,
      });
    }
    if (business.status === 'setup' && !preview) {
      return NextResponse.json({ error: 'Atendente ainda não foi ativado' }, { status: 403 });
    }

    // Get or create conversation (skip for preview)
    let convId = conversation_id;
    if (!preview) {
      if (convId) {
        // Verify conversation exists and is active
        const { data: conv } = await supabase
          .from('atalaia_conversations')
          .select('id, status')
          .eq('id', convId)
          .eq('business_id', business_id)
          .single();

        if (conv?.status === 'human_needed') {
          return NextResponse.json({
            response: `Seu atendimento está sendo feito por ${business.name}. Aguarde a resposta.`,
            human_needed: true,
          });
        }
        if (!conv) convId = null;
      }

      if (!convId) {
        // For WhatsApp: try to find existing active conversation by phone
        if (channel === 'whatsapp' && customer_phone) {
          const { data: existingConv } = await supabase
            .from('atalaia_conversations')
            .select('id, status')
            .eq('business_id', business_id)
            .eq('customer_phone', customer_phone)
            .eq('status', 'active')
            .order('started_at', { ascending: false })
            .limit(1)
            .single();

          if (existingConv) {
            convId = existingConv.id;
          }
        }

        // Create new conversation
        if (!convId) {
          const { data: newConv, error: convErr } = await supabase
            .from('atalaia_conversations')
            .insert({
              business_id,
              channel,
              customer_name: customer_name || null,
              customer_phone: customer_phone || null,
            })
            .select('id')
            .single();

          if (convErr) throw convErr;
          convId = newConv.id;
        }
      }

      // Save customer message
      await supabase.from('atalaia_messages').insert({
        conversation_id: convId,
        role: 'customer',
        content: message,
      });
    }

    // Load message history
    let history: { role: 'customer' | 'assistant' | 'human'; content: string }[] = [];
    if (convId && !preview) {
      const { data: messages } = await supabase
        .from('atalaia_messages')
        .select('role, content')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (messages) {
        history = messages;
      }
    }

    const contextMessages = buildMessageHistory(history);
    const claudeMessages = toClaudeMessages(contextMessages);

    // If no history or preview, add the current message
    if (claudeMessages.length === 0 || preview) {
      claudeMessages.push({ role: 'user', content: message });
    }

    // Call Claude Haiku with streaming
    const stream = anthropic.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: business.ai_context || `Você é o atendente virtual de "${business.name}". Responda de forma educada e objetiva.`,
      messages: claudeMessages,
    });

    // Buffer full response for saving
    let fullResponse = '';
    let totalTokens = 0;

    // Create SSE response
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              fullResponse += event.delta.text;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
            }
          }

          const finalMessage = await stream.finalMessage();
          totalTokens = (finalMessage.usage?.input_tokens || 0) + (finalMessage.usage?.output_tokens || 0);

          // Save AI response (after full stream completes)
          if (convId && !preview) {
            await supabase.from('atalaia_messages').insert({
              conversation_id: convId,
              role: 'assistant',
              content: fullResponse,
              tokens_used: totalTokens,
            });

            // Update conversation message count
            await supabase.rpc('increment_message_count', { conv_id: convId });

            // Track usage
            await incrementUsage(supabase, business_id, totalTokens);

            // Detect transfer
            const transfer = detectTransfer({ aiResponse: fullResponse, customerMessage: message });
            if (transfer.shouldTransfer) {
              await supabase
                .from('atalaia_conversations')
                .update({ status: 'human_needed' })
                .eq('id', convId);

              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ transfer: true, reason: transfer.reason })}\n\n`));
            }
          }

          // Send done event
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, conversation_id: convId })}\n\n`));
          controller.close();
        } catch (err) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Erro ao processar resposta' })}\n\n`));
          controller.close();
        }

        // Log (fire-and-forget)
        const latency = Date.now() - startTime;
        supabase.from('atalaia_logs').insert({
          business_id,
          endpoint: '/api/atalaia/chat',
          channel,
          tokens_used: totalTokens,
          latency_ms: latency,
          status_code: 200,
        }).then(() => {});
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err) {
    const latency = Date.now() - startTime;
    supabase.from('atalaia_logs').insert({
      business_id: '',
      endpoint: '/api/atalaia/chat',
      channel: '',
      status_code: 500,
      latency_ms: latency,
      error: err instanceof Error ? err.message : 'Unknown error',
    }).then(() => {});

    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
```

Note: `increment_message_count` is a Supabase RPC function. Add to migration:

- [ ] **Step 3: Add RPC function to migration**

Append to `supabase/migrations/004_atalaia.sql`:

```sql
-- RPC: increment message count (avoids race conditions)
CREATE OR REPLACE FUNCTION increment_message_count(conv_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE atalaia_conversations
  SET message_count = message_count + 1
  WHERE id = conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Re-apply migration after editing.

- [ ] **Step 4: Test chat endpoint manually**

Run dev server, log in, create a business via setup, then:

```bash
curl -N http://localhost:3000/api/atalaia/chat \
  -H "Content-Type: application/json" \
  -d '{"business_id": "<id>", "message": "Qual o horário de funcionamento?", "channel": "widget"}'
```

Expected: SSE stream with `data: {"text": "..."}` chunks, ending with `data: {"done": true, "conversation_id": "..."}`

- [ ] **Step 5: Commit**

```bash
git add src/app/api/atalaia/chat/route.ts src/lib/atalaia/usage.ts supabase/migrations/004_atalaia.sql
git commit -m "feat: chat endpoint with Claude Haiku streaming + usage tracking"
```

---

## Task 6: API — Conversations, Usage, Health

**Files:**
- Create: `src/app/api/atalaia/conversations/route.ts`
- Create: `src/app/api/atalaia/conversations/[id]/route.ts`
- Create: `src/app/api/atalaia/conversations/[id]/reply/route.ts`
- Create: `src/app/api/atalaia/conversations/[id]/status/route.ts`
- Create: `src/app/api/atalaia/usage/route.ts`
- Create: `src/app/api/health/atalaia/route.ts`

- [ ] **Step 1: Implement GET /api/atalaia/conversations**

```typescript
// src/app/api/atalaia/conversations/route.ts
export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { requireUser, errorResponse } from '@/lib/api-auth';

export async function GET(request: Request) {
  try {
    const { userId, supabase } = await requireUser();
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const channel = url.searchParams.get('channel');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = 20;
    const offset = (page - 1) * limit;

    // Get user's business
    const { data: business } = await supabase
      .from('atalaia_businesses')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!business) {
      return NextResponse.json({ conversations: [], total: 0 });
    }

    let query = supabase
      .from('atalaia_conversations')
      .select('*', { count: 'exact' })
      .eq('business_id', business.id)
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);
    if (channel) query = query.eq('channel', channel);

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({
      conversations: data || [],
      total: count || 0,
      page,
      pages: Math.ceil((count || 0) / limit),
    });
  } catch (err) {
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
```

- [ ] **Step 2: Implement GET /api/atalaia/conversations/[id]**

```typescript
// src/app/api/atalaia/conversations/[id]/route.ts
export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { requireUser, errorResponse } from '@/lib/api-auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, supabase } = await requireUser();
    const { id } = params;

    // Verify ownership via business
    const { data: business } = await supabase
      .from('atalaia_businesses')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!business) {
      return NextResponse.json({ error: 'Negócio não encontrado' }, { status: 404 });
    }

    const { data: conversation, error: convErr } = await supabase
      .from('atalaia_conversations')
      .select('*')
      .eq('id', id)
      .eq('business_id', business.id)
      .single();

    if (convErr || !conversation) {
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
    }

    const { data: messages, error: msgErr } = await supabase
      .from('atalaia_messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (msgErr) throw msgErr;

    return NextResponse.json({ conversation, messages: messages || [] });
  } catch (err) {
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
```

- [ ] **Step 3: Implement POST /api/atalaia/conversations/[id]/reply**

```typescript
// src/app/api/atalaia/conversations/[id]/reply/route.ts
export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { requireUser, errorResponse } from '@/lib/api-auth';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, supabase } = await requireUser();
    const { id } = params;
    const body = await request.json();

    if (!body.content) {
      return NextResponse.json({ error: 'Conteúdo é obrigatório' }, { status: 400 });
    }

    // Verify ownership
    const { data: business } = await supabase
      .from('atalaia_businesses')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!business) {
      return NextResponse.json({ error: 'Negócio não encontrado' }, { status: 404 });
    }

    // Verify conversation belongs to business
    const { data: conv } = await supabase
      .from('atalaia_conversations')
      .select('id, business_id')
      .eq('id', id)
      .eq('business_id', business.id)
      .single();

    if (!conv) {
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
    }

    // Save human reply
    const { data: msg, error } = await supabase
      .from('atalaia_messages')
      .insert({
        conversation_id: id,
        role: 'human',
        content: body.content,
      })
      .select()
      .single();

    if (error) throw error;

    // Increment message count
    await supabase.rpc('increment_message_count', { conv_id: id });

    return NextResponse.json({ message: msg }, { status: 201 });
  } catch (err) {
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
```

- [ ] **Step 4: Implement PATCH /api/atalaia/conversations/[id]/status**

```typescript
// src/app/api/atalaia/conversations/[id]/status/route.ts
export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { requireUser, errorResponse } from '@/lib/api-auth';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, supabase } = await requireUser();
    const { id } = params;
    const body = await request.json();

    const validStatuses = ['active', 'human_needed', 'closed'];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json({ error: `Status inválido. Use: ${validStatuses.join(', ')}` }, { status: 400 });
    }

    // Verify ownership
    const { data: business } = await supabase
      .from('atalaia_businesses')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!business) {
      return NextResponse.json({ error: 'Negócio não encontrado' }, { status: 404 });
    }

    const updates: Record<string, unknown> = { status: body.status };
    if (body.status === 'closed') {
      updates.ended_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('atalaia_conversations')
      .update(updates)
      .eq('id', id)
      .eq('business_id', business.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ conversation: data });
  } catch (err) {
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
```

- [ ] **Step 5: Implement GET /api/atalaia/usage**

```typescript
// src/app/api/atalaia/usage/route.ts
export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { requireUser, errorResponse } from '@/lib/api-auth';
import { getCurrentPeriod } from '@/lib/atalaia/chat';
import { getPlanFromSubscription, getPlanLimits } from '@/lib/atalaia/plans';

export async function GET() {
  try {
    const { userId, supabase } = await requireUser();

    const { data: business } = await supabase
      .from('atalaia_businesses')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!business) {
      return NextResponse.json({ error: 'Negócio não encontrado' }, { status: 404 });
    }

    // Get subscription
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('product')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const plan = getPlanFromSubscription(sub?.product || null);
    const limits = getPlanLimits(plan);

    // Get current period usage
    const period = getCurrentPeriod();
    const { data: usage } = await supabase
      .from('atalaia_usage')
      .select('*')
      .eq('business_id', business.id)
      .eq('period', period)
      .single();

    const textUsed = usage?.text_messages || 0;
    const voiceUsed = usage?.voice_seconds || 0;
    const textPercentage = Math.round((textUsed / limits.text_messages) * 100);
    const voicePercentage = limits.voice_seconds > 0
      ? Math.round((voiceUsed / limits.voice_seconds) * 100)
      : 0;

    return NextResponse.json({
      plan,
      period,
      text: {
        used: textUsed,
        limit: limits.text_messages,
        percentage: textPercentage,
      },
      voice: {
        used_seconds: voiceUsed,
        limit_seconds: limits.voice_seconds,
        percentage: voicePercentage,
        enabled: limits.voice_enabled,
      },
      overage_notified: usage?.overage_notified || false,
    });
  } catch (err) {
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
```

- [ ] **Step 6: Implement GET /api/health/atalaia**

```typescript
// src/app/api/health/atalaia/route.ts
export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const checks: Record<string, { ok: boolean; latency_ms: number; error?: string }> = {};

  // Supabase
  const sbStart = Date.now();
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    await supabase.from('atalaia_businesses').select('id').limit(1);
    checks.supabase = { ok: true, latency_ms: Date.now() - sbStart };
  } catch (err) {
    checks.supabase = { ok: false, latency_ms: Date.now() - sbStart, error: String(err) };
  }

  // Claude API
  const aiStart = Date.now();
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 5,
        messages: [{ role: 'user', content: 'ping' }],
      }),
    });
    checks.claude = { ok: res.ok, latency_ms: Date.now() - aiStart };
  } catch (err) {
    checks.claude = { ok: false, latency_ms: Date.now() - aiStart, error: String(err) };
  }

  const allOk = Object.values(checks).every(c => c.ok);

  return NextResponse.json({
    status: allOk ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
  }, { status: allOk ? 200 : 503 });
}
```

- [ ] **Step 7: Commit**

```bash
git add src/app/api/atalaia/conversations/ src/app/api/atalaia/usage/route.ts src/app/api/health/atalaia/route.ts
git commit -m "feat: conversations CRUD, usage tracking, and health check APIs"
```

---

## Task 7: Homepage Rebrand

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/lib/translations.ts`

- [ ] **Step 1: Read the current homepage**

Read `src/app/page.tsx` fully to understand current structure.

- [ ] **Step 2: Rewrite homepage as neutral product showcase**

Replace the full content of `src/app/page.tsx` with the new Verelus multi-product homepage. Follow the spec (section 9):
- Nav: Logo Verelus | Atalaia | Sobre | Login
- Hero: "Produtos com IA que trabalham enquanto você descansa"
- Product card: Atalaia with CTA → /atalaia
- "Em breve" section with email capture
- Footer minimal
- Use new brand colors (brand-primary, brand-trust, brand-cta, brand-bg, brand-text)
- Inter font, clean light design

The page should be ~200 lines max. Keep it simple and directional.

- [ ] **Step 3: Update translations.ts**

Add Atalaia sections to the translations object:

```typescript
// Add to both 'en' and 'pt' objects in translations.ts
atalaia: {
  nav: { product: 'Atalaia', about: 'Sobre', login: 'Entrar' },
  hero: {
    title: 'Seu negócio atendendo clientes 24/7',
    subtitle: 'IA que responde no WhatsApp e no seu site como se fosse você. Sem robô, sem espera.',
    cta: 'Testar 7 dias grátis',
    noCreditCard: 'Sem cartão de crédito',
  },
  comparison: {
    title: 'Por que Atalaia?',
    human: 'Atendente humano',
    ai: 'Atalaia',
    price: { human: 'R$ 1.500-3.000/mês', ai: 'A partir de R$ 147/mês' },
    hours: { human: '8h por dia', ai: '24/7/365' },
    absence: { human: 'Férias, faltas', ai: 'Nunca falta' },
    concurrent: { human: '1 conversa por vez', ai: 'Ilimitadas' },
    setup: { human: 'Treinamento longo', ai: 'Pronto em minutos' },
  },
  steps: {
    title: 'Como funciona',
    step1: { title: 'Conte sobre seu negócio', desc: 'Preencha um formulário simples com seus serviços, preços e horários.' },
    step2: { title: 'IA aprende em minutos', desc: 'Nossa IA estuda seu negócio e cria um atendente personalizado.' },
    step3: { title: 'Clientes atendidos', desc: 'Seu atendente começa a responder no WhatsApp e no seu site.' },
  },
  features: {
    whatsapp: { title: 'WhatsApp + Site', desc: 'Onde seus clientes já estão' },
    voice: { title: 'Responde com voz', desc: 'Áudio natural, não robô' },
    transfer: { title: 'Transfere pra você', desc: 'Quando precisa do toque humano, você recebe notificação e assume' },
    learns: { title: 'Aprende com o tempo', desc: 'Cada conversa melhora o atendente' },
  },
  faq: {
    q1: { q: 'Preciso saber programar?', a: 'Não, zero código. Você preenche um formulário e a IA faz o resto.' },
    q2: { q: 'E se o atendente errar?', a: 'Você vê tudo no dashboard e pode corrigir. Ele aprende.' },
    q3: { q: 'Posso cancelar quando quiser?', a: 'Sim, 2 cliques, sem multa, sem burocracia.' },
    q4: { q: 'Meus dados estão seguros?', a: 'Sim. Criptografia ponta a ponta, conformidade com LGPD.' },
  },
  cta_final: {
    title: 'Seu concorrente já está atendendo 24/7. E você?',
    button: 'Começar agora — 7 dias grátis',
  },
  pricing: {
    title: 'Planos',
    monthly: 'Mensal',
    annual: 'Anual (2 meses grátis)',
    starter: { name: 'Starter', price: '147', messages: '500 mensagens/mês', channels: 'Widget + WhatsApp' },
    pro: { name: 'Pro', price: '297', messages: '2.500 mensagens/mês', channels: 'Widget + WhatsApp', voice: '30 min voz/mês', badge: 'Mais popular' },
    business: { name: 'Business', price: '597', messages: '10.000 mensagens/mês', channels: 'Widget + WhatsApp', voice: '120 min voz/mês', clone: 'Voz personalizada' },
  },
},
```

- [ ] **Step 4: Start dev server and verify homepage renders**

Run: `npm run dev`
Open: `http://localhost:3000`
Verify: New homepage with light background, blue+orange palette, Atalaia card, email capture form.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/lib/translations.ts
git commit -m "feat: rebrand homepage as neutral product showcase"
```

---

## Task 8: Atalaia Landing Page

**Files:**
- Create: `src/app/atalaia/page.tsx`

- [ ] **Step 1: Create the Atalaia landing page**

Build `src/app/atalaia/page.tsx` following spec section 10. Server component. Sections:
- Hero with CTA
- Comparison table (human vs AI)
- How it works (3 steps)
- Features (4 cards)
- Who uses (categories)
- Pricing (3 cards, Pro highlighted in orange)
- FAQ (4 items, expandable)
- Final CTA with FOMO

Use translations from `translations.ts`. Use new brand colors. All inline — single file, no client components needed (FAQ can use `<details>` HTML element for expand/collapse without JS).

Page should be ~400 lines max.

- [ ] **Step 2: Verify in browser**

Run: `npm run dev`
Open: `http://localhost:3000/atalaia`
Verify: Full landing page renders with all sections, responsive on mobile.

- [ ] **Step 3: Commit**

```bash
git add src/app/atalaia/page.tsx
git commit -m "feat: Atalaia landing page with pricing and comparison"
```

---

## Task 9: Dashboard Layout + Atalaia Overview

**Files:**
- Modify: `src/app/dashboard/layout.tsx`
- Create: `src/app/dashboard/atalaia/page.tsx`
- Create: `src/app/dashboard/atalaia/OverviewDashboard.tsx`

- [ ] **Step 1: Read current dashboard layout**

Read `src/app/dashboard/layout.tsx` to understand sidebar structure.

- [ ] **Step 2: Add Atalaia items to sidebar**

Modify `src/app/dashboard/layout.tsx`:
- Add sidebar items: Visão Geral, Conversas, Configurações, Plano & Uso
- Routes: `/dashboard/atalaia`, `/dashboard/atalaia/inbox`, `/dashboard/atalaia/settings`, `/dashboard/atalaia/billing`
- Remove or hide proposals sidebar items
- Update color classes to new brand palette

- [ ] **Step 3: Create overview server page**

```typescript
// src/app/dashboard/atalaia/page.tsx
export const runtime = 'edge';

import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase-server';
import OverviewDashboard from './OverviewDashboard';

export default async function AtalaiaDashboardPage() {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return <OverviewDashboard />;
}
```

- [ ] **Step 4: Create OverviewDashboard client component**

```typescript
// src/app/dashboard/atalaia/OverviewDashboard.tsx
'use client';

import { useState, useEffect } from 'react';

interface OverviewStats {
  msgs_today: number;
  msgs_month: number;
  usage_percentage: number;
  avg_satisfaction: number;
}

export default function OverviewDashboard() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [business, setBusiness] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [bizRes, usageRes, convRes] = await Promise.all([
          fetch('/api/atalaia/business'),
          fetch('/api/atalaia/usage'),
          fetch('/api/atalaia/conversations?limit=5'),
        ]);

        const bizData = await bizRes.json();
        const usageData = await usageRes.json();
        const convData = await convRes.json();

        setBusiness(bizData.business);
        setConversations(convData.conversations || []);
        setStats({
          msgs_today: 0, // computed from conversations
          msgs_month: usageData.text?.used || 0,
          usage_percentage: usageData.text?.percentage || 0,
          avg_satisfaction: 0,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="p-8 text-brand-muted">Carregando...</div>;

  // If no business yet, redirect to setup
  if (!business) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-brand-text mb-4">Bem-vindo ao Atalaia!</h2>
        <p className="text-brand-muted mb-6">Configure seu atendente IA em poucos minutos.</p>
        <a href="/dashboard/atalaia/setup" className="bg-brand-cta text-brand-text font-bold px-6 py-3 rounded-lg hover:brightness-110">
          Começar configuração →
        </a>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold text-brand-text">Visão Geral</h1>

      {/* Alert banners */}
      {stats && stats.usage_percentage >= 80 && (
        <div className="bg-brand-cta/10 border border-brand-cta/30 rounded-lg p-4 text-brand-cta text-sm">
          ⚠️ Uso em {stats.usage_percentage}% do limite. <a href="/dashboard/atalaia/billing" className="underline font-bold">Ver plano</a>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Msgs hoje" value={stats?.msgs_today || 0} />
        <StatCard label="Msgs este mês" value={stats?.msgs_month || 0} />
        <StatCard label="Uso do plano" value={`${stats?.usage_percentage || 0}%`} />
        <StatCard label="Satisfação" value={stats?.avg_satisfaction ? `${stats.avg_satisfaction}/5` : '—'} />
      </div>

      {/* Recent conversations */}
      <div>
        <h2 className="text-lg font-bold text-brand-text mb-3">Últimas conversas</h2>
        {conversations.length === 0 ? (
          <p className="text-brand-muted text-sm">Nenhuma conversa ainda. Seu atendente está pronto!</p>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv: any) => (
              <a key={conv.id} href={`/dashboard/atalaia/inbox?id=${conv.id}`}
                className="block p-4 bg-brand-surface rounded-lg hover:bg-brand-border/50 transition">
                <div className="flex justify-between items-center">
                  <span className="text-brand-text text-sm font-medium">
                    {conv.customer_name || conv.customer_phone || 'Visitante'}
                  </span>
                  <span className="text-brand-muted text-xs">{conv.channel}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-brand-muted text-xs">{conv.message_count} msgs</span>
                  <StatusBadge status={conv.status} />
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-brand-surface rounded-lg p-4 border border-brand-border">
      <p className="text-brand-muted text-xs uppercase">{label}</p>
      <p className="text-2xl font-bold text-brand-text mt-1">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-brand-success/10 text-brand-success',
    human_needed: 'bg-brand-error/10 text-brand-error',
    closed: 'bg-brand-border text-brand-muted',
  };
  const labels: Record<string, string> = {
    active: 'Ativa',
    human_needed: 'Precisa atenção',
    closed: 'Encerrada',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${styles[status] || ''}`}>
      {labels[status] || status}
    </span>
  );
}
```

- [ ] **Step 5: Verify in browser**

Open: `http://localhost:3000/dashboard/atalaia`
Verify: Overview page loads, shows "Começar configuração" if no business, or stats if business exists.

- [ ] **Step 6: Commit**

```bash
git add src/app/dashboard/layout.tsx src/app/dashboard/atalaia/page.tsx src/app/dashboard/atalaia/OverviewDashboard.tsx
git commit -m "feat: dashboard layout + Atalaia overview page"
```

---

## Task 10: Onboarding Wizard

**Files:**
- Create: `src/app/dashboard/atalaia/setup/page.tsx`
- Create: `src/app/dashboard/atalaia/setup/SetupWizard.tsx`

- [ ] **Step 1: Create setup server page**

```typescript
// src/app/dashboard/atalaia/setup/page.tsx
export const runtime = 'edge';

import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase-server';
import SetupWizard from './SetupWizard';

export default async function SetupPage() {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return <SetupWizard />;
}
```

- [ ] **Step 2: Create SetupWizard client component**

Build a 5-step wizard as described in spec section 5.1 and 11. Each step is a form section. Steps:

1. Business info (name, category, phone, address)
2. Services + Hours + FAQ
3. Preview (test the AI)
4. Install widget (copy code)
5. Connect WhatsApp (QR code)

Key behaviors:
- Each step saves via `PATCH /api/atalaia/business` or `POST /api/atalaia/setup` (step 1)
- Progress bar shows current step
- Steps 4 and 5 have "Pular" (skip) button
- Step 3 has a mini chat interface for testing the AI
- Form validation on required fields

Component should be ~400-500 lines. Use existing pattern: `useState` for form data, `fetch` for API calls, toast for feedback.

- [ ] **Step 3: Verify wizard flow in browser**

Open: `http://localhost:3000/dashboard/atalaia/setup`
Test: Complete all 5 steps. Verify:
- Step 1: saves business name
- Step 2: saves services/hours
- Step 3: AI responds to test questions
- Step 4: shows widget code
- Step 5: shows WhatsApp connect (placeholder for now)
- Completion redirects to `/dashboard/atalaia`

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/atalaia/setup/
git commit -m "feat: onboarding wizard with 5-step setup flow"
```

---

## Task 11: Inbox (Conversations)

**Files:**
- Create: `src/app/dashboard/atalaia/inbox/page.tsx`
- Create: `src/app/dashboard/atalaia/inbox/InboxView.tsx`
- Create: `src/app/dashboard/atalaia/inbox/ConversationDetail.tsx`

- [ ] **Step 1: Create inbox server page**

Same pattern as overview: server component with auth check, renders `<InboxView />`.

- [ ] **Step 2: Create InboxView client component**

List view with:
- Filters: channel (all/widget/whatsapp), status (all/active/human_needed/closed)
- Conversation list with customer name, channel badge, message count, status badge
- Click to open ConversationDetail
- Badge vermelho on `human_needed` conversations
- Polling every 30s for new conversations

- [ ] **Step 3: Create ConversationDetail client component**

Detail view with:
- Message history (bubbles: customer gray, assistant blue, human green)
- Timestamps on each message
- Text input + "Responder como humano" button (calls `POST .../reply`)
- "Devolver pra IA" button (calls `PATCH .../status` with `{status: 'active'}`)
- "Encerrar conversa" button (calls `PATCH .../status` with `{status: 'closed'}`)
- Polling every 5s for new messages in active conversation

- [ ] **Step 4: Verify in browser**

Open: `http://localhost:3000/dashboard/atalaia/inbox`
Verify: Conversations list loads, clicking opens detail, human reply works.

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/atalaia/inbox/
git commit -m "feat: inbox with conversation list and detail view"
```

---

## Task 12: Settings & Billing Pages

**Files:**
- Create: `src/app/dashboard/atalaia/settings/page.tsx`
- Create: `src/app/dashboard/atalaia/settings/SettingsView.tsx`
- Create: `src/app/dashboard/atalaia/billing/page.tsx`
- Create: `src/app/dashboard/atalaia/billing/BillingView.tsx`

- [ ] **Step 1: Create settings page**

Tabs or sections:
- **Dados do negócio**: form with services, hours, FAQ. Save → auto-regenerates ai_context. Toast confirmation.
- **Widget**: preview box + code snippet to copy. "Copiar código" button.
- **WhatsApp**: status indicator (connected/disconnected) + QR code button (placeholder).
- **Voz**: voice selector dropdown (placeholder for ElevenLabs voices).
- **Transferência**: toggle for trigger + notification channel select.

All edits go through `PATCH /api/atalaia/business`.

- [ ] **Step 2: Create billing page**

- Current plan card with name + price
- Usage bar: text messages (green/yellow/red based on percentage)
- Usage bar: voice minutes (if enabled)
- Forecast: "No ritmo atual, 100% em X dias"
- "Fazer upgrade" button → links to `/atalaia#pricing` or Stripe checkout
- Invoice history → Stripe Customer Portal link

Data from `GET /api/atalaia/usage`.

- [ ] **Step 3: Verify in browser**

Test settings save + toast. Test billing page displays usage correctly.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/atalaia/settings/ src/app/dashboard/atalaia/billing/
git commit -m "feat: settings and billing dashboard pages"
```

---

## Task 13: Widget (Vanilla JS)

**Files:**
- Create: `public/widget.js`
- Create: `src/app/api/atalaia/widget/[id]/config/route.ts`
- Create: `src/app/api/atalaia/widget/lead/route.ts`

- [ ] **Step 1: Create widget config API**

```typescript
// src/app/api/atalaia/widget/[id]/config/route.ts
export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: business } = await supabase
    .from('atalaia_businesses')
    .select('id, name, status, widget_config, hours')
    .eq('id', params.id)
    .single();

  if (!business || business.status !== 'active') {
    return NextResponse.json({ error: 'Widget not available' }, { status: 404 });
  }

  return NextResponse.json({
    business_id: business.id,
    name: business.name,
    greeting: business.widget_config?.greeting || `Olá! Como posso ajudar?`,
    color: business.widget_config?.color || '#1e3a5f',
    position: business.widget_config?.position || 'bottom-right',
    hours: business.hours,
  }, {
    headers: { 'Cache-Control': 'public, max-age=300' }, // 5min cache
  });
}
```

- [ ] **Step 2: Create lead capture API**

```typescript
// src/app/api/atalaia/widget/lead/route.ts
export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const body = await request.json();
  const { business_id, customer_name, customer_phone } = body;

  if (!business_id || !customer_name) {
    return NextResponse.json({ error: 'business_id and customer_name required' }, { status: 400 });
  }

  // Create a conversation with lead info
  const { data, error } = await supabase
    .from('atalaia_conversations')
    .insert({
      business_id,
      channel: 'widget',
      customer_name,
      customer_phone: customer_phone || null,
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to capture lead' }, { status: 500 });
  }

  return NextResponse.json({ conversation_id: data.id }, { status: 201 });
}
```

- [ ] **Step 3: Create widget.js**

Build `public/widget.js` — vanilla JS widget with Shadow DOM. Features:
- Reads `data-business` attribute from script tag
- Fetches config from `/api/atalaia/widget/[id]/config`
- Creates Shadow DOM container
- Pre-chat form: name (required) + phone (optional) → calls `/api/atalaia/widget/lead`
- Chat interface with bubbles
- Sends messages to `/api/atalaia/chat` via fetch
- Reads SSE stream for response (streaming word-by-word)
- Typing indicator while waiting
- localStorage persistence (conversation_id, 24h expiry)
- Rate limit: max 30 messages per session
- Mobile responsive (fullscreen on small screens)
- "Powered by Atalaia" footer
- ~12KB target (minified)

The widget should be a self-contained IIFE. No build step needed — write directly in `public/widget.js`.

- [ ] **Step 4: Test widget on a local HTML file**

Create a temporary test file:
```html
<html><body>
<h1>Test Site</h1>
<script src="http://localhost:3000/widget.js" data-business="<business_id>" async></script>
</body></html>
```

Verify: Widget bubble appears, opens on click, pre-chat form works, chat streams responses.

- [ ] **Step 5: Commit**

```bash
git add public/widget.js src/app/api/atalaia/widget/
git commit -m "feat: embeddable chat widget with Shadow DOM and SSE streaming"
```

---

## Task 14: Voice API (ElevenLabs)

**Files:**
- Create: `src/app/api/atalaia/voice/route.ts`

- [ ] **Step 1: Implement POST /api/atalaia/voice**

```typescript
// src/app/api/atalaia/voice/route.ts
export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireUser, errorResponse } from '@/lib/api-auth';
import { getPlanFromSubscription, getPlanLimits } from '@/lib/atalaia/plans';

export async function POST(request: Request) {
  try {
    const { userId, supabase } = await requireUser();
    const body = await request.json();
    const { message_id, text } = body;

    if (!message_id || !text) {
      return NextResponse.json({ error: 'message_id and text required' }, { status: 400 });
    }

    // Check plan allows voice
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('product')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .limit(1)
      .single();

    const plan = getPlanFromSubscription(sub?.product || null);
    const limits = getPlanLimits(plan);

    if (!limits.voice_enabled) {
      return NextResponse.json({ error: 'Voz não disponível no seu plano. Faça upgrade.' }, { status: 403 });
    }

    // Get business voice_id
    const { data: business } = await supabase
      .from('atalaia_businesses')
      .select('id, voice_id')
      .eq('user_id', userId)
      .single();

    if (!business) {
      return NextResponse.json({ error: 'Negócio não encontrado' }, { status: 404 });
    }

    // Call ElevenLabs TTS
    const voiceId = business.voice_id === 'default' ? '21m00Tcm4TlvDq8ikWAM' : business.voice_id;
    const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    });

    if (!ttsRes.ok) {
      return NextResponse.json({ error: 'Erro ao gerar áudio' }, { status: 502 });
    }

    const audioBuffer = await ttsRes.arrayBuffer();

    // Save to Supabase Storage
    const fileName = `voice/${message_id}.mp3`;
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: uploadErr } = await serviceSupabase.storage
      .from('atalaia-audio')
      .upload(fileName, audioBuffer, { contentType: 'audio/mpeg' });

    if (uploadErr) throw uploadErr;

    const { data: urlData } = serviceSupabase.storage
      .from('atalaia-audio')
      .getPublicUrl(fileName);

    // Update message with audio URL
    await serviceSupabase
      .from('atalaia_messages')
      .update({ audio_url: urlData.publicUrl })
      .eq('id', message_id);

    // Estimate voice seconds (~150 words/min, ~5 chars/word)
    const estimatedSeconds = Math.ceil((text.length / 750) * 60);

    // Update usage
    const period = new Date().toISOString().slice(0, 7) + '-01';
    await serviceSupabase.rpc('increment_voice_usage', {
      biz_id: business.id,
      period_date: period,
      seconds_to_add: estimatedSeconds,
    });

    return NextResponse.json({ audio_url: urlData.publicUrl });
  } catch (err) {
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
```

- [ ] **Step 2: Add voice RPC to migration**

Append to migration:

```sql
CREATE OR REPLACE FUNCTION increment_voice_usage(biz_id uuid, period_date date, seconds_to_add int)
RETURNS void AS $$
BEGIN
  INSERT INTO atalaia_usage (business_id, period, voice_seconds)
  VALUES (biz_id, period_date, seconds_to_add)
  ON CONFLICT (business_id, period)
  DO UPDATE SET voice_seconds = atalaia_usage.voice_seconds + seconds_to_add;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

- [ ] **Step 3: Create Supabase Storage bucket**

Via Supabase Dashboard: create bucket `atalaia-audio` with public access.

Or via SQL:
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('atalaia-audio', 'atalaia-audio', true);
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/atalaia/voice/route.ts supabase/migrations/004_atalaia.sql
git commit -m "feat: voice API with ElevenLabs TTS and Supabase Storage"
```

---

## Task 15: Stripe Checkout + Webhook

**Files:**
- Create: `src/app/api/atalaia/checkout/route.ts`
- Modify: `src/app/api/webhook/stripe/route.ts`

- [ ] **Step 1: Implement POST /api/atalaia/checkout**

```typescript
// src/app/api/atalaia/checkout/route.ts
export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { requireUser, errorResponse } from '@/lib/api-auth';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const PRICE_MAP: Record<string, string> = {
  atalaia_starter_monthly: process.env.STRIPE_PRICE_ATALAIA_STARTER || '',
  atalaia_pro_monthly: process.env.STRIPE_PRICE_ATALAIA_PRO || '',
  atalaia_business_monthly: process.env.STRIPE_PRICE_ATALAIA_BUSINESS || '',
  atalaia_starter_annual: process.env.STRIPE_PRICE_ATALAIA_STARTER_ANNUAL || '',
  atalaia_pro_annual: process.env.STRIPE_PRICE_ATALAIA_PRO_ANNUAL || '',
  atalaia_business_annual: process.env.STRIPE_PRICE_ATALAIA_BUSINESS_ANNUAL || '',
};

export async function POST(request: Request) {
  try {
    const { userId, email, supabase } = await requireUser();
    const body = await request.json();
    const { price_id } = body;

    const stripePriceId = PRICE_MAP[price_id];
    if (!stripePriceId) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      mode: 'subscription',
      line_items: [{ price: stripePriceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 7,
        metadata: { user_id: userId, product: price_id.replace('_monthly', '').replace('_annual', '') },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/atalaia?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/atalaia#pricing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
```

- [ ] **Step 2: Update Stripe webhook to handle Atalaia subscriptions**

Read the existing `src/app/api/webhook/stripe/route.ts` and add handling for `customer.subscription.created`, `customer.subscription.updated`, and `customer.subscription.deleted` events.

On subscription created/updated:
- Upsert into `subscriptions` table with `product = metadata.product`
- If `status === 'active'`, update `atalaia_businesses.status = 'active'`

On subscription deleted:
- Update subscription status to 'canceled'
- Update `atalaia_businesses.status = 'paused'`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/atalaia/checkout/route.ts src/app/api/webhook/stripe/route.ts
git commit -m "feat: Stripe checkout and webhook for Atalaia subscriptions"
```

---

## Task 16: WhatsApp Integration Endpoints

**Files:**
- Create: `src/app/api/atalaia/whatsapp/connect/route.ts`
- Create: `src/app/api/atalaia/whatsapp/status/route.ts`
- Create: `src/app/api/atalaia/whatsapp/webhook/route.ts`

- [ ] **Step 1: Implement WhatsApp connect (QR code)**

```typescript
// src/app/api/atalaia/whatsapp/connect/route.ts
export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { requireUser, errorResponse } from '@/lib/api-auth';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '';

export async function POST() {
  try {
    const { userId, supabase } = await requireUser();

    const { data: business } = await supabase
      .from('atalaia_businesses')
      .select('id, name')
      .eq('user_id', userId)
      .single();

    if (!business) {
      return NextResponse.json({ error: 'Negócio não encontrado' }, { status: 404 });
    }

    const instanceName = `atalaia_${business.id}`;

    // Create instance on Evolution API
    const createRes = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'apikey': EVOLUTION_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      // Instance might already exist — try to get QR
      const qrRes = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: { 'apikey': EVOLUTION_API_KEY },
      });

      if (!qrRes.ok) {
        return NextResponse.json({ error: 'Erro ao conectar WhatsApp' }, { status: 502 });
      }

      const qrData = await qrRes.json();
      return NextResponse.json({ qrcode: qrData.base64 || qrData.qrcode });
    }

    const data = await createRes.json();
    return NextResponse.json({ qrcode: data.qrcode?.base64 || data.base64 });
  } catch (err) {
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
```

- [ ] **Step 2: Implement WhatsApp status check**

```typescript
// src/app/api/atalaia/whatsapp/status/route.ts
export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { requireUser, errorResponse } from '@/lib/api-auth';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '';

export async function GET() {
  try {
    const { userId, supabase } = await requireUser();

    const { data: business } = await supabase
      .from('atalaia_businesses')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!business) {
      return NextResponse.json({ connected: false, error: 'Negócio não encontrado' });
    }

    const instanceName = `atalaia_${business.id}`;
    const res = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
      headers: { 'apikey': EVOLUTION_API_KEY },
    });

    if (!res.ok) {
      return NextResponse.json({ connected: false });
    }

    const data = await res.json();
    const connected = data.instance?.state === 'open';

    return NextResponse.json({ connected, state: data.instance?.state || 'unknown' });
  } catch (err) {
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
```

- [ ] **Step 3: Implement WhatsApp webhook receiver**

```typescript
// src/app/api/atalaia/whatsapp/webhook/route.ts
export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const body = await request.json();
    const { instance, data: msgData } = body;

    // Extract business_id from instance name (atalaia_<uuid>)
    const businessId = instance?.replace('atalaia_', '');
    if (!businessId || !msgData?.message?.conversation) {
      return NextResponse.json({ ok: true }); // Ignore non-message events
    }

    const customerPhone = msgData.key?.remoteJid?.replace('@s.whatsapp.net', '') || '';
    const messageText = msgData.message?.conversation ||
      msgData.message?.extendedTextMessage?.text || '';

    if (!messageText) {
      return NextResponse.json({ ok: true }); // Ignore media-only for now
    }

    // Forward to chat API internally
    const chatRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/atalaia/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_id: businessId,
        message: messageText,
        channel: 'whatsapp',
        customer_phone: customerPhone,
      }),
    });

    // Read SSE response and collect full text
    if (chatRes.ok && chatRes.body) {
      const reader = chatRes.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.text) fullText += parsed.text;
            } catch {}
          }
        }
      }

      // Response is returned to n8n which sends it back via Evolution API
      return NextResponse.json({ response: fullText });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 });
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/atalaia/whatsapp/
git commit -m "feat: WhatsApp integration APIs (connect, status, webhook)"
```

---

## Task 17: Notifications System

**Files:**
- Create: `src/lib/atalaia/notifications.ts`

- [ ] **Step 1: Implement notification helper**

```typescript
// src/lib/atalaia/notifications.ts

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface NotifyOwnerParams {
  to: string;
  subject: string;
  html: string;
}

export async function notifyOwnerEmail(params: NotifyOwnerParams) {
  try {
    await resend.emails.send({
      from: 'Atalaia <noreply@verelus.com>',
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
  } catch (err) {
    console.error('Failed to send notification email:', err);
  }
}

export function buildTransferEmail(businessName: string, customerName: string, conversationUrl: string): NotifyOwnerParams {
  return {
    to: '', // filled by caller
    subject: `[Atalaia] ${customerName || 'Cliente'} precisa da sua atenção`,
    html: `
      <h2>Transferência solicitada</h2>
      <p>Um cliente de <strong>${businessName}</strong> precisa de atendimento humano.</p>
      <p><a href="${conversationUrl}" style="background:#f59e0b;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Ver conversa →</a></p>
    `,
  };
}

export function buildUsageAlertEmail(businessName: string, percentage: number, billingUrl: string): NotifyOwnerParams {
  return {
    to: '',
    subject: `[Atalaia] Uso em ${percentage}% do limite`,
    html: `
      <h2>Alerta de uso</h2>
      <p>Seu atendente <strong>${businessName}</strong> está com ${percentage}% do limite de mensagens usado.</p>
      <p><a href="${billingUrl}" style="background:#f59e0b;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Ver plano →</a></p>
    `,
  };
}

export function buildTrialExpiryEmail(businessName: string, daysLeft: number, checkoutUrl: string): NotifyOwnerParams {
  return {
    to: '',
    subject: `[Atalaia] Seu trial acaba em ${daysLeft} dia${daysLeft > 1 ? 's' : ''}`,
    html: `
      <h2>Trial expirando</h2>
      <p>O trial de <strong>${businessName}</strong> acaba em ${daysLeft} dia${daysLeft > 1 ? 's' : ''}.</p>
      <p>Adicione seu cartão para continuar usando o Atalaia sem interrupção.</p>
      <p><a href="${checkoutUrl}" style="background:#f59e0b;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Ativar plano →</a></p>
    `,
  };
}
```

- [ ] **Step 2: Wire notifications into chat endpoint**

In `src/app/api/atalaia/chat/route.ts`, after detecting transfer:

```typescript
// After setting status to 'human_needed', send notification
import { notifyOwnerEmail, buildTransferEmail } from '@/lib/atalaia/notifications';

// ... inside transfer detection block:
const { data: profile } = await supabase
  .from('profiles')
  .select('email')
  .eq('user_id', business.user_id)
  .single();

if (profile?.email) {
  const emailData = buildTransferEmail(
    business.name,
    customer_name || 'Visitante',
    `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/atalaia/inbox?id=${convId}`
  );
  emailData.to = profile.email;
  notifyOwnerEmail(emailData); // fire and forget
}
```

- [ ] **Step 3: Wire usage alert into usage tracking**

In `src/lib/atalaia/usage.ts`, after incrementing usage, check if >80% and notify.

- [ ] **Step 4: Commit**

```bash
git add src/lib/atalaia/notifications.ts src/app/api/atalaia/chat/route.ts src/lib/atalaia/usage.ts
git commit -m "feat: email notifications for transfers and usage alerts"
```

---

## Task 18: Final Integration & Smoke Test

**Files:**
- Modify: `src/middleware.ts` (ensure Atalaia routes don't interfere with auth)
- Modify: `src/app/dashboard/layout.tsx` (hide proposals nav items)

- [ ] **Step 1: Verify middleware allows widget and webhook routes**

Check that `src/middleware.ts` doesn't block:
- `/api/atalaia/chat` (public — called by widget without auth)
- `/api/atalaia/widget/*` (public — config and lead capture)
- `/api/atalaia/whatsapp/webhook` (public — called by n8n)
- `/api/health/atalaia` (public — called by monitoring)

These routes use service role key internally, not user auth. Ensure middleware doesn't require auth for them.

- [ ] **Step 2: Hide proposals from dashboard sidebar**

In `src/app/dashboard/layout.tsx`, comment out or remove the proposals sidebar links. Keep the code but don't show in nav.

- [ ] **Step 3: Full smoke test**

Run through the entire flow:

1. Start dev server: `npm run dev`
2. Open `http://localhost:3000` — verify new homepage
3. Click "Conhecer" → lands on `/atalaia` — verify landing page
4. Click "Testar 7 dias grátis" → redirect to login
5. Log in → redirected to `/dashboard/atalaia`
6. Click "Começar configuração" → `/dashboard/atalaia/setup`
7. Complete wizard steps 1-3
8. Copy widget code from step 4
9. Go to overview → verify stats show
10. Open inbox → verify empty state
11. Test widget on a local HTML file → send message → verify AI responds
12. Check inbox → verify conversation appeared
13. Reply as human from inbox → verify message saved
14. Check settings page → verify data loads
15. Check billing page → verify usage displays

- [ ] **Step 4: Run all tests**

```bash
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "feat: Atalaia MVP complete — AI customer service for SMBs"
```

---

## Summary

| Task | Description | Key Files |
|------|-------------|-----------|
| 1 | Foundation (schema, types, tailwind) | migration, types, plans, tailwind |
| 2 | AI Context Generator | ai-context.ts |
| 3 | Transfer Detection & Chat Helpers | transfer.ts, chat.ts |
| 4 | Business Setup & CRUD API | setup/route.ts, business/route.ts |
| 5 | Chat Endpoint (Claude SSE) | chat/route.ts, usage.ts |
| 6 | Conversations, Usage, Health APIs | conversations/, usage/, health/ |
| 7 | Homepage Rebrand | page.tsx, translations.ts |
| 8 | Atalaia Landing Page | atalaia/page.tsx |
| 9 | Dashboard Layout + Overview | dashboard/atalaia/ |
| 10 | Onboarding Wizard | setup/SetupWizard.tsx |
| 11 | Inbox (Conversations) | inbox/ |
| 12 | Settings & Billing | settings/, billing/ |
| 13 | Widget (Vanilla JS) | public/widget.js |
| 14 | Voice API (ElevenLabs) | voice/route.ts |
| 15 | Stripe Checkout + Webhook | checkout/route.ts |
| 16 | WhatsApp Integration | whatsapp/ |
| 17 | Notifications System | notifications.ts |
| 18 | Integration & Smoke Test | middleware, final test |
