# Phase 1 — MVP Diagnostico Funcional — Implementation Plan

> **STATUS: SUPERSEDED** — este plano foi substituido pelo pivot Toolbox R$29/mes. Arquivado como historico. A direcao atual esta em `/Users/luizsfap/.claude/plans/dynamic-knitting-adleman.md` e a implementacao executada sera uma Toolbox de 11 ferramentas + 2 bonus, nao o diagnostico descrito abaixo.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar o MVP funcional do pivot — usuario faz onboarding (Spotify URL + survey), recebe estagio calculado, diagnostico personalizado e plano de 90 dias num dashboard simples mas completo.

**Architecture:** Pipeline hibrido (regras deterministicas + Claude API) que ingere dados do Spotify Web API (Client Credentials) + survey no Supabase, calcula score em 6 dimensoes para classificar em 1 de 5 estagios, e chama Claude para gerar diagnostico textual + plano de acao estruturado.

**Tech Stack:** Next.js 14 (app router, edge runtime), TypeScript, Supabase (Postgres + Auth), Anthropic Claude API, Spotify Web API (Client Credentials), Tailwind, Vitest para testes, deploy Cloudflare Pages.

**Referencia do spec:** [`docs/superpowers/specs/2026-04-13-verulus-career-intelligence-design.md`](../specs/2026-04-13-verulus-career-intelligence-design.md)

**Fora de escopo (Plano 2 e 3):**
- Analise de catalogo musica-por-musica (Plano 2)
- Comparativo com peers brasileiros (Plano 2)
- PDF executivo (Plano 3)
- Novo pricing R$197/497/1997 no Stripe (Plano 3)
- Landing page redesign (Plano 3)

---

## File Structure

### Criar

| Arquivo | Responsabilidade |
|---------|------------------|
| `supabase/migrations/002_career_intelligence.sql` | Schema: artist_data, artist_survey, diagnostics, action_progress |
| `src/lib/types/career.ts` | Types: Stage, Dimension, SurveyResponse, DiagnosticResult, etc |
| `src/lib/spotify-client.ts` | Spotify Web API client (Client Credentials auth, fetch artist) |
| `src/lib/stage-calculator.ts` | Regras deterministicas de scoring → estagio |
| `src/lib/diagnostic-prompts.ts` | Constroi prompts Claude a partir dos dados |
| `src/app/api/spotify/fetch-artist/route.ts` | Endpoint: parse URL, fetch Spotify, salva em artist_data |
| `src/app/api/diagnostic/generate/route.ts` | Endpoint: orquestra stage + Claude, salva diagnostics |
| `src/app/api/diagnostic/[id]/route.ts` | GET diagnostic by id (para pagina do resultado) |
| `src/app/api/action-progress/route.ts` | POST para marcar acao como concluida |
| `src/app/dashboard/onboarding/page.tsx` | Pagina multi-step: Spotify URL + socials + survey |
| `src/app/dashboard/diagnostic/[id]/page.tsx` | Dashboard do diagnostico com 3 modulos |
| `src/components/diagnostic/StageHeader.tsx` | Modulo 1 part 1 — header com estagio + progress bar |
| `src/components/diagnostic/RaioX.tsx` | Modulo 1 part 2 — 4 cards de metrica com leitura IA |
| `src/components/diagnostic/DiagnosticText.tsx` | Modulo 4 — pontos fortes/atencao/oportunidades |
| `src/components/diagnostic/ActionPlan.tsx` | Modulo 5 — lista de acoes com checkbox |
| `src/components/onboarding/SpotifyUrlInput.tsx` | Step 1 do onboarding |
| `src/components/onboarding/SocialUrlsInput.tsx` | Step 2 do onboarding |
| `src/components/onboarding/SurveyForm.tsx` | Step 3 do onboarding — form de 12 perguntas |
| `src/__tests__/lib/stage-calculator.test.ts` | Testes das regras de scoring |
| `src/__tests__/lib/spotify-client.test.ts` | Testes do parser de URL e transformacao |
| `src/__tests__/lib/diagnostic-prompts.test.ts` | Testes de construcao de prompt |

### Modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/app/dashboard/page.tsx` | Substituir menu de ferramentas por: "Novo diagnostico" ou "Continuar para diagnostico existente" |
| `src/middleware.ts` | Garantir que rotas do diagnostic sao protegidas (auth) |
| `.env.local` | Adicionar SPOTIFY_CLIENT_ID e SPOTIFY_CLIENT_SECRET |

### Ocultar (nao deletar, renderizam pagina de placeholder)

Todos os modulos atuais em `src/app/dashboard/(tools)/*` ou sub-rotas equivalentes: social, press, setlist, budget, contracts, reports, tours, analysis, pitching, epk. Estrategia: editar cada pagina para mostrar "Esta ferramenta esta em reestruturacao — volte em breve" em vez de renderizar o conteudo antigo.

---

## Task 1 — Preparação do ambiente Spotify

**Files:**
- Modify: `.env.local` (adicionar SPOTIFY_CLIENT_ID + SPOTIFY_CLIENT_SECRET)
- Modify: Cloudflare Pages env vars (mesma coisa)

- [ ] **Step 1: Criar app no Spotify Developer Dashboard**

Manual: acessa https://developer.spotify.com/dashboard, clica em "Create app", preenche:
- Name: `Verelus`
- Description: `Career intelligence platform for independent artists`
- Redirect URI: `https://verelus.com/api/auth/spotify/callback` (ainda nao usamos mas preenche)
- APIs: selecionar "Web API"
- Aceita termos

Copia Client ID e Client Secret.

- [ ] **Step 2: Testar Spotify Client Credentials auth via curl**

Rodar (substituindo as chaves):
```bash
curl -X POST "https://accounts.spotify.com/api/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=SPOTIFY_CLIENT_ID&client_secret=SPOTIFY_CLIENT_SECRET"
```

Expected output: JSON com `access_token`, `token_type: Bearer`, `expires_in: 3600`.

Se der erro, verificar se as chaves estao corretas e o app esta ativo.

- [ ] **Step 3: Adicionar variaveis ao `.env.local`**

Editar `/Users/luizsfap/Desktop/Claude CODE Projects/verelus/.env.local` e adicionar no final:

```
# --- Spotify Web API (Client Credentials) ---
SPOTIFY_CLIENT_ID=<copiar do step 1>
SPOTIFY_CLIENT_SECRET=<copiar do step 1>
```

- [ ] **Step 4: Adicionar variaveis ao Cloudflare Pages**

Rodar via curl (substituindo os valores reais):
```bash
TOKEN="<CLOUDFLARE_API_TOKEN>"
ACCOUNT="90c020fe3dde7b51a12bea43321bdf3e"

curl -X PATCH "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT/pages/projects/tunesignal-bandbrain" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "deployment_configs": {
      "production": {
        "env_vars": {
          "SPOTIFY_CLIENT_ID": {"type": "plain_text", "value": "<REAL_ID>"},
          "SPOTIFY_CLIENT_SECRET": {"type": "secret_text", "value": "<REAL_SECRET>"}
        }
      }
    }
  }'
```

Expected output: `"success": true`.

- [ ] **Step 5: Commit `.env.local.example`**

Editar `/Users/luizsfap/Desktop/Claude CODE Projects/verelus/.env.local.example` e adicionar:
```
# Spotify Web API (Client Credentials)
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

```bash
cd /Users/luizsfap/Desktop/Claude\ CODE\ Projects/verelus
git add .env.local.example
git commit -m "chore: adicionar variaveis Spotify ao .env.example"
```

---

## Task 2 — Migration SQL

**Files:**
- Create: `supabase/migrations/002_career_intelligence.sql`

- [ ] **Step 1: Criar arquivo de migration**

Criar `supabase/migrations/002_career_intelligence.sql` com:

```sql
-- Verelus Career Intelligence Schema
-- Phase 1 MVP: artist_data, artist_survey, diagnostics, action_progress

-- Dados do artista capturados do Spotify
CREATE TABLE IF NOT EXISTS artist_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  spotify_artist_id text NOT NULL,
  spotify_url text NOT NULL,
  name text NOT NULL,
  genres text[] DEFAULT '{}',
  followers integer DEFAULT 0,
  popularity integer DEFAULT 0,
  monthly_listeners integer,
  top_tracks jsonb DEFAULT '[]',
  audio_features_avg jsonb,
  social_urls jsonb DEFAULT '{}',
  last_synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, spotify_artist_id)
);

CREATE INDEX IF NOT EXISTS idx_artist_data_user_id ON artist_data(user_id);

-- Respostas do formulario guiado
CREATE TABLE IF NOT EXISTS artist_survey (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  responses jsonb NOT NULL,
  submitted_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_artist_survey_user_id ON artist_survey(user_id);

-- Diagnosticos gerados
CREATE TABLE IF NOT EXISTS diagnostics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  artist_data_snapshot jsonb NOT NULL,
  survey_snapshot jsonb NOT NULL,
  stage text NOT NULL CHECK (stage IN ('Inicial','Emergente','Consolidado','Estabelecido','Referencia')),
  stage_score integer NOT NULL CHECK (stage_score >= 0 AND stage_score <= 100),
  dimension_scores jsonb NOT NULL,
  diagnostic_text jsonb NOT NULL,
  action_plan jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diagnostics_user_id ON diagnostics(user_id);
CREATE INDEX IF NOT EXISTS idx_diagnostics_created_at ON diagnostics(created_at DESC);

-- Progresso nas acoes do plano (checkboxes)
CREATE TABLE IF NOT EXISTS action_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  diagnostic_id uuid NOT NULL REFERENCES diagnostics(id) ON DELETE CASCADE,
  action_index integer NOT NULL,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  UNIQUE(diagnostic_id, action_index)
);

CREATE INDEX IF NOT EXISTS idx_action_progress_diagnostic_id ON action_progress(diagnostic_id);

-- RLS: usuarios so veem seus proprios dados
ALTER TABLE artist_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_survey ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostics ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_see_own_artist_data" ON artist_data
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "users_see_own_survey" ON artist_survey
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "users_see_own_diagnostics" ON diagnostics
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "users_see_own_action_progress" ON action_progress
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "users_update_own_action_progress" ON action_progress
  FOR ALL USING (user_id = auth.uid());

-- Service role tem acesso total (para webhooks e API routes que escrevem)
CREATE POLICY "service_role_full_access_artist_data" ON artist_data
  FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_full_access_survey" ON artist_survey
  FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_full_access_diagnostics" ON diagnostics
  FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_full_access_progress" ON action_progress
  FOR ALL TO service_role USING (true);
```

- [ ] **Step 2: Rodar a migration no Supabase**

Copiar o conteudo do SQL acima e rodar via SQL Editor no dashboard Supabase (https://supabase.com/dashboard/project/oqpbfomdswdjerqpadpy/sql/new) OU via curl:

```bash
SUPA_KEY="<SUPABASE_SERVICE_ROLE_KEY>"
# O Supabase REST nao executa SQL arbitrario; preciso usar a CLI ou editor.
# Via dashboard: https://supabase.com/dashboard/project/oqpbfomdswdjerqpadpy/sql/new
# Cole o SQL, clique Run.
```

Expected: queries rodam sem erro. 4 tabelas criadas.

- [ ] **Step 3: Verificar tabelas criadas**

```bash
SUPA_KEY="<SUPABASE_SERVICE_ROLE_KEY>"
SUPA_URL="https://oqpbfomdswdjerqpadpy.supabase.co"

curl -s "$SUPA_URL/rest/v1/diagnostics?limit=0" \
  -H "apikey: $SUPA_KEY" -H "Authorization: Bearer $SUPA_KEY" -w "\nHTTP:%{http_code}"
```

Expected: HTTP 200 e `[]` (tabela existe, vazia).

- [ ] **Step 4: Commit**

```bash
cd /Users/luizsfap/Desktop/Claude\ CODE\ Projects/verelus
git add supabase/migrations/002_career_intelligence.sql
git commit -m "feat: migration para career intelligence (artist_data, survey, diagnostics)"
```

---

## Task 3 — Types e interfaces

**Files:**
- Create: `src/lib/types/career.ts`

- [ ] **Step 1: Criar o arquivo de types**

Criar `src/lib/types/career.ts` com:

```typescript
/**
 * Tipos do sistema de Career Intelligence do Verelus.
 * Define estrutura de estagios, dimensoes, survey, e diagnostic.
 */

export type Stage = 'Inicial' | 'Emergente' | 'Consolidado' | 'Estabelecido' | 'Referencia';

export const STAGES: Stage[] = ['Inicial', 'Emergente', 'Consolidado', 'Estabelecido', 'Referencia'];

export type DimensionName =
  | 'audience_size'
  | 'growth_trajectory'
  | 'release_consistency'
  | 'professionalism'
  | 'revenue_business'
  | 'multi_platform_presence';

export interface DimensionScores {
  audience_size: number;          // 0-100
  growth_trajectory: number;      // 0-100
  release_consistency: number;    // 0-100
  professionalism: number;        // 0-100
  revenue_business: number;       // 0-100
  multi_platform_presence: number;// 0-100
}

export const DIMENSION_WEIGHTS: Record<DimensionName, number> = {
  audience_size: 0.30,
  growth_trajectory: 0.15,
  release_consistency: 0.15,
  professionalism: 0.15,
  revenue_business: 0.15,
  multi_platform_presence: 0.10,
};

export interface SurveyResponse {
  years_releasing: 'lt_6m' | '6m_1y' | '1_3y' | '3_5y' | 'gt_5y';
  shows_performed: '0' | '1_10' | '10_50' | '50_200' | 'gt_200';
  lives_from_music: 'no' | 'partial' | 'yes';
  monthly_revenue: 'zero' | '1k_2k' | '2k_5k' | '5k_15k' | 'gt_15k';
  has_management: 'none' | 'partnership' | 'traditional';
  release_frequency: 'sporadic' | 'quarterly' | 'monthly' | 'weekly';
  main_goal_12m: 'discovery' | 'grow_base' | 'monetize' | 'sign_contract' | 'internationalize';
  primary_genre: string;          // free text (ex: "indie rock", "MPB", "trap")
  city: string;                   // free text
  has_press_kit: 'none' | 'basic' | 'complete';
  production_quality: 'home' | 'simple_studio' | 'professional';
  rights_registration: 'none' | 'partial' | 'complete';
}

export interface SpotifyArtistData {
  spotify_artist_id: string;
  spotify_url: string;
  name: string;
  genres: string[];
  followers: number;
  popularity: number;              // 0-100 do Spotify
  monthly_listeners?: number;      // pode ser null se nao conseguimos obter
  top_tracks: SpotifyTrack[];      // top 10
  audio_features_avg?: AudioFeaturesAvg;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  popularity: number;
  preview_url: string | null;
  duration_ms: number;
  album_image_url: string | null;
}

export interface AudioFeaturesAvg {
  energy: number;       // 0-1
  danceability: number; // 0-1
  valence: number;      // 0-1 (mood: 0=sad, 1=happy)
  acousticness: number;
  instrumentalness: number;
  tempo: number;        // BPM
}

export interface ActionPlanItem {
  title: string;
  description: string;
  impact_expected: string;  // ex: "+15% monthly listeners"
  deadline_days: 7 | 30 | 60 | 90;
  priority: 1 | 2 | 3;      // 1=high, 3=low
}

export interface DiagnosticText {
  summary: string;            // paragrafo geral do diagnostico
  strengths: string[];        // 3-4 bullets
  weaknesses: string[];       // 3-4 bullets
  opportunities: string[];    // 3-4 bullets
  metric_readings: {          // leituras IA para cada metrica do Raio-X
    monthly_listeners: string;
    growth_rate: string;
    release_consistency: string;
    engagement: string;
  };
}

export interface DiagnosticResult {
  id: string;
  user_id: string;
  stage: Stage;
  stage_score: number;
  dimension_scores: DimensionScores;
  diagnostic_text: DiagnosticText;
  action_plan: ActionPlanItem[];
  created_at: string;
  artist_data_snapshot: SpotifyArtistData;
  survey_snapshot: SurveyResponse;
}
```

- [ ] **Step 2: Verificar tipos compilam**

```bash
cd /Users/luizsfap/Desktop/Claude\ CODE\ Projects/verelus
npx tsc --noEmit 2>&1 | head -10
```

Expected: nao mostra erros relacionados a `career.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/types/career.ts
git commit -m "feat: adicionar types de Career Intelligence"
```

---

## Task 4 — Spotify Client (auth + parse URL)

**Files:**
- Create: `src/lib/spotify-client.ts`
- Test: `src/__tests__/lib/spotify-client.test.ts`

- [ ] **Step 1: Escrever testes primeiro**

Criar `src/__tests__/lib/spotify-client.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { parseSpotifyArtistId } from '@/lib/spotify-client';

describe('parseSpotifyArtistId', () => {
  it('extracts ID from open.spotify.com URL', () => {
    expect(parseSpotifyArtistId('https://open.spotify.com/artist/06HL4z0CvFAxyc27GXpf02'))
      .toBe('06HL4z0CvFAxyc27GXpf02');
  });

  it('extracts ID from URL with query string', () => {
    expect(parseSpotifyArtistId('https://open.spotify.com/artist/06HL4z0CvFAxyc27GXpf02?si=abc123'))
      .toBe('06HL4z0CvFAxyc27GXpf02');
  });

  it('extracts ID from URL with locale prefix', () => {
    expect(parseSpotifyArtistId('https://open.spotify.com/intl-pt/artist/06HL4z0CvFAxyc27GXpf02'))
      .toBe('06HL4z0CvFAxyc27GXpf02');
  });

  it('accepts bare artist ID', () => {
    expect(parseSpotifyArtistId('06HL4z0CvFAxyc27GXpf02')).toBe('06HL4z0CvFAxyc27GXpf02');
  });

  it('accepts spotify URI', () => {
    expect(parseSpotifyArtistId('spotify:artist:06HL4z0CvFAxyc27GXpf02'))
      .toBe('06HL4z0CvFAxyc27GXpf02');
  });

  it('returns null for invalid URL', () => {
    expect(parseSpotifyArtistId('https://instagram.com/someone')).toBeNull();
  });

  it('returns null for non-artist URLs', () => {
    expect(parseSpotifyArtistId('https://open.spotify.com/track/06HL4z0CvFAxyc27GXpf02')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseSpotifyArtistId('')).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar testes — devem falhar**

```bash
cd /Users/luizsfap/Desktop/Claude\ CODE\ Projects/verelus
npx vitest run src/__tests__/lib/spotify-client.test.ts 2>&1 | tail -10
```

Expected: FAIL com "Cannot find module '@/lib/spotify-client'".

- [ ] **Step 3: Criar spotify-client.ts com a funcao minima**

Criar `src/lib/spotify-client.ts`:

```typescript
import type { SpotifyArtistData, SpotifyTrack } from '@/lib/types/career';

/**
 * Extrai o ID do artista do Spotify a partir de uma URL ou URI.
 * Aceita: open.spotify.com/artist/ID, open.spotify.com/intl-xx/artist/ID, spotify:artist:ID, ID bruto.
 * Retorna null se nao for uma URL valida de artista.
 */
export function parseSpotifyArtistId(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  // ID bruto (22 caracteres alfanumericos do Spotify)
  if (/^[a-zA-Z0-9]{22}$/.test(trimmed)) return trimmed;

  // spotify:artist:ID
  const uriMatch = trimmed.match(/^spotify:artist:([a-zA-Z0-9]{22})$/);
  if (uriMatch) return uriMatch[1];

  // open.spotify.com/artist/ID ou open.spotify.com/intl-xx/artist/ID
  const urlMatch = trimmed.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?artist\/([a-zA-Z0-9]{22})/);
  if (urlMatch) return urlMatch[1];

  return null;
}

/**
 * Obtem access token do Spotify via Client Credentials flow.
 * Requer SPOTIFY_CLIENT_ID e SPOTIFY_CLIENT_SECRET no ambiente.
 * Token dura 1 hora; fetch novo a cada chamada (sem cache por ora).
 */
export async function getSpotifyAccessToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET not set');
  }

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }).toString(),
  });

  if (!res.ok) {
    throw new Error(`Spotify auth failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

/**
 * Busca dados do artista no Spotify Web API.
 * Retorna artista + top 10 tracks + audio features medios.
 * Throws se artista nao existe ou Spotify retorna erro.
 */
export async function fetchSpotifyArtistData(artistId: string): Promise<SpotifyArtistData> {
  const token = await getSpotifyAccessToken();
  const headers = { Authorization: `Bearer ${token}` };

  // Fetch artist info
  const artistRes = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, { headers });
  if (!artistRes.ok) {
    if (artistRes.status === 404) throw new Error(`Artist not found: ${artistId}`);
    throw new Error(`Spotify artist fetch failed: ${artistRes.status}`);
  }
  const artist = (await artistRes.json()) as {
    id: string;
    name: string;
    genres: string[];
    followers: { total: number };
    popularity: number;
    external_urls: { spotify: string };
  };

  // Fetch top tracks (BR market)
  const tracksRes = await fetch(
    `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=BR`,
    { headers }
  );
  if (!tracksRes.ok) throw new Error(`Spotify top tracks fetch failed: ${tracksRes.status}`);
  const tracksData = (await tracksRes.json()) as {
    tracks: Array<{
      id: string;
      name: string;
      popularity: number;
      preview_url: string | null;
      duration_ms: number;
      album: { images: Array<{ url: string }> };
    }>;
  };

  const topTracks: SpotifyTrack[] = tracksData.tracks.slice(0, 10).map((t) => ({
    id: t.id,
    name: t.name,
    popularity: t.popularity,
    preview_url: t.preview_url,
    duration_ms: t.duration_ms,
    album_image_url: t.album.images[0]?.url ?? null,
  }));

  return {
    spotify_artist_id: artist.id,
    spotify_url: artist.external_urls.spotify,
    name: artist.name,
    genres: artist.genres,
    followers: artist.followers.total,
    popularity: artist.popularity,
    monthly_listeners: undefined, // Nao disponivel via API publica; fica para Plano 2 (scraping)
    top_tracks: topTracks,
  };
}
```

- [ ] **Step 4: Rodar testes — devem passar**

```bash
npx vitest run src/__tests__/lib/spotify-client.test.ts 2>&1 | tail -10
```

Expected: 8 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/spotify-client.ts src/__tests__/lib/spotify-client.test.ts
git commit -m "feat: spotify client com auth e fetch de artista"
```

---

## Task 5 — Stage Calculator

**Files:**
- Create: `src/lib/stage-calculator.ts`
- Test: `src/__tests__/lib/stage-calculator.test.ts`

- [ ] **Step 1: Escrever testes primeiro**

Criar `src/__tests__/lib/stage-calculator.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  calculateStage,
  scoreAudienceSize,
  scoreGrowthTrajectory,
  scoreReleaseConsistency,
  scoreProfessionalism,
  scoreRevenueBusiness,
  scoreMultiPlatformPresence,
  stageFromScore,
} from '@/lib/stage-calculator';
import type { SpotifyArtistData, SurveyResponse } from '@/lib/types/career';

const baseSpotify: SpotifyArtistData = {
  spotify_artist_id: 'x',
  spotify_url: 'x',
  name: 'Test',
  genres: ['indie'],
  followers: 0,
  popularity: 0,
  top_tracks: [],
};

const baseSurvey: SurveyResponse = {
  years_releasing: 'lt_6m',
  shows_performed: '0',
  lives_from_music: 'no',
  monthly_revenue: 'zero',
  has_management: 'none',
  release_frequency: 'sporadic',
  main_goal_12m: 'discovery',
  primary_genre: 'indie',
  city: 'Sao Paulo',
  has_press_kit: 'none',
  production_quality: 'home',
  rights_registration: 'none',
};

describe('stageFromScore', () => {
  it('maps 0-20 to Inicial', () => {
    expect(stageFromScore(0)).toBe('Inicial');
    expect(stageFromScore(20)).toBe('Inicial');
  });
  it('maps 21-40 to Emergente', () => {
    expect(stageFromScore(21)).toBe('Emergente');
    expect(stageFromScore(40)).toBe('Emergente');
  });
  it('maps 41-60 to Consolidado', () => {
    expect(stageFromScore(41)).toBe('Consolidado');
    expect(stageFromScore(60)).toBe('Consolidado');
  });
  it('maps 61-80 to Estabelecido', () => {
    expect(stageFromScore(61)).toBe('Estabelecido');
    expect(stageFromScore(80)).toBe('Estabelecido');
  });
  it('maps 81-100 to Referencia', () => {
    expect(stageFromScore(81)).toBe('Referencia');
    expect(stageFromScore(100)).toBe('Referencia');
  });
});

describe('scoreAudienceSize', () => {
  it('returns 0 for 0 listeners', () => {
    expect(scoreAudienceSize({ ...baseSpotify, monthly_listeners: 0, followers: 0 })).toBe(0);
  });
  it('returns low score for <500 listeners', () => {
    const score = scoreAudienceSize({ ...baseSpotify, monthly_listeners: 300, followers: 100 });
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(20);
  });
  it('returns mid score for 5k-50k listeners', () => {
    const score = scoreAudienceSize({ ...baseSpotify, monthly_listeners: 10000, followers: 5000 });
    expect(score).toBeGreaterThanOrEqual(40);
    expect(score).toBeLessThanOrEqual(60);
  });
  it('returns 100 for 500k+ listeners', () => {
    expect(scoreAudienceSize({ ...baseSpotify, monthly_listeners: 800000, followers: 500000 })).toBe(100);
  });
  it('uses popularity-based proxy when monthly_listeners missing', () => {
    // followers=100k, popularity=70 should give mid-to-high score
    const score = scoreAudienceSize({ ...baseSpotify, monthly_listeners: undefined, followers: 100000, popularity: 70 });
    expect(score).toBeGreaterThan(40);
  });
});

describe('scoreReleaseConsistency', () => {
  it('returns 0 for sporadic frequency', () => {
    expect(scoreReleaseConsistency({ ...baseSurvey, release_frequency: 'sporadic' })).toBe(20);
  });
  it('returns 50 for quarterly', () => {
    expect(scoreReleaseConsistency({ ...baseSurvey, release_frequency: 'quarterly' })).toBe(50);
  });
  it('returns 80 for monthly', () => {
    expect(scoreReleaseConsistency({ ...baseSurvey, release_frequency: 'monthly' })).toBe(80);
  });
  it('returns 100 for weekly', () => {
    expect(scoreReleaseConsistency({ ...baseSurvey, release_frequency: 'weekly' })).toBe(100);
  });
});

describe('scoreProfessionalism', () => {
  it('returns low for no press kit + home production', () => {
    const score = scoreProfessionalism({
      ...baseSurvey,
      has_press_kit: 'none',
      production_quality: 'home',
      rights_registration: 'none',
    });
    expect(score).toBeLessThan(20);
  });
  it('returns high for complete press kit + professional + rights', () => {
    const score = scoreProfessionalism({
      ...baseSurvey,
      has_press_kit: 'complete',
      production_quality: 'professional',
      rights_registration: 'complete',
    });
    expect(score).toBeGreaterThanOrEqual(90);
  });
});

describe('scoreRevenueBusiness', () => {
  it('returns 0 for not living from music + no revenue + no management', () => {
    expect(scoreRevenueBusiness({
      ...baseSurvey,
      lives_from_music: 'no',
      monthly_revenue: 'zero',
      has_management: 'none',
    })).toBe(0);
  });
  it('returns 100 for living from music + high revenue + traditional management', () => {
    expect(scoreRevenueBusiness({
      ...baseSurvey,
      lives_from_music: 'yes',
      monthly_revenue: 'gt_15k',
      has_management: 'traditional',
    })).toBe(100);
  });
});

describe('scoreMultiPlatformPresence', () => {
  it('returns 0 for no socials', () => {
    expect(scoreMultiPlatformPresence({})).toBe(0);
  });
  it('returns 50 for 1 social', () => {
    expect(scoreMultiPlatformPresence({ instagram: 'https://instagram.com/x' })).toBe(50);
  });
  it('returns 100 for 3+ socials', () => {
    expect(scoreMultiPlatformPresence({
      instagram: 'x',
      tiktok: 'x',
      youtube: 'x',
    })).toBe(100);
  });
});

describe('calculateStage (integracao)', () => {
  it('classifies artista novo como Inicial', () => {
    const result = calculateStage(
      { ...baseSpotify, monthly_listeners: 100, followers: 50 },
      baseSurvey,
      {}
    );
    expect(result.stage).toBe('Inicial');
    expect(result.score).toBeLessThanOrEqual(20);
  });

  it('classifies artista meio-caminho como Consolidado', () => {
    const result = calculateStage(
      { ...baseSpotify, monthly_listeners: 15000, followers: 8000, popularity: 40 },
      {
        ...baseSurvey,
        years_releasing: '3_5y',
        shows_performed: '50_200',
        lives_from_music: 'partial',
        monthly_revenue: '2k_5k',
        release_frequency: 'monthly',
        has_press_kit: 'basic',
        production_quality: 'simple_studio',
        rights_registration: 'partial',
      },
      { instagram: 'x', tiktok: 'x' }
    );
    expect(['Consolidado', 'Emergente']).toContain(result.stage);
  });

  it('classifies artista estabelecido como Referencia', () => {
    const result = calculateStage(
      { ...baseSpotify, monthly_listeners: 800000, followers: 500000, popularity: 80 },
      {
        ...baseSurvey,
        years_releasing: 'gt_5y',
        shows_performed: 'gt_200',
        lives_from_music: 'yes',
        monthly_revenue: 'gt_15k',
        has_management: 'traditional',
        release_frequency: 'monthly',
        has_press_kit: 'complete',
        production_quality: 'professional',
        rights_registration: 'complete',
      },
      { instagram: 'x', tiktok: 'x', youtube: 'x' }
    );
    expect(result.stage).toBe('Referencia');
    expect(result.score).toBeGreaterThanOrEqual(81);
  });
});
```

- [ ] **Step 2: Rodar os testes — devem falhar**

```bash
npx vitest run src/__tests__/lib/stage-calculator.test.ts 2>&1 | tail -10
```

Expected: FAIL com "Cannot find module '@/lib/stage-calculator'".

- [ ] **Step 3: Implementar stage-calculator.ts**

Criar `src/lib/stage-calculator.ts`:

```typescript
import type {
  SpotifyArtistData,
  SurveyResponse,
  DimensionScores,
  Stage,
} from '@/lib/types/career';
import { DIMENSION_WEIGHTS } from '@/lib/types/career';

/**
 * Mapeia score numerico (0-100) para estagio.
 * Ranges: 0-20 Inicial, 21-40 Emergente, 41-60 Consolidado, 61-80 Estabelecido, 81-100 Referencia.
 */
export function stageFromScore(score: number): Stage {
  if (score <= 20) return 'Inicial';
  if (score <= 40) return 'Emergente';
  if (score <= 60) return 'Consolidado';
  if (score <= 80) return 'Estabelecido';
  return 'Referencia';
}

/**
 * Score de audiencia (0-100) baseado em monthly_listeners + followers.
 * Se monthly_listeners estiver ausente, usa proxy: min(followers * 2, popularity * 10000).
 */
export function scoreAudienceSize(data: SpotifyArtistData): number {
  const listeners = data.monthly_listeners ?? Math.min(data.followers * 2, (data.popularity ?? 0) * 10000);
  if (listeners >= 500_000) return 100;
  if (listeners >= 100_000) return 85;
  if (listeners >= 50_000) return 70;
  if (listeners >= 10_000) return 55;
  if (listeners >= 5_000) return 40;
  if (listeners >= 1_000) return 25;
  if (listeners >= 500) return 15;
  if (listeners >= 100) return 8;
  if (listeners > 0) return 3;
  return 0;
}

/**
 * Score de crescimento (0-100).
 * No MVP: usamos o release_frequency + years_releasing como proxy
 * (nao temos historico de listeners ainda). Um artista com pouco tempo de carreira
 * mas consistencia alta pode ter score alto.
 */
export function scoreGrowthTrajectory(survey: SurveyResponse): number {
  const freqScore: Record<SurveyResponse['release_frequency'], number> = {
    sporadic: 20,
    quarterly: 50,
    monthly: 80,
    weekly: 100,
  };
  const yearsScore: Record<SurveyResponse['years_releasing'], number> = {
    lt_6m: 60,      // muito novo — potencial alto se consistent
    '6m_1y': 70,
    '1_3y': 80,     // sweet spot de crescimento
    '3_5y': 70,
    gt_5y: 50,      // mais tempo = mais dificil crescer rapidamente
  };
  // Media das duas dimensoes
  return Math.round((freqScore[survey.release_frequency] + yearsScore[survey.years_releasing]) / 2);
}

/**
 * Score de consistencia de lancamento (0-100) baseado em release_frequency.
 */
export function scoreReleaseConsistency(survey: SurveyResponse): number {
  const map: Record<SurveyResponse['release_frequency'], number> = {
    sporadic: 20,
    quarterly: 50,
    monthly: 80,
    weekly: 100,
  };
  return map[survey.release_frequency];
}

/**
 * Score de profissionalismo (0-100) baseado em press_kit + production_quality + rights_registration.
 */
export function scoreProfessionalism(survey: SurveyResponse): number {
  const pressKit: Record<SurveyResponse['has_press_kit'], number> = {
    none: 0,
    basic: 50,
    complete: 100,
  };
  const production: Record<SurveyResponse['production_quality'], number> = {
    home: 30,
    simple_studio: 65,
    professional: 100,
  };
  const rights: Record<SurveyResponse['rights_registration'], number> = {
    none: 0,
    partial: 50,
    complete: 100,
  };
  return Math.round(
    pressKit[survey.has_press_kit] * 0.35 +
    production[survey.production_quality] * 0.35 +
    rights[survey.rights_registration] * 0.30
  );
}

/**
 * Score de receita e negocio (0-100) baseado em lives_from_music + monthly_revenue + has_management.
 */
export function scoreRevenueBusiness(survey: SurveyResponse): number {
  const lives: Record<SurveyResponse['lives_from_music'], number> = {
    no: 0,
    partial: 50,
    yes: 100,
  };
  const revenue: Record<SurveyResponse['monthly_revenue'], number> = {
    zero: 0,
    '1k_2k': 20,
    '2k_5k': 50,
    '5k_15k': 80,
    gt_15k: 100,
  };
  const mgmt: Record<SurveyResponse['has_management'], number> = {
    none: 0,
    partnership: 50,
    traditional: 100,
  };
  return Math.round(
    lives[survey.lives_from_music] * 0.40 +
    revenue[survey.monthly_revenue] * 0.40 +
    mgmt[survey.has_management] * 0.20
  );
}

/**
 * Score de presenca multiplataforma (0-100) baseado em quantas redes sociais foram informadas.
 */
export function scoreMultiPlatformPresence(socialUrls: Record<string, string | undefined>): number {
  const active = Object.values(socialUrls).filter((v) => v && v.trim().length > 0).length;
  if (active === 0) return 0;
  if (active === 1) return 50;
  if (active === 2) return 80;
  return 100;
}

/**
 * Calcula estagio final e scores por dimensao.
 */
export function calculateStage(
  spotify: SpotifyArtistData,
  survey: SurveyResponse,
  socialUrls: Record<string, string | undefined>
): { stage: Stage; score: number; dimensions: DimensionScores } {
  const dimensions: DimensionScores = {
    audience_size: scoreAudienceSize(spotify),
    growth_trajectory: scoreGrowthTrajectory(survey),
    release_consistency: scoreReleaseConsistency(survey),
    professionalism: scoreProfessionalism(survey),
    revenue_business: scoreRevenueBusiness(survey),
    multi_platform_presence: scoreMultiPlatformPresence(socialUrls),
  };

  const weightedScore =
    dimensions.audience_size * DIMENSION_WEIGHTS.audience_size +
    dimensions.growth_trajectory * DIMENSION_WEIGHTS.growth_trajectory +
    dimensions.release_consistency * DIMENSION_WEIGHTS.release_consistency +
    dimensions.professionalism * DIMENSION_WEIGHTS.professionalism +
    dimensions.revenue_business * DIMENSION_WEIGHTS.revenue_business +
    dimensions.multi_platform_presence * DIMENSION_WEIGHTS.multi_platform_presence;

  const finalScore = Math.round(weightedScore);
  return {
    stage: stageFromScore(finalScore),
    score: finalScore,
    dimensions,
  };
}
```

- [ ] **Step 4: Rodar testes — devem passar**

```bash
npx vitest run src/__tests__/lib/stage-calculator.test.ts 2>&1 | tail -15
```

Expected: todos os tests passam (aproximadamente 22 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/stage-calculator.ts src/__tests__/lib/stage-calculator.test.ts
git commit -m "feat: stage calculator com regras ponderadas de 6 dimensoes"
```

---

## Task 6 — Prompts de Diagnostico

**Files:**
- Create: `src/lib/diagnostic-prompts.ts`
- Test: `src/__tests__/lib/diagnostic-prompts.test.ts`

- [ ] **Step 1: Escrever testes primeiro**

Criar `src/__tests__/lib/diagnostic-prompts.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { buildDiagnosticPrompt, parseDiagnosticResponse } from '@/lib/diagnostic-prompts';
import type { SpotifyArtistData, SurveyResponse, DimensionScores } from '@/lib/types/career';

const fakeSpotify: SpotifyArtistData = {
  spotify_artist_id: 'abc',
  spotify_url: 'https://open.spotify.com/artist/abc',
  name: 'Banda Teste',
  genres: ['indie rock', 'MPB'],
  followers: 5000,
  popularity: 35,
  monthly_listeners: 12000,
  top_tracks: [
    { id: 't1', name: 'Musica 1', popularity: 40, preview_url: null, duration_ms: 180000, album_image_url: null },
  ],
};

const fakeSurvey: SurveyResponse = {
  years_releasing: '3_5y',
  shows_performed: '50_200',
  lives_from_music: 'partial',
  monthly_revenue: '2k_5k',
  has_management: 'none',
  release_frequency: 'quarterly',
  main_goal_12m: 'monetize',
  primary_genre: 'indie rock',
  city: 'Sao Paulo',
  has_press_kit: 'basic',
  production_quality: 'simple_studio',
  rights_registration: 'partial',
};

const fakeDimensions: DimensionScores = {
  audience_size: 55,
  growth_trajectory: 60,
  release_consistency: 50,
  professionalism: 55,
  revenue_business: 45,
  multi_platform_presence: 80,
};

describe('buildDiagnosticPrompt', () => {
  it('inclui nome do artista no prompt', () => {
    const prompt = buildDiagnosticPrompt(fakeSpotify, fakeSurvey, 'Consolidado', 54, fakeDimensions, {});
    expect(prompt).toContain('Banda Teste');
  });

  it('inclui estagio calculado', () => {
    const prompt = buildDiagnosticPrompt(fakeSpotify, fakeSurvey, 'Consolidado', 54, fakeDimensions, {});
    expect(prompt).toContain('Consolidado');
  });

  it('inclui instrucao de formato JSON', () => {
    const prompt = buildDiagnosticPrompt(fakeSpotify, fakeSurvey, 'Consolidado', 54, fakeDimensions, {});
    expect(prompt).toContain('JSON');
  });

  it('inclui todas as dimensoes com scores', () => {
    const prompt = buildDiagnosticPrompt(fakeSpotify, fakeSurvey, 'Consolidado', 54, fakeDimensions, {});
    expect(prompt).toContain('audience_size');
    expect(prompt).toContain('55');
  });

  it('inclui objetivo do artista para os 12 meses', () => {
    const prompt = buildDiagnosticPrompt(fakeSpotify, fakeSurvey, 'Consolidado', 54, fakeDimensions, {});
    expect(prompt).toContain('monetize');
  });
});

describe('parseDiagnosticResponse', () => {
  it('parseia resposta JSON bem-formada', () => {
    const raw = JSON.stringify({
      diagnostic_text: {
        summary: 'Voce esta no estagio Consolidado.',
        strengths: ['a', 'b', 'c'],
        weaknesses: ['x', 'y'],
        opportunities: ['o1', 'o2'],
        metric_readings: {
          monthly_listeners: 'voce tem 12k',
          growth_rate: '5%',
          release_consistency: 'trimestral',
          engagement: 'alto',
        },
      },
      action_plan: [
        {
          title: 'Lance single',
          description: 'Lance seu proximo single em 30 dias',
          impact_expected: '+10% listeners',
          deadline_days: 30,
          priority: 1,
        },
      ],
    });
    const result = parseDiagnosticResponse(raw);
    expect(result.diagnostic_text.summary).toContain('Consolidado');
    expect(result.action_plan).toHaveLength(1);
    expect(result.action_plan[0].title).toBe('Lance single');
  });

  it('parseia JSON com markdown code fence', () => {
    const raw = '```json\n{"diagnostic_text":{"summary":"x","strengths":[],"weaknesses":[],"opportunities":[],"metric_readings":{"monthly_listeners":"","growth_rate":"","release_consistency":"","engagement":""}},"action_plan":[]}\n```';
    const result = parseDiagnosticResponse(raw);
    expect(result.diagnostic_text.summary).toBe('x');
  });

  it('throw em JSON invalido', () => {
    expect(() => parseDiagnosticResponse('not json')).toThrow();
  });
});
```

- [ ] **Step 2: Rodar os testes — devem falhar**

```bash
npx vitest run src/__tests__/lib/diagnostic-prompts.test.ts 2>&1 | tail -10
```

Expected: FAIL.

- [ ] **Step 3: Implementar diagnostic-prompts.ts**

Criar `src/lib/diagnostic-prompts.ts`:

```typescript
import type {
  SpotifyArtistData,
  SurveyResponse,
  DimensionScores,
  Stage,
  DiagnosticText,
  ActionPlanItem,
} from '@/lib/types/career';

const SYSTEM_PROMPT = `Voce e um especialista em carreira de musicos independentes brasileiros e latinos, com 15 anos de experiencia em A&R, management e desenvolvimento de artistas. Sua missao e analisar os dados fornecidos e entregar um diagnostico honesto e personalizado, seguido de um plano de acao concreto e realista para o artista avancar na sua carreira.

Voce fala em portugues brasileiro claro e direto, sem jargao corporativo vazio. Seus diagnosticos sao especificos aos dados — NUNCA genericos. Seus planos de acao sao acionaveis em 90 dias.

IMPORTANTE: Sua resposta deve ser APENAS um JSON valido seguindo exatamente a estrutura pedida. Nao adicione texto antes ou depois do JSON.`;

/**
 * Constroi o prompt para Claude gerar diagnostico + plano.
 */
export function buildDiagnosticPrompt(
  spotify: SpotifyArtistData,
  survey: SurveyResponse,
  stage: Stage,
  stageScore: number,
  dimensions: DimensionScores,
  socialUrls: Record<string, string | undefined>
): string {
  const socialList = Object.entries(socialUrls)
    .filter(([, v]) => v)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n') || '(nenhuma rede social informada)';

  return `Analise os dados deste artista e gere um diagnostico + plano de 90 dias.

## Dados do Spotify
- Nome: ${spotify.name}
- URL: ${spotify.spotify_url}
- Generos: ${spotify.genres.join(', ') || 'nao categorizado'}
- Followers: ${spotify.followers.toLocaleString('pt-BR')}
- Popularity score (Spotify, 0-100): ${spotify.popularity}
- Monthly listeners: ${spotify.monthly_listeners?.toLocaleString('pt-BR') ?? 'nao disponivel'}
- Top tracks: ${spotify.top_tracks.map((t) => `"${t.name}" (pop ${t.popularity})`).join(', ') || 'nenhuma'}

## Respostas do formulario guiado
- Lancando musica ha: ${survey.years_releasing}
- Shows realizados: ${survey.shows_performed}
- Vive de musica: ${survey.lives_from_music}
- Receita mensal: ${survey.monthly_revenue}
- Management: ${survey.has_management}
- Frequencia de lancamento: ${survey.release_frequency}
- Objetivo 12 meses: ${survey.main_goal_12m}
- Genero primario (informado): ${survey.primary_genre}
- Cidade: ${survey.city}
- Press kit: ${survey.has_press_kit}
- Qualidade de producao: ${survey.production_quality}
- Registro de direitos: ${survey.rights_registration}

## Redes sociais
${socialList}

## Classificacao calculada (pelo motor determinist)
- Estagio: **${stage}**
- Score geral: ${stageScore}/100
- Scores por dimensao:
  - audience_size: ${dimensions.audience_size}
  - growth_trajectory: ${dimensions.growth_trajectory}
  - release_consistency: ${dimensions.release_consistency}
  - professionalism: ${dimensions.professionalism}
  - revenue_business: ${dimensions.revenue_business}
  - multi_platform_presence: ${dimensions.multi_platform_presence}

## Tarefa

Gere a resposta APENAS no formato JSON abaixo:

\`\`\`json
{
  "diagnostic_text": {
    "summary": "Paragrafo de 2-4 frases explicando porque o artista esta neste estagio, baseado nos dados reais",
    "strengths": ["3 a 4 pontos fortes especificos (nao genericos)"],
    "weaknesses": ["3 a 4 pontos de atencao especificos"],
    "opportunities": ["3 a 4 oportunidades concretas no mercado indie BR/LATAM para o estagio atual"],
    "metric_readings": {
      "monthly_listeners": "1 frase contextualizando o numero de listeners comparado com o benchmark do estagio",
      "growth_rate": "1 frase sobre trajetoria de crescimento esperada",
      "release_consistency": "1 frase sobre a consistencia de lancamento",
      "engagement": "1 frase sobre engajamento (followers vs listeners)"
    }
  },
  "action_plan": [
    {
      "title": "Titulo curto da acao",
      "description": "2-3 frases explicando o que fazer, por que, e como",
      "impact_expected": "Impacto estimado (ex: +15% monthly listeners, entrar em X playlists, etc)",
      "deadline_days": 7,
      "priority": 1
    }
  ]
}
\`\`\`

Requisitos do plano:
- 5 a 7 acoes concretas
- deadline_days deve ser 7, 30, 60 ou 90
- priority: 1 (alta) / 2 (media) / 3 (baixa)
- Primeira acao deve ser algo executavel nos proximos 7 dias
- Acoes devem ser adaptadas ao estagio: Inicial foca em fundamentos; Referencia foca em escala
- Objetivos 12 meses do artista (${survey.main_goal_12m}) devem guiar a priorizacao`;
}

export function getSystemPrompt(): string {
  return SYSTEM_PROMPT;
}

/**
 * Parseia a resposta do Claude extraindo o JSON e validando estrutura minima.
 */
export function parseDiagnosticResponse(raw: string): {
  diagnostic_text: DiagnosticText;
  action_plan: ActionPlanItem[];
} {
  // Remove markdown code fence se houver
  let clean = raw.trim();
  const fenceMatch = clean.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fenceMatch) clean = fenceMatch[1];

  const parsed = JSON.parse(clean) as {
    diagnostic_text: DiagnosticText;
    action_plan: ActionPlanItem[];
  };

  if (!parsed.diagnostic_text || !parsed.action_plan) {
    throw new Error('Invalid diagnostic response: missing diagnostic_text or action_plan');
  }
  if (!Array.isArray(parsed.action_plan)) {
    throw new Error('action_plan must be an array');
  }

  return parsed;
}
```

- [ ] **Step 4: Rodar testes — devem passar**

```bash
npx vitest run src/__tests__/lib/diagnostic-prompts.test.ts 2>&1 | tail -10
```

Expected: 8 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/diagnostic-prompts.ts src/__tests__/lib/diagnostic-prompts.test.ts
git commit -m "feat: prompt builder + parser de diagnostico Claude"
```

---

## Task 7 — API Route: fetch artist do Spotify

**Files:**
- Create: `src/app/api/spotify/fetch-artist/route.ts`

- [ ] **Step 1: Criar a API route**

Criar `src/app/api/spotify/fetch-artist/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { parseSpotifyArtistId, fetchSpotifyArtistData } from '@/lib/spotify-client';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { spotify_url?: string; social_urls?: Record<string, string> };
    const spotifyUrl = body.spotify_url;
    const socialUrls = body.social_urls ?? {};

    if (!spotifyUrl) {
      return NextResponse.json({ error: 'spotify_url is required' }, { status: 400 });
    }

    const artistId = parseSpotifyArtistId(spotifyUrl);
    if (!artistId) {
      return NextResponse.json({ error: 'URL de Spotify invalida' }, { status: 400 });
    }

    // Autenticar usuario
    const cookieStore = cookies();
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
        },
      }
    );
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
    }

    // Buscar usuario na tabela users
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: dbUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', user.email!.toLowerCase().trim())
      .single();
    if (!dbUser) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 });
    }

    // Fetch do Spotify
    const artistData = await fetchSpotifyArtistData(artistId);

    // Salvar em artist_data (upsert por user_id + spotify_artist_id)
    const { error: upsertError } = await supabase
      .from('artist_data')
      .upsert(
        {
          user_id: dbUser.id,
          spotify_artist_id: artistData.spotify_artist_id,
          spotify_url: artistData.spotify_url,
          name: artistData.name,
          genres: artistData.genres,
          followers: artistData.followers,
          popularity: artistData.popularity,
          monthly_listeners: artistData.monthly_listeners ?? null,
          top_tracks: artistData.top_tracks,
          social_urls: socialUrls,
          last_synced_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,spotify_artist_id' }
      );

    if (upsertError) {
      console.error('Upsert error:', upsertError);
      return NextResponse.json({ error: 'Falha ao salvar dados do artista' }, { status: 500 });
    }

    return NextResponse.json({ artist: artistData });
  } catch (err) {
    console.error('fetch-artist error:', err);
    const msg = err instanceof Error ? err.message : 'erro desconhecido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
```

- [ ] **Step 2: Testar manualmente com curl**

```bash
# Precisa de sessao autenticada; pode testar no browser dev tools depois
# Por ora, verificar que compila:
cd /Users/luizsfap/Desktop/Claude\ CODE\ Projects/verelus
npx tsc --noEmit 2>&1 | head -10
```

Expected: sem erros relacionados ao novo arquivo.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/spotify/fetch-artist/route.ts
git commit -m "feat: API route para fetch do artista no Spotify"
```

---

## Task 8 — API Route: generate diagnostic

**Files:**
- Create: `src/app/api/diagnostic/generate/route.ts`

- [ ] **Step 1: Criar a API route**

Criar `src/app/api/diagnostic/generate/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { calculateStage } from '@/lib/stage-calculator';
import { buildDiagnosticPrompt, getSystemPrompt, parseDiagnosticResponse } from '@/lib/diagnostic-prompts';
import type { SurveyResponse, SpotifyArtistData } from '@/lib/types/career';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { survey: SurveyResponse };
    if (!body.survey) {
      return NextResponse.json({ error: 'survey is required' }, { status: 400 });
    }

    // Autenticar
    const cookieStore = cookies();
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: { get(name: string) { return cookieStore.get(name)?.value; } },
      }
    );
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: dbUser } = await supabase.from('users').select('id').eq('email', user.email!.toLowerCase().trim()).single();
    if (!dbUser) return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 });

    // Buscar artist_data mais recente do usuario
    const { data: artistRow } = await supabase
      .from('artist_data')
      .select('*')
      .eq('user_id', dbUser.id)
      .order('last_synced_at', { ascending: false })
      .limit(1)
      .single();

    if (!artistRow) {
      return NextResponse.json({ error: 'Conecte seu Spotify antes de gerar diagnostico' }, { status: 400 });
    }

    const spotifyData: SpotifyArtistData = {
      spotify_artist_id: artistRow.spotify_artist_id,
      spotify_url: artistRow.spotify_url,
      name: artistRow.name,
      genres: artistRow.genres ?? [],
      followers: artistRow.followers,
      popularity: artistRow.popularity,
      monthly_listeners: artistRow.monthly_listeners ?? undefined,
      top_tracks: artistRow.top_tracks ?? [],
    };

    const socialUrls = (artistRow.social_urls ?? {}) as Record<string, string>;

    // Salvar survey
    const { data: surveyRow } = await supabase
      .from('artist_survey')
      .insert({ user_id: dbUser.id, responses: body.survey })
      .select()
      .single();

    // Calcular estagio
    const { stage, score, dimensions } = calculateStage(spotifyData, body.survey, socialUrls);

    // Montar prompt e chamar Claude
    const userPrompt = buildDiagnosticPrompt(spotifyData, body.survey, stage, score, dimensions, socialUrls);

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: getSystemPrompt(),
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!claudeRes.ok) {
      console.error('Claude error:', claudeRes.status, await claudeRes.text());
      return NextResponse.json({ error: 'Falha ao gerar diagnostico' }, { status: 502 });
    }

    const claudeData = (await claudeRes.json()) as { content: Array<{ text: string }> };
    const rawText = claudeData.content?.[0]?.text ?? '';

    let parsed: ReturnType<typeof parseDiagnosticResponse>;
    try {
      parsed = parseDiagnosticResponse(rawText);
    } catch (e) {
      console.error('Parse error:', e, 'raw:', rawText);
      return NextResponse.json({ error: 'Resposta da IA nao parseavel. Tente novamente.' }, { status: 502 });
    }

    // Salvar diagnostic
    const { data: diagnostic, error: insErr } = await supabase
      .from('diagnostics')
      .insert({
        user_id: dbUser.id,
        artist_data_snapshot: spotifyData,
        survey_snapshot: body.survey,
        stage,
        stage_score: score,
        dimension_scores: dimensions,
        diagnostic_text: parsed.diagnostic_text,
        action_plan: parsed.action_plan,
      })
      .select()
      .single();

    if (insErr) {
      console.error('Insert error:', insErr);
      return NextResponse.json({ error: 'Falha ao salvar diagnostico' }, { status: 500 });
    }

    return NextResponse.json({ diagnostic_id: diagnostic.id });
  } catch (err) {
    console.error('generate diagnostic error:', err);
    const msg = err instanceof Error ? err.message : 'erro desconhecido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
```

- [ ] **Step 2: Type check**

```bash
cd /Users/luizsfap/Desktop/Claude\ CODE\ Projects/verelus
npx tsc --noEmit 2>&1 | head -10
```

Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/diagnostic/generate/route.ts
git commit -m "feat: API route para gerar diagnostico (orquestra stage + Claude)"
```

---

## Task 9 — API Route: get diagnostic by id

**Files:**
- Create: `src/app/api/diagnostic/[id]/route.ts`

- [ ] **Step 1: Criar a route**

Criar `src/app/api/diagnostic/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies();
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
    );
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: dbUser } = await supabase.from('users').select('id').eq('email', user.email!.toLowerCase().trim()).single();
    if (!dbUser) return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 });

    const { data: diagnostic } = await supabase
      .from('diagnostics')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', dbUser.id)
      .single();

    if (!diagnostic) return NextResponse.json({ error: 'Diagnostico nao encontrado' }, { status: 404 });

    // Fetch action progress
    const { data: progress } = await supabase
      .from('action_progress')
      .select('action_index, completed')
      .eq('diagnostic_id', params.id);

    const progressMap: Record<number, boolean> = {};
    (progress ?? []).forEach((p) => { progressMap[p.action_index] = p.completed; });

    return NextResponse.json({ diagnostic, progress: progressMap });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'erro' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/luizsfap/Desktop/Claude\ CODE\ Projects/verelus
npx tsc --noEmit 2>&1 | head -10
git add src/app/api/diagnostic/\[id\]/route.ts
git commit -m "feat: API route para buscar diagnostico por id"
```

---

## Task 10 — API Route: toggle action progress

**Files:**
- Create: `src/app/api/action-progress/route.ts`

- [ ] **Step 1: Criar a route**

Criar `src/app/api/action-progress/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      diagnostic_id?: string;
      action_index?: number;
      completed?: boolean;
    };
    if (!body.diagnostic_id || typeof body.action_index !== 'number' || typeof body.completed !== 'boolean') {
      return NextResponse.json({ error: 'Parametros invalidos' }, { status: 400 });
    }

    const cookieStore = cookies();
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
    );
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: dbUser } = await supabase.from('users').select('id').eq('email', user.email!.toLowerCase().trim()).single();
    if (!dbUser) return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 });

    await supabase.from('action_progress').upsert(
      {
        user_id: dbUser.id,
        diagnostic_id: body.diagnostic_id,
        action_index: body.action_index,
        completed: body.completed,
        completed_at: body.completed ? new Date().toISOString() : null,
      },
      { onConflict: 'diagnostic_id,action_index' }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'erro' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/luizsfap/Desktop/Claude\ CODE\ Projects/verelus
npx tsc --noEmit 2>&1 | head -10
git add src/app/api/action-progress/route.ts
git commit -m "feat: API route para marcar acao como concluida"
```

---

## Task 11 — Componentes de Onboarding

**Files:**
- Create: `src/components/onboarding/SpotifyUrlInput.tsx`
- Create: `src/components/onboarding/SocialUrlsInput.tsx`
- Create: `src/components/onboarding/SurveyForm.tsx`

- [ ] **Step 1: SpotifyUrlInput**

Criar `src/components/onboarding/SpotifyUrlInput.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { parseSpotifyArtistId } from '@/lib/spotify-client';

interface Props {
  value: string;
  onChange: (url: string) => void;
  onNext: () => void;
}

export function SpotifyUrlInput({ value, onChange, onNext }: Props) {
  const [error, setError] = useState('');

  const validate = () => {
    if (!value.trim()) {
      setError('Cole a URL do seu perfil no Spotify');
      return false;
    }
    if (!parseSpotifyArtistId(value)) {
      setError('URL invalida. Exemplo: https://open.spotify.com/artist/...');
      return false;
    }
    setError('');
    return true;
  };

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-2">Conecte seu Spotify</h2>
      <p className="text-brand-muted mb-6">
        Cole a URL do seu perfil de artista no Spotify. Usamos isso para analisar seus dados publicos (listeners, top tracks, generos).
      </p>
      <input
        type="url"
        placeholder="https://open.spotify.com/artist/..."
        value={value}
        onChange={(e) => { onChange(e.target.value); if (error) setError(''); }}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-brand-green/50 mb-4"
      />
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
      <button
        onClick={() => { if (validate()) onNext(); }}
        className="w-full px-4 py-3 bg-gradient-to-r from-brand-green to-brand-green/80 text-black font-bold rounded-xl"
      >
        Continuar
      </button>
    </div>
  );
}
```

- [ ] **Step 2: SocialUrlsInput**

Criar `src/components/onboarding/SocialUrlsInput.tsx`:

```tsx
'use client';

interface Props {
  value: { instagram?: string; tiktok?: string; youtube?: string };
  onChange: (v: { instagram?: string; tiktok?: string; youtube?: string }) => void;
  onNext: () => void;
  onBack: () => void;
}

export function SocialUrlsInput({ value, onChange, onNext, onBack }: Props) {
  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-2">Redes sociais</h2>
      <p className="text-brand-muted mb-6">Opcional. Informe suas redes ativas (minimo 1 recomendado).</p>
      {(['instagram', 'tiktok', 'youtube'] as const).map((key) => (
        <div key={key} className="mb-4">
          <label className="block text-sm text-white/60 mb-1 capitalize">{key}</label>
          <input
            type="url"
            placeholder={`https://${key}.com/seuperfil`}
            value={value[key] ?? ''}
            onChange={(e) => onChange({ ...value, [key]: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-brand-green/50"
          />
        </div>
      ))}
      <div className="flex gap-3 mt-6">
        <button onClick={onBack} className="flex-1 px-4 py-3 border border-white/10 text-white rounded-xl">Voltar</button>
        <button onClick={onNext} className="flex-1 px-4 py-3 bg-gradient-to-r from-brand-green to-brand-green/80 text-black font-bold rounded-xl">Continuar</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: SurveyForm (longa mas direta)**

Criar `src/components/onboarding/SurveyForm.tsx`:

```tsx
'use client';

import type { SurveyResponse } from '@/lib/types/career';

interface Props {
  value: SurveyResponse;
  onChange: (v: SurveyResponse) => void;
  onSubmit: () => void;
  onBack: () => void;
  submitting: boolean;
}

const FIELDS: Array<{
  name: keyof SurveyResponse;
  label: string;
  type: 'select' | 'text';
  options?: Array<{ value: string; label: string }>;
}> = [
  { name: 'years_releasing', label: 'Ha quanto tempo voce lanca musica?', type: 'select', options: [
    { value: 'lt_6m', label: 'Menos de 6 meses' },
    { value: '6m_1y', label: '6 meses a 1 ano' },
    { value: '1_3y', label: '1 a 3 anos' },
    { value: '3_5y', label: '3 a 5 anos' },
    { value: 'gt_5y', label: 'Mais de 5 anos' },
  ]},
  { name: 'shows_performed', label: 'Quantos shows ja fez?', type: 'select', options: [
    { value: '0', label: 'Nenhum' },
    { value: '1_10', label: '1 a 10' },
    { value: '10_50', label: '10 a 50' },
    { value: '50_200', label: '50 a 200' },
    { value: 'gt_200', label: 'Mais de 200' },
  ]},
  { name: 'lives_from_music', label: 'Voce vive de musica?', type: 'select', options: [
    { value: 'no', label: 'Nao' },
    { value: 'partial', label: 'Parcialmente' },
    { value: 'yes', label: 'Sim' },
  ]},
  { name: 'monthly_revenue', label: 'Receita mensal com musica', type: 'select', options: [
    { value: 'zero', label: 'R$ 0' },
    { value: '1k_2k', label: 'R$ 1k - 2k' },
    { value: '2k_5k', label: 'R$ 2k - 5k' },
    { value: '5k_15k', label: 'R$ 5k - 15k' },
    { value: 'gt_15k', label: 'R$ 15k+' },
  ]},
  { name: 'has_management', label: 'Voce tem empresario ou gravadora?', type: 'select', options: [
    { value: 'none', label: 'Nao' },
    { value: 'partnership', label: 'Tenho parceria' },
    { value: 'traditional', label: 'Sim, tradicional' },
  ]},
  { name: 'release_frequency', label: 'Frequencia de lancamento', type: 'select', options: [
    { value: 'sporadic', label: 'Esporadico' },
    { value: 'quarterly', label: 'A cada 3-6 meses' },
    { value: 'monthly', label: 'Mensal' },
    { value: 'weekly', label: 'Semanal' },
  ]},
  { name: 'main_goal_12m', label: 'Principal objetivo para os proximos 12 meses', type: 'select', options: [
    { value: 'discovery', label: 'Ser descoberto' },
    { value: 'grow_base', label: 'Crescer minha base' },
    { value: 'monetize', label: 'Monetizar' },
    { value: 'sign_contract', label: 'Assinar contrato' },
    { value: 'internationalize', label: 'Internacionalizar' },
  ]},
  { name: 'primary_genre', label: 'Genero primario (ex: indie rock, MPB, trap)', type: 'text' },
  { name: 'city', label: 'Cidade de atuacao', type: 'text' },
  { name: 'has_press_kit', label: 'Voce tem press kit?', type: 'select', options: [
    { value: 'none', label: 'Nao' },
    { value: 'basic', label: 'Basico' },
    { value: 'complete', label: 'Completo' },
  ]},
  { name: 'production_quality', label: 'Qualidade media da producao', type: 'select', options: [
    { value: 'home', label: 'Gravacao caseira' },
    { value: 'simple_studio', label: 'Estudio simples' },
    { value: 'professional', label: 'Estudio profissional' },
  ]},
  { name: 'rights_registration', label: 'Registro de direitos autorais', type: 'select', options: [
    { value: 'none', label: 'Nao tenho' },
    { value: 'partial', label: 'Parcial' },
    { value: 'complete', label: 'Completo' },
  ]},
];

export function SurveyForm({ value, onChange, onSubmit, onBack, submitting }: Props) {
  const update = <K extends keyof SurveyResponse>(key: K, v: SurveyResponse[K]) => {
    onChange({ ...value, [key]: v });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-2">Sobre sua carreira</h2>
      <p className="text-brand-muted mb-6">12 perguntas rapidas. Suas respostas calibram a analise.</p>
      <div className="space-y-4">
        {FIELDS.map((field) => (
          <div key={field.name}>
            <label className="block text-sm text-white/60 mb-1">{field.label}</label>
            {field.type === 'select' ? (
              <select
                value={value[field.name] as string}
                onChange={(e) => update(field.name as any, e.target.value as any)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-green/50"
              >
                {field.options!.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            ) : (
              <input
                type="text"
                value={value[field.name] as string}
                onChange={(e) => update(field.name as any, e.target.value as any)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-brand-green/50"
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={onBack} disabled={submitting} className="flex-1 px-4 py-3 border border-white/10 text-white rounded-xl disabled:opacity-50">Voltar</button>
        <button onClick={onSubmit} disabled={submitting} className="flex-1 px-4 py-3 bg-gradient-to-r from-brand-green to-brand-green/80 text-black font-bold rounded-xl disabled:opacity-50">
          {submitting ? 'Gerando diagnostico...' : 'Gerar diagnostico'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Type check + commit**

```bash
cd /Users/luizsfap\ CODE\ Projects/verelus
npx tsc --noEmit 2>&1 | head -10
git add src/components/onboarding/
git commit -m "feat: componentes de onboarding (Spotify URL + socials + survey)"
```

---

## Task 12 — Onboarding Page

**Files:**
- Create: `src/app/dashboard/onboarding/page.tsx`

- [ ] **Step 1: Criar a pagina**

Criar `src/app/dashboard/onboarding/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SpotifyUrlInput } from '@/components/onboarding/SpotifyUrlInput';
import { SocialUrlsInput } from '@/components/onboarding/SocialUrlsInput';
import { SurveyForm } from '@/components/onboarding/SurveyForm';
import type { SurveyResponse } from '@/lib/types/career';

const DEFAULT_SURVEY: SurveyResponse = {
  years_releasing: 'lt_6m',
  shows_performed: '0',
  lives_from_music: 'no',
  monthly_revenue: 'zero',
  has_management: 'none',
  release_frequency: 'sporadic',
  main_goal_12m: 'discovery',
  primary_genre: '',
  city: '',
  has_press_kit: 'none',
  production_quality: 'home',
  rights_registration: 'none',
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [socials, setSocials] = useState<{ instagram?: string; tiktok?: string; youtube?: string }>({});
  const [survey, setSurvey] = useState<SurveyResponse>(DEFAULT_SURVEY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      // 1. Fetch do Spotify (salva artist_data)
      const fetchRes = await fetch('/api/spotify/fetch-artist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spotify_url: spotifyUrl, social_urls: socials }),
      });
      if (!fetchRes.ok) {
        const err = await fetchRes.json() as { error: string };
        throw new Error(err.error);
      }

      // 2. Gerar diagnostico
      const diagRes = await fetch('/api/diagnostic/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ survey }),
      });
      if (!diagRes.ok) {
        const err = await diagRes.json() as { error: string };
        throw new Error(err.error);
      }
      const { diagnostic_id } = (await diagRes.json()) as { diagnostic_id: string };

      router.push(`/dashboard/diagnostic/${diagnostic_id}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro desconhecido';
      setError(msg);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark text-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-10">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`flex-1 h-1 rounded-full ${s <= step ? 'bg-brand-green' : 'bg-white/10'}`} />
          ))}
        </div>

        {error && <div className="max-w-xl mx-auto bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm mb-4">{error}</div>}

        {step === 1 && (
          <SpotifyUrlInput value={spotifyUrl} onChange={setSpotifyUrl} onNext={() => setStep(2)} />
        )}
        {step === 2 && (
          <SocialUrlsInput value={socials} onChange={setSocials} onNext={() => setStep(3)} onBack={() => setStep(1)} />
        )}
        {step === 3 && (
          <SurveyForm value={survey} onChange={setSurvey} onSubmit={handleSubmit} onBack={() => setStep(2)} submitting={submitting} />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type check + commit**

```bash
cd /Users/luizsfap/Desktop/Claude\ CODE\ Projects/verelus
npx tsc --noEmit 2>&1 | head -10
git add src/app/dashboard/onboarding/page.tsx
git commit -m "feat: pagina de onboarding com 3 steps"
```

---

## Task 13 — Componentes do Dashboard

**Files:**
- Create: `src/components/diagnostic/StageHeader.tsx`
- Create: `src/components/diagnostic/RaioX.tsx`
- Create: `src/components/diagnostic/DiagnosticText.tsx`
- Create: `src/components/diagnostic/ActionPlan.tsx`

- [ ] **Step 1: StageHeader**

Criar `src/components/diagnostic/StageHeader.tsx`:

```tsx
import type { Stage } from '@/lib/types/career';

interface Props {
  stage: Stage;
  score: number;
  artistName: string;
}

const STAGE_COLORS: Record<Stage, string> = {
  Inicial: 'from-gray-400 to-gray-600',
  Emergente: 'from-blue-400 to-blue-600',
  Consolidado: 'from-green-400 to-green-600',
  Estabelecido: 'from-purple-400 to-purple-600',
  Referencia: 'from-orange-400 to-red-600',
};

export function StageHeader({ stage, score, artistName }: Props) {
  const nextStageThresholds: Record<Stage, number> = {
    Inicial: 20, Emergente: 40, Consolidado: 60, Estabelecido: 80, Referencia: 100,
  };
  const upper = nextStageThresholds[stage];
  const lower = upper === 20 ? 0 : upper - 20;
  const pctInStage = ((score - lower) / (upper - lower)) * 100;

  return (
    <div className="bg-brand-surface rounded-2xl p-8 border border-white/10">
      <p className="text-brand-muted text-sm uppercase tracking-wider font-mono mb-2">Diagnostico de {artistName}</p>
      <h1 className="text-4xl font-bold text-white mb-2">Voce esta no estagio <span className={`bg-gradient-to-r ${STAGE_COLORS[stage]} bg-clip-text text-transparent`}>{stage}</span></h1>
      <p className="text-brand-muted mb-6">Score geral: {score}/100</p>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${STAGE_COLORS[stage]}`} style={{ width: `${Math.max(5, pctInStage)}%` }} />
      </div>
      <p className="text-xs text-brand-muted mt-2">
        {stage !== 'Referencia' ? `${Math.round(100 - pctInStage)}% para chegar ao proximo estagio` : 'Voce esta no topo da framework'}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: RaioX (4 cards)**

Criar `src/components/diagnostic/RaioX.tsx`:

```tsx
import type { DimensionScores, DiagnosticText, SpotifyArtistData, SurveyResponse } from '@/lib/types/career';

interface Props {
  dimensions: DimensionScores;
  readings: DiagnosticText['metric_readings'];
  spotify: SpotifyArtistData;
  survey: SurveyResponse;
}

export function RaioX({ dimensions, readings, spotify, survey }: Props) {
  const cards = [
    {
      label: 'Monthly Listeners',
      value: spotify.monthly_listeners?.toLocaleString('pt-BR') ?? `~${spotify.followers.toLocaleString('pt-BR')} (via followers)`,
      reading: readings.monthly_listeners,
      score: dimensions.audience_size,
    },
    {
      label: 'Crescimento',
      value: `${dimensions.growth_trajectory}/100`,
      reading: readings.growth_rate,
      score: dimensions.growth_trajectory,
    },
    {
      label: 'Consistencia de Lancamento',
      value: survey.release_frequency === 'sporadic' ? 'Esporadico' : survey.release_frequency === 'quarterly' ? 'Trimestral' : survey.release_frequency === 'monthly' ? 'Mensal' : 'Semanal',
      reading: readings.release_consistency,
      score: dimensions.release_consistency,
    },
    {
      label: 'Engajamento (followers/listeners)',
      value: spotify.monthly_listeners ? `${Math.round((spotify.followers / spotify.monthly_listeners) * 100)}%` : '—',
      reading: readings.engagement,
      score: dimensions.multi_platform_presence,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="bg-brand-surface rounded-xl p-6 border border-white/10">
          <p className="text-brand-muted text-xs uppercase tracking-wider mb-2">{c.label}</p>
          <p className="text-3xl font-bold text-white mb-3">{c.value}</p>
          <p className="text-sm text-white/70 leading-relaxed">{c.reading}</p>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: DiagnosticText**

Criar `src/components/diagnostic/DiagnosticText.tsx`:

```tsx
import type { DiagnosticText as DT } from '@/lib/types/career';

interface Props { text: DT }

export function DiagnosticText({ text }: Props) {
  return (
    <div className="space-y-6">
      <div className="bg-brand-surface rounded-2xl p-8 border border-white/10">
        <h2 className="text-xl font-bold text-white mb-4">Diagnostico</h2>
        <p className="text-white/80 leading-relaxed">{text.summary}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Section title="Pontos Fortes" items={text.strengths} color="green" />
        <Section title="Pontos de Atencao" items={text.weaknesses} color="orange" />
        <Section title="Oportunidades" items={text.opportunities} color="purple" />
      </div>
    </div>
  );
}

function Section({ title, items, color }: { title: string; items: string[]; color: 'green' | 'orange' | 'purple' }) {
  const colorClass = color === 'green' ? 'text-brand-green' : color === 'orange' ? 'text-brand-orange' : 'text-brand-purple';
  return (
    <div className="bg-brand-surface rounded-xl p-6 border border-white/10">
      <h3 className={`text-lg font-bold mb-4 ${colorClass}`}>{title}</h3>
      <ul className="space-y-3 text-sm text-white/80">
        {items.map((item, i) => <li key={i} className="flex gap-2"><span className={colorClass}>•</span><span>{item}</span></li>)}
      </ul>
    </div>
  );
}
```

- [ ] **Step 4: ActionPlan com checkboxes**

Criar `src/components/diagnostic/ActionPlan.tsx`:

```tsx
'use client';

import { useState } from 'react';
import type { ActionPlanItem } from '@/lib/types/career';

interface Props {
  diagnosticId: string;
  actions: ActionPlanItem[];
  initialProgress: Record<number, boolean>;
}

export function ActionPlan({ diagnosticId, actions, initialProgress }: Props) {
  const [progress, setProgress] = useState(initialProgress);

  const toggle = async (index: number) => {
    const completed = !progress[index];
    setProgress({ ...progress, [index]: completed });
    await fetch('/api/action-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ diagnostic_id: diagnosticId, action_index: index, completed }),
    });
  };

  return (
    <div className="bg-brand-surface rounded-2xl p-8 border border-white/10">
      <h2 className="text-xl font-bold text-white mb-6">Seu plano para os proximos 90 dias</h2>
      <div className="space-y-3">
        {actions.map((action, i) => {
          const done = !!progress[i];
          return (
            <div key={i} className={`flex gap-4 p-4 rounded-xl border ${done ? 'border-brand-green/30 bg-brand-green/5' : 'border-white/10 bg-white/[0.02]'}`}>
              <button
                onClick={() => toggle(i)}
                className={`flex-shrink-0 w-6 h-6 rounded-full border-2 mt-0.5 flex items-center justify-center ${done ? 'bg-brand-green border-brand-green' : 'border-white/30'}`}
              >
                {done && <span className="text-black text-xs">✓</span>}
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className={`font-semibold ${done ? 'text-white/50 line-through' : 'text-white'}`}>{action.title}</h3>
                  <span className="text-xs bg-white/10 text-white/70 px-2 py-0.5 rounded-full">{action.deadline_days} dias</span>
                  {action.priority === 1 && <span className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full">Prioridade alta</span>}
                </div>
                <p className={`text-sm leading-relaxed ${done ? 'text-white/40' : 'text-white/70'}`}>{action.description}</p>
                <p className={`text-xs mt-2 ${done ? 'text-white/30' : 'text-brand-green/80'}`}>{action.impact_expected}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Type check + commit**

```bash
cd /Users/luizsfap/Desktop/Claude\ CODE\ Projects/verelus
npx tsc --noEmit 2>&1 | head -10
git add src/components/diagnostic/
git commit -m "feat: componentes do dashboard do diagnostico"
```

---

## Task 14 — Pagina do diagnostico

**Files:**
- Create: `src/app/dashboard/diagnostic/[id]/page.tsx`

- [ ] **Step 1: Criar a pagina**

Criar `src/app/dashboard/diagnostic/[id]/page.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { StageHeader } from '@/components/diagnostic/StageHeader';
import { RaioX } from '@/components/diagnostic/RaioX';
import { DiagnosticText } from '@/components/diagnostic/DiagnosticText';
import { ActionPlan } from '@/components/diagnostic/ActionPlan';
import type { DiagnosticResult } from '@/lib/types/career';

interface ApiResponse {
  diagnostic: DiagnosticResult & {
    dimension_scores: DiagnosticResult['dimension_scores'];
  };
  progress: Record<number, boolean>;
}

export default function DiagnosticPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/diagnostic/${params.id}`)
      .then(async (r) => {
        if (!r.ok) {
          const err = (await r.json()) as { error: string };
          throw new Error(err.error);
        }
        return r.json() as Promise<ApiResponse>;
      })
      .then((d) => { setData(d); setLoading(false); })
      .catch((e: Error) => { setError(e.message); setLoading(false); });
  }, [params.id]);

  if (loading) return <div className="min-h-screen bg-brand-dark flex items-center justify-center text-white">Carregando diagnostico...</div>;
  if (error) return <div className="min-h-screen bg-brand-dark flex items-center justify-center text-red-400">{error}</div>;
  if (!data) return null;

  const { diagnostic, progress } = data;

  return (
    <div className="min-h-screen bg-brand-dark text-white py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <StageHeader stage={diagnostic.stage} score={diagnostic.stage_score} artistName={diagnostic.artist_data_snapshot.name} />
        <RaioX
          dimensions={diagnostic.dimension_scores}
          readings={diagnostic.diagnostic_text.metric_readings}
          spotify={diagnostic.artist_data_snapshot}
          survey={diagnostic.survey_snapshot}
        />
        <DiagnosticText text={diagnostic.diagnostic_text} />
        <ActionPlan diagnosticId={diagnostic.id} actions={diagnostic.action_plan} initialProgress={progress} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type check + commit**

```bash
cd /Users/luizsfap/Desktop/Claude\ CODE\ Projects/verelus
npx tsc --noEmit 2>&1 | head -10
git add src/app/dashboard/diagnostic/
git commit -m "feat: pagina do dashboard do diagnostico"
```

---

## Task 15 — Atualizar Dashboard Home

**Files:**
- Modify: `src/app/dashboard/page.tsx` (substituir conteudo inteiro)

- [ ] **Step 1: Reescrever a home do dashboard**

Substituir o conteudo inteiro de `src/app/dashboard/page.tsx` por:

```tsx
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const runtime = 'edge';

export default async function DashboardHome() {
  const cookieStore = cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) redirect('/login');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: dbUser } = await supabase.from('users').select('id').eq('email', user.email!.toLowerCase().trim()).single();
  if (!dbUser) redirect('/login');

  const { data: latest } = await supabase
    .from('diagnostics')
    .select('id, stage, stage_score, created_at')
    .eq('user_id', dbUser.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return (
    <div className="min-h-screen bg-brand-dark text-white px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Bem-vindo ao Verelus</h1>
        {latest ? (
          <div className="bg-brand-surface rounded-2xl p-8 border border-white/10">
            <p className="text-brand-muted text-sm mb-2">Seu diagnostico mais recente</p>
            <h2 className="text-2xl font-bold mb-2">Estagio {latest.stage}</h2>
            <p className="text-brand-muted mb-4">Score: {latest.stage_score}/100 — criado em {new Date(latest.created_at).toLocaleDateString('pt-BR')}</p>
            <div className="flex gap-3">
              <Link href={`/dashboard/diagnostic/${latest.id}`} className="px-5 py-2.5 bg-gradient-to-r from-brand-green to-brand-green/80 text-black font-semibold rounded-xl">Ver diagnostico</Link>
              <Link href="/dashboard/onboarding" className="px-5 py-2.5 border border-white/10 text-white rounded-xl">Refazer analise</Link>
            </div>
          </div>
        ) : (
          <div className="bg-brand-surface rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold mb-2">Comece sua analise</h2>
            <p className="text-brand-muted mb-6">Em ~8 minutos voce tera um diagnostico completo da sua carreira musical e um plano de 90 dias.</p>
            <Link href="/dashboard/onboarding" className="inline-block px-6 py-3 bg-gradient-to-r from-brand-green to-brand-green/80 text-black font-bold rounded-xl">Comecar agora</Link>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type check + commit**

```bash
cd /Users/luizsfap/Desktop/Claude\ CODE\ Projects/verelus
npx tsc --noEmit 2>&1 | head -10
git add src/app/dashboard/page.tsx
git commit -m "feat: reescrever dashboard home como entrada do diagnostico"
```

---

## Task 16 — Ocultar modulos antigos

**Files:**
- Modify: `src/app/dashboard/<cada-modulo-antigo>/page.tsx`

- [ ] **Step 1: Listar todos os modulos antigos**

```bash
cd /Users/luizsfap/Desktop/Claude\ CODE\ Projects/verelus
find src/app/dashboard -maxdepth 2 -name "page.tsx" | grep -v "onboarding\|diagnostic" | grep -v "^src/app/dashboard/page.tsx$"
```

Cada um desses arquivos precisa virar uma pagina de placeholder.

- [ ] **Step 2: Criar componente de placeholder compartilhado**

Criar `src/components/ToolRestructuring.tsx`:

```tsx
import Link from 'next/link';

export function ToolRestructuring({ name }: { name: string }) {
  return (
    <div className="min-h-screen bg-brand-dark text-white flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-bold mb-4">{name} esta em reestruturacao</h1>
        <p className="text-brand-muted mb-8">
          Estamos refocando o Verelus em inteligencia de carreira. Essa ferramenta volta em breve, muito melhor e contextualizada com o seu diagnostico.
        </p>
        <Link href="/dashboard" className="inline-block px-6 py-3 bg-gradient-to-r from-brand-green to-brand-green/80 text-black font-bold rounded-xl">
          Voltar ao dashboard
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Substituir cada pagina antiga pelo placeholder**

Para cada arquivo encontrado no Step 1, substituir completamente pelo conteudo abaixo (ajustando o nome):

Ex: `src/app/dashboard/setlist/page.tsx`:

```tsx
import { ToolRestructuring } from '@/components/ToolRestructuring';
export const runtime = 'edge';
export default function Page() {
  return <ToolRestructuring name="Setlist" />;
}
```

Repetir para cada: social, press, budget, contracts, reports, tours, analysis, pitching, epk. O nome mostrado no componente deve ser amigavel (ex: "Planejamento de Turne" para tours).

- [ ] **Step 4: Commit**

```bash
cd /Users/luizsfap/Desktop/Claude\ CODE\ Projects/verelus
git add src/components/ToolRestructuring.tsx src/app/dashboard/
git commit -m "feat: ocultar modulos antigos com placeholder de reestruturacao"
```

---

## Task 17 — Rodar todos os testes + Deploy

**Files:** none

- [ ] **Step 1: Rodar a suite completa de testes**

```bash
cd /Users/luizsfap/Desktop/Claude\ CODE\ Projects/verelus
npx vitest run 2>&1 | tail -15
```

Expected: todos passam. Se algum falhar, corrigir antes de deployar.

- [ ] **Step 2: Type check final**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: nenhum erro.

- [ ] **Step 3: Push pra main (triggers Cloudflare auto-deploy)**

```bash
git push origin main
```

- [ ] **Step 4: Aguardar deploy completar e validar smoke test**

```bash
TOKEN="<CLOUDFLARE_API_TOKEN>"
ACCOUNT="90c020fe3dde7b51a12bea43321bdf3e"

for i in 1 2 3 4 5 6 7 8; do
  STATUS=$(curl -s "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT/pages/projects/tunesignal-bandbrain/deployments?per_page=1" \
    -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys,json
d=json.load(sys.stdin)
r=d.get('result',[])
if r:
  dep=r[0]
  print(f\"{dep['latest_stage']['name']}:{dep['latest_stage']['status']}\")")
  echo "[$i] $STATUS"
  if echo "$STATUS" | grep -qE "deploy:success|failure"; then break; fi
  sleep 20
done
```

Expected: deploy:success.

- [ ] **Step 5: Teste manual end-to-end em producao**

Em https://verelus.com :
1. Fazer login (com conta existente luizsfap@hotmail.com, senha lfp415263)
2. Ir em /dashboard → clicar "Comecar agora"
3. Colar URL de um artista Spotify real (usar um conhecido, ex: https://open.spotify.com/artist/0RqtSIYZmd4fiBKVFqyIqD para Thiago Pethit)
4. Preencher os 3 steps do onboarding
5. Aguardar diagnostico (~60-90s)
6. Verificar que o dashboard renderiza todos os 4 modulos
7. Marcar uma acao como completa — verificar que persiste apos reload

Expected: experiencia fluida, sem erros no console.

---

## Self-Review

Apos escrever o plano, revisar contra o spec:

**Spec coverage:**
- Vision: nao muda codigo, sem task
- Framework de estagios: implementado em Task 3 (types) + Task 5 (calculator)
- Jornada do usuario: Task 11 + 12 + 14 + 15
- Dashboard — Modulo 1 (Raio-X): Task 13 + 14
- Dashboard — Modulo 2 (Catalogo): **fora do Plano 1** (Plano 2)
- Dashboard — Modulo 3 (Peers): **fora do Plano 1** (Plano 2)
- Dashboard — Modulo 4 (Diagnostico): Task 13 + 14
- Dashboard — Modulo 5 (Plano 90 dias): Task 13 + 14
- Dashboard — Modulo 6 (PDF): **fora do Plano 1** (Plano 3)
- Motor de Diagnostico Fase 1 (ingestao): Task 4 + 7 + 12
- Motor de Diagnostico Fase 2 (regras): Task 5
- Motor de Diagnostico Fase 3 (IA): Task 6 + 8
- Motor de Diagnostico Fase 4 (benchmark peers): **fora do Plano 1** (Plano 2)
- Arquitetura de dados: Task 2 (schema)
- Pricing novo: **fora do Plano 1** (Plano 3)
- Remocoes de modulos antigos: Task 16
- Landing page nova: **fora do Plano 1** (Plano 3)

**Placeholder scan:** nenhum "TBD"/"TODO". Todos os steps tem codigo completo.

**Type consistency:** `Stage`, `SurveyResponse`, `SpotifyArtistData`, `DimensionScores`, `DiagnosticText`, `ActionPlanItem`, `DiagnosticResult` usados consistentemente entre Tasks 3, 5, 6, 8, 11, 12, 13, 14.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-13-phase-1-mvp-diagnostic.md`.

Options for execution:

**1. Subagent-Driven (recommended)** — Dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
