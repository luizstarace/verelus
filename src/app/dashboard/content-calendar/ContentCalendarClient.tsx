'use client';

import { useState } from 'react';
import { ToolPageHeader } from '@/components/ToolPageHeader';
import { POST_PLATFORM_META } from '@/lib/types/tools';
import type { ContentCalendarInput, ContentCalendarOutput, PostPlatform, PostSuggestion } from '@/lib/types/tools';

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
  const [form, setForm] = useState<ContentCalendarInput>({
    artist_name: '',
    song_title: '',
    release_type: 'single',
    release_date: '',
    genre: '',
    mood: '',
    platforms: ['instagram_reel', 'instagram_feed', 'tiktok'],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ContentCalendarOutput | null>(null);

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

  function copyPost(p: PostSuggestion) {
    const text = `${p.caption_draft}\n\n${p.hashtags.map((h) => h.startsWith('#') ? h : `#${h}`).join(' ')}`;
    navigator.clipboard.writeText(text);
  }

  const postsByPhase = result ? groupByPhase(result.posts) : null;

  return (
    <div className="min-h-screen bg-brand-dark text-white">
      <div className="max-w-6xl mx-auto px-4 py-12 lg:py-16">
        <ToolPageHeader
          title="Cronograma de Posts"
          description="30 dias de posts coordenados para o lancamento. Captions, hashtags e prompts de imagem prontos."
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

            {error && <div className="text-sm text-red-400">{error}</div>}

            <button
              type="submit"
              disabled={loading || form.platforms.length === 0}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-orange text-black font-bold hover:bg-brand-orange/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Gerando cronograma...' : 'Gerar cronograma de 30 dias'}
            </button>
            <p className="text-xs text-brand-muted/70">
              Pode levar 20-40 segundos. Gera 15-20 posts coordenados.
            </p>
          </form>
        )}

        {result && postsByPhase && (
          <div className="space-y-8">
            <div className="bg-brand-surface rounded-2xl p-6 border border-white/10">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                <h2 className="text-lg font-bold text-white">Estrategia</h2>
                <button
                  onClick={() => { setResult(null); }}
                  className="text-xs font-mono uppercase tracking-wider text-brand-muted hover:text-white transition-colors"
                >
                  ← Novo cronograma
                </button>
              </div>
              <p className="text-sm text-brand-muted leading-relaxed">{result.summary}</p>
              <div className="mt-4 flex items-center gap-4 text-xs text-brand-muted/70">
                <span>{result.posts.length} posts</span>
                <span>•</span>
                <span>D-30 a D+7</span>
              </div>
            </div>

            {postsByPhase.map(({ phase, posts }) => (
              <section key={phase}>
                <h3 className="text-xs font-mono uppercase tracking-wider text-brand-muted mb-3">{phase}</h3>
                <div className="space-y-3">
                  {posts.map((p, i) => (
                    <div key={i} className="bg-brand-surface rounded-xl p-5 border border-white/10">
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
                          onClick={() => copyPost(p)}
                          className="text-xs font-mono uppercase text-brand-muted hover:text-brand-orange transition-colors"
                        >
                          Copiar
                        </button>
                      </div>

                      <div className="mb-3">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-brand-muted mb-1">{p.post_type}</div>
                        <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">{p.caption_draft}</p>
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
                  ))}
                </div>
              </section>
            ))}
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

function groupByPhase(posts: PostSuggestion[]): Array<{ phase: string; posts: PostSuggestion[] }> {
  const phases: Array<{ phase: string; range: [number, number] }> = [
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
