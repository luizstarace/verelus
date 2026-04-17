# Fase 1 Quick Wins Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevar todas as 11 ferramentas do Verelus para 7/10+ via componentes UI compartilhados (Toast, HelpTooltip, PresetSelector, CharCounter) e conteudo explicativo centralizado.

**Architecture:** 4 novos componentes UI puros em `src/components/ui/`, biblioteca de conteudo estatico em `src/lib/tool-content.ts`, aplicacao consistente nos 11 Clients existentes. Toast via singleton hook. Sem mudancas de API backend.

**Tech Stack:** React 18 + Next.js 14 edge runtime + TailwindCSS. Testes com Vitest + @testing-library/react (ja instalados).

---

## File Structure

### Criar (novos)
- `src/components/ui/Toast.tsx` + `useToast.ts` — notificacoes nao-bloqueantes
- `src/components/ui/HelpTooltip.tsx` — icone `?` com explicacao
- `src/components/ui/PresetSelector.tsx` — botoes pra pre-preencher forms
- `src/components/ui/CharCounter.tsx` — contador com cores por threshold
- `src/lib/tool-content.ts` — HELP_TEXTS, CACHE_PRESETS, GOAL_BENCHMARKS, CLAUSE_HELP, RECIPIENT_PREVIEWS, PHASE_STRATEGY
- Testes: `Toast.test.tsx`, `HelpTooltip.test.tsx`, `CharCounter.test.tsx`, `tool-content.test.ts`

### Modificar
- `src/app/dashboard/layout.tsx` (ToastContainer)
- 11 Clients das ferramentas (detalhado em cada task)
- `src/components/rider/StagePlotEditor.tsx` (undo/redo + notes)

---

## Part 1: Foundation

### Task 1: Toast Component + Hook

**Files:**
- Create: `src/components/ui/Toast.tsx`
- Create: `src/lib/use-toast.ts`
- Test: `src/__tests__/components/Toast.test.tsx`

- [ ] **Step 1: Write the failing test**

Create directory first: `mkdir -p src/__tests__/components`

```tsx
// src/__tests__/components/Toast.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ToastContainer } from '@/components/ui/Toast';
import { useToast } from '@/lib/use-toast';

function Trigger({ msg }: { msg: string }) {
  const t = useToast();
  return <button onClick={() => t.success(msg)}>Fire</button>;
}

describe('Toast', () => {
  it('renders toast when triggered and auto-dismisses after 2s', async () => {
    vi.useFakeTimers();
    render(
      <>
        <ToastContainer />
        <Trigger msg="Copied!" />
      </>
    );
    act(() => { screen.getByText('Fire').click(); });
    expect(screen.getByText('Copied!')).toBeDefined();
    act(() => { vi.advanceTimersByTime(2100); });
    expect(screen.queryByText('Copied!')).toBeNull();
    vi.useRealTimers();
  });

  it('supports success, error, and info variants', () => {
    vi.useFakeTimers();
    const Multi = () => {
      const t = useToast();
      return (
        <>
          <button onClick={() => t.success('S')}>s</button>
          <button onClick={() => t.error('E')}>e</button>
          <button onClick={() => t.info('I')}>i</button>
        </>
      );
    };
    render(<><ToastContainer /><Multi /></>);
    act(() => { screen.getByText('s').click(); });
    act(() => { screen.getByText('e').click(); });
    act(() => { screen.getByText('i').click(); });
    expect(screen.getByText('S')).toBeDefined();
    expect(screen.getByText('E')).toBeDefined();
    expect(screen.getByText('I')).toBeDefined();
    vi.useRealTimers();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/components/Toast.test.tsx`
Expected: FAIL (modules not found)

- [ ] **Step 3: Implement useToast hook**

```tsx
// src/lib/use-toast.ts
'use client';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastEntry {
  id: string;
  variant: ToastVariant;
  message: string;
}

type Listener = (toasts: ToastEntry[]) => void;

let toasts: ToastEntry[] = [];
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l([...toasts]));
}

function push(variant: ToastVariant, message: string) {
  const id = Math.random().toString(36).slice(2, 10);
  toasts = [...toasts, { id, variant, message }];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, 2000);
}

export function useToast() {
  return {
    success: (m: string) => push('success', m),
    error: (m: string) => push('error', m),
    info: (m: string) => push('info', m),
  };
}

export function subscribeToasts(l: Listener): () => void {
  listeners.add(l);
  l([...toasts]);
  return () => { listeners.delete(l); };
}
```

- [ ] **Step 4: Implement Toast component**

```tsx
// src/components/ui/Toast.tsx
'use client';

import { useEffect, useState } from 'react';
import { subscribeToasts, type ToastEntry } from '@/lib/use-toast';

const VARIANT_CLASS: Record<ToastEntry['variant'], string> = {
  success: 'bg-brand-green/10 border-brand-green/30 text-brand-green',
  error: 'bg-red-500/10 border-red-500/30 text-red-300',
  info: 'bg-white/5 border-white/20 text-white',
};

export function ToastContainer() {
  const [items, setItems] = useState<ToastEntry[]>([]);

  useEffect(() => subscribeToasts(setItems), []);

  if (items.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {items.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`pointer-events-auto px-4 py-3 rounded-lg border text-sm shadow-lg backdrop-blur-sm animate-in ${VARIANT_CLASS[t.variant]}`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/__tests__/components/Toast.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/Toast.tsx src/lib/use-toast.ts src/__tests__/components/Toast.test.tsx
git commit -m "feat(ui): Toast component + useToast hook with auto-dismiss"
```

---

### Task 2: HelpTooltip Component

**Files:**
- Create: `src/components/ui/HelpTooltip.tsx`
- Test: `src/__tests__/components/HelpTooltip.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/__tests__/components/HelpTooltip.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HelpTooltip } from '@/components/ui/HelpTooltip';

describe('HelpTooltip', () => {
  it('hides content by default and shows on click', () => {
    render(<HelpTooltip content="Explanation here" />);
    expect(screen.queryByText('Explanation here')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /ajuda/i }));
    expect(screen.getByText('Explanation here')).toBeDefined();
  });

  it('closes when clicking outside', () => {
    render(
      <>
        <HelpTooltip content="Tip" />
        <div data-testid="outside">outside</div>
      </>
    );
    fireEvent.click(screen.getByRole('button', { name: /ajuda/i }));
    expect(screen.getByText('Tip')).toBeDefined();
    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(screen.queryByText('Tip')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/components/HelpTooltip.test.tsx`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement HelpTooltip**

```tsx
// src/components/ui/HelpTooltip.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  content: React.ReactNode;
  label?: string;
}

export function HelpTooltip({ content, label = 'Ajuda' }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <span ref={ref} className="inline-block relative align-middle">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={label}
        aria-expanded={open}
        className="w-4 h-4 rounded-full bg-white/10 text-white/60 text-[10px] font-bold leading-none inline-flex items-center justify-center hover:bg-white/20 hover:text-white transition-colors"
      >
        ?
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 max-w-[80vw] z-50 bg-brand-surface border border-white/10 rounded-lg p-3 text-xs text-white/90 leading-relaxed shadow-xl whitespace-normal"
          onClick={(e) => e.stopPropagation()}
        >
          {content}
        </span>
      )}
    </span>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/components/HelpTooltip.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/HelpTooltip.tsx src/__tests__/components/HelpTooltip.test.tsx
git commit -m "feat(ui): HelpTooltip component with click-outside-to-close"
```

---

### Task 3: CharCounter Component

**Files:**
- Create: `src/components/ui/CharCounter.tsx`
- Test: `src/__tests__/components/CharCounter.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/__tests__/components/CharCounter.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CharCounter } from '@/components/ui/CharCounter';

describe('CharCounter', () => {
  it('renders current/max', () => {
    render(<CharCounter current={50} max={100} />);
    expect(screen.getByText('50/100')).toBeDefined();
  });

  it('uses muted color below 80%', () => {
    const { container } = render(<CharCounter current={70} max={100} />);
    expect(container.querySelector('.text-brand-muted')).toBeDefined();
  });

  it('uses yellow color between 80-95%', () => {
    const { container } = render(<CharCounter current={85} max={100} />);
    expect(container.querySelector('.text-yellow-400')).toBeDefined();
  });

  it('uses orange color above 95%', () => {
    const { container } = render(<CharCounter current={97} max={100} />);
    expect(container.querySelector('.text-orange-400')).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/components/CharCounter.test.tsx`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement CharCounter**

```tsx
// src/components/ui/CharCounter.tsx
interface Props {
  current: number;
  max: number;
}

export function CharCounter({ current, max }: Props) {
  const pct = (current / max) * 100;
  const color = pct > 95 ? 'text-orange-400' : pct > 80 ? 'text-yellow-400' : 'text-brand-muted';
  return (
    <span className={`text-xs font-mono ${color}`}>
      {current}/{max}
    </span>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/components/CharCounter.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/CharCounter.tsx src/__tests__/components/CharCounter.test.tsx
git commit -m "feat(ui): CharCounter component with threshold-based colors"
```

---

### Task 4: PresetSelector Component

**Files:**
- Create: `src/components/ui/PresetSelector.tsx`

- [ ] **Step 1: Implement PresetSelector**

(Component e trivial o bastante que testes unitarios nao agregam — vamos testar via uso real nas ferramentas.)

```tsx
// src/components/ui/PresetSelector.tsx
'use client';

export interface Preset<T> {
  label: string;
  description?: string;
  values: T;
}

interface Props<T> {
  presets: Preset<T>[];
  onSelect: (values: T) => void;
  label?: string;
}

export function PresetSelector<T>({ presets, onSelect, label = 'Comecar com um preset' }: Props<T>) {
  return (
    <div>
      <p className="text-xs font-mono uppercase tracking-wider text-brand-muted mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {presets.map((p, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(p.values)}
            title={p.description}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/PresetSelector.tsx
git commit -m "feat(ui): PresetSelector component for form pre-fills"
```

---

### Task 5: Tool Content Library

**Files:**
- Create: `src/lib/tool-content.ts`
- Test: `src/__tests__/lib/tool-content.test.ts`

- [ ] **Step 1: Write the failing test**

```tsx
// src/__tests__/lib/tool-content.test.ts
import { describe, it, expect } from 'vitest';
import {
  HELP_TEXTS,
  CACHE_PRESETS,
  GOAL_BENCHMARKS,
  CLAUSE_HELP,
  RECIPIENT_PREVIEWS,
  PHASE_STRATEGY,
  TONE_DESCRIPTIONS,
} from '@/lib/tool-content';

describe('tool-content', () => {
  it('HELP_TEXTS has all required keys', () => {
    expect(HELP_TEXTS.cache).toBeDefined();
    expect(HELP_TEXTS.breakEven).toBeDefined();
    expect(HELP_TEXTS.exclusivity).toBeDefined();
    expect(HELP_TEXTS.pitchCurator).toBeDefined();
  });

  it('CACHE_PRESETS has at least 3 presets', () => {
    expect(CACHE_PRESETS.length).toBeGreaterThanOrEqual(3);
    expect(CACHE_PRESETS[0].label).toBeDefined();
    expect(CACHE_PRESETS[0].values).toBeDefined();
  });

  it('GOAL_BENCHMARKS covers all growth sources', () => {
    expect(GOAL_BENCHMARKS.spotify_listeners).toBeDefined();
    expect(GOAL_BENCHMARKS.youtube_subscribers).toBeDefined();
    expect(GOAL_BENCHMARKS.instagram_followers).toBeDefined();
    expect(GOAL_BENCHMARKS.tiktok_followers).toBeDefined();
  });

  it('CLAUSE_HELP entries have what/when fields', () => {
    const entries = Object.values(CLAUSE_HELP);
    expect(entries.length).toBeGreaterThan(0);
    entries.forEach((e) => {
      expect(e.what).toBeDefined();
      expect(e.when).toBeDefined();
    });
  });

  it('RECIPIENT_PREVIEWS covers playlist, radio, journalist', () => {
    expect(RECIPIENT_PREVIEWS.playlist_curator).toBeDefined();
    expect(RECIPIENT_PREVIEWS.journalist).toBeDefined();
  });

  it('PHASE_STRATEGY explains each content calendar phase', () => {
    expect(PHASE_STRATEGY.teaser).toBeDefined();
    expect(PHASE_STRATEGY.countdown).toBeDefined();
    expect(PHASE_STRATEGY.launch).toBeDefined();
  });

  it('TONE_DESCRIPTIONS covers all tone options', () => {
    expect(TONE_DESCRIPTIONS.formal).toBeDefined();
    expect(TONE_DESCRIPTIONS.casual).toBeDefined();
    expect(TONE_DESCRIPTIONS.poetico).toBeDefined();
    expect(TONE_DESCRIPTIONS.edgy).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/lib/tool-content.test.ts`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement tool-content.ts**

```tsx
// src/lib/tool-content.ts

export const HELP_TEXTS = {
  cache: 'Cache (cachê) e o valor garantido que o venue/contratante paga pro artista, independente de bilheteria. Cobre o trabalho e as despesas da apresentacao.',
  breakEven: 'Break-even e o ponto onde a receita iguala as despesas. Abaixo desse valor voce esta pagando pra tocar. Acima, entra lucro.',
  exclusivity: 'Clausula de exclusividade impede o artista de tocar as mesmas musicas em venues concorrentes num raio/periodo especifico. Usada em festivais exclusivos e shows especiais.',
  cancellation: 'Multa por cancelamento protege o artista se o venue cancelar o show. Tipicamente 50% do cache se cancelado com menos de 30 dias.',
  recordingRights: 'Define se o venue/contratante pode gravar/transmitir o show. Inclui audio, video, livestream, clipes pra TikTok/Instagram.',
  pitchCurator: 'Curador de playlist: foca em "encaixe" (mood, energia, genero). Pitch deve enfatizar streams recentes, crescimento, e qual playlist sua faixa se encaixa.',
  pitchJournalist: 'Jornalista: foca em "historia" (contexto, angulo, timing). Pitch deve enfatizar narrativa unica, conexao com tendencia atual, e quote acionavel.',
  pitchRadio: 'Radio/DJ: foca em "espaco no programa" (duracao, estrutura, limpo vs explicito). Pitch curto e direto, menciona duracao, disponibilidade de versao radio edit.',
  monthlyListeners: 'Ouvintes mensais unicos no Spotify (nao e igual a streams). E o indicador mais importante de alcance real — streams podem ser inflados por poucos fans.',
  playlistFit: 'Playlist fit: quanto sua musica "encaixa" no mood/energia/tempo da playlist. Editores analisam os 30 segundos iniciais — gancho e essencial.',
} as const;

export type HelpTextKey = keyof typeof HELP_TEXTS;

export const CACHE_PRESETS = [
  {
    label: 'Solo acustico',
    description: 'Voz + violao ou piano, sem banda',
    values: {
      band_size: 1,
      gear_transport_cost: 150,
      food_cost: 50,
      rehearsal_hours: 2,
      sound_tech_cost: 0,
    },
  },
  {
    label: 'Duo',
    description: '2 musicos, equipamento minimo',
    values: {
      band_size: 2,
      gear_transport_cost: 300,
      food_cost: 100,
      rehearsal_hours: 4,
      sound_tech_cost: 200,
    },
  },
  {
    label: 'Banda (5)',
    description: 'Banda completa com backline',
    values: {
      band_size: 5,
      gear_transport_cost: 800,
      food_cost: 250,
      rehearsal_hours: 8,
      sound_tech_cost: 500,
    },
  },
  {
    label: 'Producao full',
    description: '6+ musicos + tecnicos + logistica',
    values: {
      band_size: 7,
      gear_transport_cost: 1500,
      food_cost: 450,
      rehearsal_hours: 12,
      sound_tech_cost: 1000,
    },
  },
];

export const GOAL_BENCHMARKS: Record<string, { emerging: string; growing: string; established: string }> = {
  spotify_listeners: {
    emerging: '1-5k/mes em 6 meses (artista com <1k listeners hoje)',
    growing: '10-30k/mes em 6 meses (artista com 5-20k listeners hoje)',
    established: '50k-200k/mes em 6 meses (artista com 30k+ listeners hoje)',
  },
  youtube_subscribers: {
    emerging: '200-1k subs em 6 meses',
    growing: '2-5k subs em 6 meses',
    established: '10k+ subs em 6 meses',
  },
  instagram_followers: {
    emerging: '500-2k em 3 meses',
    growing: '3-8k em 3 meses',
    established: '10k+ em 3 meses',
  },
  tiktok_followers: {
    emerging: '1-5k em 3 meses (crescimento imprevisivel, depende de viral)',
    growing: '5-20k em 3 meses',
    established: '50k+ em 3 meses',
  },
};

export interface ClauseHelpEntry {
  what: string;
  when: string;
  example?: string;
}

export const CLAUSE_HELP: Record<string, ClauseHelpEntry> = {
  payment_schedule: {
    what: 'Define quando e como o pagamento e feito (sinal, dia do show, apos).',
    when: 'Sempre — e o ponto mais importante do contrato.',
    example: 'Padrao BR: 50% na assinatura, 50% no dia do show, ate 2h antes do soundcheck.',
  },
  cancellation: {
    what: 'Multa se o venue cancelar o show.',
    when: 'Todo contrato — protege seu trabalho investido em ensaios/logistica.',
    example: 'Cancelamento com menos de 30 dias: 50% do cache. Menos de 7 dias: 100%.',
  },
  recording: {
    what: 'Se o venue pode gravar/transmitir o show.',
    when: 'Festivais, venues com canal YouTube, qualquer casa que faca livestream.',
    example: 'Permito gravacao de audio pra uso interno. Video/livestream requer autorizacao previa escrita.',
  },
  exclusivity: {
    what: 'Impede tocar em venues concorrentes num raio/periodo.',
    when: 'Apenas pra festivais exclusivos ou shows especiais — evite em shows normais.',
    example: 'Nao tocar as mesmas musicas em venues num raio de 50km, 15 dias antes e depois.',
  },
  force_majeure: {
    what: 'Isenta as partes em caso de forca maior (pandemia, tempestade, guerra).',
    when: 'Sempre — e clausula padrao.',
  },
  rider_technical: {
    what: 'Lista os equipamentos/estrutura necessarios (PA, monitores, backline).',
    when: 'Qualquer show com banda ou equipamento especifico.',
    example: 'Ver rider tecnico anexo. PA minimo 2kW, 4 monitores, 8 canais de mesa.',
  },
};

export const RECIPIENT_PREVIEWS = {
  playlist_curator: {
    title: 'Pitch para curador de playlist',
    emphasis: [
      'Genero, mood e BPM (encaixe na playlist)',
      'Streams recentes e crescimento dos ultimos 30 dias',
      'Quais playlists similares voce esta',
      'Duracao do gancho (primeiros 15-30s)',
    ],
    avoid: 'Biografia longa. Eles escutam, nao leem.',
  },
  journalist: {
    title: 'Pitch para jornalista/imprensa',
    emphasis: [
      'Historia/angulo unico (por que AGORA?)',
      'Conexao com tendencia atual ou contexto',
      'Quote acionavel (algo citavel em 1 frase)',
      'Contexto do genero e cena',
    ],
    avoid: 'Release genericos ("lanca proximo single"). Precisa de angulo.',
  },
  radio: {
    title: 'Pitch para radio/DJ',
    emphasis: [
      'Duracao exata da faixa',
      'Versao radio-edit disponivel (se explicito)',
      'Estrutura (intro/verso/gancho)',
      'Data de disponibilidade',
    ],
    avoid: 'Historia longa. Va direto ao ponto.',
  },
  sync_licensing: {
    title: 'Pitch para licenciamento (sync)',
    emphasis: [
      'Mood, instrumentacao e energia',
      'Se ha versao instrumental disponivel',
      'Duracao e estrutura (beats de 15s, 30s)',
      'Status de publishing (auto-gerido vs editora)',
    ],
    avoid: 'Metricas de streaming (nao importam aqui).',
  },
} as const;

export type RecipientType = keyof typeof RECIPIENT_PREVIEWS;

export const PHASE_STRATEGY = {
  teaser: {
    title: 'Teaser (D-30 a D-22)',
    goal: 'Plantar curiosidade sem revelar muito. "Alguma coisa ta vindo."',
    tactics: 'Posts conceituais, bastidores crus, ambientacao visual. Evite audio.',
  },
  curiosity: {
    title: 'Construindo curiosidade (D-21 a D-14)',
    goal: 'Aprofundar interesse. Comecar a revelar pecas.',
    tactics: 'Bastidores do estudio, trechos de letra, processo criativo.',
  },
  preview: {
    title: 'Preview (D-13 a D-7)',
    goal: 'Revelar audio. Ativar pre-save.',
    tactics: 'Trechos de 15s, chamada explicita pra pre-save, contexto da faixa.',
  },
  countdown: {
    title: 'Countdown (D-6 a D-1)',
    goal: 'Gerar urgencia. Dia X.',
    tactics: 'Contagem regressiva, capa final, trechos maiores, stories diarios.',
  },
  launch: {
    title: 'Lancamento (D-0)',
    goal: 'Maximizar streams das primeiras 48h (algoritmos).',
    tactics: 'Anuncio coordenado em todas plataformas, thank you pros fans, link em todo lugar.',
  },
  post: {
    title: 'Pos-lancamento (D+1 a D+7)',
    goal: 'Manter momentum. Agradecer. Reagir.',
    tactics: 'Reacao aos comentarios, bastidores do lancamento, numeros alcancados, call pra playlists.',
  },
} as const;

export type PhaseKey = keyof typeof PHASE_STRATEGY;

export const TONE_DESCRIPTIONS = {
  formal: 'Profissional, editorial. Usa pra EPK, press releases, booking agents. Evita giria.',
  casual: 'Amigavel, proximo. Usa pra Instagram, dia-a-dia. Fala como se fosse um amigo.',
  poetico: 'Imagetico, metaforico. Usa pra artistas de MPB, folk, indie com peso literario.',
  edgy: 'Direto, com atitude. Usa pra punk, trap, rock pesado. Sem meias-palavras.',
} as const;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/lib/tool-content.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/tool-content.ts src/__tests__/lib/tool-content.test.ts
git commit -m "feat(content): tool-content library com HELP/PRESETS/BENCHMARKS/STRATEGY"
```

---

### Task 6: Wire ToastContainer into Dashboard Layout

**Files:**
- Modify: `src/app/dashboard/layout.tsx`

- [ ] **Step 1: Add ToastContainer import and render**

Read the file first, then add import at top and `<ToastContainer />` inside the `<ArtistProfileCtx.Provider>` block just before `<ChatWidget />`.

```tsx
// Add to imports at top:
import { ToastContainer } from '@/components/ui/Toast';

// In the JSX, replace the block ending with:
//     <ChatWidget />
//     </ArtistProfileCtx.Provider>
//     </UserTierContext.Provider>
// with:
//     <ChatWidget />
//     <ToastContainer />
//     </ArtistProfileCtx.Provider>
//     </UserTierContext.Provider>
```

- [ ] **Step 2: Verify TypeScript compiles and dev server renders**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/layout.tsx
git commit -m "feat(layout): wire ToastContainer into dashboard"
```

---

## Part 2: Apply to Each Tool

### Task 7: Bio Adaptativa

**Files:**
- Modify: `src/app/dashboard/bio/BioClient.tsx`

**Changes:**
1. Import `useToast`, `HelpTooltip`, `CharCounter`, `TONE_DESCRIPTIONS`
2. No `BioCard.copy()` use `toast.success('Bio copiada!')` instead of local `copied` state
3. In `BioCard` header, replace `<p className="text-xs ${charColor} ...">` with `<CharCounter current={charCount} max={limit} />`
4. Add `<HelpTooltip>` next to each tone button showing `TONE_DESCRIPTIONS[opt.value]`
5. Clarify label: `"Uma influencia nao-obvia que te inspira"` - improve `hint` prop to: `"Um artista, cineasta, autor, arquiteto — ALGUMA REFERENCIA fora do seu genero obvio. Ex: Wong Kar-wai, Clarice Lispector, Arvo Part, SAMO"`

- [ ] **Step 1: Read BioClient.tsx to find exact strings**

Run: `grep -n "const charColor\|const copy\|opt.value === input.tone\|hint=\"Um artista" src/app/dashboard/bio/BioClient.tsx`

- [ ] **Step 2: Apply edits**

Edit replacements:
- `import { BIO_CHAR_LIMITS } from '@/lib/types/tools';` → add line after: `import { useToast } from '@/lib/use-toast';\nimport { HelpTooltip } from '@/components/ui/HelpTooltip';\nimport { CharCounter } from '@/components/ui/CharCounter';\nimport { TONE_DESCRIPTIONS } from '@/lib/tool-content';`

- Replace the `BioCard` component's `copy` function to use `toast` hook:
  ```tsx
  // Remove: const [copied, setCopied] = useState(false);
  // Replace copy logic with:
  const toast = useToast();
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    toast.success(`Bio ${label} copiada!`);
  };
  // Button text stays 'copiar' (no more 'copiado!' state)
  ```

- Replace the `<p className={\`text-xs \${charColor}...\`}>{charCount}/{limit}...</p>` with:
  ```tsx
  <CharCounter current={charCount} max={limit} />
  ```
  (Remove the `pct` and `charColor` calculations — CharCounter handles it.)

- In the tone options grid, wrap the label in a span with HelpTooltip:
  ```tsx
  <div className="font-semibold text-sm flex items-center gap-1.5">
    {opt.label}
    <HelpTooltip content={TONE_DESCRIPTIONS[opt.value]} />
  </div>
  ```

- Update the hint prop for the "unusual_influence" field:
  ```tsx
  <Field label="Uma influencia nao-obvia que te inspira" required hint="Um artista, cineasta, autor, arquiteto — qualquer referencia fora do seu genero obvio. Ex: Wong Kar-wai, Clarice Lispector, Arvo Part">
  ```

- [ ] **Step 3: Verify typecheck + tests**

Run: `npx tsc --noEmit && npx vitest run`
Expected: 0 errors, all tests pass (>= 74 tests now)

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/bio/BioClient.tsx
git commit -m "feat(bio): Toast on copy, CharCounter, tone tooltips, better hints"
```

---

### Task 8: Calculadora de Cache

**Files:**
- Modify: `src/app/dashboard/cache-calculator/CacheClient.tsx`

**Changes:**
1. Import `HelpTooltip`, `PresetSelector`, `HELP_TEXTS`, `CACHE_PRESETS`
2. Add `<PresetSelector>` at top of form that pre-fills `band_size`, `gear_transport_cost`, `food_cost`, `rehearsal_hours`, `sound_tech_cost`
3. Add `<HelpTooltip content={HELP_TEXTS.cache}>` next to the page title/subtitle mentioning "cache"
4. Add city tier examples inline (SP/RJ/BH for Tier 1, capitais pra Tier 2)
5. Show break-even formula below the result

- [ ] **Step 1: Read CacheClient.tsx to find structure**

Run: `grep -n "band_size\|city_tier\|break.even\|BreakEven\|cost_breakdown\|const CITY" src/app/dashboard/cache-calculator/CacheClient.tsx | head -20`

- [ ] **Step 2: Apply edits**

- Add imports:
  ```tsx
  import { HelpTooltip } from '@/components/ui/HelpTooltip';
  import { PresetSelector } from '@/components/ui/PresetSelector';
  import { HELP_TEXTS, CACHE_PRESETS } from '@/lib/tool-content';
  ```

- Inside the main form card (before the first form field), add:
  ```tsx
  <PresetSelector
    presets={CACHE_PRESETS}
    onSelect={(v) => setInput({ ...input, ...v })}
    label="Preencher automaticamente"
  />
  ```
  (Place in the form container's top area, with `mb-5` separator.)

- Find where the city tier dropdown/selector is and add HelpTooltip or inline examples near its label:
  ```tsx
  <label>
    Tier da cidade
    <HelpTooltip content="Tier 1: SP, RJ, BH, POA, BSB. Tier 2: outras capitais. Tier 3: interior. Afeta o cache de referencia." />
  </label>
  ```

- Find the break-even result display and add the formula:
  ```tsx
  <details className="mt-2">
    <summary className="text-xs text-brand-muted cursor-pointer hover:text-white">Como calculamos?</summary>
    <p className="text-xs text-brand-muted mt-2 leading-relaxed">
      Break-even = (despesas totais) / (1 − margem de imposto). Acima desse valor, entra lucro liquido.
    </p>
  </details>
  ```

- [ ] **Step 3: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/cache-calculator/CacheClient.tsx
git commit -m "feat(cache): presets, help tooltips, break-even formula explanation"
```

---

### Task 9: Rider Tecnico (preview + undo/redo + notes)

**Files:**
- Modify: `src/components/rider/StagePlotEditor.tsx`
- Modify: `src/app/dashboard/rider/RiderClient.tsx`

**Changes:**
1. Add undo/redo to StagePlotEditor via history state
2. Add equipment notes popup (click item to edit label + notes)
3. Preview modal in RiderClient before PDF generation

- [ ] **Step 1: Read StagePlotEditor.tsx**

Run: `wc -l src/components/rider/StagePlotEditor.tsx` then read first 100 lines to understand state management

- [ ] **Step 2: Refactor StagePlotEditor to use history**

Modify the component:
- Add `const [history, setHistory] = useState<StageItem[][]>([items]);`
- Add `const [historyIndex, setHistoryIndex] = useState(0);`
- Create a wrapper: `const pushHistory = (next: StageItem[]) => { const newHistory = history.slice(0, historyIndex + 1).concat([next]); setHistory(newHistory); setHistoryIndex(newHistory.length - 1); onChange(next); };`
- Replace all `onChange(...)` calls inside mutation functions (addItem, removeItem, updateLabel, drag-end) with `pushHistory(...)`
- Add undo/redo buttons in the toolbar area:
  ```tsx
  <button
    onClick={() => { if (historyIndex > 0) { const i = historyIndex - 1; setHistoryIndex(i); onChange(history[i]); } }}
    disabled={historyIndex === 0}
    className="px-2 py-1 text-xs bg-white/5 hover:bg-white/10 text-white/70 rounded disabled:opacity-30"
  >
    Desfazer
  </button>
  <button
    onClick={() => { if (historyIndex < history.length - 1) { const i = historyIndex + 1; setHistoryIndex(i); onChange(history[i]); } }}
    disabled={historyIndex >= history.length - 1}
    className="px-2 py-1 text-xs bg-white/5 hover:bg-white/10 text-white/70 rounded disabled:opacity-30"
  >
    Refazer
  </button>
  ```

- [ ] **Step 3: Add preview modal in RiderClient**

Before the PDF generation button:
```tsx
const [showPreview, setShowPreview] = useState(false);

// Replace "Gerar PDF" button onClick to first show preview:
<button onClick={() => setShowPreview(true)}>Visualizar</button>

// Render preview modal that shows the stage plot SVG + rider summary.
{showPreview && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/70" onClick={() => setShowPreview(false)} />
    <div className="relative bg-brand-surface border border-white/10 rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
      <h3 className="text-lg font-bold mb-4">Preview do Rider</h3>
      {/* Reuse StagePlotEditor in read-only mode, or inline svg */}
      <p className="text-sm text-brand-muted mb-4">Revise antes de gerar o PDF final.</p>
      <div className="flex gap-3 justify-end">
        <button onClick={() => setShowPreview(false)} className="px-4 py-2 border border-white/10 text-white/60 rounded-lg">Voltar e editar</button>
        <button onClick={() => { setShowPreview(false); generatePdf(); }} className="px-4 py-2 bg-brand-green text-black rounded-lg font-bold">Gerar PDF agora</button>
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 4: Verify typecheck + tests**

Run: `npx tsc --noEmit && npx vitest run`
Expected: 0 errors

- [ ] **Step 5: Commit**

```bash
git add src/components/rider/StagePlotEditor.tsx src/app/dashboard/rider/RiderClient.tsx
git commit -m "feat(rider): undo/redo, preview modal before PDF generation"
```

---

### Task 10: Contrato de Show

**Files:**
- Modify: `src/app/dashboard/contract/ContractClient.tsx`

**Changes:**
1. Add HelpTooltip next to each clause in the "Clauses" step with content from CLAUSE_HELP
2. Add "Visualizar contrato" button before final PDF generation (modal showing formatted preview)
3. Toggles to enable/disable optional clauses (exclusividade, gravacao)

- [ ] **Step 1: Read ContractClient.tsx for clause structure**

Run: `grep -n "exclusivity\|recording\|cancellation\|clause\|clausula" src/app/dashboard/contract/ContractClient.tsx | head -20`

- [ ] **Step 2: Import and apply**

- Add imports:
  ```tsx
  import { HelpTooltip } from '@/components/ui/HelpTooltip';
  import { CLAUSE_HELP } from '@/lib/tool-content';
  ```

- In the "Clauses" step, next to each clause toggle/label, add:
  ```tsx
  <label className="flex items-center gap-2">
    <span>Clausula de cancelamento</span>
    <HelpTooltip content={<><strong>{CLAUSE_HELP.cancellation.what}</strong><br/><span className="text-brand-muted">Quando usar: {CLAUSE_HELP.cancellation.when}</span>{CLAUSE_HELP.cancellation.example && <><br/><em className="text-brand-muted">Ex: {CLAUSE_HELP.cancellation.example}</em></>}</>} />
  </label>
  ```
  (Apply analog pattern for all clauses: payment_schedule, cancellation, recording, exclusivity, force_majeure, rider_technical — use the corresponding CLAUSE_HELP key.)

- Add preview modal before the final "Gerar PDF" button:

```tsx
const [showPreview, setShowPreview] = useState(false);

// Replace the final "Gerar PDF" button's onClick to first show preview:
<button onClick={() => setShowPreview(true)}>Visualizar contrato</button>

{showPreview && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/70" onClick={() => setShowPreview(false)} />
    <div className="relative bg-brand-surface border border-white/10 rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
      <h3 className="text-lg font-bold mb-4">Preview do Contrato</h3>
      <p className="text-sm text-brand-muted mb-4">Revise os dados antes de gerar o PDF. Se algo estiver errado, volte e edite — depois do PDF gerado, alteracoes precisam de novo arquivo.</p>
      {/* Render a summary: partes, cache, data, clausulas ativas */}
      <div className="text-sm text-white/80 space-y-2 mb-4">
        <p><strong>Contratante:</strong> {form.contractor_name} · <strong>Artista:</strong> {form.artist_name}</p>
        <p><strong>Show:</strong> {form.show_date} — {form.venue_name}</p>
        <p><strong>Cache:</strong> R$ {form.total_cache}</p>
        <p><strong>Clausulas ativas:</strong> {Object.entries(form.clauses).filter(([, v]) => v).map(([k]) => k).join(', ')}</p>
      </div>
      <div className="flex gap-3 justify-end">
        <button onClick={() => setShowPreview(false)} className="px-4 py-2 border border-white/10 text-white/60 rounded-lg">Voltar e editar</button>
        <button onClick={() => { setShowPreview(false); generatePdf(); }} className="px-4 py-2 bg-brand-green text-black rounded-lg font-bold">Gerar PDF agora</button>
      </div>
    </div>
  </div>
)}
```
Adapt field names (contractor_name, show_date, etc.) to the actual fields in your form state.

- [ ] **Step 3: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/contract/ContractClient.tsx
git commit -m "feat(contract): clause help tooltips + preview modal"
```

---

### Task 11: Pitch Kit (recipient preview + toast)

**Files:**
- Modify: `src/app/dashboard/pitch-kit/PitchKitClient.tsx`

**Changes:**
1. Import `useToast`, `RECIPIENT_PREVIEWS`
2. Show recipient preview card when `form.recipient_type` is set (before submit)
3. Use Toast on all `copy` actions (replace local `copied` state if exists)

- [ ] **Step 1: Read PitchKitClient.tsx**

Run: `grep -n "recipient_type\|const copy\|setCopied" src/app/dashboard/pitch-kit/PitchKitClient.tsx | head -20`

- [ ] **Step 2: Add imports and preview card**

- Imports:
  ```tsx
  import { useToast } from '@/lib/use-toast';
  import { RECIPIENT_PREVIEWS, type RecipientType } from '@/lib/tool-content';
  ```

- Above the "Gerar Pitch Kit" submit button, render:
  ```tsx
  {form.recipient_type && RECIPIENT_PREVIEWS[form.recipient_type as RecipientType] && (
    <div className="bg-brand-green/5 rounded-xl p-4 border border-brand-green/20 mb-4">
      <p className="text-xs font-mono uppercase tracking-wider text-brand-green mb-2">
        Como vai ser a pitch
      </p>
      <h4 className="font-semibold text-white mb-2">{RECIPIENT_PREVIEWS[form.recipient_type as RecipientType].title}</h4>
      <p className="text-xs text-white/80 mb-1">Vai enfatizar:</p>
      <ul className="text-xs text-white/70 space-y-1 mb-2 list-disc list-inside">
        {RECIPIENT_PREVIEWS[form.recipient_type as RecipientType].emphasis.map((e, i) => <li key={i}>{e}</li>)}
      </ul>
      <p className="text-xs text-brand-muted">
        <strong>Evita:</strong> {RECIPIENT_PREVIEWS[form.recipient_type as RecipientType].avoid}
      </p>
    </div>
  )}
  ```

- Replace all `navigator.clipboard.writeText(...)` calls in copy buttons:
  ```tsx
  const toast = useToast();
  const copy = async (label: string, text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };
  ```
  Then use `copy('Subject', output.email_subject)`, `copy('Email', output.email_body)`, etc.

- [ ] **Step 3: Verify typecheck + tests**

Run: `npx tsc --noEmit && npx vitest run`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/pitch-kit/PitchKitClient.tsx
git commit -m "feat(pitch): recipient preview card + Toast on copy"
```

---

### Task 12: Release Timing

**Files:**
- Modify: `src/app/dashboard/release-timing/ReleaseTimingClient.tsx`

**Changes:**
1. Rename goal labels in the UI (keep backend values the same)
2. Highlight recommended dates in the calendar grid with green border/bg

- [ ] **Step 1: Read ReleaseTimingClient.tsx for goal labels + calendar grid**

Run: `grep -n "viral_hit\|steady_growth\|fan_release\|GOAL_OPTIONS\|suggested.*dates" src/app/dashboard/release-timing/ReleaseTimingClient.tsx | head -15`

- [ ] **Step 2: Apply label renames**

Find the goal options array (likely `GOAL_OPTIONS` or similar) and update labels while keeping `value` the same:
```tsx
const GOAL_OPTIONS = [
  { value: 'viral_hit', label: 'Entrar em playlists editoriais', hint: 'Algoritmos, adicionar em Release Radar, crescer streams rapido' },
  { value: 'steady_growth', label: 'Construir fanbase leal', hint: 'Crescimento organico, engajamento profundo, longo prazo' },
  { value: 'fan_release', label: 'Expandir territorio/alcance', hint: 'Chegar em novos mercados ou nichos' },
];
```

- [ ] **Step 3: Highlight recommended dates in calendar grid**

Find the calendar grid rendering (likely a `.map(...)` over Fridays). Check if the date is in the `result.dates` array and apply a highlight class:
```tsx
{weeks.map((friday) => {
  const isRecommended = result?.dates.some((d) => d.date === friday.toISOString().slice(0, 10));
  return (
    <div
      key={friday.toISOString()}
      className={`p-2 rounded text-xs text-center ${
        isRecommended
          ? 'bg-brand-green/20 border border-brand-green/40 text-brand-green font-bold'
          : 'bg-white/5 text-white/60'
      }`}
    >
      {friday.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
    </div>
  );
})}
```

(Adapt to whatever structure actually exists in the file.)

- [ ] **Step 4: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/release-timing/ReleaseTimingClient.tsx
git commit -m "feat(timing): rename goal labels, highlight recommended dates"
```

---

### Task 13: Launch Checklist

**Files:**
- Modify: `src/app/dashboard/launch-checklist/ChecklistClient.tsx`
- Modify: `src/lib/checklist-template.ts` (add `importance` field + `description` to items)

**Changes:**
1. Add `importance: 'critical' | 'important' | 'optional'` to each template item
2. Add `description?: string` with "why/how" text
3. Add tag rendering in ChecklistClient based on importance
4. Add cross-tool links where relevant (pitch items → open Pitch Kit)

- [ ] **Step 1: Read checklist-template.ts**

Run: `head -50 src/lib/checklist-template.ts && wc -l src/lib/checklist-template.ts`

- [ ] **Step 2: Extend the ChecklistItem type with importance and description**

In `src/lib/types/tools.ts` (or wherever `ChecklistItem` is defined), extend:
```tsx
export interface ChecklistItem {
  // existing fields...
  importance?: 'critical' | 'important' | 'optional';
  description?: string;
  link_tool?: string; // e.g., 'pitch-kit', 'content-calendar'
}
```

- [ ] **Step 3: Add metadata to at least 10 key template items**

Edit `src/lib/checklist-template.ts` and add `importance` + `description` + `link_tool` to important items. Example for pitch-related item:
```tsx
{
  title: 'Enviar pitches pra curadores de playlist',
  day_offset: -21,
  importance: 'critical',
  description: 'Playlists editoriais precisam receber pitch no minimo 2 semanas antes da release. Use o Pitch Kit pra gerar email profissional.',
  link_tool: 'pitch-kit',
}
```

Apply to at least: pitch envio, anunciar data, pre-save link, capa/art, masterizacao, rider, contratos com venues, press release, content calendar posts.

- [ ] **Step 4: Render tags and links in ChecklistClient**

In the item rendering, add:
```tsx
{item.importance === 'critical' && (
  <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-300">
    critico
  </span>
)}
{item.importance === 'important' && (
  <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300">
    importante
  </span>
)}

{item.description && (
  <p className="text-xs text-brand-muted mt-1 leading-relaxed">{item.description}</p>
)}

{item.link_tool && (
  <a
    href={`/dashboard/${item.link_tool}`}
    className="text-xs text-brand-orange hover:text-brand-orange/80 mt-1 inline-block"
  >
    Abrir {item.link_tool.replace('-', ' ')} →
  </a>
)}
```

- [ ] **Step 5: Verify typecheck + tests**

Run: `npx tsc --noEmit && npx vitest run`
Expected: 0 errors

- [ ] **Step 6: Commit**

```bash
git add src/lib/types/tools.ts src/lib/checklist-template.ts src/app/dashboard/launch-checklist/ChecklistClient.tsx
git commit -m "feat(checklist): importance tags, descriptions, cross-tool links"
```

---

### Task 14: Growth Tracker

**Files:**
- Modify: `src/app/dashboard/growth/GrowthClient.tsx`

**Changes:**
1. Show "Atualize seu IG/TikTok" badge when last update for manual sources > 7 days
2. Toggle log/linear scale in the chart
3. Improve insight text (just a prompt change in `src/lib/growth-aggregator.ts` already-existing `generateWeeklyInsight`)

- [ ] **Step 1: Read GrowthClient.tsx to find last_updated**

Run: `grep -n "last_updated\|LineChart\|weekly_insight\|instagram\|tiktok" src/app/dashboard/growth/GrowthClient.tsx | head -15`

- [ ] **Step 2: Add stale badge**

In the card for each source (spotify/youtube/instagram/tiktok), check if source is manual (ig/tiktok) and last update > 7 days. Render warning badge:
```tsx
{(source === 'instagram' || source === 'tiktok') && (() => {
  const last = data.last_updated[source];
  if (!last) return null;
  const daysStale = Math.floor((Date.now() - new Date(last).getTime()) / 86400000);
  if (daysStale < 7) return null;
  return (
    <span className="text-[10px] text-yellow-400 font-mono uppercase bg-yellow-500/10 border border-yellow-500/30 px-1.5 py-0.5 rounded">
      atualizar ({daysStale}d)
    </span>
  );
})()}
```

- [ ] **Step 3: Add log scale toggle**

Add state `const [logScale, setLogScale] = useState(false);` in `GrowthClient`. Add a toggle above the chart:
```tsx
<button
  onClick={() => setLogScale(!logScale)}
  className="text-xs font-mono text-brand-muted hover:text-white"
>
  {logScale ? 'Escala linear' : 'Escala logaritmica'}
</button>
```

Pass `logScale` to `LineChart` as a prop and use `Math.log10(p.value + 1)` when `logScale` is true.

- [ ] **Step 4: Improve insight prompt (growth-aggregator.ts)**

Read `src/lib/growth-aggregator.ts` function `generateWeeklyInsight`. Update the user prompt to ask for a **diagnostic** tone instead of descriptive:

Change from something like "Resuma o crescimento da semana em 2 frases" to:
```tsx
`Analise o crescimento da semana de forma diagnostica. Em 2-3 frases:
1. Identifique o maior movimento (positivo ou negativo)
2. Sugira UMA hipotese do que pode ter causado (viral? colaboracao? estacao? algoritmo?)
3. Recomende UMA acao acionavel pra proxima semana

Nao seja generico. Nao diga "continue assim". Seja especifico.`
```

- [ ] **Step 5: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 6: Commit**

```bash
git add src/app/dashboard/growth/GrowthClient.tsx src/lib/growth-aggregator.ts
git commit -m "feat(growth): stale badge, log scale toggle, diagnostic insights"
```

---

### Task 15: Comparador de Concorrentes

**Files:**
- Modify: `src/app/dashboard/competitors/CompetitorsClient.tsx`

**Changes:**
1. Add help text in the "Adicionar competidor" form explaining who to pick
2. Add a "Crescimento/sem" column in the comparison table (calculated from snapshots)
3. Ensure the insight box (ja existente) e bom

- [ ] **Step 1: Read CompetitorsClient.tsx**

Run: `grep -n "Adicionar competidor\|display_name\|<th>\|<td>" src/app/dashboard/competitors/CompetitorsClient.tsx | head -15`

- [ ] **Step 2: Add help text**

In the "Adicionar competidor" form card, before the input fields, add:
```tsx
<div className="bg-white/5 rounded-lg p-3 border border-white/10 mb-2">
  <p className="text-xs text-white/80 leading-relaxed">
    <strong className="text-brand-orange">Dica:</strong> escolha artistas 2-5x seu tamanho no seu genero. Evite superestrelas — olhe pra quem chegou no proximo nivel que voce quer. 3-5 concorrentes bons &gt; 10 aleatorios.
  </p>
</div>
```

- [ ] **Step 3: Add "Crescimento/sem" column**

Calculate weekly growth for each competitor from their `history` array:
```tsx
function calcWeeklyGrowth(history: Array<{ date: string; spotify?: number }>): number | null {
  if (history.length < 2) return null;
  const sorted = history.filter((h) => h.spotify !== undefined).slice(-4); // last 4 snapshots
  if (sorted.length < 2) return null;
  const first = sorted[0].spotify as number;
  const last = sorted[sorted.length - 1].spotify as number;
  const daysDiff = (new Date(sorted[sorted.length - 1].date).getTime() - new Date(sorted[0].date).getTime()) / 86400000;
  if (daysDiff < 1) return null;
  return Math.round((last - first) / (daysDiff / 7));
}
```

Add a column in the table header: `<th>Crescimento Spotify/sem</th>` and cell rendering with `calcWeeklyGrowth(c.history)` result formatted as `+X/sem` in green or `-X/sem` in red.

- [ ] **Step 4: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/competitors/CompetitorsClient.tsx
git commit -m "feat(competitors): selection help, weekly growth column"
```

---

### Task 16: Meta Tracker

**Files:**
- Modify: `src/app/dashboard/goals/GoalsClient.tsx`

**Changes:**
1. Show PresetSelector with common goals
2. Show benchmark text above the "Create goal" form
3. Add HelpTooltip explaining status thresholds

- [ ] **Step 1: Apply edits**

- Add imports:
  ```tsx
  import { PresetSelector } from '@/components/ui/PresetSelector';
  import { HelpTooltip } from '@/components/ui/HelpTooltip';
  import { GOAL_BENCHMARKS } from '@/lib/tool-content';
  ```

- Define presets (above component or inside):
  ```tsx
  const GOAL_PRESETS = [
    { label: '5k ouvintes Spotify', values: { metric: 'spotify_listeners' as const, target_value: 5000, title: '5k ouvintes mensais em 6 meses' } },
    { label: '10k ouvintes Spotify', values: { metric: 'spotify_listeners' as const, target_value: 10000, title: '10k ouvintes mensais em 6 meses' } },
    { label: '1k subs YouTube', values: { metric: 'youtube_subscribers' as const, target_value: 1000, title: '1k inscritos YouTube em 6 meses' } },
    { label: '5k seguidores IG', values: { metric: 'instagram_followers' as const, target_value: 5000, title: '5k seguidores Instagram em 3 meses' } },
  ];
  ```

- In the "Criar meta" form (inside `showAdd` block), after the title, add:
  ```tsx
  <PresetSelector
    presets={GOAL_PRESETS}
    onSelect={(v) => setForm((f) => ({
      ...f,
      ...v,
      target_date: (() => { const d = new Date(); d.setMonth(d.getMonth() + (v.metric === 'instagram_followers' || v.metric === 'tiktok_followers' ? 3 : 6)); return d.toISOString().slice(0, 10); })(),
    }))}
    label="Metas comuns (pre-preencher)"
  />
  ```

- Below the form title, add benchmark info for the current selected metric:
  ```tsx
  {GOAL_BENCHMARKS[form.metric] && (
    <div className="bg-white/5 rounded-lg p-3 border border-white/10 text-xs leading-relaxed mb-2">
      <p className="font-semibold text-white/90 mb-1">Benchmarks pra referencia:</p>
      <p className="text-brand-muted">Emergente: {GOAL_BENCHMARKS[form.metric].emerging}</p>
      <p className="text-brand-muted">Em crescimento: {GOAL_BENCHMARKS[form.metric].growing}</p>
      <p className="text-brand-muted">Estabelecido: {GOAL_BENCHMARKS[form.metric].established}</p>
    </div>
  )}
  ```

- On the "status" badge in each goal card, add HelpTooltip:
  ```tsx
  <span className="flex items-center gap-1">
    {statusLabel(gp.status)}
    <HelpTooltip content="Status calculado comparando ritmo atual (ultimas 4 semanas) com ritmo necessario para bater a meta. On track = 80%+ do necessario. Apertado = 50-80%. Atrasado = <50%." />
  </span>
  ```

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/goals/GoalsClient.tsx
git commit -m "feat(goals): presets, benchmarks, status threshold tooltip"
```

---

### Task 17: Cronograma de Posts

**Files:**
- Modify: `src/app/dashboard/content-calendar/ContentCalendarClient.tsx`

**Changes:**
1. Allow editing captions inline (textarea) instead of fixed text — local state
2. Add collapsible card explaining each phase using PHASE_STRATEGY
3. Add window selector (15/30/60 days) — passes to backend via new form field

- [ ] **Step 1: Read ContentCalendarClient.tsx**

Run: `grep -n "caption_draft\|copyPost\|groupByPhase\|window_days" src/app/dashboard/content-calendar/ContentCalendarClient.tsx | head -15`

- [ ] **Step 2: Add imports and window selector**

- Imports:
  ```tsx
  import { useToast } from '@/lib/use-toast';
  import { PHASE_STRATEGY, type PhaseKey } from '@/lib/tool-content';
  ```

- Extend form state to include `window_days`:
  ```tsx
  const [form, setForm] = useState<ContentCalendarInput & { window_days: 15 | 30 | 60 }>({
    // ... existing fields
    window_days: 30,
  });
  ```

- Add window selector buttons next to the date field:
  ```tsx
  <Field label="Janela de posts">
    <div className="flex gap-2">
      {[15, 30, 60].map((w) => (
        <button
          key={w}
          type="button"
          onClick={() => setForm({ ...form, window_days: w as 15 | 30 | 60 })}
          className={`px-3 py-2 rounded-lg text-xs font-medium border ${
            form.window_days === w
              ? 'bg-brand-orange/20 text-brand-orange border-brand-orange/40'
              : 'bg-white/5 text-brand-muted border-white/10'
          }`}
        >
          {w} dias
        </button>
      ))}
    </div>
  </Field>
  ```

- [ ] **Step 3: Add inline caption editing**

Replace the `<p>` showing `p.caption_draft` with a textarea that has local state:
```tsx
const [editedCaptions, setEditedCaptions] = useState<Record<number, string>>({});

// In the post render:
<textarea
  value={editedCaptions[postIndex] ?? p.caption_draft}
  onChange={(e) => setEditedCaptions({ ...editedCaptions, [postIndex]: e.target.value })}
  rows={4}
  className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-sm text-white leading-relaxed resize-none focus:outline-none focus:border-brand-orange/40"
/>

// copyPost uses the edited version:
function copyPost(p: PostSuggestion, idx: number) {
  const caption = editedCaptions[idx] ?? p.caption_draft;
  const text = `${caption}\n\n${p.hashtags.map((h) => h.startsWith('#') ? h : `#${h}`).join(' ')}`;
  navigator.clipboard.writeText(text);
  toast.success('Post copiado!');
}
```

- [ ] **Step 4: Add phase strategy card**

Above the posts list (when `result` is set), add a collapsible card:
```tsx
<details className="bg-brand-surface rounded-xl p-4 border border-white/10 mb-4">
  <summary className="text-sm font-semibold text-white cursor-pointer">Por que essa estrategia de 30 dias funciona?</summary>
  <div className="mt-3 space-y-2 text-sm text-brand-muted leading-relaxed">
    {(Object.keys(PHASE_STRATEGY) as PhaseKey[]).map((key) => (
      <div key={key}>
        <p className="text-white font-semibold">{PHASE_STRATEGY[key].title}</p>
        <p className="text-xs">Meta: {PHASE_STRATEGY[key].goal}</p>
        <p className="text-xs">Tatica: {PHASE_STRATEGY[key].tactics}</p>
      </div>
    ))}
  </div>
</details>
```

- [ ] **Step 5: Verify typecheck + tests**

Run: `npx tsc --noEmit && npx vitest run`
Expected: 0 errors, all tests pass

- [ ] **Step 6: Commit**

```bash
git add src/app/dashboard/content-calendar/ContentCalendarClient.tsx
git commit -m "feat(calendar): window selector, inline caption editing, phase strategy card"
```

---

## Part 3: Final Verification

### Task 18: Full Verification and Push

- [ ] **Step 1: Run complete test suite**

Run: `npx tsc --noEmit && npx vitest run`
Expected: 0 TS errors, >= 78 tests passing (67 original + Toast 2 + HelpTooltip 2 + CharCounter 4 + tool-content 7 = 82)

- [ ] **Step 2: Manual smoke check of dashboard**

Run: `npx next dev -p 3333` in background.
Visit each tool page via curl:
```bash
for page in bio cache-calculator rider contract pitch-kit release-timing launch-checklist growth competitors goals content-calendar; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3333/dashboard/$page")
  echo "$code  /$page"
done
```
Expected: all 200

- [ ] **Step 3: Push to main**

```bash
git push origin main
```

Expected: Cloudflare Pages builds automatically in 2-5 min.

- [ ] **Step 4: Final commit (if any residue)**

Check: `git status`. If clean, done. If files modified, investigate.

---

## Summary

Apos este plano, teremos:
- 4 novos componentes UI (Toast, HelpTooltip, CharCounter, PresetSelector)
- Biblioteca centralizada de conteudo explicativo (tool-content.ts)
- 11 ferramentas polidas com Toast/HelpTooltip/PresetSelector onde relevante
- 82+ testes passando
- 0 erros TypeScript
- Cada ferramenta com clareza, feedback e explicacao de termos

Scorecard esperado: media 7-8/10 em vez de 6.5/10.
