'use client';

import { useState, useEffect, useRef } from 'react';
import { ToolPageHeader } from '@/components/ToolPageHeader';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { POST_PLATFORM_META } from '@/lib/types/tools';
import type { ContentCalendarInput, ContentCalendarOutput, PostPlatform, PostSuggestion } from '@/lib/types/tools';
import { useToast } from '@/lib/use-toast';
import { PHASE_STRATEGY, type PhaseKey } from '@/lib/tool-content';

const ALL_PLATFORMS = Object.keys(POST_PLATFORM_META) as PostPlatform[];

const PLATFORM_COLOR: Record<PostPlatform, string> = {
  instagram_reel: 'bg-pink-500/10 text-pink-300 border-pink-500/20',
  instagram_feed: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
  instagram_story: 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/20',
  tiktok: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
  twitter: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
  youtube_shorts: 'bg-red-500/10 text-red-300 border-red-500/20',
};

function formatDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function dayLabel(offset: number): string {
  if (offset === 0) return 'D-0 (lancamento)';
  if (offset < 0) return `D${offset}`;
  return `D+${offset}`;
}

export function ContentCalendarClient() {
  const [form, setForm] = useState<ContentCalendarInput & { window_days: 15 | 30 | 60 }>({
    artist_name: '',
    song_title: '',
    release_type: 'single',
    release_date: '',
    genre: '',
    mood: '',
    platforms: ['instagram_reel', 'instagram_feed', 'tiktok'],
    window_days: 30,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ContentCalendarOutput | null>(null);
  const [editedCaptions, setEditedCaptions] = useState<Record<number, string>>({});
  const [loadingStep, setLoadingStep] = useState(0);
  const loadingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (loading) {
      setLoadingStep(0);
      let step = 0;
      loadingTimer.current = setInterval(() => {
        step++;
        if (step <= 4) setLoadingStep(step);
      }, 5000);
    } else {
      if (loadingTimer.current) clearInterval(loadingTimer.current);
      setLoadingStep(0);
    }
    return () => { if (loadingTimer.current) clearInterval(loadingTimer.current); };
  }, [loading]);

  function togglePlatform(p: PostPlatform) {
    setForm((f) => ({
      ...f,
      platforms: f.platforms.includes(p) ? f.platforms.filter((x) => x !== p) : [...f.platforms, p],
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch('/api/tools/content-calendar/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json() as { output?: ContentCalendarOutput; error?: string };
      if (!res.ok) throw new Error(json.error || 'Falha ao gerar');
      setResult(json.output!);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'erro');
    } finally {
      setLoading(false);
    }
  }

  function copyPost(p: PostSuggestion, idx: number) {
    const caption = editedCaptions[idx] ?? p.caption_draft;
    const text = `${caption}\n\n${p.hashtags.map((h) => h.startsWith('#') ? h : `#${h}`).join(' ')}`;
    navigator.clipboard.writeText(text);
    toast.success('Post copiado!');
  }

  const postsByPhase = result ? groupByPhase(result.posts, form.window_days) : null;

  return (
    <div className="min-h-screen bg-brand-dark text-white">
      <div className="max-w-6xl mx-auto px-4 py-12 lg:py-16">
        <ToolPageHeader
          title="Cronograma de Posts"
          description={`${form.window_days} dias de posts coordenados para o lancamento. Captions, hashtags e prompts de imagem prontos.`}
          accent="orange"
        />

        {!result && (
          <form onSubmit={submit} className="bg-brand-surface rounded-2xl p-6 border border-white/10 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nome do artista">
                <input
                  required
                  value={form.artist_name}
                  onChange={(e) => setForm({ ...form, artist_name: e.target.value })}
                  className={inputClass}
                  placeholder="Ex: Clara Moretti"
                />
              </Field>
              <Field label="Titulo da musica/release">
                <input
                  required
                  value={form.song_title}
                  onChange={(e) => setForm({ ...form, song_title: e.target.value })}
                  className={inputClass}
                  placeholder="Ex: Noite Azul"
                />
              </Field>
              <Field label="Tipo">
                <select
                  value={form.release_type}
                  onChange={(e) => setForm({ ...form, release_type: e.target.value as ContentCalendarInput['release_type'] })}
                  className={inputClass}
                >
                  <option value="single">Single</option>
                  <option value="ep">EP</option>
                  <option value="album">Album</option>
                </select>
              </Field>
              <Field label="Data de lancamento">
                <input
                  required
                  type="date"
                  value={form.release_date}
                  onChange={(e) => setForm({ ...form, release_date: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Genero">
                <input
                  required
                  value={form.genre}
                  onChange={(e) => setForm({ ...form, genre: e.target.value })}
                  className={inputClass}
                  placeholder="Ex: indie rock, MPB experimental"
                />
              </Field>
              <Field label="Mood / sentimento">
                <input
                  required
                  value={form.mood}
                  onChange={(e) => setForm({ ...form, mood: e.target.value })}
                  className={inputClass}
                  placeholder="Ex: melancolica, noturna, urgente"
                />
              </Field>
            </div>

            <Field label="Janela de posts">
              <div className="flex gap-2">
                {([15, 30, 60] as const).map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setForm({ ...form, window_days: w })}
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

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-brand-muted mb-2">
                Plataformas ativas
              </label>
              <div className="flex flex-wrap gap-2">
                {ALL_PLATFORMS.map((p) => {
                  const selected = form.platforms.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePlatform(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        selected
                          ? 'bg-brand-orange/20 text-brand-orange border-brand-orange/40'
                          : 'bg-white/5 text-brand-muted border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {POST_PLATFORM_META[p].label}
                    </button>
                  );
                })}
              </div>
            </div>

            {form.platforms.length === 0 && (
              <p className="text-sm text-yellow-400">Selecione pelo menos uma plataforma para gerar o cronograma.</p>
            )}

            {error && <ErrorMessage message={error} />}

            <button
              type="submit"
              disabled={loading || form.platforms.length === 0}
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-brand-orange text-black font-bold hover:bg-brand-orange/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Gerando...' : `Gerar cronograma de ${form.window_days} dias`}
            </button>

            {loading && <LoadingProgress step={loadingStep} />}

            {!loading && (
              <p className="text-xs text-brand-muted/70">
                Leva 20-40 segundos. Gera 15-20 posts coordenados com captions, hashtags e prompts de imagem.
              </p>
            )}
          </form>
        )}

        {result && postsByPhase && (
          <div className="space-y-8">
            <div className="bg-brand-surface rounded-2xl p-6 border border-white/10">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                <h2 className="text-lg font-bold text-white">Estrategia</h2>
                <button
                  onClick={() => { setResult(null); setEditedCaptions({}); }}
                  className="text-xs font-mono uppercase tracking-wider text-brand-muted hover:text-white transition-colors"
                >
                  ← Novo cronograma
                </button>
              </div>
              <p className="text-sm text-brand-muted leading-relaxed">{result.summary}</p>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-brand-muted/70">
                  <span>{result.posts.length} posts</span>
                  <span>•</span>
                  <span>D-{form.window_days} a D+7</span>
                </div>
                <button
                  onClick={() => {
                    const lines = result.posts.map((p, i) => {
                      const caption = editedCaptions[i] ?? p.caption_draft;
                      const date = formatDate(p.suggested_date);
                      const tags = p.hashtags.map((h) => h.startsWith('#') ? h : `#${h}`).join(' ');
                      return `[${dayLabel(p.day_offset)} · ${date}] ${POST_PLATFORM_META[p.platform].label}\n${caption}\n${tags}\n`;
                    });
                    navigator.clipboard.writeText(lines.join('\n'));
                    toast.success(`${result.posts.length} posts copiados!`);
                  }}
                  className="text-xs font-mono uppercase text-brand-orange hover:text-brand-orange/80 transition-colors"
                >
                  Copiar tudo
                </button>
              </div>
            </div>

            <details className="bg-brand-surface rounded-xl p-4 border border-white/10">
              <summary className="text-sm font-semibold text-white cursor-pointer">Por que essa estrategia de {form.window_days} dias funciona?</summary>
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

            {(() => {
              let globalIdx = 0;
              return postsByPhase.map(({ phase, posts }, phaseIdx) => (
              <details key={phase} open={phaseIdx === 0}>
                <summary className="text-xs font-mono uppercase tracking-wider text-brand-muted mb-3 cursor-pointer hover:text-white transition-colors list-none flex items-center gap-2">
                  <span className="text-[10px] select-none">▸</span>
                  {phase}
                  <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded">{posts.length}</span>
                </summary>
                <div className="space-y-3 mb-6">
                  {posts.map((p) => {
                    const postIdx = globalIdx++;
                    return (
                    <div key={postIdx} className="bg-brand-surface rounded-xl p-5 border border-white/10">
                      <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-[10px] font-mono uppercase tracking-wider bg-white/5 text-white px-2 py-0.5 rounded">
                            {dayLabel(p.day_offset)}
                          </span>
                          <span className="text-xs text-brand-muted">{formatDate(p.suggested_date)}</span>
                          <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${PLATFORM_COLOR[p.platform]}`}>
                            {POST_PLATFORM_META[p.platform].label}
                          </span>
                          {p.best_time && (
                            <span className="text-[10px] font-mono text-brand-muted/70">{p.best_time}</span>
                          )}
                        </div>
                        <button
                          onClick={() => copyPost(p, postIdx)}
                          className="text-xs font-mono uppercase text-brand-muted hover:text-brand-orange transition-colors"
                        >
                          Copiar
                        </button>
                      </div>

                      <div className="mb-3">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-brand-muted mb-1">{p.post_type}</div>
                        <textarea
                          value={editedCaptions[postIdx] ?? p.caption_draft}
                          onChange={(e) => setEditedCaptions({ ...editedCaptions, [postIdx]: e.target.value })}
                          rows={4}
                          className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-sm text-white leading-relaxed resize-none focus:outline-none focus:border-brand-orange/40"
                        />
                      </div>

                      {p.hashtags.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-1.5">
                          {p.hashtags.map((h, j) => (
                            <span key={j} className="text-[11px] text-brand-orange/80 font-mono">
                              {h.startsWith('#') ? h : `#${h}`}
                            </span>
                          ))}
                        </div>
                      )}

                      {p.image_prompt && (
                        <details className="mb-2">
                          <summary className="text-[11px] font-mono uppercase tracking-wider text-brand-muted cursor-pointer hover:text-white transition-colors">
                            Prompt de imagem
                          </summary>
                          <p className="mt-2 text-xs text-brand-muted leading-relaxed bg-black/30 rounded p-3 border border-white/5">
                            {p.image_prompt}
                          </p>
                        </details>
                      )}

                      {p.notes && (
                        <p className="text-xs text-brand-muted/70 italic border-l-2 border-white/10 pl-3">{p.notes}</p>
                      )}
                    </div>
                    );
                  })}
                </div>
              </details>
              ));
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-mono uppercase tracking-wider text-brand-muted mb-1.5">{label}</span>
      {children}
    </label>
  );
}

const inputClass = 'w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-orange/40 transition-colors';

const LOADING_STEPS = [
  'Analisando genero e mood...',
  'Planejando fases do lancamento...',
  'Escrevendo captions e hashtags...',
  'Gerando prompts de imagem...',
  'Finalizando cronograma...',
];

function LoadingProgress({ step }: { step: number }) {
  return (
    <div className="bg-brand-surface rounded-xl p-5 border border-white/10 space-y-3">
      {LOADING_STEPS.map((label, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <div key={i} className="flex items-center gap-3 text-xs">
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
              done ? 'bg-brand-green/20 border-brand-green text-brand-green' :
              active ? 'border-brand-orange animate-pulse' :
              'border-white/10'
            }`}>
              {done && <span className="text-[10px]">✓</span>}
            </div>
            <span className={done ? 'text-white/60 line-through' : active ? 'text-white font-medium' : 'text-white/30'}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function groupByPhase(posts: PostSuggestion[], windowDays: number): Array<{ phase: string; posts: PostSuggestion[] }> {
  const phases: Array<{ phase: string; range: [number, number] }> =
    windowDays === 15
      ? [
          { phase: `Teaser + Curiosidade (D-${windowDays} a D-8)`, range: [-windowDays, -8] },
          { phase: 'Preview + Countdown (D-7 a D-1)', range: [-7, -1] },
          { phase: 'Lancamento (D-0)', range: [0, 0] },
          { phase: 'Pos-lancamento (D+1 a D+7)', range: [1, 7] },
        ]
      : windowDays === 60
      ? [
          { phase: 'Pre-teaser (D-60 a D-45)', range: [-60, -45] },
          { phase: 'Teaser (D-44 a D-30)', range: [-44, -30] },
          { phase: 'Construindo curiosidade (D-29 a D-15)', range: [-29, -15] },
          { phase: 'Preview (D-14 a D-7)', range: [-14, -7] },
          { phase: 'Countdown (D-6 a D-1)', range: [-6, -1] },
          { phase: 'Lancamento (D-0)', range: [0, 0] },
          { phase: 'Pos-lancamento (D+1 a D+7)', range: [1, 7] },
        ]
      : [
          { phase: 'Teaser (D-30 a D-22)', range: [-30, -22] },
          { phase: 'Construindo curiosidade (D-21 a D-14)', range: [-21, -14] },
          { phase: 'Preview (D-13 a D-7)', range: [-13, -7] },
          { phase: 'Countdown (D-6 a D-1)', range: [-6, -1] },
          { phase: 'Lancamento (D-0)', range: [0, 0] },
          { phase: 'Pos-lancamento (D+1 a D+7)', range: [1, 7] },
        ];
  return phases
    .map(({ phase, range }) => ({
      phase,
      posts: posts.filter((p) => p.day_offset >= range[0] && p.day_offset <= range[1]),
    }))
    .filter((g) => g.posts.length > 0);
}
