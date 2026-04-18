'use client';

import { useMemo, useState } from 'react';
import type { ReleaseTimingInput, ReleaseType } from '@/lib/types/tools';
import { suggestReleaseDates } from '@/lib/release-timing-engine';
import { ToolPageHeader } from '@/components/ToolPageHeader';
import { ToolIcon } from '@/components/ToolIcon';

const MONTH_NAMES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const DEFAULT_INPUT: ReleaseTimingInput = {
  release_type: 'single',
  window_days: 90,
  months_to_avoid: [],
  artist_name: '',
  genre: '',
  has_growth_data: false,
  main_market: 'br',
  goal: 'grow_base',
};

const GOAL_OPTIONS: Array<{ v: ReleaseTimingInput['goal']; label: string; desc: string }> = [
  { v: 'discovery', label: 'Entrar em playlists editoriais', desc: 'Algoritmos, Release Radar, crescer streams rápido' },
  { v: 'grow_base', label: 'Construir fanbase leal', desc: 'Crescimento orgânico, engajamento profundo, longo prazo' },
  { v: 'monetize', label: 'Gerar renda consistente', desc: 'Playlists pagas, streams recorrentes, royalties' },
  { v: 'playlist_placement', label: 'Placement em curadorias', desc: 'Foco em playlists editoriais e independentes' },
  { v: 'press', label: 'Expandir território/alcance', desc: 'Chegar em novos mercados, blogs e jornalistas' },
];

function formatDateBR(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function monthLabelFull(iso: string): string {
  const date = new Date(iso + 'T12:00:00');
  return MONTH_NAMES[date.getMonth()];
}

export function ReleaseTimingClient() {
  const [input, setInput] = useState<ReleaseTimingInput>(DEFAULT_INPUT);

  const result = useMemo(() => suggestReleaseDates(input), [input]);
  const recommendedDates = useMemo(
    () => new Set(result.suggestions.map((s) => s.iso_date)),
    [result.suggestions],
  );

  const update = <K extends keyof ReleaseTimingInput>(key: K, value: ReleaseTimingInput[K]) => {
    setInput({ ...input, [key]: value });
  };

  const toggleMonthAvoid = (month: number) => {
    const current = input.months_to_avoid;
    if (current.includes(month)) {
      update('months_to_avoid', current.filter((m) => m !== month));
    } else {
      update('months_to_avoid', [...current, month]);
    }
  };

  const addToGoogleCalendar = (iso: string) => {
    const date = new Date(iso + 'T09:00:00');
    const endDate = new Date(date);
    endDate.setHours(date.getHours() + 1);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
    const url = new URL('https://calendar.google.com/calendar/render');
    url.searchParams.set('action', 'TEMPLATE');
    url.searchParams.set('text', `Lançamento — ${input.artist_name || 'Release'}`);
    url.searchParams.set('dates', `${fmt(date)}/${fmt(endDate)}`);
    url.searchParams.set('details', `Data sugerida pelo Verelus pro lançamento do seu ${input.release_type}.`);
    window.open(url.toString(), '_blank');
  };

  return (
    <div className="min-h-screen bg-brand-dark text-white py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <ToolPageHeader
          title="Quando Lançar"
          description="3 datas ideais nos próximos 30/60/90 dias pra seu próximo lançamento, pontuadas com base em padrões da indústria indie BR, feriados nacionais e seu objetivo."
          icon={<ToolIcon tool="release-timing" size={22} />}
          accent="purple"
        />

        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
          {/* ===== INPUT ===== */}
          <div className="space-y-4">
            <div className="bg-brand-surface rounded-2xl p-6 border border-white/10 space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Sobre o release</h2>

              <Field label="Nome artístico (opcional)">
                <TextInput value={input.artist_name} onChange={(v) => update('artist_name', v)} placeholder="Pra integrar com Google Calendar" />
              </Field>

              <Field label="Gênero">
                <TextInput value={input.genre} onChange={(v) => update('genre', v)} placeholder="Ex: indie rock, MPB" />
              </Field>

              <Field label="Tipo de release">
                <div className="grid grid-cols-3 gap-2">
                  {(['single', 'ep', 'album'] as ReleaseType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => update('release_type', t)}
                      className={`px-3 py-2.5 rounded-xl border text-sm font-semibold transition uppercase ${
                        input.release_type === t
                          ? 'border-brand-purple bg-brand-purple/10 text-white'
                          : 'border-white/10 bg-white/[0.02] text-white/70'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Janela de busca">
                <div className="grid grid-cols-3 gap-2">
                  {[30, 60, 90].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => update('window_days', d as 30 | 60 | 90)}
                      className={`px-3 py-2.5 rounded-xl border text-sm font-semibold transition ${
                        input.window_days === d
                          ? 'border-brand-purple bg-brand-purple/10 text-white'
                          : 'border-white/10 bg-white/[0.02] text-white/70'
                      }`}
                    >
                      {d} dias
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Qual seu objetivo?">
                <div className="space-y-1.5">
                  {GOAL_OPTIONS.map((g) => (
                    <button
                      key={g.v}
                      type="button"
                      onClick={() => update('goal', g.v)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl border transition ${
                        input.goal === g.v
                          ? 'border-brand-purple bg-brand-purple/10 text-white'
                          : 'border-white/10 bg-white/[0.02] text-white/70'
                      }`}
                    >
                      <div className="font-semibold text-sm">{g.label}</div>
                      <div className="text-xs text-brand-muted">{g.desc}</div>
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Meses a evitar (opcional)" hint="Clica pra marcar/desmarcar. Ex: você tá viajando, de férias, etc.">
                <div className="grid grid-cols-6 gap-1.5">
                  {MONTH_NAMES.map((m, i) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => toggleMonthAvoid(i)}
                      className={`px-2 py-2 rounded-lg border text-xs font-semibold transition uppercase ${
                        input.months_to_avoid.includes(i)
                          ? 'border-red-500/50 bg-red-500/10 text-red-300'
                          : 'border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          </div>

          {/* ===== RESULT ===== */}
          <div className="space-y-5">
            {/* Strategy summary */}
            <div className="bg-brand-surface rounded-2xl p-5 border border-white/10">
              <p className="text-xs uppercase tracking-wider text-brand-muted font-mono mb-2">Leitura da janela</p>
              <p className="text-white/90 leading-relaxed">{result.strategy_summary}</p>
            </div>

            {/* Top 3 */}
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Top 3 datas sugeridas</h2>
              <div className="space-y-3">
                {result.suggestions.map((s, i) => (
                  <div
                    key={s.iso_date}
                    className={`rounded-2xl p-5 border ${
                      i === 0
                        ? 'bg-gradient-to-br from-brand-purple/15 to-brand-purple/5 border-brand-purple/40'
                        : 'bg-brand-surface border-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            i === 0 ? 'bg-brand-purple text-black' : 'bg-white/10 text-white/70'
                          }`}>
                            {i === 0 ? 'Top pick' : `opção ${i + 1}`}
                          </span>
                          <span className="text-xs text-brand-muted font-mono">score {s.score}/100</span>
                        </div>
                        <h3 className="text-2xl font-bold text-white">{formatDateBR(s.iso_date)}</h3>
                        <p className="text-sm text-brand-muted capitalize">{s.day_of_week} · {s.context}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => addToGoogleCalendar(s.iso_date)}
                        className="flex-shrink-0 text-xs px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg"
                      >
                        + Calendar
                      </button>
                    </div>

                    {s.reasons.length > 0 && (
                      <ul className="space-y-1.5 mb-3">
                        {s.reasons.map((r, ri) => (
                          <li key={ri} className="flex gap-2 text-sm text-white/85">
                            <span className="text-brand-purple flex-shrink-0">→</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {s.warnings.length > 0 && (
                      <div className="space-y-1">
                        {s.warnings.map((w, wi) => (
                          <p key={wi} className="text-xs text-yellow-400/90 flex gap-2">
                            <span>⚠</span>
                            <span>{w}</span>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Calendar visual */}
            <div className="bg-brand-surface rounded-2xl p-5 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Todas as sextas da janela</h3>
                <div className="flex items-center gap-3 text-[10px] font-mono text-brand-muted">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400" /> bom</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400" /> mediano</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" /> evitar</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand-purple ring-1 ring-brand-purple/60" /> top 3</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.calendar_candidates.map((c) => {
                  const isRecommended = recommendedDates.has(c.iso_date);
                  return (
                    <div
                      key={c.iso_date}
                      className={`flex-1 min-w-[70px] px-2 py-2.5 rounded-lg border text-center relative ${
                        isRecommended
                          ? 'border-brand-purple/70 bg-brand-purple/15 ring-2 ring-brand-purple/50 shadow-[0_0_14px_-2px_rgba(168,85,247,0.35)]'
                          : c.color === 'green'
                          ? 'border-green-400/40 bg-green-400/10'
                          : c.color === 'yellow'
                          ? 'border-yellow-400/40 bg-yellow-400/10'
                          : 'border-red-400/40 bg-red-400/10'
                      }`}
                    >
                      {isRecommended && (
                        <span className="absolute -top-1.5 -right-1.5 text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-brand-purple text-black font-bold">
                          top
                        </span>
                      )}
                      <div className="text-[10px] text-brand-muted font-mono uppercase mb-0.5">{monthLabelFull(c.iso_date)}</div>
                      <div className={`text-sm font-bold ${isRecommended ? 'text-white' : 'text-white'}`}>{formatDateBR(c.iso_date).slice(0, 2)}</div>
                      <div className="text-[10px] text-brand-muted font-mono mt-0.5">{c.score}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-brand-muted/60 mt-10 leading-relaxed">
          Scoring baseado em: sazonalidade da indústria indie BR (pico set-nov, evitar dezembro), feriados nacionais, seu objetivo. Sextas-feiras são o dia global de lançamento — por isso só elas são consideradas.
        </p>
      </div>
    </div>
  );
}

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
