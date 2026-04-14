import type { ReleaseTimingInput, SuggestedDate } from '@/lib/types/tools';

/**
 * Engine deterministica pra calcular score de cada sexta-feira numa janela.
 * Combina: sazonalidade da industria, feriados BR, objetivo do artista.
 *
 * Scoring:
 *   +30 base por ser sexta
 *   + ajuste sazonal (-15 a +20)
 *   - penalidade de feriado (0 a -25 dependendo da distancia)
 *   + ajuste pelo objetivo
 */

// Feriados nacionais BR fixos (mes-dia)
const FIXED_HOLIDAYS_BR: Array<{ month: number; day: number; label: string }> = [
  { month: 0, day: 1, label: 'Ano Novo' },
  { month: 3, day: 21, label: 'Tiradentes' },
  { month: 4, day: 1, label: 'Dia do Trabalho' },
  { month: 8, day: 7, label: 'Independencia' },
  { month: 9, day: 12, label: 'N.S. Aparecida' },
  { month: 10, day: 2, label: 'Finados' },
  { month: 10, day: 15, label: 'Proclamacao da Republica' },
  { month: 10, day: 20, label: 'Consciencia Negra' },
  { month: 11, day: 24, label: 'Vespera de Natal' },
  { month: 11, day: 25, label: 'Natal' },
  { month: 11, day: 31, label: 'Vespera Reveillon' },
];

/**
 * Score sazonal: para cada mes, ajuste base ao ritmo da industria indie BR.
 * Valores -20 a +20.
 *
 * Base: setembro a novembro = pico de descoberta indie; janeiro baixa competicao;
 * dezembro competitivo; fevereiro-marco morno (carnaval + volta as aulas).
 */
const SEASONAL_ADJUSTMENT: number[] = [
  8,    // jan — baixa competicao, bom
  -8,   // fev — carnaval dispersa atencao (inicio) e volta as aulas
  0,    // mar — neutro
  10,   // abr — aquecimento pre-inverno festival season
  12,   // mai — bom
  5,    // jun — festa junina compete
  8,    // jul — ferias escolares, bom
  14,   // ago — excelente
  18,   // set — pico indie
  20,   // out — pico maximo
  15,   // nov — ainda pico, mas desacelera na segunda quinzena
  -20,  // dez — majors dominam algoritmo, pessimo pra indie
];

/**
 * Ajuste pelo objetivo do artista.
 */
function goalAdjustment(month: number, goal: ReleaseTimingInput['goal']): number {
  switch (goal) {
    case 'discovery':
      // Discovery precisa de atencao — evitar dezembro (competicao alta) e carnaval
      return month === 11 ? -5 : 0;
    case 'grow_base':
      // Crescer base pede momentum — pico de indie e melhor
      return (month === 8 || month === 9) ? 5 : 0;
    case 'monetize':
      // Monetizar via playlist needs early in year, ou pre-epoca de tour
      return (month === 2 || month === 7) ? 5 : 0;
    case 'playlist_placement':
      // Placements — sextas sao criticas, evitar mes competitivo
      return month === 11 ? -10 : 0;
    case 'press':
      // Press responde a pautas — nao em mes de recesso
      return (month === 0 || month === 11) ? -5 : 0;
  }
}

function formatBRDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function dayOfWeekPT(date: Date): string {
  const names = ['domingo', 'segunda-feira', 'terca-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sabado'];
  return names[date.getDay()];
}

function monthLabelPT(month: number): string {
  const names = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  return names[month];
}

/**
 * Retorna todas as sextas-feiras dentro da janela a partir de hoje.
 */
function getFridaysInWindow(days: number): Date[] {
  const fridays: Date[] = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setDate(end.getDate() + days);
  const current = new Date(now);
  // Avanca ate a proxima sexta
  while (current.getDay() !== 5) {
    current.setDate(current.getDate() + 1);
  }
  while (current <= end) {
    fridays.push(new Date(current));
    current.setDate(current.getDate() + 7);
  }
  return fridays;
}

/**
 * Penalidade por proximidade de feriado nacional.
 * Dentro de +/- 3 dias de feriado: -15
 * Dentro de +/- 7 dias: -5
 */
function holidayPenalty(date: Date): { penalty: number; warning?: string } {
  const year = date.getFullYear();
  for (const h of FIXED_HOLIDAYS_BR) {
    const holDate = new Date(year, h.month, h.day);
    const diffDays = Math.abs((date.getTime() - holDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 3) {
      return { penalty: -15, warning: `Proximo a ${h.label} (${diffDays.toFixed(0)} dia${diffDays === 1 ? '' : 's'} de distancia). Atencao dispersa.` };
    }
    if (diffDays <= 7) {
      return { penalty: -5, warning: `Perto de ${h.label}. Considere.` };
    }
  }
  return { penalty: 0 };
}

/**
 * Avalia se mes esta na lista pra evitar do user.
 */
function monthToAvoidPenalty(month: number, monthsToAvoid: number[]): number {
  return monthsToAvoid.includes(month) ? -40 : 0;
}

/**
 * Score final de uma data candidata.
 */
function scoreFriday(date: Date, input: ReleaseTimingInput): { score: number; reasons: string[]; warnings: string[]; context: string } {
  const reasons: string[] = [];
  const warnings: string[] = [];
  const month = date.getMonth();
  let score = 30; // base por ser sexta

  // Sazonalidade
  const seasonal = SEASONAL_ADJUSTMENT[month];
  score += seasonal;
  if (seasonal >= 14) {
    reasons.push(`${monthLabelPT(month).charAt(0).toUpperCase() + monthLabelPT(month).slice(1)} e pico de descoberta no mercado indie BR`);
  } else if (seasonal >= 8) {
    reasons.push(`${monthLabelPT(month).charAt(0).toUpperCase() + monthLabelPT(month).slice(1)} e mes bom pra lancar (acima da media)`);
  } else if (seasonal <= -15) {
    warnings.push(`${monthLabelPT(month)} tem competicao alta (majors dominam o algoritmo)`);
  } else if (seasonal <= -5) {
    warnings.push(`${monthLabelPT(month)} tende a ser mais fraco`);
  }

  // Feriados
  const hol = holidayPenalty(date);
  score += hol.penalty;
  if (hol.warning) warnings.push(hol.warning);

  // Mes a evitar
  const avoidPenalty = monthToAvoidPenalty(month, input.months_to_avoid);
  score += avoidPenalty;
  if (avoidPenalty < 0) warnings.push(`Voce marcou ${monthLabelPT(month)} como mes a evitar`);

  // Objetivo
  score += goalAdjustment(month, input.goal);

  // Release type contexto
  if (input.release_type === 'album' && month === 11) {
    score -= 10;
    warnings.push('Lancar album em dezembro raramente funciona — majors mobilizam a midia');
  }
  if (input.release_type === 'single' && (month === 8 || month === 9)) {
    reasons.push('Singles em set-out performam bem: algoritmo recomenda pra playlists');
  }

  // Contexto textual
  const contextParts: string[] = [];
  const dayNum = date.getDate();
  if (dayNum <= 7) contextParts.push('primeira sexta do mes');
  if (month === 1 && dayNum >= 8) contextParts.push('pos-carnaval');
  if (month === 6 && dayNum >= 15) contextParts.push('meio das ferias escolares');
  if (month === 9) contextParts.push('mes do Rock in Rio e outros grandes festivais');
  if (month === 10) contextParts.push('semana antes de feriado de Consciencia Negra (20/11)');
  const context = contextParts.length > 0 ? contextParts.join(', ') : `sexta comum de ${monthLabelPT(month)}`;

  // Clamp
  score = Math.max(0, Math.min(100, score));

  return { score, reasons, warnings, context };
}

export function suggestReleaseDates(input: ReleaseTimingInput): {
  suggestions: SuggestedDate[];
  calendar_candidates: Array<{ iso_date: string; score: number; color: 'green' | 'yellow' | 'red' }>;
  strategy_summary: string;
} {
  const fridays = getFridaysInWindow(input.window_days);

  const scored = fridays.map((date) => {
    const { score, reasons, warnings, context } = scoreFriday(date, input);
    return {
      date,
      score,
      reasons,
      warnings,
      context,
      iso_date: formatBRDate(date),
      day_of_week: dayOfWeekPT(date),
    };
  });

  // Top 3 por score
  const top3 = [...scored]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const suggestions: SuggestedDate[] = top3.map((s) => ({
    iso_date: s.iso_date,
    day_of_week: s.day_of_week,
    score: s.score,
    reasons: s.reasons.slice(0, 3),
    warnings: s.warnings.slice(0, 2),
    context: s.context,
  }));

  const calendar_candidates = scored.map((s) => ({
    iso_date: s.iso_date,
    score: s.score,
    color: (s.score >= 55 ? 'green' : s.score >= 35 ? 'yellow' : 'red') as 'green' | 'yellow' | 'red',
  }));

  // Strategy summary
  const bestMonthsArr: number[] = [];
  for (const s of top3) {
    if (!bestMonthsArr.includes(s.date.getMonth())) bestMonthsArr.push(s.date.getMonth());
  }
  const bestMonthsLabel = bestMonthsArr.map(monthLabelPT).join(' e ');
  const avgScore = Math.round(scored.reduce((sum, s) => sum + s.score, 0) / Math.max(1, scored.length));

  let strategySummary: string;
  if (suggestions[0].score >= 70) {
    strategySummary = `Voce tem uma janela forte. ${bestMonthsLabel.charAt(0).toUpperCase() + bestMonthsLabel.slice(1)} concentram as melhores datas, com score medio ${avgScore}. Priorize a data no topo.`;
  } else if (suggestions[0].score >= 50) {
    strategySummary = `Janela OK. As 3 melhores datas sao decentes. Se puder esperar ate ${monthLabelPT(8)}-${monthLabelPT(9)}, seria ainda melhor. Score medio da janela: ${avgScore}.`;
  } else {
    strategySummary = `A janela atual esta num periodo desafiador do ano. Considere adiar pra sep-nov se o release nao for urgente. Se precisa sair, a data top ainda e seu melhor caminho.`;
  }

  return { suggestions, calendar_candidates, strategy_summary: strategySummary };
}
