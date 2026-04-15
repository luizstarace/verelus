'use client';

import { useEffect, useState } from 'react';
import type { GrowthDashboardData, GrowthSource } from '@/lib/types/tools';
import { GROWTH_SOURCE_META } from '@/lib/types/tools';
import { ToolPageHeader } from '@/components/ToolPageHeader';
import { ToolIcon } from '@/components/ToolIcon';

type View = 'dashboard' | 'setup';

function formatNum(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace('.0', '')}k`;
  return n.toLocaleString('pt-BR');
}

function formatDelta(pct: number | null): { label: string; color: string } {
  if (pct === null) return { label: '—', color: 'text-brand-muted' };
  const s = `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`;
  const color = pct > 0 ? 'text-brand-green' : pct < 0 ? 'text-red-400' : 'text-brand-muted';
  return { label: s, color };
}

export function GrowthClient() {
  const [view, setView] = useState<View>('dashboard');
  const [data, setData] = useState<GrowthDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [profileForm, setProfileForm] = useState<{
    spotify_artist_url: string;
    youtube_channel_url: string;
    instagram_handle: string;
    tiktok_handle: string;
  }>({ spotify_artist_url: '', youtube_channel_url: '', instagram_handle: '', tiktok_handle: '' });
  const [saving, setSaving] = useState(false);

  const loadDashboard = async () => {
    const res = await fetch('/api/tools/growth/dashboard');
    const body = await res.json() as { data?: GrowthDashboardData; error?: string };
    if (body.data) {
      setData(body.data);
      setProfileForm({
        spotify_artist_url: body.data.profile.spotify_artist_url ?? '',
        youtube_channel_url: body.data.profile.youtube_channel_url ?? '',
        instagram_handle: body.data.profile.instagram_handle ?? '',
        tiktok_handle: body.data.profile.tiktok_handle ?? '',
      });
    }
    setLoading(false);
  };

  useEffect(() => { loadDashboard(); }, []);

  const hasProfile = !!(
    data?.profile.spotify_artist_url ||
    data?.profile.youtube_channel_url ||
    data?.profile.instagram_handle ||
    data?.profile.tiktok_handle
  );

  const saveProfile = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/tools/growth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      });
      if (!res.ok) {
        const err = await res.json() as { error: string };
        throw new Error(err.error);
      }
      await loadDashboard();
      setView('dashboard');
      // Trigger primeiro refresh automatico
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro');
    } finally {
      setSaving(false);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    setError('');
    try {
      const res = await fetch('/api/tools/growth/refresh', { method: 'POST' });
      const body = await res.json() as { errors?: string[]; error?: string };
      if (body.error) throw new Error(body.error);
      if (body.errors && body.errors.length > 0) {
        setError(body.errors.join(' · '));
      }
      await loadDashboard();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro');
    } finally {
      setRefreshing(false);
    }
  };

  const updateManual = async (source: 'instagram' | 'tiktok', value: number) => {
    await fetch('/api/tools/growth/manual-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source, value }),
    });
    await loadDashboard();
  };

  // ========= LOADING =========
  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark text-white py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <ToolPageHeader
            title="Growth Tracker"
            description="Seu painel semanal de crescimento nas plataformas."
            icon={<ToolIcon tool="growth" size={22} />}
            accent="orange"
          />
          <p className="text-brand-muted">Carregando...</p>
        </div>
      </div>
    );
  }

  // ========= SETUP =========
  if (view === 'setup' || !hasProfile) {
    return (
      <div className="min-h-screen bg-brand-dark text-white py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <ToolPageHeader
            title="Growth Tracker"
            description="Configure suas plataformas. Toda segunda atualizamos automatico. Voce tambem pode clicar 'atualizar agora' quando quiser."
            icon={<ToolIcon tool="growth" size={22} />}
            accent="orange"
          />

          <div className="bg-brand-surface rounded-2xl p-8 border border-white/10 space-y-5">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Suas plataformas</h2>
            <p className="text-xs text-brand-muted">Pelo menos uma. Spotify e YouTube sao automaticos. Instagram e TikTok voce atualiza manualmente (leva 10s por semana).</p>

            <Field label="URL do Spotify do artista" hint="Automatico. Ex: https://open.spotify.com/artist/...">
              <TextInput value={profileForm.spotify_artist_url} onChange={(v) => setProfileForm({ ...profileForm, spotify_artist_url: v })} placeholder="https://open.spotify.com/artist/..." />
            </Field>

            <Field label="Canal do YouTube (URL ou @handle)" hint="Automatico. Ex: https://youtube.com/@seucanal ou @seucanal">
              <TextInput value={profileForm.youtube_channel_url} onChange={(v) => setProfileForm({ ...profileForm, youtube_channel_url: v })} placeholder="https://youtube.com/@seucanal" />
            </Field>

            <Field label="Handle Instagram (opcional)" hint="Manual. Voce atualiza semanalmente em 10s">
              <TextInput value={profileForm.instagram_handle} onChange={(v) => setProfileForm({ ...profileForm, instagram_handle: v })} placeholder="@seuhandle" />
            </Field>

            <Field label="Handle TikTok (opcional)" hint="Manual.">
              <TextInput value={profileForm.tiktok_handle} onChange={(v) => setProfileForm({ ...profileForm, tiktok_handle: v })} placeholder="@seuhandle" />
            </Field>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">{error}</div>
            )}

            <div className="flex gap-3 pt-4 border-t border-white/5">
              {hasProfile && (
                <button onClick={() => setView('dashboard')} className="px-5 py-3 border border-white/10 text-white rounded-xl hover:bg-white/5">
                  Cancelar
                </button>
              )}
              <button
                onClick={saveProfile}
                disabled={saving}
                className="flex-1 px-5 py-3 bg-gradient-to-r from-brand-orange to-brand-orange/80 text-black font-bold rounded-xl disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar e capturar primeira medida'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========= DASHBOARD =========
  if (!data) return null;

  return (
    <div className="min-h-screen bg-brand-dark text-white py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <ToolPageHeader
          title="Growth Tracker"
          description="Seu crescimento real na semana. Atualizado toda segunda 8h + quando voce pedir."
          icon={<ToolIcon tool="growth" size={22} />}
          accent="orange"
        />

        {/* Top actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="text-xs text-brand-muted font-mono">
            {Object.values(data.last_updated).find((d) => d) && (
              <>Ultima atualizacao: {Object.values(data.last_updated).find((d) => d)}</>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setView('setup')}
              className="px-4 py-2 text-sm border border-white/10 text-white rounded-xl hover:bg-white/5"
            >
              Config
            </button>
            <button
              onClick={refresh}
              disabled={refreshing}
              className="px-4 py-2 text-sm bg-brand-orange/10 hover:bg-brand-orange/20 text-brand-orange rounded-xl disabled:opacity-50 font-semibold"
            >
              {refreshing ? 'atualizando...' : '↻ atualizar agora'}
            </button>
          </div>
        </div>

        {/* Insight semanal */}
        {data.weekly_insight && (
          <div className="bg-gradient-to-br from-brand-orange/10 to-brand-orange/5 rounded-2xl p-5 border border-brand-orange/30 mb-6">
            <p className="text-xs font-mono uppercase tracking-wider text-brand-orange mb-2">Leitura da semana</p>
            <p className="text-white/90 leading-relaxed">{data.weekly_insight}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-300 text-sm mb-6">{error}</div>
        )}

        {/* 4 Metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {(['spotify', 'youtube', 'instagram', 'tiktok'] as GrowthSource[]).map((source) => {
            const value = data.current[source];
            const delta = formatDelta(data.delta_pct[source]);
            const meta = GROWTH_SOURCE_META[source];
            const isManual = source === 'instagram' || source === 'tiktok';
            const hasConfig = (source === 'spotify' && !!data.profile.spotify_artist_url)
              || (source === 'youtube' && !!data.profile.youtube_channel_url)
              || (source === 'instagram' && !!data.profile.instagram_handle)
              || (source === 'tiktok' && !!data.profile.tiktok_handle);

            return (
              <div key={source} className="bg-brand-surface rounded-2xl p-5 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-brand-muted">{meta.label}</span>
                  {isManual && hasConfig && (
                    <button
                      onClick={() => {
                        const input = prompt(`Quantos seguidores no ${meta.label} hoje?`, String(value ?? 0));
                        if (input !== null) {
                          const n = Number(input);
                          if (Number.isFinite(n) && n >= 0) updateManual(source as 'instagram' | 'tiktok', n);
                        }
                      }}
                      className="text-[10px] text-brand-orange hover:underline"
                    >
                      atualizar
                    </button>
                  )}
                </div>
                <div className="text-3xl font-black text-white mb-1">{formatNum(value)}</div>
                <div className="flex items-center gap-2 text-xs">
                  <span className={delta.color}>{delta.label}</span>
                  <span className="text-brand-muted">vs semana ant.</span>
                </div>
                {!hasConfig && (
                  <p className="text-[11px] text-brand-muted mt-2">Nao configurado</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Chart */}
        <div className="bg-brand-surface rounded-2xl p-5 border border-white/10">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Evolucao 12 semanas</h3>
          <LineChart data={data.history} />
        </div>

        <p className="text-xs text-brand-muted/60 mt-10 leading-relaxed">
          Dados do Spotify (ouvintes mensais via pagina publica) e YouTube (inscritos via API oficial) atualizados automaticamente.
          Instagram e TikTok via input manual (OAuth dessas plataformas exige aprovacao burocratica).
        </p>
      </div>
    </div>
  );
}

// =============== CHART ===============

function LineChart({ data }: { data: Record<GrowthSource, Array<{ date: string; value: number }>> }) {
  const W = 600;
  const H = 200;
  const PAD = 30;

  const sources: GrowthSource[] = ['spotify', 'youtube', 'instagram', 'tiktok'];
  const colors: Record<GrowthSource, string> = {
    spotify: '#1DB954',
    youtube: '#FF0000',
    instagram: '#E040FB',
    tiktok: '#00D9F5',
  };

  // Determinar range comum de datas
  const allDatesMap: Record<string, true> = {};
  for (const source of sources) {
    for (const p of data[source]) allDatesMap[p.date] = true;
  }
  const dates = Object.keys(allDatesMap).sort();
  if (dates.length === 0) {
    return <p className="text-sm text-brand-muted">Ainda sem historico. Primeira captura aparece aqui apos seu primeiro refresh.</p>;
  }

  // Cada source usa sua propria escala (independentes) — pontos normalizados
  const activeSources = sources.filter((s) => data[s].length >= 2);

  return (
    <div className="w-full overflow-x-auto">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block" height={220}>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((pct) => (
          <line
            key={pct}
            x1={PAD}
            y1={PAD + (H - 2 * PAD) * pct}
            x2={W - PAD}
            y2={PAD + (H - 2 * PAD) * pct}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
          />
        ))}

        {/* Linhas por source */}
        {activeSources.map((source) => {
          const points = data[source];
          if (points.length === 0) return null;
          const minV = Math.min(...points.map((p) => p.value));
          const maxV = Math.max(...points.map((p) => p.value));
          const range = Math.max(1, maxV - minV);

          const coords = points.map((p, i) => {
            const x = PAD + (i / Math.max(1, points.length - 1)) * (W - 2 * PAD);
            const y = H - PAD - ((p.value - minV) / range) * (H - 2 * PAD);
            return { x, y };
          });

          const pathD = coords.map((c, i) => (i === 0 ? `M ${c.x} ${c.y}` : `L ${c.x} ${c.y}`)).join(' ');

          return (
            <g key={source}>
              <path d={pathD} fill="none" stroke={colors[source]} strokeWidth="2" strokeLinecap="round" />
              {coords.map((c, i) => (
                <circle key={i} cx={c.x} cy={c.y} r="3" fill={colors[source]} />
              ))}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4">
        {activeSources.map((s) => (
          <div key={s} className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-sm" style={{ background: colors[s] }} />
            <span className="text-white/70">{GROWTH_SOURCE_META[s].label}</span>
            <span className="text-brand-muted">· {data[s].length} pts</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============== HELPERS ===============

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-white mb-1">{label}</label>
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

