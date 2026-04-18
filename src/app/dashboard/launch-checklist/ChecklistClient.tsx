'use client';

import { useEffect, useMemo, useState } from 'react';
import type {
  ChecklistInput,
  ReleaseType,
  ChecklistObjective,
  ChecklistBudget,
  ChecklistItem,
} from '@/lib/types/tools';
import { PHASE_META, CATEGORY_META, calculateItemDueDate } from '@/lib/checklist-template';
import { ToolPageHeader } from '@/components/ToolPageHeader';
import { ToolIcon } from '@/components/ToolIcon';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

type ChecklistItemWithState = ChecklistItem & { completed: boolean; completed_at?: string; skipped?: boolean };

interface StoredChecklist {
  id: string;
  input: ChecklistInput;
  items: ChecklistItemWithState[];
  created_at: string;
}

type View = 'list' | 'setup' | 'timeline';

const DEFAULT_INPUT: ChecklistInput = {
  release_type: 'single',
  release_date: '',
  release_title: '',
  objective: 'discovery',
  budget: 'caseiro',
  platforms: ['spotify', 'apple', 'youtube_music'],
};

const OBJECTIVE_OPTIONS: Array<{ v: ChecklistObjective; label: string; desc: string }> = [
  { v: 'discovery', label: 'Ser descoberto', desc: 'Algoritmo + playlists editoriais' },
  { v: 'monetization', label: 'Monetizar', desc: 'Streams consistentes + direitos' },
  { v: 'radio', label: 'Entrar na rádio', desc: 'Rádio + imprensa tradicional' },
];

const BUDGET_OPTIONS: Array<{ v: ChecklistBudget; label: string; desc: string }> = [
  { v: 'caseiro', label: 'Caseiro', desc: 'R$0-500' },
  { v: 'medio', label: 'Médio', desc: 'R$500-5k' },
  { v: 'pro', label: 'Profissional', desc: 'R$5k+' },
];

function formatDateBR(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function daysUntil(iso: string): number {
  const target = new Date(iso + 'T12:00:00');
  const now = new Date();
  now.setHours(12, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function ChecklistClient() {
  const [view, setView] = useState<View>('list');
  const [checklists, setChecklists] = useState<StoredChecklist[]>([]);
  const [activeChecklist, setActiveChecklist] = useState<StoredChecklist | null>(null);
  const [input, setInput] = useState<ChecklistInput>(DEFAULT_INPUT);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const loadChecklists = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/tools/checklist/list');
      if (!res.ok) throw new Error('Falha ao carregar checklists');
      const data = (await res.json()) as { checklists?: StoredChecklist[] };
      setChecklists(data.checklists ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar checklists');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadChecklists(); }, []);

  const createChecklist = async () => {
    setCreating(true);
    setError('');
    try {
      const res = await fetch('/api/tools/checklist/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json() as { error: string };
        throw new Error(err.error);
      }
      const data = await res.json() as { checklist: StoredChecklist };
      setChecklists([data.checklist, ...checklists]);
      setActiveChecklist(data.checklist);
      setView('timeline');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setCreating(false);
    }
  };

  const toggleItem = async (itemId: string, completed: boolean) => {
    if (!activeChecklist) return;
    const previousItems = activeChecklist.items;
    const updatedItems = activeChecklist.items.map((it) =>
      it.id === itemId ? { ...it, completed, completed_at: completed ? new Date().toISOString() : undefined } : it
    );
    setActiveChecklist({ ...activeChecklist, items: updatedItems });
    try {
      const res = await fetch('/api/tools/checklist/update-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checklist_id: activeChecklist.id, item_id: itemId, completed }),
      });
      if (!res.ok) throw new Error('Falha ao atualizar item');
    } catch {
      setActiveChecklist({ ...activeChecklist, items: previousItems });
      setError('Erro ao salvar. Tente novamente.');
    }
  };

  const skipItem = async (itemId: string) => {
    if (!activeChecklist) return;
    const item = activeChecklist.items.find((it) => it.id === itemId);
    if (!item) return;
    const newSkipped = !item.skipped;
    const updatedItems = activeChecklist.items.map((it) =>
      it.id === itemId ? { ...it, skipped: newSkipped } : it
    );
    setActiveChecklist({ ...activeChecklist, items: updatedItems });
    await fetch('/api/tools/checklist/update-item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checklist_id: activeChecklist.id, item_id: itemId, skipped: newSkipped }),
    });
  };

  const canSubmit = input.release_title.trim().length > 0 && !!input.release_date;

  // ========== VIEW: LIST ==========
  if (view === 'list' && !activeChecklist) {
    return (
      <div className="min-h-screen bg-brand-dark text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <ToolPageHeader
            title="Checklist de Lançamento"
            description="Planejamento completo de 8 semanas antes até 2 semanas pós-release. Curado com padrões de A&R indie BR. Edite, pule e adapte conforme for."
            icon={<ToolIcon tool="launch-checklist" size={22} />}
            accent="purple"
          />

          <div className="flex justify-end mb-6">
            <button
              onClick={() => setView('setup')}
              className="px-5 py-3 bg-gradient-to-r from-brand-purple to-brand-purple/80 text-white font-bold rounded-xl"
            >
              + Nova checklist
            </button>
          </div>

          {loading ? (
            <LoadingSpinner label="Carregando..." />
          ) : error ? (
            <ErrorMessage message={error} onRetry={loadChecklists} />
          ) : checklists.length === 0 ? (
            <div className="bg-brand-surface rounded-2xl p-12 border border-white/10 text-center">
              <p className="text-white/60 mb-4">Você ainda não tem nenhuma checklist.</p>
              <button
                onClick={() => setView('setup')}
                className="px-5 py-3 bg-gradient-to-r from-brand-purple to-brand-purple/80 text-white font-bold rounded-xl"
              >
                Criar primeira checklist
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {checklists.map((cl) => {
                const total = cl.items.length;
                const done = cl.items.filter((it) => it.completed).length;
                const skipped = cl.items.filter((it) => it.skipped).length;
                const progressPct = total > 0 ? Math.round(((done + skipped) / total) * 100) : 0;
                const days = daysUntil(cl.input.release_date);
                return (
                  <button
                    key={cl.id}
                    onClick={() => {
                      setActiveChecklist(cl);
                      setView('timeline');
                    }}
                    className="w-full text-left bg-brand-surface hover:bg-white/[0.04] rounded-2xl p-5 border border-white/10 hover:border-brand-purple/40 transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-white">{cl.input.release_title}</h3>
                        <p className="text-xs text-brand-muted font-mono uppercase tracking-wider mt-0.5">
                          {cl.input.release_type} · lançamento em {formatDateBR(cl.input.release_date)}
                          {days >= 0 && days <= 60 && <span className="ml-2 text-brand-purple">· {days} dias</span>}
                          {days < 0 && <span className="ml-2 text-brand-muted">· há {Math.abs(days)} dias</span>}
                        </p>
                      </div>
                      <span className="text-xs font-mono text-brand-muted">{progressPct}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-brand-purple to-brand-purple/60" style={{ width: `${progressPct}%` }} />
                    </div>
                    <p className="text-xs text-brand-muted mt-2">
                      {done}/{total} feito · {skipped} pulado
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ========== VIEW: SETUP ==========
  if (view === 'setup') {
    return (
      <div className="min-h-screen bg-brand-dark text-white py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <ToolPageHeader
            title="Nova Checklist de Lançamento"
            description="Preenche uma vez e a gente monta uma checklist personalizada de 8 semanas com prazos calculados automaticamente."
            icon={<ToolIcon tool="launch-checklist" size={22} />}
            accent="purple"
          />

          <div className="bg-brand-surface rounded-2xl p-8 border border-white/10 space-y-6">
            <Field label="Título do release" required>
              <TextInput value={input.release_title} onChange={(v) => setInput({ ...input, release_title: v })} placeholder="Ex: Tem Certeza (single)" />
            </Field>

            <Field label="Data do lançamento" required hint="Idealmente uma sexta-feira (use Quando Lançar pra escolher)">
              <input
                type="date"
                value={input.release_date}
                onChange={(e) => setInput({ ...input, release_date: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-green/50"
              />
            </Field>

            <Field label="Tipo de release">
              <div className="grid grid-cols-3 gap-2">
                {(['single', 'ep', 'album'] as ReleaseType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setInput({ ...input, release_type: t })}
                    className={`px-3 py-3 rounded-xl border text-sm font-semibold transition uppercase ${
                      input.release_type === t ? 'border-brand-purple bg-brand-purple/10 text-white' : 'border-white/10 bg-white/[0.02] text-white/70'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Objetivo principal" hint="Adapta quais itens entram na checklist">
              <div className="space-y-2">
                {OBJECTIVE_OPTIONS.map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => setInput({ ...input, objective: o.v })}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition ${
                      input.objective === o.v ? 'border-brand-purple bg-brand-purple/10 text-white' : 'border-white/10 bg-white/[0.02] text-white/70'
                    }`}
                  >
                    <div className="font-semibold">{o.label}</div>
                    <div className="text-xs text-brand-muted">{o.desc}</div>
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Orçamento do lançamento">
              <div className="grid grid-cols-3 gap-2">
                {BUDGET_OPTIONS.map((b) => (
                  <button
                    key={b.v}
                    type="button"
                    onClick={() => setInput({ ...input, budget: b.v })}
                    className={`px-3 py-3 rounded-xl border text-left transition ${
                      input.budget === b.v ? 'border-brand-purple bg-brand-purple/10 text-white' : 'border-white/10 bg-white/[0.02] text-white/70'
                    }`}
                  >
                    <div className="font-semibold text-sm">{b.label}</div>
                    <div className="text-xs text-brand-muted">{b.desc}</div>
                  </button>
                ))}
              </div>
            </Field>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">{error}</div>
            )}

            <div className="flex gap-3 pt-4 border-t border-white/5">
              <button
                onClick={() => setView('list')}
                className="px-5 py-3 border border-white/10 text-white rounded-xl hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                onClick={createChecklist}
                disabled={!canSubmit || creating}
                className="flex-1 px-5 py-3 bg-gradient-to-r from-brand-purple to-brand-purple/80 text-white font-bold rounded-xl disabled:opacity-50"
              >
                {creating ? 'Criando...' : 'Criar checklist'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========== VIEW: TIMELINE ==========
  return <ChecklistTimeline
    checklist={activeChecklist!}
    onBack={() => { setActiveChecklist(null); setView('list'); }}
    onToggleItem={toggleItem}
    onSkipItem={skipItem}
  />;
}

// ========== TIMELINE COMPONENT ==========

function ChecklistTimeline({
  checklist,
  onBack,
  onToggleItem,
  onSkipItem,
}: {
  checklist: StoredChecklist;
  onBack: () => void;
  onToggleItem: (id: string, done: boolean) => void;
  onSkipItem: (id: string) => void;
}) {
  const phases = useMemo(() => {
    const grouped: Record<string, ChecklistItemWithState[]> = {};
    for (const item of checklist.items) {
      if (!grouped[item.phase]) grouped[item.phase] = [];
      grouped[item.phase].push(item);
    }
    return grouped;
  }, [checklist.items]);

  const phaseOrder: Array<keyof typeof PHASE_META> = ['D-56', 'D-28', 'D-14', 'D-7', 'D-0', 'D+14'];
  const total = checklist.items.length;
  const done = checklist.items.filter((it) => it.completed).length;
  const skipped = checklist.items.filter((it) => it.skipped).length;
  const progressPct = total > 0 ? Math.round(((done + skipped) / total) * 100) : 0;
  const daysToRelease = daysUntil(checklist.input.release_date);

  return (
    <div className="min-h-screen bg-brand-dark text-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-brand-muted hover:text-white transition-colors mb-6"
        >
          <span>←</span>
          <span>Voltar para minhas checklists</span>
        </button>

        {/* Header */}
        <div className="bg-brand-surface rounded-2xl p-6 border border-white/10 mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-brand-purple mb-1">
                {checklist.input.release_type} · {checklist.input.objective} · orçamento {checklist.input.budget}
              </p>
              <h1 className="text-2xl font-bold text-white mb-1">{checklist.input.release_title}</h1>
              <p className="text-sm text-brand-muted">
                Lançamento em <strong className="text-white">{formatDateBR(checklist.input.release_date)}</strong>
                {daysToRelease >= 0 ? ` · em ${daysToRelease} dias` : ` · há ${Math.abs(daysToRelease)} dias`}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-white">{progressPct}%</div>
              <p className="text-xs text-brand-muted font-mono">{done}/{total} · {skipped} pulado</p>
            </div>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-purple to-brand-purple/60 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Phases */}
        <div className="space-y-6">
          {phaseOrder.map((phase) => {
            const items = phases[phase] ?? [];
            if (items.length === 0) return null;
            const phaseDone = items.filter((it) => it.completed).length;
            return (
              <section key={phase}>
                <div className="flex items-baseline justify-between mb-3">
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">{PHASE_META[phase].label}</h2>
                    <p className="text-xs text-brand-muted">{PHASE_META[phase].description}</p>
                  </div>
                  <span className="text-xs text-brand-muted font-mono">{phaseDone}/{items.length}</span>
                </div>

                <div className="space-y-2">
                  {items.map((item) => {
                    const dueDate = calculateItemDueDate(checklist.input.release_date, item.due_offset_days);
                    const days = daysUntil(dueDate);
                    const isOverdue = days < 0 && !item.completed && !item.skipped;
                    const isSoon = days >= 0 && days <= 7 && !item.completed && !item.skipped;
                    return (
                      <div
                        key={item.id}
                        className={`flex gap-4 p-4 rounded-2xl border transition ${
                          item.completed
                            ? 'border-brand-purple/30 bg-brand-purple/5'
                            : item.skipped
                            ? 'border-white/5 bg-white/[0.01] opacity-50'
                            : isOverdue
                            ? 'border-red-500/30 bg-red-500/5'
                            : isSoon
                            ? 'border-yellow-500/30 bg-yellow-500/5'
                            : 'border-white/10 bg-white/[0.02]'
                        }`}
                      >
                        <button
                          onClick={() => onToggleItem(item.id, !item.completed)}
                          disabled={item.skipped}
                          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 mt-0.5 flex items-center justify-center transition disabled:opacity-40 ${
                            item.completed ? 'bg-brand-purple border-brand-purple' : 'border-white/30 hover:border-white/60'
                          }`}
                        >
                          {item.completed && <span className="text-white text-xs">✓</span>}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-1">
                            <h3 className={`font-semibold text-sm leading-snug ${
                              item.completed ? 'text-white/50 line-through' : item.skipped ? 'text-white/40 line-through' : 'text-white'
                            }`}>
                              {item.title}
                              {item.importance === 'critical' && (
                                <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 ml-2 align-middle">
                                  crítico
                                </span>
                              )}
                              {item.importance === 'important' && (
                                <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 ml-2 align-middle">
                                  importante
                                </span>
                              )}
                              {item.importance === 'optional' && (
                                <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-white/10 text-white/50 ml-2 align-middle">
                                  opcional
                                </span>
                              )}
                            </h3>
                            <span className={`text-[10px] font-mono flex-shrink-0 px-1.5 py-0.5 rounded ${
                              CATEGORY_META[item.category].color === 'purple' ? 'bg-brand-purple/15 text-brand-purple' :
                              CATEGORY_META[item.category].color === 'green' ? 'bg-brand-green/15 text-brand-green' :
                              CATEGORY_META[item.category].color === 'orange' ? 'bg-brand-orange/15 text-brand-orange' :
                              CATEGORY_META[item.category].color === 'yellow' ? 'bg-yellow-500/15 text-yellow-400' :
                              CATEGORY_META[item.category].color === 'red' ? 'bg-red-500/15 text-red-400' :
                              CATEGORY_META[item.category].color === 'blue' ? 'bg-blue-500/15 text-blue-400' :
                              'bg-pink-500/15 text-pink-400'
                            }`}>
                              {CATEGORY_META[item.category].label}
                            </span>
                          </div>

                          <p className={`text-xs leading-relaxed mb-2 ${
                            item.completed || item.skipped ? 'text-white/40' : 'text-white/70'
                          }`}>
                            {item.description}
                          </p>

                          <div className="flex items-center gap-3 text-[11px] flex-wrap">
                            <span className={`font-mono ${
                              isOverdue ? 'text-red-400' : isSoon ? 'text-yellow-400' : 'text-brand-muted'
                            }`}>
                              {formatDateBR(dueDate)}
                              {isOverdue && ` · atrasado`}
                              {isSoon && ` · em ${days}d`}
                            </span>
                            {item.link_url && item.link_label && (
                              <a
                                href={item.link_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-brand-purple hover:underline"
                              >
                                {item.link_label} →
                              </a>
                            )}
                            {item.link_tool && (
                              <a
                                href={`/dashboard/${item.link_tool}`}
                                className="text-brand-orange hover:text-brand-orange/80"
                              >
                                Abrir {item.link_tool.replace('-', ' ')} →
                              </a>
                            )}
                            <button
                              onClick={() => onSkipItem(item.id)}
                              className="text-brand-muted hover:text-white ml-auto"
                            >
                              {item.skipped ? 'desmarcar pular' : 'pular'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <p className="text-xs text-brand-muted/60 mt-10 leading-relaxed">
          Progresso é salvo automaticamente. Marque como feito conforme executa. Pule itens que não se aplicam ao seu caso.
        </p>
      </div>
    </div>
  );
}

// ========== HELPERS ==========

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
