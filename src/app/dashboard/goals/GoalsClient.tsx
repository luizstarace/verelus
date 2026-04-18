'use client';

import { useEffect, useState } from 'react';
import type { GoalMetric, GoalProgress } from '@/lib/types/tools';
import { GOAL_METRIC_META } from '@/lib/types/tools';
import { ToolPageHeader } from '@/components/ToolPageHeader';
import { ToolIcon } from '@/components/ToolIcon';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { PresetSelector } from '@/components/ui/PresetSelector';
import { HelpTooltip } from '@/components/ui/HelpTooltip';
import { GOAL_BENCHMARKS } from '@/lib/tool-content';

function formatNum(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace('.0', '')}k`;
  return n.toLocaleString('pt-BR');
}

function formatDateBR(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function getMinDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

const GOAL_PRESETS = [
  { label: '5k ouvintes Spotify', values: { metric: 'spotify_listeners' as GoalMetric, target_value: 5000, title: '5k ouvintes mensais em 6 meses' } },
  { label: '10k ouvintes Spotify', values: { metric: 'spotify_listeners' as GoalMetric, target_value: 10000, title: '10k ouvintes mensais em 6 meses' } },
  { label: '1k subs YouTube', values: { metric: 'youtube_subscribers' as GoalMetric, target_value: 1000, title: '1k inscritos YouTube em 6 meses' } },
  { label: '5k seguidores IG', values: { metric: 'instagram_followers' as GoalMetric, target_value: 5000, title: '5k seguidores Instagram em 3 meses' } },
];

export function GoalsClient({ embedded }: { embedded?: boolean } = {}) {
  const [goals, setGoals] = useState<GoalProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [form, setForm] = useState<{ title: string; metric: GoalMetric; target_value: number; target_date: string }>({
    title: '',
    metric: 'spotify_listeners',
    target_value: 0,
    target_date: '',
  });

  const load = async () => {
    try {
      setLoadError(null);
      const res = await fetch('/api/tools/goals/list');
      if (!res.ok) throw new Error('Falha ao carregar metas');
      const data = await res.json() as { goals?: GoalProgress[] };
      setGoals(data.goals ?? []);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    setCreating(true);
    setError('');
    try {
      const res = await fetch('/api/tools/goals/create', {
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
      setForm({ title: '', metric: 'spotify_listeners', target_value: 0, target_date: '' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro');
    } finally {
      setCreating(false);
    }
  };

  const updateGoal = async (goalId: string, update: { status?: string; action?: 'delete' }) => {
    try {
      const res = await fetch('/api/tools/goals/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal_id: goalId, ...update }),
      });
      if (!res.ok) throw new Error('Falha ao atualizar meta');
      await load();
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Erro ao atualizar');
    }
  };

  const statusColor = (s: GoalProgress['status']): string => {
    if (s === 'achieved') return 'text-brand-green border-brand-green/40 bg-brand-green/5';
    if (s === 'on_track') return 'text-brand-green border-brand-green/30 bg-brand-green/5';
    if (s === 'tight') return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/5';
    return 'text-red-400 border-red-500/30 bg-red-500/5';
  };
  const statusLabel = (s: GoalProgress['status']): string => {
    if (s === 'achieved') return 'atingida';
    if (s === 'on_track') return 'no ritmo';
    if (s === 'tight') return 'apertado';
    return 'atrasado';
  };

  const goalsContent = (
    <>
        {loading ? (
          <div className="py-20"><LoadingSpinner size="lg" label="Carregando metas..." /></div>
        ) : loadError ? (
          <ErrorMessage message={loadError} onRetry={load} />
        ) : (
          <>
            <div className="flex justify-end mb-6">
              <button
                onClick={() => setShowAdd(!showAdd)}
                className="px-4 py-2 text-sm bg-brand-orange text-black font-bold rounded-xl hover:brightness-110 transition"
              >
                + Nova meta
              </button>
            </div>

            {showAdd && (
              <div className="bg-brand-surface rounded-2xl p-6 border border-white/10 mb-6 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Criar meta</h3>
                <PresetSelector
                  presets={GOAL_PRESETS}
                  onSelect={(v) => setForm((f) => ({
                    ...f,
                    ...v,
                    target_date: (() => { const d = new Date(); d.setMonth(d.getMonth() + (v.metric === 'instagram_followers' || v.metric === 'tiktok_followers' ? 3 : 6)); return d.toISOString().slice(0, 10); })(),
                  }))}
                  label="Metas comuns (pre-preencher)"
                />
                {GOAL_BENCHMARKS[form.metric] && (
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10 text-xs leading-relaxed">
                    <p className="font-semibold text-white/90 mb-1">Benchmarks pra referencia:</p>
                    <p className="text-brand-muted">Emergente: {GOAL_BENCHMARKS[form.metric].emerging}</p>
                    <p className="text-brand-muted">Em crescimento: {GOAL_BENCHMARKS[form.metric].growing}</p>
                    <p className="text-brand-muted">Estabelecido: {GOAL_BENCHMARKS[form.metric].established}</p>
                  </div>
                )}
                <Field label="Titulo" required hint="Ex: 10k ouvintes ate julho">
                  <TextInput value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="Meu objetivo..." />
                </Field>
                <Field label="Metrica" required>
                  <select
                    value={form.metric}
                    onChange={(e) => setForm({ ...form, metric: e.target.value as GoalMetric })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-orange/40"
                  >
                    {Object.keys(GOAL_METRIC_META).map((k) => (
                      <option key={k} value={k} className="bg-brand-surface">
                        {GOAL_METRIC_META[k as GoalMetric].label}
                      </option>
                    ))}
                  </select>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Valor alvo" required>
                    <input
                      type="number"
                      min={1}
                      max={100_000_000}
                      value={form.target_value || ''}
                      onChange={(e) => setForm({ ...form, target_value: Number(e.target.value) || 0 })}
                      placeholder="Ex: 10000"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-orange/40"
                    />
                  </Field>
                  <Field label="Data alvo" required>
                    <input
                      type="date"
                      min={getMinDate()}
                      value={form.target_date}
                      onChange={(e) => setForm({ ...form, target_date: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-orange/40"
                    />
                  </Field>
                </div>
                {error && <ErrorMessage message={error} />}
                <div className="flex gap-2">
                  <button onClick={() => setShowAdd(false)} className="px-4 py-2.5 border border-white/10 text-white/60 rounded-lg hover:bg-white/5 text-sm">Cancelar</button>
                  <button
                    onClick={create}
                    disabled={creating || !form.title.trim() || form.target_value <= 0 || !form.target_date}
                    className="flex-1 px-4 py-2.5 bg-brand-orange text-black font-bold rounded-lg disabled:opacity-50 text-sm"
                  >
                    {creating ? 'Criando...' : 'Criar meta'}
                  </button>
                </div>
              </div>
            )}

            {goals.length === 0 ? (
              <EmptyState
                icon="🎯"
                title="Nenhuma meta ainda"
                description='Comece com algo como "10k ouvintes no Spotify ate janeiro" ou "5k subs YouTube em 6 meses".'
                action={{ label: '+ Nova meta', onClick: () => setShowAdd(true) }}
              />
            ) : (
              <div className="space-y-4">
                {goals.map((gp) => (
                  <div key={gp.goal.id} className={`rounded-2xl p-6 border ${statusColor(gp.status)}`}>
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-white">{gp.goal.title}</h3>
                        <p className="text-xs text-brand-muted font-mono uppercase tracking-wider mt-0.5">
                          {GOAL_METRIC_META[gp.goal.metric].label} · ate {formatDateBR(gp.goal.target_date)}
                        </p>
                      </div>
                      <span className="flex items-center gap-1">
                        <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-full border ${statusColor(gp.status)}`}>
                          {statusLabel(gp.status)}
                        </span>
                        <HelpTooltip content="Status calculado comparando ritmo atual (ultimas 4 semanas) com ritmo necessario para bater a meta. No ritmo = 80%+ do necessario. Apertado = 50-80%. Atrasado = <50%." />
                      </span>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-white/80 font-semibold">{formatNum(gp.current_value)}</span>
                        <span className="text-brand-muted font-mono">{gp.progress_pct.toFixed(0)}%</span>
                        <span className="text-brand-muted font-mono">{formatNum(gp.goal.target_value)}</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            gp.status === 'achieved' || gp.status === 'on_track' ? 'bg-brand-green'
                              : gp.status === 'tight' ? 'bg-yellow-400'
                              : 'bg-red-400'
                          }`}
                          style={{ width: `${Math.min(100, gp.progress_pct)}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-xs">
                      <div>
                        <div className="text-brand-muted uppercase tracking-wider font-mono mb-0.5">Ritmo atual</div>
                        <div className="text-white font-semibold">{gp.actual_per_week !== null ? `${formatNum(gp.actual_per_week)}/sem` : '—'}</div>
                      </div>
                      <div>
                        <div className="text-brand-muted uppercase tracking-wider font-mono mb-0.5">Necessario</div>
                        <div className="text-white font-semibold">{formatNum(gp.required_per_week)}/sem</div>
                      </div>
                      <div>
                        <div className="text-brand-muted uppercase tracking-wider font-mono mb-0.5">Dias restantes</div>
                        <div className="text-white font-semibold">{gp.days_remaining}</div>
                      </div>
                      <div>
                        <div className="text-brand-muted uppercase tracking-wider font-mono mb-0.5">Projecao</div>
                        <div className="text-white font-semibold">{gp.projected_eta ? formatDateBR(gp.projected_eta) : '—'}</div>
                      </div>
                    </div>

                    <p className="text-sm text-white/85 leading-relaxed mb-4">{gp.recommendation}</p>

                    <div className="flex gap-2 text-xs pt-3 border-t border-white/5">
                      {gp.status !== 'achieved' && gp.current_value !== null && gp.current_value >= gp.goal.target_value && (
                        <button
                          onClick={() => updateGoal(gp.goal.id, { status: 'achieved' })}
                          className="px-3 py-1.5 bg-brand-green/10 hover:bg-brand-green/20 text-brand-green rounded-lg font-semibold"
                        >
                          marcar como atingida
                        </button>
                      )}
                      {gp.goal.status === 'active' && (
                        <button
                          onClick={() => updateGoal(gp.goal.id, { status: 'abandoned' })}
                          className="px-3 py-1.5 text-brand-muted hover:text-white rounded-lg"
                        >
                          desistir
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteTarget(gp.goal.id)}
                        className="px-3 py-1.5 text-red-400 hover:text-red-300 rounded-lg ml-auto"
                        aria-label={`Deletar meta ${gp.goal.title}`}
                      >
                        deletar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <p className="text-xs text-brand-muted/60 mt-10 leading-relaxed">
          Metas comparam o ritmo das ultimas 4 semanas de snapshots (Growth Tracker) com o crescimento necessario pra bater no prazo.
          Precisa de pelo menos 2 snapshots pra calcular ritmo.
        </p>

      <ConfirmModal
        open={deleteTarget !== null}
        title="Deletar meta"
        message="Tem certeza? Essa acao nao pode ser desfeita."
        confirmLabel="Deletar"
        danger
        onConfirm={() => { if (deleteTarget) { updateGoal(deleteTarget, { action: 'delete' }); setDeleteTarget(null); } }}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );

  if (embedded) return goalsContent;
  return (
    <div className="min-h-screen bg-brand-dark text-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <ToolPageHeader
          title="Meta Tracker"
          description="Defina metas concretas e acompanhe se esta no ritmo certo pra bater. Usa dados do Growth Tracker."
          icon={<ToolIcon tool="goals" size={22} />}
          accent="orange"
        />
        {goalsContent}
      </div>
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
