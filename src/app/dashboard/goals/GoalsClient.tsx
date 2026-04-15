'use client';

import { useEffect, useState } from 'react';
import type { GoalMetric, GoalProgress } from '@/lib/types/tools';
import { GOAL_METRIC_META } from '@/lib/types/tools';
import { ToolPageHeader } from '@/components/ToolPageHeader';
import { ToolIcon } from '@/components/ToolIcon';

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

export function GoalsClient() {
  const [goals, setGoals] = useState<GoalProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<{ title: string; metric: GoalMetric; target_value: number; target_date: string }>({
    title: '',
    metric: 'spotify_listeners',
    target_value: 0,
    target_date: '',
  });

  const load = async () => {
    const res = await fetch('/api/tools/goals/list');
    const data = await res.json() as { goals?: GoalProgress[] };
    setGoals(data.goals ?? []);
    setLoading(false);
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
    await fetch('/api/tools/goals/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal_id: goalId, ...update }),
    });
    load();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark text-white py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <ToolPageHeader
            title="Meta Tracker"
            description="Carregando..."
            icon={<ToolIcon tool="goals" size={22} />}
            accent="orange"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark text-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <ToolPageHeader
          title="Meta Tracker"
          description="Defina metas concretas e acompanhe se esta no ritmo certo pra bater. Usa dados do Growth Tracker."
          icon={<ToolIcon tool="goals" size={22} />}
          accent="orange"
        />

        <div className="flex justify-end mb-6">
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-4 py-2 text-sm bg-gradient-to-r from-brand-orange to-brand-orange/80 text-black font-semibold rounded-xl"
          >
            + Nova meta
          </button>
        </div>

        {showAdd && (
          <div className="bg-brand-surface rounded-2xl p-6 border border-white/10 mb-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Criar meta</h3>
            <Field label="Titulo" required hint="Ex: 10k ouvintes ate julho">
              <TextInput value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="Meu objetivo..." />
            </Field>
            <Field label="Metrica" required>
              <select
                value={form.metric}
                onChange={(e) => setForm({ ...form, metric: e.target.value as GoalMetric })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange/50"
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
                  value={form.target_value || ''}
                  onChange={(e) => setForm({ ...form, target_value: Number(e.target.value) || 0 })}
                  placeholder="Ex: 10000"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange/50"
                />
              </Field>
              <Field label="Data alvo" required>
                <input
                  type="date"
                  value={form.target_date}
                  onChange={(e) => setForm({ ...form, target_date: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange/50"
                />
              </Field>
            </div>
            {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">{error}</div>}
            <div className="flex gap-2">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2.5 border border-white/10 text-white rounded-xl hover:bg-white/5">Cancelar</button>
              <button
                onClick={create}
                disabled={creating || !form.title.trim() || form.target_value <= 0 || !form.target_date}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-brand-orange to-brand-orange/80 text-black font-semibold rounded-xl disabled:opacity-50"
              >
                {creating ? 'Criando...' : 'Criar meta'}
              </button>
            </div>
          </div>
        )}

        {goals.length === 0 ? (
          <div className="bg-brand-surface rounded-2xl p-12 border border-white/10 text-center">
            <p className="text-white/60 mb-4">Voce ainda nao tem metas.</p>
            <p className="text-xs text-brand-muted">Comece com uma: &ldquo;10k ouvintes no Spotify ate janeiro&rdquo; ou &ldquo;5k subs YouTube em 6 meses&rdquo;.</p>
          </div>
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
                  <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-full border ${statusColor(gp.status)}`}>
                    {statusLabel(gp.status)}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-white/80 font-semibold">{formatNum(gp.current_value)}</span>
                    <span className="text-brand-muted font-mono">{gp.progress_pct.toFixed(0)}%</span>
                    <span className="text-brand-muted font-mono">{formatNum(gp.goal.target_value)}</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        gp.status === 'achieved' || gp.status === 'on_track' ? 'bg-gradient-to-r from-brand-green to-brand-green/70'
                          : gp.status === 'tight' ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                          : 'bg-gradient-to-r from-red-400 to-red-600'
                      }`}
                      style={{ width: `${Math.min(100, gp.progress_pct)}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
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

                {/* Recomendacao */}
                <p className="text-sm text-white/85 leading-relaxed mb-4">{gp.recommendation}</p>

                {/* Actions */}
                <div className="flex gap-2 text-xs pt-3 border-t border-white/5">
                  {gp.status !== 'achieved' && gp.current_value !== null && gp.current_value >= gp.goal.target_value && (
                    <button
                      onClick={() => updateGoal(gp.goal.id, { status: 'achieved' })}
                      className="px-3 py-1.5 bg-brand-green/10 hover:bg-brand-green/20 text-brand-green rounded-lg font-semibold"
                    >
                      ✓ marcar como atingida
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
                    onClick={() => { if (confirm('Deletar essa meta?')) updateGoal(gp.goal.id, { action: 'delete' }); }}
                    className="px-3 py-1.5 text-red-400 hover:text-red-300 rounded-lg ml-auto"
                  >
                    deletar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-brand-muted/60 mt-10 leading-relaxed">
          Metas comparam o ritmo das ultimas 4 semanas de snapshots (Growth Tracker) com o crescimento necessario pra bater no prazo.
          Precisa de pelo menos 2 snapshots pra calcular ritmo.
        </p>
      </div>
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
      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-brand-orange/50"
    />
  );
}
