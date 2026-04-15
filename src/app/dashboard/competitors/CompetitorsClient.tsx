'use client';

import { useEffect, useState } from 'react';
import type { ComparisonDashboard, CompetitorWithData } from '@/lib/types/tools';
import { ToolPageHeader } from '@/components/ToolPageHeader';
import { ToolIcon } from '@/components/ToolIcon';

function formatNum(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace('.0', '')}k`;
  return n.toLocaleString('pt-BR');
}

export function CompetitorsClient() {
  const [dashboard, setDashboard] = useState<ComparisonDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    spotify_artist_url: '',
    youtube_channel_url: '',
    display_name: '',
  });

  const load = async () => {
    const res = await fetch('/api/tools/competitors/list');
    const body = await res.json() as { dashboard?: ComparisonDashboard };
    if (body.dashboard) setDashboard(body.dashboard);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addCompetitor = async () => {
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
    if (!confirm('Remover esse competidor?')) return;
    await fetch('/api/tools/competitors/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ competitor_id: id }),
    });
    load();
  };

  const refresh = async () => {
    setRefreshing(true);
    await fetch('/api/tools/competitors/refresh', { method: 'POST' });
    await load();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark text-white py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <ToolPageHeader
            title="Comparador de Concorrentes"
            description="Voce vs 3 artistas similares, ao longo do tempo."
            icon={<ToolIcon tool="competitors" size={22} />}
            accent="orange"
          />
          <p className="text-brand-muted">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark text-white py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <ToolPageHeader
          title="Comparador de Concorrentes"
          description="Adicione ate 10 artistas similares. Acompanhamos os numeros deles junto com os seus ao longo do tempo."
          icon={<ToolIcon tool="competitors" size={22} />}
          accent="orange"
        />

        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <p className="text-xs text-brand-muted font-mono">
            {dashboard?.competitors.length ?? 0} de 10 competidores
          </p>
          <div className="flex gap-2">
            {(dashboard?.competitors.length ?? 0) > 0 && (
              <button
                onClick={refresh}
                disabled={refreshing}
                className="px-4 py-2 text-sm bg-brand-orange/10 hover:bg-brand-orange/20 text-brand-orange rounded-xl disabled:opacity-50 font-semibold"
              >
                {refreshing ? 'atualizando...' : '↻ atualizar'}
              </button>
            )}
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="px-4 py-2 text-sm bg-gradient-to-r from-brand-orange to-brand-orange/80 text-black font-semibold rounded-xl"
            >
              + Adicionar
            </button>
          </div>
        </div>

        {showAdd && (
          <div className="bg-brand-surface rounded-2xl p-6 border border-white/10 mb-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Adicionar competidor</h3>
            <Field label="URL do Spotify do artista" required>
              <TextInput value={form.spotify_artist_url} onChange={(v) => setForm({ ...form, spotify_artist_url: v })} placeholder="https://open.spotify.com/artist/..." />
            </Field>
            <Field label="Canal YouTube (opcional)" hint="URL ou @handle">
              <TextInput value={form.youtube_channel_url} onChange={(v) => setForm({ ...form, youtube_channel_url: v })} placeholder="https://youtube.com/@canal" />
            </Field>
            <Field label="Nome pra exibir (opcional)" hint="Se vazio, buscamos do Spotify">
              <TextInput value={form.display_name} onChange={(v) => setForm({ ...form, display_name: v })} placeholder="Ex: Ana Frango Eletrico" />
            </Field>
            {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">{error}</div>}
            <div className="flex gap-2">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2.5 border border-white/10 text-white rounded-xl hover:bg-white/5">Cancelar</button>
              <button
                onClick={addCompetitor}
                disabled={adding || !form.spotify_artist_url.trim()}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-brand-orange to-brand-orange/80 text-black font-semibold rounded-xl disabled:opacity-50"
              >
                {adding ? 'Adicionando...' : 'Adicionar'}
              </button>
            </div>
          </div>
        )}

        {/* Insight */}
        {dashboard?.insight && (
          <div className="bg-gradient-to-br from-brand-orange/10 to-brand-orange/5 rounded-2xl p-5 border border-brand-orange/30 mb-6">
            <p className="text-xs font-mono uppercase tracking-wider text-brand-orange mb-2">Leitura comparativa</p>
            <p className="text-white/90 leading-relaxed">{dashboard.insight}</p>
          </div>
        )}

        {/* Tabela comparativa */}
        {(dashboard?.competitors.length ?? 0) === 0 ? (
          <div className="bg-brand-surface rounded-2xl p-12 border border-white/10 text-center">
            <p className="text-white/60 mb-4">Voce ainda nao adicionou competidores.</p>
            <p className="text-xs text-brand-muted">Comece com 1-3 artistas similares do seu genero e estagio. Ate 10 no total.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-brand-surface rounded-2xl border border-white/10 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left py-3 px-4 text-xs font-mono uppercase tracking-wider text-brand-muted">Artista</th>
                    <th className="text-right py-3 px-4 text-xs font-mono uppercase tracking-wider text-brand-muted">Spotify</th>
                    <th className="text-right py-3 px-4 text-xs font-mono uppercase tracking-wider text-brand-muted">YouTube</th>
                    <th className="text-right py-3 px-4 text-xs font-mono uppercase tracking-wider text-brand-muted"></th>
                  </tr>
                </thead>
                <tbody>
                  {/* Voce */}
                  <tr className="border-b border-white/5 bg-brand-orange/5">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-brand-orange" />
                        <span className="font-bold text-white">Voce</span>
                      </div>
                    </td>
                    <td className="text-right py-4 px-4 font-bold text-white">{formatNum(dashboard!.you.current.spotify)}</td>
                    <td className="text-right py-4 px-4 font-bold text-white">{formatNum(dashboard!.you.current.youtube)}</td>
                    <td></td>
                  </tr>

                  {/* Competidores */}
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
                      <td className="text-right py-2 px-4">
                        <button
                          onClick={() => deleteCompetitor(c.id)}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          remover
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Graficos sobrepostos */}
            <ComparisonChart dashboard={dashboard!} />
          </div>
        )}

        <p className="text-xs text-brand-muted/60 mt-10 leading-relaxed">
          Os snapshots dos competidores sao capturados quando voce adiciona e em cada refresh manual.
          Spotify via scraping publico, YouTube via API oficial.
        </p>
      </div>
    </div>
  );
}

function ComparisonChart({ dashboard }: { dashboard: ComparisonDashboard }) {
  const W = 600;
  const H = 260;
  const PAD = 35;

  // Para cada source (spotify/youtube), montar series com todas as linhas
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

    // Determinar escala comum
    const allValues = series.flatMap((s) => s.points.map((p) => p.value));
    const minV = Math.min(...allValues);
    const maxV = Math.max(...allValues);
    const range = Math.max(1, maxV - minV);

    // Datas normalizadas
    const allDatesMap: Record<string, true> = {};
    for (const s of series) for (const p of s.points) allDatesMap[p.date] = true;
    const allDates = Object.keys(allDatesMap).sort();
    const dateIndex: Record<string, number> = {};
    allDates.forEach((d, i) => { dateIndex[d] = i; });
    const maxIdx = Math.max(1, allDates.length - 1);

    return (
      <div className="bg-brand-surface rounded-2xl p-6 border border-white/10">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">{title}</h4>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block" height={260}>
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
              <div className={`h-[3px] w-6 rounded`} style={{ background: s.color }} />
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
        {label} {required && <span className="text-brand-green">*</span>}
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
      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-brand-green/50"
    />
  );
}

// Avoid unused warning
void ({} as CompetitorWithData);
