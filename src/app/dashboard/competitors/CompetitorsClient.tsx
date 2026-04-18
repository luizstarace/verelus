'use client';

import { useEffect, useState } from 'react';
import type { ComparisonDashboard, CompetitorWithData } from '@/lib/types/tools';
import { ToolPageHeader } from '@/components/ToolPageHeader';
import { ToolIcon } from '@/components/ToolIcon';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';

function formatNum(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace('.0', '')}k`;
  return n.toLocaleString('pt-BR');
}

function calcWeeklyGrowth(history: Array<{ date: string; spotify?: number }>): number | null {
  const sorted = history.filter((h) => h.spotify !== undefined).slice(-4);
  if (sorted.length < 2) return null;
  const first = sorted[0].spotify as number;
  const last = sorted[sorted.length - 1].spotify as number;
  const daysDiff = (new Date(sorted[sorted.length - 1].date).getTime() - new Date(sorted[0].date).getTime()) / 86400000;
  if (daysDiff < 1) return null;
  return Math.round((last - first) / (daysDiff / 7));
}

function isValidSpotifyUrl(url: string): boolean {
  return /^https?:\/\/(open\.)?spotify\.com\/(intl-\w+\/)?artist\/[a-zA-Z0-9]+/.test(url.trim())
    || /^[a-zA-Z0-9]{22}$/.test(url.trim());
}

export function CompetitorsClient() {
  const [dashboard, setDashboard] = useState<ComparisonDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [form, setForm] = useState({
    spotify_artist_url: '',
    youtube_channel_url: '',
    display_name: '',
  });

  const load = async () => {
    try {
      setLoadError(null);
      const res = await fetch('/api/tools/competitors/list');
      if (!res.ok) throw new Error('Falha ao carregar');
      const body = await res.json() as { dashboard?: ComparisonDashboard };
      if (body.dashboard) setDashboard(body.dashboard);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Erro');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const addCompetitor = async () => {
    if (!isValidSpotifyUrl(form.spotify_artist_url)) {
      setError('URL do Spotify invalida. Ex: https://open.spotify.com/artist/...');
      return;
    }
    setAdding(true);
    setError('');
    try {
      const res = await fetch('/api/tools/competitors/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json() as { error: string };
        throw new Error(err.error);
      }
      await load();
      setShowAdd(false);
      setForm({ spotify_artist_url: '', youtube_channel_url: '', display_name: '' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro');
    } finally {
      setAdding(false);
    }
  };

  const deleteCompetitor = async (id: string) => {
    try {
      const res = await fetch('/api/tools/competitors/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitor_id: id }),
      });
      if (!res.ok) throw new Error('Falha ao remover');
      await load();
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Erro ao remover');
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    try {
      await fetch('/api/tools/competitors/refresh', { method: 'POST' });
      await load();
    } catch {
      setLoadError('Falha ao atualizar dados');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark text-white py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <ToolPageHeader
          title="Comparador de Concorrentes"
          description="Adicione ate 10 artistas similares. Acompanhamos os numeros deles junto com os seus ao longo do tempo."
          icon={<ToolIcon tool="competitors" size={22} />}
          accent="orange"
        />

        {loading ? (
          <div className="py-20"><LoadingSpinner size="lg" label="Carregando concorrentes..." /></div>
        ) : loadError ? (
          <ErrorMessage message={loadError} onRetry={load} />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <p className="text-xs text-brand-muted font-mono">
                {dashboard?.competitors.length ?? 0} de 10 competidores
              </p>
              <div className="flex gap-2">
                {(dashboard?.competitors.length ?? 0) > 0 && (
                  <button
                    onClick={refresh}
                    disabled={refreshing}
                    className="px-4 py-2 text-sm bg-brand-orange/10 hover:bg-brand-orange/20 text-brand-orange rounded-lg disabled:opacity-50 font-semibold"
                  >
                    {refreshing ? 'atualizando...' : 'atualizar'}
                  </button>
                )}
                <button
                  onClick={() => setShowAdd(!showAdd)}
                  className="px-4 py-2 text-sm bg-brand-orange text-black font-bold rounded-lg hover:brightness-110 transition"
                >
                  + Adicionar
                </button>
              </div>
            </div>

            {showAdd && (
              <div className="bg-brand-surface rounded-2xl p-6 border border-white/10 mb-6 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Adicionar competidor</h3>
                <div className="bg-white/5 rounded-lg p-3 border border-white/10 mb-2">
                  <p className="text-xs text-white/80 leading-relaxed">
                    <strong className="text-brand-orange">Dica:</strong> escolha artistas 2-5x seu tamanho no seu genero. Evite superestrelas — olhe pra quem chegou no proximo nivel que voce quer. 3-5 concorrentes bons &gt; 10 aleatorios.
                  </p>
                </div>
                <Field label="URL do Spotify do artista" required>
                  <TextInput value={form.spotify_artist_url} onChange={(v) => setForm({ ...form, spotify_artist_url: v })} placeholder="https://open.spotify.com/artist/..." />
                </Field>
                <Field label="Canal YouTube (opcional)" hint="URL ou @handle">
                  <TextInput value={form.youtube_channel_url} onChange={(v) => setForm({ ...form, youtube_channel_url: v })} placeholder="https://youtube.com/@canal" />
                </Field>
                <Field label="Nome pra exibir (opcional)" hint="Se vazio, buscamos do Spotify">
                  <TextInput value={form.display_name} onChange={(v) => setForm({ ...form, display_name: v })} placeholder="Ex: Ana Frango Eletrico" />
                </Field>
                {error && <ErrorMessage message={error} />}
                <div className="flex gap-2">
                  <button onClick={() => setShowAdd(false)} className="px-4 py-2.5 border border-white/10 text-white/60 rounded-lg hover:bg-white/5 text-sm">Cancelar</button>
                  <button
                    onClick={addCompetitor}
                    disabled={adding || !form.spotify_artist_url.trim()}
                    className="flex-1 px-4 py-2.5 bg-brand-orange text-black font-bold rounded-lg disabled:opacity-50 text-sm"
                  >
                    {adding ? 'Adicionando...' : 'Adicionar'}
                  </button>
                </div>
              </div>
            )}

            {dashboard?.insight && (
              <div className="bg-brand-orange/5 rounded-2xl p-5 border border-brand-orange/20 mb-6">
                <p className="text-xs font-mono uppercase tracking-wider text-brand-orange mb-2">Leitura comparativa</p>
                <p className="text-white/90 text-sm leading-relaxed">{dashboard.insight}</p>
              </div>
            )}

            {(dashboard?.competitors.length ?? 0) === 0 ? (
              <EmptyState
                icon="🏆"
                title="Nenhum concorrente ainda"
                description="Comece com 1-3 artistas similares do seu genero e estagio. Ate 10 no total."
                action={{ label: '+ Adicionar', onClick: () => setShowAdd(true) }}
              />
            ) : (
              <div className="space-y-6">
                <div className="bg-brand-surface rounded-2xl border border-white/10 overflow-x-auto">
                  <table className="w-full min-w-[400px]">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left py-3 px-4 text-xs font-mono uppercase tracking-wider text-brand-muted">Artista</th>
                        <th className="text-right py-3 px-4 text-xs font-mono uppercase tracking-wider text-brand-muted">Spotify</th>
                        <th className="text-right py-3 px-4 text-xs font-mono uppercase tracking-wider text-brand-muted">YouTube</th>
                        <th className="text-right py-3 px-4 text-xs font-mono uppercase tracking-wider text-brand-muted">Spotify/sem</th>
                        <th className="w-20"></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-white/5 bg-brand-orange/5">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-brand-orange" />
                            <span className="font-bold text-white">Voce</span>
                          </div>
                        </td>
                        <td className="text-right py-4 px-4 font-bold text-white">{formatNum(dashboard!.you.current.spotify)}</td>
                        <td className="text-right py-4 px-4 font-bold text-white">{formatNum(dashboard!.you.current.youtube)}</td>
                        <td className="text-right py-4 px-4 text-xs font-mono">
                          {(() => {
                            const g = calcWeeklyGrowth(dashboard!.you.history);
                            if (g === null) return <span className="text-brand-muted">—</span>;
                            return <span className={g >= 0 ? 'text-brand-green' : 'text-red-400'}>{g >= 0 ? '+' : ''}{formatNum(g)}/sem</span>;
                          })()}
                        </td>
                        <td></td>
                      </tr>
                      {dashboard!.competitors.map((c) => (
                        <tr key={c.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-white/30" />
                              <span className="text-white">{c.display_name}</span>
                            </div>
                          </td>
                          <td className="text-right py-4 px-4 text-white/80">{formatNum(c.current.spotify)}</td>
                          <td className="text-right py-4 px-4 text-white/80">{formatNum(c.current.youtube)}</td>
                          <td className="text-right py-4 px-4 text-xs font-mono">
                            {(() => {
                              const g = calcWeeklyGrowth(c.history);
                              if (g === null) return <span className="text-brand-muted">—</span>;
                              return <span className={g >= 0 ? 'text-brand-green' : 'text-red-400'}>{g >= 0 ? '+' : ''}{formatNum(g)}/sem</span>;
                            })()}
                          </td>
                          <td className="text-right py-2 px-4">
                            <button
                              onClick={() => setDeleteTarget(c.id)}
                              className="text-xs text-red-400 hover:text-red-300"
                              aria-label={`Remover ${c.display_name}`}
                            >
                              remover
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <ComparisonChart dashboard={dashboard!} />
              </div>
            )}
          </>
        )}

        <p className="text-xs text-brand-muted/60 mt-10 leading-relaxed">
          Os snapshots dos competidores sao capturados quando voce adiciona e em cada refresh manual.
          Spotify via scraping publico, YouTube via API oficial.
        </p>
      </div>

      <ConfirmModal
        open={deleteTarget !== null}
        title="Remover competidor"
        message="Tem certeza? O historico de snapshots sera perdido."
        confirmLabel="Remover"
        danger
        onConfirm={() => { if (deleteTarget) { deleteCompetitor(deleteTarget); setDeleteTarget(null); } }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function ComparisonChart({ dashboard }: { dashboard: ComparisonDashboard }) {
  const W = 600;
  const H = 260;
  const PAD = 35;

  type Series = { label: string; color: string; isYou: boolean; points: Array<{ date: string; value: number }> };

  const palette = ['#00d9f5', '#e040fb', '#ffd700', '#ff6b6b', '#a29bfe', '#fd79a8', '#48dbfb', '#feca57', '#54a0ff', '#ff9ff3'];

  const buildSeries = (source: 'spotify' | 'youtube'): Series[] => {
    const youPoints = dashboard.you.history
      .filter((h) => h[source] !== undefined)
      .map((h) => ({ date: h.date, value: h[source] as number }));

    const series: Series[] = [];
    if (youPoints.length >= 2) {
      series.push({ label: 'Voce', color: '#ffa500', isYou: true, points: youPoints });
    }

    dashboard.competitors.forEach((c, i) => {
      const pts = c.history
        .filter((h) => h[source] !== undefined)
        .map((h) => ({ date: h.date, value: h[source] as number }));
      if (pts.length >= 2) {
        series.push({ label: c.display_name, color: palette[i % palette.length], isYou: false, points: pts });
      }
    });

    return series;
  };

  const renderChart = (title: string, series: Series[]) => {
    if (series.length === 0) {
      return (
        <div className="bg-brand-surface rounded-2xl p-6 border border-white/10">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-2">{title}</h4>
          <p className="text-sm text-brand-muted">Sem dados historicos suficientes (precisa 2+ snapshots).</p>
        </div>
      );
    }

    const allValues = series.flatMap((s) => s.points.map((p) => p.value));
    const minV = Math.min(...allValues);
    const maxV = Math.max(...allValues);
    const range = Math.max(1, maxV - minV);

    const allDatesMap: Record<string, true> = {};
    for (const s of series) for (const p of s.points) allDatesMap[p.date] = true;
    const allDates = Object.keys(allDatesMap).sort();
    const dateIndex: Record<string, number> = {};
    allDates.forEach((d, i) => { dateIndex[d] = i; });
    const maxIdx = Math.max(1, allDates.length - 1);

    return (
      <div className="bg-brand-surface rounded-2xl p-6 border border-white/10">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">{title}</h4>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block" height={260} role="img" aria-label={title}>
          <title>{title}</title>
          {[0.25, 0.5, 0.75].map((pct) => (
            <line key={pct} x1={PAD} y1={PAD + (H - 2 * PAD) * pct} x2={W - PAD} y2={PAD + (H - 2 * PAD) * pct} stroke="rgba(255,255,255,0.05)" />
          ))}
          {series.map((s, si) => {
            const coords = s.points.map((p) => {
              const x = PAD + (dateIndex[p.date] / maxIdx) * (W - 2 * PAD);
              const y = H - PAD - ((p.value - minV) / range) * (H - 2 * PAD);
              return { x, y };
            });
            const pathD = coords.map((c, i) => (i === 0 ? `M ${c.x} ${c.y}` : `L ${c.x} ${c.y}`)).join(' ');
            return (
              <g key={si}>
                <path d={pathD} fill="none" stroke={s.color} strokeWidth={s.isYou ? 3 : 1.5} strokeLinecap="round" />
                {coords.map((c, i) => (
                  <circle key={i} cx={c.x} cy={c.y} r={s.isYou ? 4 : 2.5} fill={s.color} />
                ))}
              </g>
            );
          })}
        </svg>
        <div className="flex flex-wrap gap-3 mt-3">
          {series.map((s) => (
            <div key={s.label} className="flex items-center gap-2 text-xs">
              <div className="h-[3px] w-6 rounded" style={{ background: s.color }} />
              <span className={s.isYou ? 'text-white font-semibold' : 'text-white/70'}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      {renderChart('Spotify — Ouvintes mensais', buildSeries('spotify'))}
      {renderChart('YouTube — Inscritos', buildSeries('youtube'))}
    </div>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-white mb-1">
        {label} {required && <span className="text-brand-orange">*</span>}
      </label>
      {hint && <p className="text-xs text-brand-muted mb-2">{hint}</p>}
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-brand-orange/40"
    />
  );
}

void ({} as CompetitorWithData);
