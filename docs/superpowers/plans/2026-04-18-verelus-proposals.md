# Verelus Proposals MVP — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pivotar o Verelus de toolbox musical pra plataforma de propostas comerciais para freelancers digitais BR, reusando ~70% da infra existente.

**Architecture:** Formulário de 5 campos gera proposta web pública (`/p/[slug]`), rastreável via beacon API. Dashboard lista propostas com tracking de visualizações. Freemium: 3/mês free com marca, Pro R$29/mês ilimitado.

**Tech Stack:** Next.js 14 (app router, edge), TypeScript, Supabase (auth + PostgreSQL + RLS), Stripe, Tailwind CSS, Resend (email), Claude API (sugestão IA Pro), deploy Cloudflare Pages.

**Spec:** `docs/superpowers/specs/2026-04-18-verelus-proposals-design.md`

---

## File Structure

### Criar (novos)
- `supabase/migrations/003_proposals.sql` — tabelas profiles, proposals, proposal_views, proposal_accepts
- `src/lib/types/proposals.ts` — tipos Profile, Proposal, ProposalView, ProposalAccept
- `src/lib/proposal-slug.ts` — gerador de slugs únicos
- `src/app/api/profile/route.ts` — GET/PUT perfil do freelancer
- `src/app/api/proposals/create/route.ts` — criar proposta
- `src/app/api/proposals/list/route.ts` — listar propostas do user
- `src/app/api/proposals/[id]/route.ts` — GET detalhe + PUT editar + DELETE excluir
- `src/app/api/proposals/public/[slug]/route.ts` — dados da proposta pública (sem auth)
- `src/app/api/proposals/accept/[slug]/route.ts` — registrar aceite
- `src/app/api/track/view/route.ts` — registrar visualização (sem auth)
- `src/app/api/track/heartbeat/route.ts` — atualizar duração (sem auth)
- `src/app/api/ai/suggest-scope/route.ts` — IA sugere escopo (Pro)
- `src/app/dashboard/proposals/page.tsx` — página wrapper
- `src/app/dashboard/proposals/ProposalsDashboard.tsx` — dashboard de propostas
- `src/app/dashboard/proposals/new/page.tsx` — página wrapper
- `src/app/dashboard/proposals/new/NewProposalForm.tsx` — formulário de criação
- `src/app/dashboard/proposals/[id]/page.tsx` — página wrapper
- `src/app/dashboard/proposals/[id]/ProposalDetail.tsx` — detalhe + analytics
- `src/app/dashboard/profile/ProfileClient.tsx` — formulário de perfil (substituir existente)
- `src/app/p/[slug]/page.tsx` — proposta pública
- `src/app/p/[slug]/PublicProposal.tsx` — renderização da proposta
- `src/app/p/[slug]/accept/page.tsx` — tela de aceite
- `src/app/p/[slug]/accept/AcceptForm.tsx` — formulário de aceite
- `src/lib/proposal-emails.ts` — templates de email (visualização, aceite)
- `src/__tests__/lib/proposal-slug.test.ts` — testes do slug generator
- `src/__tests__/lib/proposals.test.ts` — testes de tipos e validação

### Modificar
- `src/app/dashboard/layout.tsx` — novos NAV_ITEMS (propostas em vez de tools de música)
- `src/app/dashboard/page.tsx` — novo dashboard home
- `src/app/page.tsx` — novo copy da landing page
- `src/lib/translations.ts` — novo copy de tradução

### Remover (após pivot completo)
- Todos os diretórios em `src/app/dashboard/` exceto proposals, profile
- Todos os API routes em `src/app/api/tools/`
- Libs musicais em `src/lib/` (growth-aggregator, spotify-client, etc.)

**NOTA:** A remoção do código antigo é o ÚLTIMO passo. Até lá, código antigo coexiste com o novo.

---

## Part 1: Foundation (DB + Types + Slug)

### Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/003_proposals.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- supabase/migrations/003_proposals.sql
-- Verelus Proposals MVP: profiles, proposals, views, accepts

-- Profiles (dados do freelancer que aparecem na proposta)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  website TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_owner" ON profiles FOR ALL USING (auth.uid() = user_id);

-- Proposals
CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  client_name TEXT NOT NULL,
  client_email TEXT DEFAULT '',
  project_title TEXT NOT NULL,
  scope TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents > 0),
  deadline_days INTEGER NOT NULL CHECK (deadline_days > 0),
  valid_until DATE NOT NULL,
  payment_terms TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','viewed','accepted','expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_proposals_user_id ON proposals(user_id);
CREATE INDEX idx_proposals_slug ON proposals(slug);
CREATE INDEX idx_proposals_status ON proposals(status);

ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proposals_owner" ON proposals FOR ALL USING (auth.uid() = user_id);

-- Proposal Views (tracking sem auth — inserido via service role)
CREATE TABLE IF NOT EXISTS proposal_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  viewer_ip TEXT DEFAULT '',
  user_agent TEXT DEFAULT '',
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_seconds INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_proposal_views_proposal_id ON proposal_views(proposal_id);

ALTER TABLE proposal_views ENABLE ROW LEVEL SECURITY;
-- Views são inseridas via service role (tracking público), lidas pelo dono da proposta
CREATE POLICY "views_read_owner" ON proposal_views FOR SELECT
  USING (proposal_id IN (SELECT id FROM proposals WHERE user_id = auth.uid()));

-- Proposal Accepts
CREATE TABLE IF NOT EXISTS proposal_accepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE UNIQUE,
  acceptor_name TEXT NOT NULL,
  acceptor_ip TEXT DEFAULT '',
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE proposal_accepts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "accepts_read_owner" ON proposal_accepts FOR SELECT
  USING (proposal_id IN (SELECT id FROM proposals WHERE user_id = auth.uid()));
```

- [ ] **Step 2: Apply migration to Supabase**

Run: `npx supabase db push` (ou aplicar via Supabase Dashboard > SQL Editor se não tiver CLI local configurado)

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/003_proposals.sql
git commit -m "feat(db): migration 003 — profiles, proposals, views, accepts tables"
```

---

### Task 2: TypeScript Types

**Files:**
- Create: `src/lib/types/proposals.ts`

- [ ] **Step 1: Write the types file**

```typescript
// src/lib/types/proposals.ts

export interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  title: string;
  email: string;
  phone: string;
  avatar_url: string;
  website: string;
  created_at: string;
}

export type ProposalStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'expired';

export interface Proposal {
  id: string;
  user_id: string;
  slug: string;
  client_name: string;
  client_email: string;
  project_title: string;
  scope: string;
  price_cents: number;
  deadline_days: number;
  valid_until: string; // ISO date YYYY-MM-DD
  payment_terms: string;
  status: ProposalStatus;
  created_at: string;
  updated_at: string;
}

export interface ProposalView {
  id: string;
  proposal_id: string;
  viewer_ip: string;
  user_agent: string;
  viewed_at: string;
  duration_seconds: number;
}

export interface ProposalAccept {
  id: string;
  proposal_id: string;
  acceptor_name: string;
  acceptor_ip: string;
  accepted_at: string;
}

export interface ProposalCreateInput {
  client_name: string;
  client_email?: string;
  project_title: string;
  scope: string;
  price_cents: number;
  deadline_days: number;
  valid_until?: string;
  payment_terms?: string;
}

export interface ProposalWithAnalytics extends Proposal {
  view_count: number;
  total_duration_seconds: number;
  last_viewed_at: string | null;
  accepted_at: string | null;
  acceptor_name: string | null;
}

export interface DashboardSummary {
  total_proposals: number;
  open_proposals: number;
  pipeline_cents: number;
  acceptance_rate: number; // 0-100
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/types/proposals.ts
git commit -m "feat(types): proposal types — Profile, Proposal, Views, Analytics"
```

---

### Task 3: Slug Generator

**Files:**
- Create: `src/lib/proposal-slug.ts`
- Test: `src/__tests__/lib/proposal-slug.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/__tests__/lib/proposal-slug.test.ts
import { describe, it, expect } from 'vitest';
import { generateSlug } from '@/lib/proposal-slug';

describe('generateSlug', () => {
  it('generates a slug of correct length', () => {
    const slug = generateSlug();
    expect(slug.length).toBe(10);
  });

  it('generates URL-safe characters only', () => {
    const slug = generateSlug();
    expect(/^[a-z0-9]+$/.test(slug)).toBe(true);
  });

  it('generates unique slugs', () => {
    const slugs = new Set(Array.from({ length: 100 }, () => generateSlug()));
    expect(slugs.size).toBe(100);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/lib/proposal-slug.test.ts`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement slug generator**

```typescript
// src/lib/proposal-slug.ts

const CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';

export function generateSlug(length: number = 10): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CHARS[b % CHARS.length]).join('');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/lib/proposal-slug.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/proposal-slug.ts src/__tests__/lib/proposal-slug.test.ts
git commit -m "feat: slug generator for public proposal URLs"
```

---

## Part 2: API Routes

### Task 4: Profile API (GET + PUT)

**Files:**
- Create: `src/app/api/profile/route.ts`

- [ ] **Step 1: Implement profile API**

```typescript
// src/app/api/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireUser, errorResponse } from '@/lib/api-auth';

export const runtime = 'edge';

export async function GET() {
  try {
    const { userId, supabase } = await requireUser();
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    return NextResponse.json({ profile: data ?? null });
  } catch (err) {
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId, supabase } = await requireUser();
    const body = await req.json() as Record<string, unknown>;

    const profile = {
      user_id: userId,
      display_name: String(body.display_name ?? '').trim().slice(0, 100),
      title: String(body.title ?? '').trim().slice(0, 100),
      email: String(body.email ?? '').trim().slice(0, 200),
      phone: String(body.phone ?? '').trim().slice(0, 30),
      avatar_url: String(body.avatar_url ?? '').trim().slice(0, 500),
      website: String(body.website ?? '').trim().slice(0, 200),
    };

    if (!profile.display_name) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }

    const { data, error: dbErr } = await supabase
      .from('profiles')
      .upsert(profile, { onConflict: 'user_id' })
      .select()
      .single();

    if (dbErr) {
      console.error('profile upsert error:', dbErr);
      return NextResponse.json({ error: 'Falha ao salvar perfil' }, { status: 500 });
    }

    return NextResponse.json({ profile: data });
  } catch (err) {
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/profile/route.ts
git commit -m "feat(api): profile GET/PUT — freelancer profile for proposal headers"
```

---

### Task 5: Proposal Create API

**Files:**
- Create: `src/app/api/proposals/create/route.ts`

- [ ] **Step 1: Implement create route**

```typescript
// src/app/api/proposals/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireUser, errorResponse } from '@/lib/api-auth';
import { generateSlug } from '@/lib/proposal-slug';
import type { ProposalCreateInput } from '@/lib/types/proposals';

export const runtime = 'edge';

function validateInput(raw: unknown): ProposalCreateInput | { error: string } {
  if (!raw || typeof raw !== 'object') return { error: 'Input inválido' };
  const r = raw as Record<string, unknown>;

  if (typeof r.client_name !== 'string' || !r.client_name.trim()) return { error: 'Nome do cliente é obrigatório' };
  if (typeof r.project_title !== 'string' || !r.project_title.trim()) return { error: 'Título do projeto é obrigatório' };
  if (typeof r.scope !== 'string' || !r.scope.trim()) return { error: 'Escopo é obrigatório' };

  const priceCents = Number(r.price_cents);
  if (!Number.isFinite(priceCents) || priceCents < 100) return { error: 'Preço deve ser pelo menos R$1,00' };

  const deadlineDays = Number(r.deadline_days);
  if (!Number.isFinite(deadlineDays) || deadlineDays < 1 || deadlineDays > 365) return { error: 'Prazo entre 1 e 365 dias' };

  let validUntil = r.valid_until as string | undefined;
  if (!validUntil) {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    validUntil = d.toISOString().slice(0, 10);
  }

  return {
    client_name: String(r.client_name).trim(),
    client_email: r.client_email ? String(r.client_email).trim() : undefined,
    project_title: String(r.project_title).trim(),
    scope: String(r.scope).trim(),
    price_cents: Math.round(priceCents),
    deadline_days: Math.round(deadlineDays),
    valid_until: validUntil,
    payment_terms: r.payment_terms ? String(r.payment_terms).trim() : undefined,
  };
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const input = validateInput(raw);
    if ('error' in input) return NextResponse.json({ error: input.error }, { status: 400 });

    const { userId, supabase } = await requireUser();

    // Check free tier limit (3/month)
    const tierRes = await supabase.from('subscriptions').select('product, status').eq('user_id', userId).eq('status', 'active').maybeSingle();
    const isPro = tierRes.data?.product === 'pro' || tierRes.data?.product === 'business';

    if (!isPro) {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from('proposals')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', monthStart.toISOString());
      if ((count ?? 0) >= 3) {
        return NextResponse.json({ error: 'Limite de 3 propostas/mês no plano gratuito. Assine o Pro para ilimitado.' }, { status: 403 });
      }
    }

    const slug = generateSlug();

    const { data, error: dbErr } = await supabase
      .from('proposals')
      .insert({
        user_id: userId,
        slug,
        client_name: input.client_name,
        client_email: input.client_email ?? '',
        project_title: input.project_title,
        scope: input.scope,
        price_cents: input.price_cents,
        deadline_days: input.deadline_days,
        valid_until: input.valid_until,
        payment_terms: input.payment_terms ?? '',
        status: 'draft',
      })
      .select()
      .single();

    if (dbErr) {
      console.error('proposal create error:', dbErr);
      return NextResponse.json({ error: 'Falha ao criar proposta' }, { status: 500 });
    }

    return NextResponse.json({ proposal: data });
  } catch (err) {
    console.error('proposal create error:', err);
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/proposals/create/route.ts
git commit -m "feat(api): proposal create — validation, free tier limit, slug generation"
```

---

### Task 6: Proposal List + Detail + Edit + Delete APIs

**Files:**
- Create: `src/app/api/proposals/list/route.ts`
- Create: `src/app/api/proposals/[id]/route.ts`

- [ ] **Step 1: Implement list route**

```typescript
// src/app/api/proposals/list/route.ts
import { NextResponse } from 'next/server';
import { requireUser, errorResponse } from '@/lib/api-auth';
import type { ProposalWithAnalytics, DashboardSummary } from '@/lib/types/proposals';

export const runtime = 'edge';

export async function GET() {
  try {
    const { userId, supabase } = await requireUser();

    const { data: proposals } = await supabase
      .from('proposals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!proposals) return NextResponse.json({ proposals: [], summary: null });

    // Enrich with analytics
    const enriched: ProposalWithAnalytics[] = [];
    for (const p of proposals) {
      const { data: views } = await supabase
        .from('proposal_views')
        .select('viewed_at, duration_seconds')
        .eq('proposal_id', p.id)
        .order('viewed_at', { ascending: false });

      const { data: accept } = await supabase
        .from('proposal_accepts')
        .select('accepted_at, acceptor_name')
        .eq('proposal_id', p.id)
        .maybeSingle();

      enriched.push({
        ...p,
        view_count: views?.length ?? 0,
        total_duration_seconds: views?.reduce((sum, v) => sum + (v.duration_seconds ?? 0), 0) ?? 0,
        last_viewed_at: views?.[0]?.viewed_at ?? null,
        accepted_at: accept?.accepted_at ?? null,
        acceptor_name: accept?.acceptor_name ?? null,
      });
    }

    // Dashboard summary
    const open = enriched.filter((p) => ['draft', 'sent', 'viewed'].includes(p.status));
    const accepted = enriched.filter((p) => p.status === 'accepted');
    const total = enriched.length;
    const summary: DashboardSummary = {
      total_proposals: total,
      open_proposals: open.length,
      pipeline_cents: open.reduce((sum, p) => sum + p.price_cents, 0),
      acceptance_rate: total > 0 ? Math.round((accepted.length / total) * 100) : 0,
    };

    return NextResponse.json({ proposals: enriched, summary });
  } catch (err) {
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
```

- [ ] **Step 2: Implement detail/edit/delete route**

```typescript
// src/app/api/proposals/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireUser, errorResponse } from '@/lib/api-auth';

export const runtime = 'edge';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId, supabase } = await requireUser();

    const { data: proposal } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', userId)
      .single();

    if (!proposal) return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 });

    const { data: views } = await supabase
      .from('proposal_views')
      .select('*')
      .eq('proposal_id', params.id)
      .order('viewed_at', { ascending: false });

    const { data: accept } = await supabase
      .from('proposal_accepts')
      .select('*')
      .eq('proposal_id', params.id)
      .maybeSingle();

    return NextResponse.json({ proposal, views: views ?? [], accept: accept ?? null });
  } catch (err) {
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId, supabase } = await requireUser();
    const body = await req.json() as Record<string, unknown>;

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof body.client_name === 'string') updates.client_name = body.client_name.trim();
    if (typeof body.project_title === 'string') updates.project_title = body.project_title.trim();
    if (typeof body.scope === 'string') updates.scope = body.scope.trim();
    if (typeof body.price_cents === 'number') updates.price_cents = Math.round(body.price_cents);
    if (typeof body.deadline_days === 'number') updates.deadline_days = Math.round(body.deadline_days);
    if (typeof body.valid_until === 'string') updates.valid_until = body.valid_until;
    if (typeof body.payment_terms === 'string') updates.payment_terms = body.payment_terms.trim();
    if (typeof body.status === 'string' && ['draft', 'sent'].includes(body.status)) updates.status = body.status;

    const { data, error: dbErr } = await supabase
      .from('proposals')
      .update(updates)
      .eq('id', params.id)
      .eq('user_id', userId)
      .select()
      .single();

    if (dbErr || !data) return NextResponse.json({ error: 'Falha ao atualizar' }, { status: 500 });
    return NextResponse.json({ proposal: data });
  } catch (err) {
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId, supabase } = await requireUser();
    await supabase.from('proposals').delete().eq('id', params.id).eq('user_id', userId);
    return NextResponse.json({ success: true });
  } catch (err) {
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
```

- [ ] **Step 3: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add src/app/api/proposals/list/route.ts src/app/api/proposals/[id]/route.ts
git commit -m "feat(api): proposal list, detail, edit, delete with analytics enrichment"
```

---

### Task 7: Public Proposal + Tracking APIs

**Files:**
- Create: `src/app/api/proposals/public/[slug]/route.ts`
- Create: `src/app/api/track/view/route.ts`
- Create: `src/app/api/track/heartbeat/route.ts`
- Create: `src/app/api/proposals/accept/[slug]/route.ts`
- Create: `src/lib/proposal-emails.ts`

- [ ] **Step 1: Implement public proposal route (no auth)**

```typescript
// src/app/api/proposals/public/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: proposal } = await supabase
    .from('proposals')
    .select('id, slug, client_name, project_title, scope, price_cents, deadline_days, valid_until, payment_terms, status, user_id')
    .eq('slug', params.slug)
    .single();

  if (!proposal) return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 });

  // Fetch profile of proposal owner
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, title, email, phone, avatar_url, website')
    .eq('user_id', proposal.user_id)
    .maybeSingle();

  // Check if already accepted
  const { data: accept } = await supabase
    .from('proposal_accepts')
    .select('acceptor_name, accepted_at')
    .eq('proposal_id', proposal.id)
    .maybeSingle();

  return NextResponse.json({
    proposal: {
      id: proposal.id,
      slug: proposal.slug,
      client_name: proposal.client_name,
      project_title: proposal.project_title,
      scope: proposal.scope,
      price_cents: proposal.price_cents,
      deadline_days: proposal.deadline_days,
      valid_until: proposal.valid_until,
      payment_terms: proposal.payment_terms,
      status: proposal.status,
    },
    profile: profile ?? { display_name: 'Freelancer', title: '', email: '', phone: '', avatar_url: '', website: '' },
    accept: accept ?? null,
  });
}
```

- [ ] **Step 2: Implement tracking routes**

```typescript
// src/app/api/track/view/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { proposal_id } = await req.json() as { proposal_id?: string };
    if (!proposal_id) return NextResponse.json({ error: 'missing proposal_id' }, { status: 400 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '';
    const ua = req.headers.get('user-agent') ?? '';

    const { data } = await supabase
      .from('proposal_views')
      .insert({ proposal_id, viewer_ip: ip, user_agent: ua, duration_seconds: 0 })
      .select('id')
      .single();

    // Update proposal status to 'viewed' if currently 'sent' or 'draft'
    await supabase
      .from('proposals')
      .update({ status: 'viewed', updated_at: new Date().toISOString() })
      .eq('id', proposal_id)
      .in('status', ['draft', 'sent']);

    // Send email notification to proposal owner (async, don't await)
    sendViewNotification(supabase, proposal_id).catch(() => {});

    return NextResponse.json({ view_id: data?.id ?? null });
  } catch {
    return NextResponse.json({ ok: true }); // tracking should never fail visibly
  }
}

async function sendViewNotification(supabase: ReturnType<typeof createClient>, proposalId: string) {
  const { data: proposal } = await supabase.from('proposals').select('user_id, project_title, client_name').eq('id', proposalId).single();
  if (!proposal) return;

  const { data: user } = await supabase.from('users').select('email').eq('id', proposal.user_id).single();
  if (!user?.email) return;

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey}` },
    body: JSON.stringify({
      from: 'Verelus <noreply@verelus.com>',
      to: [user.email],
      subject: `${proposal.client_name} abriu sua proposta "${proposal.project_title}"`,
      html: `<p><strong>${proposal.client_name}</strong> acabou de abrir sua proposta "<strong>${proposal.project_title}</strong>".</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/proposals">Ver no painel</a></p>`,
    }),
  });
}
```

```typescript
// src/app/api/track/heartbeat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { view_id, seconds } = await req.json() as { view_id?: string; seconds?: number };
    if (!view_id || typeof seconds !== 'number') return NextResponse.json({ ok: true });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await supabase
      .from('proposal_views')
      .update({ duration_seconds: Math.min(seconds, 3600) }) // cap 1h
      .eq('id', view_id);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
```

- [ ] **Step 3: Implement accept route**

```typescript
// src/app/api/proposals/accept/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { acceptor_name } = await req.json() as { acceptor_name?: string };
    if (!acceptor_name?.trim()) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: proposal } = await supabase
      .from('proposals')
      .select('id, user_id, project_title, client_name, price_cents, status')
      .eq('slug', params.slug)
      .single();

    if (!proposal) return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 });
    if (proposal.status === 'accepted') return NextResponse.json({ error: 'Proposta já foi aceita' }, { status: 400 });

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '';

    await supabase.from('proposal_accepts').insert({
      proposal_id: proposal.id,
      acceptor_name: acceptor_name.trim(),
      acceptor_ip: ip,
    });

    await supabase
      .from('proposals')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', proposal.id);

    // Send accept email to owner
    const { data: user } = await supabase.from('users').select('email').eq('id', proposal.user_id).single();
    const resendKey = process.env.RESEND_API_KEY;
    if (user?.email && resendKey) {
      const priceFormatted = (proposal.price_cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey}` },
        body: JSON.stringify({
          from: 'Verelus <noreply@verelus.com>',
          to: [user.email],
          subject: `${proposal.client_name} aceitou sua proposta de ${priceFormatted}!`,
          html: `<h2>Proposta aceita!</h2><p><strong>${acceptor_name.trim()}</strong> aceitou sua proposta "<strong>${proposal.project_title}</strong>" no valor de <strong>${priceFormatted}</strong>.</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/proposals">Ver detalhes</a></p>`,
        }),
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('accept error:', err);
    return NextResponse.json({ error: 'Falha ao registrar aceite' }, { status: 500 });
  }
}
```

- [ ] **Step 4: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 5: Commit**

```bash
git add src/app/api/proposals/public/ src/app/api/track/ src/app/api/proposals/accept/
git commit -m "feat(api): public proposal, tracking (view + heartbeat), accept with email notifications"
```

---

### Task 8: AI Scope Suggestion API (Pro only)

**Files:**
- Create: `src/app/api/ai/suggest-scope/route.ts`

- [ ] **Step 1: Implement AI suggestion route**

```typescript
// src/app/api/ai/suggest-scope/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireUser, errorResponse } from '@/lib/api-auth';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { userId, supabase } = await requireUser();

    // Check Pro tier
    const { data: sub } = await supabase.from('subscriptions').select('product, status').eq('user_id', userId).eq('status', 'active').maybeSingle();
    if (!sub || (sub.product !== 'pro' && sub.product !== 'business')) {
      return NextResponse.json({ error: 'Recurso exclusivo do plano Pro' }, { status: 403 });
    }

    const { project_title, client_name } = await req.json() as { project_title?: string; client_name?: string };
    if (!project_title?.trim()) return NextResponse.json({ error: 'Título do projeto é obrigatório' }, { status: 400 });

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `Você é um freelancer digital brasileiro experiente. Gere um escopo profissional para uma proposta comercial.

Projeto: "${project_title}"
Cliente: "${client_name ?? 'não informado'}"

Gere uma lista de 4-6 entregáveis concretos e específicos. Cada item em uma linha, começando com "→". Seja específico ao tipo de projeto (se parece design, foque em telas/protótipos; se parece dev, foque em funcionalidades; se parece marketing, foque em entregas mensuráveis).

Não inclua preço, prazo, ou introdução. Apenas a lista de entregáveis.`,
        }],
      }),
    });

    if (!claudeRes.ok) return NextResponse.json({ error: 'Falha ao gerar sugestão' }, { status: 502 });
    const data = (await claudeRes.json()) as { content: Array<{ text: string }> };
    const suggestion = data.content?.[0]?.text?.trim() ?? '';

    return NextResponse.json({ suggestion });
  } catch (err) {
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/ai/suggest-scope/route.ts
git commit -m "feat(api): AI scope suggestion — Pro only, generates deliverables list"
```

---

## Part 3: Frontend — Public Proposal Page

### Task 9: Public Proposal Page (`/p/[slug]`)

**Files:**
- Create: `src/app/p/[slug]/page.tsx`
- Create: `src/app/p/[slug]/PublicProposal.tsx`

- [ ] **Step 1: Create page wrapper**

```typescript
// src/app/p/[slug]/page.tsx
import { PublicProposal } from './PublicProposal';

export const runtime = 'edge';

export default function ProposalPage({ params }: { params: { slug: string } }) {
  return <PublicProposal slug={params.slug} />;
}
```

- [ ] **Step 2: Create PublicProposal client component**

```typescript
// src/app/p/[slug]/PublicProposal.tsx
'use client';

import { useEffect, useState, useRef } from 'react';

interface ProposalData {
  id: string;
  slug: string;
  client_name: string;
  project_title: string;
  scope: string;
  price_cents: number;
  deadline_days: number;
  valid_until: string;
  payment_terms: string;
  status: string;
}

interface ProfileData {
  display_name: string;
  title: string;
  email: string;
  phone: string;
  avatar_url: string;
  website: string;
}

interface AcceptData {
  acceptor_name: string;
  accepted_at: string;
}

function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function PublicProposal({ slug }: { slug: string }) {
  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [accept, setAccept] = useState<AcceptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const viewIdRef = useRef<string | null>(null);
  const secondsRef = useRef(0);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/proposals/public/${slug}`);
        if (!res.ok) { setError('Proposta não encontrada'); return; }
        const data = await res.json();
        setProposal(data.proposal);
        setProfile(data.profile);
        setAccept(data.accept);

        // Register view
        const viewRes = await fetch('/api/track/view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ proposal_id: data.proposal.id }),
        });
        const viewData = await viewRes.json();
        viewIdRef.current = viewData.view_id;
      } catch {
        setError('Erro ao carregar proposta');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  // Heartbeat every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      secondsRef.current += 30;
      if (viewIdRef.current) {
        navigator.sendBeacon('/api/track/heartbeat', JSON.stringify({
          view_id: viewIdRef.current,
          seconds: secondsRef.current,
        }));
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !proposal || !profile) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Proposta não encontrada</h1>
          <p className="text-gray-500">Este link pode ter expirado ou sido removido.</p>
        </div>
      </div>
    );
  }

  const isExpired = new Date(proposal.valid_until + 'T23:59:59') < new Date();
  const isAccepted = proposal.status === 'accepted' || !!accept;

  return (
    <div className="min-h-screen bg-[#fafafa] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold text-sm">
                {profile.display_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-sm">{profile.display_name}</div>
                <div className="text-xs text-gray-500">{profile.email}</div>
              </div>
            </div>
            <div className="text-xs text-gray-400">{formatDate(proposal.valid_until)}</div>
          </div>

          {/* Divider */}
          <div className="w-12 h-0.5 bg-gray-900 mb-4" />

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-1.5 leading-tight">
            Proposta: {proposal.project_title}
          </h1>
          <p className="text-sm text-gray-500 mb-8">Para {proposal.client_name}</p>

          {/* Metrics */}
          <div className="flex gap-5 mb-8">
            <div>
              <div className="text-[11px] text-gray-400 uppercase tracking-wider mb-0.5">Investimento</div>
              <div className="text-2xl font-extrabold text-gray-900">{formatCurrency(proposal.price_cents)}</div>
            </div>
            <div>
              <div className="text-[11px] text-gray-400 uppercase tracking-wider mb-0.5">Prazo</div>
              <div className="text-2xl font-extrabold text-gray-900">{proposal.deadline_days} dias</div>
            </div>
            <div>
              <div className="text-[11px] text-gray-400 uppercase tracking-wider mb-0.5">Validade</div>
              <div className="text-2xl font-extrabold text-gray-900">{formatDate(proposal.valid_until)}</div>
            </div>
          </div>

          {/* Scope */}
          <div className="mb-8">
            <div className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">O que está incluído</div>
            <div className="text-sm text-gray-600 leading-loose whitespace-pre-wrap">{proposal.scope}</div>
          </div>

          {/* Payment terms */}
          {proposal.payment_terms && (
            <div className="mb-8">
              <div className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Condições de pagamento</div>
              <p className="text-sm text-gray-600">{proposal.payment_terms}</p>
            </div>
          )}

          {/* Accept button */}
          {isAccepted ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <p className="text-green-700 font-semibold">Proposta aceita por {accept?.acceptor_name}</p>
              <p className="text-green-600 text-xs mt-1">{accept?.accepted_at ? formatDate(accept.accepted_at.slice(0, 10)) : ''}</p>
            </div>
          ) : isExpired ? (
            <div className="bg-gray-100 border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-gray-500 font-semibold">Esta proposta expirou em {formatDate(proposal.valid_until)}</p>
            </div>
          ) : (
            <div className="flex gap-3">
              <a
                href={`/p/${slug}/accept`}
                className="flex-1 bg-gray-900 text-white font-bold text-center py-3.5 rounded-xl hover:bg-gray-800 transition text-sm"
              >
                Aceitar proposta
              </a>
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-8">
            <a href="https://verelus.com" target="_blank" rel="noopener noreferrer" className="text-[10px] text-gray-300 hover:text-gray-400 transition">
              Feito com Verelus
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add src/app/p/
git commit -m "feat: public proposal page with tracking and clean minimal design"
```

---

### Task 10: Accept Page (`/p/[slug]/accept`)

**Files:**
- Create: `src/app/p/[slug]/accept/page.tsx`
- Create: `src/app/p/[slug]/accept/AcceptForm.tsx`

- [ ] **Step 1: Create accept page and form**

```typescript
// src/app/p/[slug]/accept/page.tsx
import { AcceptForm } from './AcceptForm';

export const runtime = 'edge';

export default function AcceptPage({ params }: { params: { slug: string } }) {
  return <AcceptForm slug={params.slug} />;
}
```

```typescript
// src/app/p/[slug]/accept/AcceptForm.tsx
'use client';

import { useState, useEffect } from 'react';

export function AcceptForm({ slug }: { slug: string }) {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [proposal, setProposal] = useState<{ project_title: string; price_cents: number; deadline_days: number; client_name: string } | null>(null);
  const [freelancerName, setFreelancerName] = useState('');

  useEffect(() => {
    fetch(`/api/proposals/public/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        setProposal(d.proposal);
        setFreelancerName(d.profile?.display_name ?? '');
      });
  }, [slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Digite seu nome'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/proposals/accept/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acceptor_name: name.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Falha ao aceitar');
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-10 max-w-md text-center">
          <div className="text-4xl mb-4">✓</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Proposta aceita!</h1>
          <p className="text-gray-500 text-sm">{freelancerName} receberá uma notificação e entrará em contato com você.</p>
        </div>
      </div>
    );
  }

  const priceFormatted = proposal ? (proposal.price_cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '';

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md w-full">
        <h1 className="text-lg font-bold text-gray-900 mb-1">Confirmar aceite</h1>
        {proposal && (
          <div className="text-sm text-gray-500 mb-6">
            {proposal.project_title} · {priceFormatted} · {proposal.deadline_days} dias
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Seu nome completo</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: João Silva"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-gray-400"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition disabled:opacity-50 text-sm"
          >
            {submitting ? 'Confirmando...' : 'Confirmar aceite'}
          </button>
          <a href={`/p/${slug}`} className="block text-center text-sm text-gray-400 hover:text-gray-600">← Voltar à proposta</a>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add src/app/p/[slug]/accept/
git commit -m "feat: accept page — client confirms proposal with name"
```

---

## Part 4: Frontend — Dashboard

### Task 11: Update Sidebar Navigation

**Files:**
- Modify: `src/app/dashboard/layout.tsx`

- [ ] **Step 1: Replace NAV_ITEMS**

Replace the existing NAV_ITEMS array (lines 25-41) with:

```typescript
const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Painel', icon: '\u{1F4CB}', tier: 1 },
  { href: '/dashboard/proposals', label: 'Propostas', icon: '\u{1F4E8}', tier: 1 },
  { href: '/dashboard/proposals/new', label: 'Nova proposta', icon: '\u{2795}', tier: 1 },
  { href: '/dashboard/profile', label: 'Perfil', icon: '\u{1F464}', tier: 1 },
];
```

- [ ] **Step 2: Remove growthPaths logic from sidebar active state**

Remove the `growthPaths` variable and simplify the `isActive` check back to the original:

```typescript
const isActive = currentPath === item.href || (item.href !== '/dashboard' && currentPath.startsWith(item.href + '/'));
```

- [ ] **Step 3: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/layout.tsx
git commit -m "feat(nav): pivot sidebar — proposals-focused navigation"
```

---

### Task 12: Dashboard Home

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Replace dashboard home with proposals summary**

Replace entire file content with:

```typescript
// src/app/dashboard/page.tsx
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const runtime = 'edge';

export default async function DashboardHome() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-brand-dark text-white">
      <div className="max-w-4xl mx-auto px-4 py-12 lg:py-16">
        <header className="mb-10">
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-3">
            <span className="bg-gradient-to-r from-brand-green to-brand-green/60 bg-clip-text text-transparent">Verelus</span>
          </h1>
          <p className="text-brand-muted leading-relaxed max-w-xl">
            Propostas profissionais que fecham. Em 2 minutos.
          </p>
        </header>

        <div className="bg-gradient-to-r from-brand-green/10 to-brand-green/5 rounded-2xl p-6 border border-brand-green/20 mb-8">
          <h2 className="text-lg font-bold text-white mb-2">Comece aqui</h2>
          <p className="text-sm text-brand-muted leading-relaxed mb-4">
            Monte seu perfil e crie sua primeira proposta profissional. Leva menos de 2 minutos.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/profile" className="px-5 py-2.5 bg-white/5 text-white/70 text-sm rounded-lg hover:bg-white/10 transition font-medium">
              1. Completar perfil
            </Link>
            <Link href="/dashboard/proposals/new" className="px-5 py-2.5 bg-brand-green/15 text-brand-green text-sm font-semibold rounded-lg hover:bg-brand-green/25 transition">
              2. Criar primeira proposta →
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Link href="/dashboard/proposals" className="group bg-brand-surface rounded-2xl p-5 border border-white/10 hover:border-brand-green/40 transition hover:-translate-y-0.5">
            <div className="text-2xl mb-3">📨</div>
            <h3 className="font-bold text-white mb-1">Propostas</h3>
            <p className="text-xs text-brand-muted">Crie, envie e acompanhe suas propostas</p>
          </Link>
          <Link href="/dashboard/proposals/new" className="group bg-brand-surface rounded-2xl p-5 border border-white/10 hover:border-brand-green/40 transition hover:-translate-y-0.5">
            <div className="text-2xl mb-3">✨</div>
            <h3 className="font-bold text-white mb-1">Nova proposta</h3>
            <p className="text-xs text-brand-muted">Formulário rápido, resultado profissional</p>
          </Link>
          <Link href="/dashboard/profile" className="group bg-brand-surface rounded-2xl p-5 border border-white/10 hover:border-brand-green/40 transition hover:-translate-y-0.5">
            <div className="text-2xl mb-3">👤</div>
            <h3 className="font-bold text-white mb-1">Perfil</h3>
            <p className="text-xs text-brand-muted">Dados que aparecem no cabeçalho</p>
          </Link>
        </div>

        <footer className="pt-8 border-t border-white/5 text-xs text-brand-muted/60">
          <span>Conta: {user.email}</span>
        </footer>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat(dashboard): pivot home — proposals-focused with onboarding"
```

---

### Task 13: Proposals Dashboard (List + Summary)

**Files:**
- Create: `src/app/dashboard/proposals/page.tsx`
- Create: `src/app/dashboard/proposals/ProposalsDashboard.tsx`

- [ ] **Step 1: Create page wrapper**

```typescript
// src/app/dashboard/proposals/page.tsx
import { ProposalsDashboard } from './ProposalsDashboard';

export const runtime = 'edge';

export default function ProposalsPage() {
  return <ProposalsDashboard />;
}
```

- [ ] **Step 2: Create ProposalsDashboard component**

This is the core dashboard showing the list of proposals with tracking data. File will be ~200 lines. Key elements:

- Fetch from `/api/proposals/list`
- Show summary bar: total, open, pipeline, acceptance rate
- List of proposal cards with status badges, tracking info, copy link button
- Empty state with CTA to create first proposal
- Uses existing UI components: LoadingSpinner, EmptyState, Toast

```typescript
// src/app/dashboard/proposals/ProposalsDashboard.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ProposalWithAnalytics, DashboardSummary } from '@/lib/types/proposals';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useToast } from '@/lib/use-toast';

const STATUS_BADGE: Record<string, { label: string; class: string }> = {
  draft: { label: 'Rascunho', class: 'bg-white/5 text-white/50 border-white/10' },
  sent: { label: 'Enviada', class: 'bg-blue-500/10 text-blue-300 border-blue-500/30' },
  viewed: { label: 'Visualizada', class: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30' },
  accepted: { label: 'Aceita', class: 'bg-brand-green/10 text-brand-green border-brand-green/30' },
  expired: { label: 'Expirada', class: 'bg-red-500/10 text-red-300 border-red-500/30' },
};

function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min}min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days}d`;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return sec > 0 ? `${min}min${sec}s` : `${min}min`;
}

export function ProposalsDashboard() {
  const [proposals, setProposals] = useState<ProposalWithAnalytics[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const toast = useToast();

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/proposals/list');
        if (!res.ok) throw new Error('Falha ao carregar');
        const data = await res.json();
        setProposals(data.proposals ?? []);
        setSummary(data.summary ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function copyLink(slug: string) {
    navigator.clipboard.writeText(`${window.location.origin}/p/${slug}`);
    toast.success('Link copiado!');
  }

  if (loading) return <div className="min-h-screen bg-brand-dark text-white py-12 px-4"><div className="max-w-4xl mx-auto"><LoadingSpinner label="Carregando propostas..." /></div></div>;
  if (error) return <div className="min-h-screen bg-brand-dark text-white py-12 px-4"><div className="max-w-4xl mx-auto"><ErrorMessage message={error} /></div></div>;

  return (
    <div className="min-h-screen bg-brand-dark text-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Propostas</h1>
          <Link href="/dashboard/proposals/new" className="px-5 py-2.5 bg-brand-green text-black font-bold rounded-xl hover:brightness-110 transition text-sm">
            + Nova proposta
          </Link>
        </div>

        {summary && proposals.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <div className="bg-brand-surface rounded-xl p-4 border border-white/10">
              <div className="text-xs text-brand-muted uppercase tracking-wider mb-1">Total</div>
              <div className="text-2xl font-bold">{summary.total_proposals}</div>
            </div>
            <div className="bg-brand-surface rounded-xl p-4 border border-white/10">
              <div className="text-xs text-brand-muted uppercase tracking-wider mb-1">Abertas</div>
              <div className="text-2xl font-bold">{summary.open_proposals}</div>
            </div>
            <div className="bg-brand-surface rounded-xl p-4 border border-white/10">
              <div className="text-xs text-brand-muted uppercase tracking-wider mb-1">Pipeline</div>
              <div className="text-2xl font-bold text-brand-green">{formatCurrency(summary.pipeline_cents)}</div>
            </div>
            <div className="bg-brand-surface rounded-xl p-4 border border-white/10">
              <div className="text-xs text-brand-muted uppercase tracking-wider mb-1">Taxa de aceite</div>
              <div className="text-2xl font-bold">{summary.acceptance_rate}%</div>
            </div>
          </div>
        )}

        {proposals.length === 0 ? (
          <EmptyState
            icon="📨"
            title="Nenhuma proposta ainda"
            description="Crie sua primeira proposta profissional em 2 minutos."
            action={{ label: '+ Nova proposta', onClick: () => { window.location.href = '/dashboard/proposals/new'; } }}
          />
        ) : (
          <div className="space-y-3">
            {proposals.map((p) => {
              const badge = STATUS_BADGE[p.status] ?? STATUS_BADGE.draft;
              return (
                <div key={p.id} className="bg-brand-surface rounded-xl p-5 border border-white/10 hover:border-white/20 transition">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <Link href={`/dashboard/proposals/${p.id}`} className="text-white font-bold hover:text-brand-green transition">
                        {p.project_title}
                      </Link>
                      <p className="text-xs text-brand-muted mt-0.5">{p.client_name} · {formatCurrency(p.price_cents)}</p>
                    </div>
                    <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-full border ${badge.class}`}>
                      {badge.label}
                    </span>
                  </div>

                  {p.view_count > 0 && (
                    <p className="text-xs text-brand-muted mb-3">
                      Visualizada {p.view_count}x · {formatDuration(p.total_duration_seconds)} total
                      {p.last_viewed_at && ` · ${formatTimeAgo(p.last_viewed_at)}`}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <button onClick={() => copyLink(p.slug)} className="text-xs text-brand-muted hover:text-brand-green transition">
                      Copiar link
                    </button>
                    <Link href={`/dashboard/proposals/${p.id}`} className="text-xs text-brand-muted hover:text-white transition">
                      Detalhes
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/proposals/
git commit -m "feat: proposals dashboard — list with tracking, summary stats, copy link"
```

---

### Task 14: New Proposal Form

**Files:**
- Create: `src/app/dashboard/proposals/new/page.tsx`
- Create: `src/app/dashboard/proposals/new/NewProposalForm.tsx`

- [ ] **Step 1: Create page wrapper**

```typescript
// src/app/dashboard/proposals/new/page.tsx
import { NewProposalForm } from './NewProposalForm';

export const runtime = 'edge';

export default function NewProposalPage() {
  return <NewProposalForm />;
}
```

- [ ] **Step 2: Create NewProposalForm component**

```typescript
// src/app/dashboard/proposals/new/NewProposalForm.tsx
'use client';

import { useState } from 'react';
import { useToast } from '@/lib/use-toast';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useUserTier, isPro } from '@/lib/use-user-tier';

export function NewProposalForm() {
  const [form, setForm] = useState({
    client_name: '',
    client_email: '',
    project_title: '',
    scope: '',
    price_reais: '',
    deadline_days: '',
    payment_terms: '',
    valid_until: '',
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [suggesting, setSuggesting] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const toast = useToast();
  const { tier } = useUserTier();

  async function suggestScope() {
    if (!form.project_title.trim()) { toast.error('Preencha o título primeiro'); return; }
    setSuggesting(true);
    try {
      const res = await fetch('/api/ai/suggest-scope', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_title: form.project_title, client_name: form.client_name }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Erro ao sugerir');
        return;
      }
      const data = await res.json();
      setForm((f) => ({ ...f, scope: data.suggestion }));
      toast.success('Escopo sugerido!');
    } catch {
      toast.error('Erro ao sugerir escopo');
    } finally {
      setSuggesting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setCreating(true);
    try {
      const res = await fetch('/api/proposals/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: form.client_name,
          client_email: form.client_email || undefined,
          project_title: form.project_title,
          scope: form.scope,
          price_cents: Math.round(parseFloat(form.price_reais) * 100),
          deadline_days: parseInt(form.deadline_days),
          payment_terms: form.payment_terms || undefined,
          valid_until: form.valid_until || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Falha ao criar');
      }
      const data = await res.json();
      window.location.href = `/dashboard/proposals/${data.proposal.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro');
    } finally {
      setCreating(false);
    }
  }

  const inputClass = 'w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-brand-green/50 transition';

  return (
    <div className="min-h-screen bg-brand-dark text-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Nova proposta</h1>
        <p className="text-sm text-brand-muted mb-8">Preencha os dados e crie uma proposta profissional em segundos.</p>

        <form onSubmit={handleSubmit} className="bg-brand-surface rounded-2xl p-6 border border-white/10 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-white mb-1">Nome do cliente</label>
            <input required value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} className={inputClass} placeholder="Ex: TechStartup Ltda" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-1">Título do projeto</label>
            <input required value={form.project_title} onChange={(e) => setForm({ ...form, project_title: e.target.value })} className={inputClass} placeholder="Ex: Redesign do App Mobile" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-semibold text-white">Escopo e entregáveis</label>
              {isPro(tier) && (
                <button type="button" onClick={suggestScope} disabled={suggesting} className="text-xs text-brand-green hover:text-brand-green/80 transition disabled:opacity-50">
                  {suggesting ? 'Sugerindo...' : '✨ Sugerir com IA'}
                </button>
              )}
            </div>
            <textarea required value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })} rows={6} className={inputClass + ' resize-none'} placeholder="→ Pesquisa com 5 usuários&#10;→ Wireframes de 12 telas&#10;→ Design system completo (Figma)&#10;→ Protótipo interativo navegável&#10;→ 2 rodadas de revisão incluídas" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-1">Preço (R$)</label>
              <input required type="number" min="1" step="0.01" value={form.price_reais} onChange={(e) => setForm({ ...form, price_reais: e.target.value })} className={inputClass} placeholder="8500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-white mb-1">Prazo (dias)</label>
              <input required type="number" min="1" max="365" value={form.deadline_days} onChange={(e) => setForm({ ...form, deadline_days: e.target.value })} className={inputClass} placeholder="21" />
            </div>
          </div>

          <button type="button" onClick={() => setShowOptional(!showOptional)} className="text-xs text-brand-muted hover:text-white transition">
            {showOptional ? '▾ Esconder opcionais' : '▸ Campos opcionais (email, pagamento, validade)'}
          </button>

          {showOptional && (
            <div className="space-y-4 pt-2 border-t border-white/5">
              <div>
                <label className="block text-sm font-semibold text-white mb-1">Email do cliente (opcional)</label>
                <input type="email" value={form.client_email} onChange={(e) => setForm({ ...form, client_email: e.target.value })} className={inputClass} placeholder="joao@empresa.com" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white mb-1">Condições de pagamento (opcional)</label>
                <input value={form.payment_terms} onChange={(e) => setForm({ ...form, payment_terms: e.target.value })} className={inputClass} placeholder="Ex: 50% entrada + 50% na entrega" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white mb-1">Válida até (opcional, default 15 dias)</label>
                <input type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} className={inputClass} />
              </div>
            </div>
          )}

          {error && <ErrorMessage message={error} />}

          <button type="submit" disabled={creating} className="w-full py-3.5 bg-brand-green text-black font-bold rounded-xl hover:brightness-110 transition disabled:opacity-50 text-sm">
            {creating ? 'Criando...' : 'Criar e visualizar proposta'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/proposals/new/
git commit -m "feat: new proposal form — 5 fields, optional extras, AI scope suggestion"
```

---

### Task 15: Proposal Detail Page (Preview + Analytics)

**Files:**
- Create: `src/app/dashboard/proposals/[id]/page.tsx`
- Create: `src/app/dashboard/proposals/[id]/ProposalDetail.tsx`

- [ ] **Step 1: Create page wrapper**

```typescript
// src/app/dashboard/proposals/[id]/page.tsx
import { ProposalDetail } from './ProposalDetail';

export const runtime = 'edge';

export default function ProposalDetailPage({ params }: { params: { id: string } }) {
  return <ProposalDetail proposalId={params.id} />;
}
```

- [ ] **Step 2: Create ProposalDetail component**

Component shows: proposal preview (as client sees it) + analytics panel (views, durations, status). Actions: copy link, mark as sent, edit, delete. ~150 lines. Uses existing UI components (Toast, ConfirmModal, LoadingSpinner).

The component fetches from `/api/proposals/[id]` and displays:
- Proposal data rendered in the same clean minimal style as the public page
- Analytics sidebar: view count, total duration, list of views with timestamps
- Accept info if accepted
- Action buttons: copy link, mark sent, edit (redirect to edit page), delete (with confirmation)

Write this as a focused client component that imports types from `@/lib/types/proposals`.

- [ ] **Step 3: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/proposals/[id]/
git commit -m "feat: proposal detail — preview, analytics, actions"
```

---

### Task 16: Profile Page (Freelancer Data)

**Files:**
- Modify: `src/app/dashboard/profile/` — replace music profile with freelancer profile

- [ ] **Step 1: Create new ProfileClient**

Simple form with 6 fields: display_name, title, email, phone, website, avatar_url. Fetches from `/api/profile`, saves via PUT. Shows toast on success. Uses existing UI components.

- [ ] **Step 2: Update profile page.tsx to use new client**

- [ ] **Step 3: Verify typecheck and commit**

```bash
git add src/app/dashboard/profile/
git commit -m "feat: freelancer profile page — name, title, contact info"
```

---

## Part 5: Landing Page + Cleanup

### Task 17: Landing Page Rebrand

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/lib/translations.ts`

- [ ] **Step 1: Update translations with new copy**

Replace hero, features, pricing, FAQ content in translations.ts with proposal-focused copy:
- Hero: "Propostas que fecham. Em 2 minutos."
- Sub: "Crie propostas profissionais, envie como link, saiba quando o cliente abriu."
- Features: tracking, aceite digital, templates, IA
- Pricing: Free (3/mês) vs Pro R$29/mês

- [ ] **Step 2: Update page.tsx hero and sections**

- [ ] **Step 3: Verify and commit**

```bash
git add src/app/page.tsx src/lib/translations.ts
git commit -m "feat(landing): rebrand — proposals for freelancers, new copy and pricing"
```

---

### Task 18: Remove Old Music Tools Code

**Files:**
- Remove: all music-specific directories and files

- [ ] **Step 1: Remove old dashboard tool pages**

```bash
rm -rf src/app/dashboard/bio
rm -rf src/app/dashboard/cache-calculator
rm -rf src/app/dashboard/rider
rm -rf src/app/dashboard/contract
rm -rf src/app/dashboard/pitch-kit
rm -rf src/app/dashboard/release-timing
rm -rf src/app/dashboard/launch-checklist
rm -rf src/app/dashboard/growth
rm -rf src/app/dashboard/goals
rm -rf src/app/dashboard/competitors
rm -rf src/app/dashboard/content-calendar
```

- [ ] **Step 2: Remove old API routes**

```bash
rm -rf src/app/api/tools
rm -rf src/app/api/cron
```

- [ ] **Step 3: Remove old lib files**

```bash
rm -f src/lib/spotify-client.ts
rm -f src/lib/youtube-client.ts
rm -f src/lib/growth-aggregator.ts
rm -f src/lib/goal-calculator.ts
rm -f src/lib/cache-reference-table.ts
rm -f src/lib/checklist-template.ts
rm -f src/lib/content-calendar-prompt.ts
rm -f src/lib/contract-pdf.ts
rm -f src/lib/release-timing-engine.ts
rm -f src/lib/churn-detection.ts
rm -f src/lib/tool-content.ts
rm -f src/lib/types/tools.ts
```

- [ ] **Step 4: Remove old tests**

```bash
rm -rf src/__tests__/lib/cache-reference-table.test.ts
rm -rf src/__tests__/lib/tool-content.test.ts
rm -rf src/__tests__/components/
```

- [ ] **Step 5: Verify typecheck passes with no old references**

Run: `npx tsc --noEmit`
Fix any remaining import references to deleted files.

- [ ] **Step 6: Run tests**

Run: `npx vitest run`
Expected: slug tests pass, old tests removed

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: remove old music toolbox code — clean pivot to proposals"
```

---

### Task 19: Final Verification

- [ ] **Step 1: Full typecheck**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 2: Run all tests**

Run: `npx vitest run`
Expected: all pass

- [ ] **Step 3: Smoke test all pages**

Start dev server and curl all pages:
```bash
npx next dev -p 3333
# Test: /, /login, /dashboard, /dashboard/proposals, /dashboard/proposals/new, /dashboard/profile
```
Expected: all 200

- [ ] **Step 4: Test full flow manually**

1. Login
2. Fill profile
3. Create proposal
4. Open public link in incognito
5. Verify tracking shows in dashboard
6. Accept proposal
7. Verify email notification

- [ ] **Step 5: Push**

```bash
git push origin main
```

---

## Summary

19 tasks. Estimated build time: 2-3 sessions.

After this plan, Verelus will be:
- Proposal creation (5-field form + AI scope suggestion)
- Public proposal page (clean minimal, tracked)
- Accept digital (1-click with name)
- Dashboard with tracking analytics
- Freemium: 3/mês free (with viral "Feito com Verelus"), Pro R$29/mês
- All old music code removed
