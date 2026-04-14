'use client';

import { useMemo, useState } from 'react';
import type {
  CacheInput,
  ArtistStage,
  VenueType,
  CityTier,
  CacheExpenses,
} from '@/lib/types/tools';
import { STAGE_META, VENUE_META, CITY_TIER_META } from '@/lib/types/tools';
import { calculateCache, inferStageFromListeners } from '@/lib/cache-reference-table';
import { ToolPageHeader } from '@/components/ToolPageHeader';
import { ToolIcon } from '@/components/ToolIcon';

const DEFAULT_EXPENSES: CacheExpenses = {
  transport: 0,
  accommodation: 0,
  meals: 0,
  hired_musicians: 0,
  equipment: 0,
  tech_crew: 0,
  commission: 0,
  other: 0,
};

const DEFAULT_INPUT: CacheInput = {
  stage: 'emerging',
  monthly_listeners: undefined,
  venue_type: 'club_small',
  show_city_tier: 'tier1',
  musicians_traveling: 3,
  expenses: { ...DEFAULT_EXPENSES },
};

const EXPENSE_LABELS: Array<{ key: keyof CacheExpenses; label: string; hint?: string }> = [
  { key: 'transport', label: 'Transporte (ida + volta)', hint: 'Combustivel, passagens, uber, etc.' },
  { key: 'accommodation', label: 'Hospedagem', hint: 'Se nao fornecida pelo contratante' },
  { key: 'meals', label: 'Alimentacao' },
  { key: 'hired_musicians', label: 'Cache musicos contratados', hint: 'Total pra todos os musicos que levou' },
  { key: 'equipment', label: 'Equipamento extra', hint: 'Aluguel de qualquer equipamento' },
  { key: 'tech_crew', label: 'Tecnico / roadie' },
  { key: 'commission', label: 'Comissao empresario/agent', hint: 'Valor absoluto. Geralmente 15-20% do cache.' },
  { key: 'other', label: 'Outros', hint: 'Qualquer coisa que nao cabe acima' },
];

const PIE_COLORS = ['#00f5a0', '#00d9f5', '#e040fb', '#ffa500', '#ffd700', '#ff6b6b', '#a29bfe', '#fd79a8'];

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatBRLCompact(value: number): string {
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1).replace('.0', '')}M`;
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(1).replace('.0', '')}k`;
  return formatBRL(value);
}

export function CacheClient() {
  const [input, setInput] = useState<CacheInput>(DEFAULT_INPUT);
  const [autoStage, setAutoStage] = useState(false);

  const result = useMemo(() => calculateCache(input), [input]);

  const update = <K extends keyof CacheInput>(key: K, value: CacheInput[K]) => {
    setInput({ ...input, [key]: value });
  };

  const updateExpense = (key: keyof CacheExpenses, value: number) => {
    setInput({
      ...input,
      expenses: { ...input.expenses, [key]: Math.max(0, value) },
    });
  };

  const updateListeners = (value: string) => {
    const num = value.trim() === '' ? undefined : Math.max(0, Number(value) || 0);
    if (autoStage && typeof num === 'number') {
      setInput({
        ...input,
        monthly_listeners: num,
        stage: inferStageFromListeners(num),
      });
    } else {
      setInput({ ...input, monthly_listeners: num });
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark text-white py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <ToolPageHeader
          title="Calculadora de Cache"
          description="Em 2 minutos voce sabe quanto cobrar e quanto sobra no bolso. Baseado em dados reais do mercado indie BR."
          icon={<ToolIcon tool="cache" size={22} />}
          accent="green"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ===================== INPUTS ===================== */}
          <div className="space-y-6">
            {/* Perfil */}
            <div className="bg-brand-surface rounded-2xl p-6 border border-white/10 space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">1. Seu perfil</h2>

              <Field label="Ouvintes mensais no Spotify (opcional)" hint="Se informar, calculamos seu estagio automaticamente">
                <input
                  type="number"
                  min={0}
                  value={input.monthly_listeners ?? ''}
                  onChange={(e) => updateListeners(e.target.value)}
                  placeholder="Ex: 12000"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-brand-green/50"
                />
              </Field>

              <div className="flex items-center gap-2">
                <input
                  id="auto-stage"
                  type="checkbox"
                  checked={autoStage}
                  onChange={(e) => {
                    setAutoStage(e.target.checked);
                    if (e.target.checked && typeof input.monthly_listeners === 'number') {
                      update('stage', inferStageFromListeners(input.monthly_listeners));
                    }
                  }}
                  className="w-4 h-4 accent-brand-green"
                />
                <label htmlFor="auto-stage" className="text-xs text-brand-muted cursor-pointer">
                  Inferir estagio a partir dos ouvintes automaticamente
                </label>
              </div>

              <Field label="Seu estagio de carreira">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(Object.keys(STAGE_META) as ArtistStage[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => update('stage', s)}
                      disabled={autoStage && typeof input.monthly_listeners === 'number'}
                      className={`px-3 py-2.5 rounded-xl border text-left transition disabled:opacity-50 ${
                        input.stage === s
                          ? 'border-brand-green bg-brand-green/10 text-white'
                          : 'border-white/10 bg-white/[0.02] text-white/70 hover:border-white/20'
                      }`}
                    >
                      <div className="font-semibold text-sm">{STAGE_META[s].label}</div>
                      <div className="text-xs text-brand-muted mt-0.5">{STAGE_META[s].listeners_desc}</div>
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            {/* Show */}
            <div className="bg-brand-surface rounded-2xl p-6 border border-white/10 space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">2. Sobre o show</h2>

              <Field label="Tipo de venue">
                <select
                  value={input.venue_type}
                  onChange={(e) => update('venue_type', e.target.value as VenueType)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-green/50"
                >
                  {(Object.keys(VENUE_META) as VenueType[]).map((v) => (
                    <option key={v} value={v} className="bg-brand-surface">
                      {VENUE_META[v].label} — {VENUE_META[v].capacity}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Cidade do show">
                <div className="grid grid-cols-1 gap-2">
                  {(Object.keys(CITY_TIER_META) as CityTier[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => update('show_city_tier', t)}
                      className={`px-3 py-2.5 rounded-xl border text-left transition ${
                        input.show_city_tier === t
                          ? 'border-brand-green bg-brand-green/10 text-white'
                          : 'border-white/10 bg-white/[0.02] text-white/70 hover:border-white/20'
                      }`}
                    >
                      <div className="font-semibold text-sm">{CITY_TIER_META[t].label}</div>
                      <div className="text-xs text-brand-muted mt-0.5">
                        {CITY_TIER_META[t].example} · multiplicador {CITY_TIER_META[t].multiplier}x
                      </div>
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Quantos musicos vao viajar" hint="Incluindo voce">
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={input.musicians_traveling}
                  onChange={(e) => update('musicians_traveling', Math.max(1, Number(e.target.value) || 1))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-green/50"
                />
              </Field>
            </div>

            {/* Despesas */}
            <div className="bg-brand-surface rounded-2xl p-6 border border-white/10 space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">3. Despesas do show</h2>
              <p className="text-xs text-brand-muted">
                Preencha apenas o que vai pagar do proprio bolso. Se o CONTRATANTE ja fornece hospedagem, deixe em branco.
              </p>
              <div className="space-y-2">
                {EXPENSE_LABELS.map((exp) => (
                  <div key={exp.key} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{exp.label}</div>
                      {exp.hint && <div className="text-[11px] text-brand-muted truncate">{exp.hint}</div>}
                    </div>
                    <div className="relative w-32 flex-shrink-0">
                      <span className="absolute left-3 top-2.5 text-brand-muted text-sm">R$</span>
                      <input
                        type="number"
                        min={0}
                        value={input.expenses[exp.key] || ''}
                        onChange={(e) => updateExpense(exp.key, Number(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-2 py-2 text-white text-sm focus:outline-none focus:border-brand-green/50"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-sm pt-3 border-t border-white/5">
                <span className="text-brand-muted">Total de despesas</span>
                <span className="font-bold text-white">{formatBRL(result.total_expenses)}</span>
              </div>
            </div>
          </div>

          {/* ===================== RESULTADO ===================== */}
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            {/* Cards principais */}
            <div className="bg-gradient-to-br from-brand-green/10 to-brand-green/5 rounded-2xl p-6 border border-brand-green/30">
              <p className="text-xs uppercase tracking-wider text-brand-green font-mono mb-2">Cache sugerido</p>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-4xl font-black text-white">{formatBRLCompact(result.suggested_median)}</span>
                <span className="text-sm text-brand-muted">mediana</span>
              </div>
              <div className="flex justify-between text-sm">
                <div>
                  <div className="text-xs text-brand-muted">Minimo</div>
                  <div className="text-white font-semibold">{formatBRLCompact(result.suggested_min)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-brand-muted">Maximo</div>
                  <div className="text-white font-semibold">{formatBRLCompact(result.suggested_max)}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-brand-surface rounded-2xl p-4 border border-white/10">
                <p className="text-[11px] uppercase tracking-wider text-brand-muted font-mono mb-1">Break-even</p>
                <div className="text-xl font-bold text-white">{formatBRLCompact(result.break_even)}</div>
                <div className="text-xs text-brand-muted mt-1">Seu piso pra nao dar prejuizo</div>
              </div>
              <div className={`rounded-2xl p-4 border ${
                result.profit_at_median < 0
                  ? 'bg-red-500/10 border-red-500/30'
                  : result.margin_percent_at_median < 20
                  ? 'bg-yellow-500/10 border-yellow-500/30'
                  : 'bg-brand-green/5 border-brand-green/20'
              }`}>
                <p className="text-[11px] uppercase tracking-wider text-brand-muted font-mono mb-1">Lucro liquido</p>
                <div className={`text-xl font-bold ${
                  result.profit_at_median < 0 ? 'text-red-400' : result.margin_percent_at_median < 20 ? 'text-yellow-300' : 'text-brand-green'
                }`}>
                  {formatBRLCompact(result.profit_at_median)}
                </div>
                <div className="text-xs text-brand-muted mt-1">
                  Margem {result.margin_percent_at_median.toFixed(0)}%
                </div>
              </div>
            </div>

            {/* Expense Pie Chart */}
            {result.expense_breakdown.length > 0 && (
              <div className="bg-brand-surface rounded-2xl p-6 border border-white/10">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Onde vai o dinheiro</h3>
                <div className="flex items-center gap-4">
                  <PieChart data={result.expense_breakdown} />
                  <div className="flex-1 space-y-1.5 min-w-0">
                    {result.expense_breakdown.map((e, i) => (
                      <div key={e.label} className="flex items-center gap-2 text-xs">
                        <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-white/80 truncate flex-1">{e.label}</span>
                        <span className="text-brand-muted font-mono">{e.percent.toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Alertas */}
            {result.alerts.length > 0 && (
              <div className="space-y-2">
                {result.alerts.map((alert, i) => (
                  <div
                    key={i}
                    className={`rounded-xl p-4 text-sm border ${
                      alert.toLowerCase().includes('prejuizo')
                        ? 'bg-red-500/10 border-red-500/30 text-red-200'
                        : alert.toLowerCase().includes('alta')
                        ? 'bg-brand-green/10 border-brand-green/30 text-brand-green'
                        : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-100'
                    }`}
                  >
                    {alert}
                  </div>
                ))}
              </div>
            )}

            {/* Sugestoes */}
            {result.suggestions.length > 0 && (
              <div className="bg-brand-surface rounded-2xl p-5 border border-white/10">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
                  Sugestoes de negociacao
                </h3>
                <ul className="space-y-2">
                  {result.suggestions.map((s, i) => (
                    <li key={i} className="flex gap-2 text-sm text-white/85 leading-relaxed">
                      <span className="text-brand-green flex-shrink-0">→</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-brand-muted/60 mt-10 leading-relaxed">
          Base de dados construida com pesquisa de mercado indie BR 2024-2026 (managers, dados publicos GIRA/Superfonia). Aproximado. Valores individuais podem variar — use como referencia, nao regra.
        </p>
      </div>
    </div>
  );
}

// ================ Helpers UI ================

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-white mb-1">{label}</label>
      {hint && <p className="text-xs text-brand-muted mb-2">{hint}</p>}
      {children}
    </div>
  );
}

function PieChart({ data }: { data: Array<{ label: string; value: number; percent: number }> }) {
  const size = 120;
  const radius = 52;
  const cx = size / 2;
  const cy = size / 2;
  let cumulativeAngle = -Math.PI / 2; // comeca no topo

  if (data.length === 0) return null;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
      {data.map((slice, i) => {
        const pct = slice.percent / 100;
        const angle = pct * 2 * Math.PI;
        const x1 = cx + Math.cos(cumulativeAngle) * radius;
        const y1 = cy + Math.sin(cumulativeAngle) * radius;
        const endAngle = cumulativeAngle + angle;
        const x2 = cx + Math.cos(endAngle) * radius;
        const y2 = cy + Math.sin(endAngle) * radius;
        const largeArc = angle > Math.PI ? 1 : 0;

        const path =
          data.length === 1
            ? `M ${cx - radius} ${cy} A ${radius} ${radius} 0 1 1 ${cx + radius} ${cy} A ${radius} ${radius} 0 1 1 ${cx - radius} ${cy}`
            : `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

        cumulativeAngle = endAngle;
        return <path key={i} d={path} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="rgba(0,0,0,0.3)" strokeWidth="0.5" />;
      })}
      {/* Buraco no centro pra virar donut */}
      <circle cx={cx} cy={cy} r={radius * 0.55} fill="rgb(20,20,22)" />
    </svg>
  );
}
