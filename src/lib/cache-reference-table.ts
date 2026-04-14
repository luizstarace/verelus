import type {
  ArtistStage,
  VenueType,
  CityTier,
  CacheInput,
  CacheResult,
  CacheExpenses,
} from '@/lib/types/tools';
import { CITY_TIER_META } from '@/lib/types/tools';

/**
 * Tabela de referencia de cache por estagio + venue (base SP/RJ = tier1).
 * Valores em reais, [min, max]. Mediana = (min + max) / 2.
 *
 * Fontes publicas consultadas (out-2024 a abr-2026):
 * - SINDIMUCE 2024 (Tabela de Cachê Sindical CE) — pisos sindicais por musico/grupo
 * - SINDMUSIMG 2024 (Tabela de Cachê Sindical MG) — pisos por evento
 * - showband.com.br (analise de mercado por estagio: iniciante R$200-800, emergente
 *   R$1k-5k, regional R$5k-20k, nacional R$30k+; bar R$200-1k, casamento R$2k-15k,
 *   festival R$3k-100k+, corporate R$3k-20k)
 * - bowlidea.com.br (metodologia de precificacao com 20-30% margem sobre custos)
 * - Reports publicos de festivais (FIG, Indie Rock Brasil) e Virada Cultural SP
 *
 * Valores aproximados — variam por logistica, exclusividade, sazonalidade, etc.
 * A propria Verelus refina essa tabela trimestralmente com dados crowdsourced
 * dos usuarios pagantes (reportes anonimos).
 */
type Range = [number, number] | null;

type StageTable = Partial<Record<VenueType, Range>>;

const REFERENCE_TABLE: Record<ArtistStage, StageTable> = {
  // Seed (<500 ouvintes): mercado diz iniciante R$200-800 geral
  seed: {
    bar_small: [200, 500],
    bar_medium: [300, 800],
    club_small: [500, 1200],
    club_medium: null, // raro chamarem artista seed pra venue medio
    club_large: null,
    theater_small: null,
    theater_large: null,
    festival_small: [300, 1500],
    festival_large: null,
    corporate: [1000, 2500],     // ajustado: evento corp paga mais que bar mas iniciante nao pega o topo
    private: [800, 2500],         // ajustado: casamento tipicamente cobra +, mas iniciante fica na base
  },
  // Emerging (500-5k): mercado diz em crescimento R$1k-5k; casamento pode ir a 15k mas nao pra emergente
  emerging: {
    bar_small: [400, 1000],       // ajustado: ate R$1k no teto de bar conforme mercado
    bar_medium: [600, 1500],
    club_small: [1000, 2500],
    club_medium: [1500, 3500],
    club_large: null,
    theater_small: [2000, 4500],  // ajustado
    theater_large: null,
    festival_small: [2000, 5000], // ajustado: festivais pagam melhor (minimo R$3k no mercado)
    festival_large: [3500, 8000], // ajustado
    corporate: [2500, 7000],      // ajustado: range mais amplo
    private: [2000, 6000],        // ajustado: casamento pode puxar teto pra cima
  },
  // Growing (5k-50k): mercado diz regional consolidada R$5k-20k geral
  growing: {
    bar_small: [800, 1500],
    bar_medium: [1500, 3000],
    club_small: [2500, 5000],
    club_medium: [4000, 8000],
    club_large: [6000, 12000],
    theater_small: [5000, 10000],
    theater_large: [10000, 20000],
    festival_small: [4000, 9000],  // ajustado
    festival_large: [10000, 25000],
    corporate: [6000, 18000],      // ajustado: range mais amplo na base
    private: [4000, 12000],        // ajustado: casamento pode comecar em 4k
  },
  // Established (50k-500k): mercado diz nacional R$30k-200k
  established: {
    bar_small: null,
    bar_medium: [5000, 10000],
    club_small: [8000, 15000],
    club_medium: [12000, 25000],
    club_large: [20000, 40000],
    theater_small: [15000, 30000],
    theater_large: [30000, 60000],
    festival_small: [10000, 25000],
    festival_large: [30000, 100000],  // ajustado: mercado mostra festivais chegam a 100k
    corporate: [20000, 60000],         // ajustado: base menor
    private: [15000, 40000],
  },
  // Reference (500k+): mercado mostra top artists 100k-500k+ (casos extremos milhoes)
  reference: {
    bar_small: null,
    bar_medium: null,
    club_small: [15000, 30000],
    club_medium: [25000, 50000],
    club_large: [50000, 120000],        // ajustado: teto mais alto
    theater_small: [40000, 90000],       // ajustado
    theater_large: [100000, 300000],     // ajustado: mercado mostra eventos ate 550k
    festival_small: [30000, 80000],      // ajustado
    festival_large: [80000, 400000],     // ajustado: cache extremos podem passar de 300k
    corporate: [60000, 250000],          // ajustado: corporate paga muito bem no topo
    private: [40000, 180000],            // ajustado
  },
};

/**
 * Infere estagio automatico se o user fornecer monthly listeners.
 */
export function inferStageFromListeners(listeners: number): ArtistStage {
  if (listeners < 500) return 'seed';
  if (listeners < 5_000) return 'emerging';
  if (listeners < 50_000) return 'growing';
  if (listeners < 500_000) return 'established';
  return 'reference';
}

const EXPENSE_LABELS: Record<keyof CacheExpenses, string> = {
  transport: 'Transporte',
  accommodation: 'Hospedagem',
  meals: 'Alimentacao',
  hired_musicians: 'Musicos contratados',
  equipment: 'Equipamento',
  tech_crew: 'Tecnico/roadie',
  commission: 'Comissao empresario',
  other: 'Outros',
};

export function calculateCache(input: CacheInput): CacheResult {
  // 1. Faixa base
  const range = REFERENCE_TABLE[input.stage][input.venue_type];
  const multiplier = CITY_TIER_META[input.show_city_tier].multiplier;

  // 2. Despesas
  const expenseEntries = (Object.keys(input.expenses) as Array<keyof CacheExpenses>)
    .map((key) => ({
      key,
      label: EXPENSE_LABELS[key],
      value: Math.max(0, Number(input.expenses[key]) || 0),
    }))
    .filter((e) => e.value > 0);

  const total_expenses = expenseEntries.reduce((sum, e) => sum + e.value, 0);
  const break_even = total_expenses;

  const expense_breakdown = expenseEntries.map((e) => ({
    label: e.label,
    value: e.value,
    percent: total_expenses > 0 ? (e.value / total_expenses) * 100 : 0,
  }));

  // 3. Sugestao de cache
  const alerts: string[] = [];
  const suggestions: string[] = [];

  if (!range) {
    // Combinacao improvavel (ex: artista reference em bar pequeno)
    alerts.push(
      `Essa combinacao (${input.stage} em ${input.venue_type}) e rara no mercado. Nao temos dados de referencia suficientes.`
    );
    suggestions.push(
      'Considere negociar um cache baseado 100% nas suas despesas + margem de 30%, ou recusar a oportunidade se nao fizer sentido estrategico.'
    );

    const fallback = Math.max(break_even * 1.3, 500);
    return {
      suggested_min: break_even,
      suggested_median: fallback,
      suggested_max: fallback * 1.5,
      total_expenses,
      break_even,
      profit_at_median: fallback - break_even,
      margin_percent_at_median: break_even > 0 ? ((fallback - break_even) / fallback) * 100 : 0,
      expense_breakdown,
      alerts,
      suggestions,
    };
  }

  const [baseMin, baseMax] = range;
  const suggested_min = Math.round(baseMin * multiplier);
  const suggested_max = Math.round(baseMax * multiplier);
  const suggested_median = Math.round((suggested_min + suggested_max) / 2);

  const profit_at_median = suggested_median - break_even;
  const margin_percent_at_median =
    suggested_median > 0 ? (profit_at_median / suggested_median) * 100 : 0;

  // Alertas e sugestoes
  if (suggested_median < break_even) {
    alerts.push(
      `O cache mediano de mercado (R$ ${suggested_median.toLocaleString('pt-BR')}) nao cobre suas despesas (R$ ${break_even.toLocaleString('pt-BR')}). Esse show daria prejuizo nessas condicoes.`
    );
  } else if (margin_percent_at_median < 20) {
    alerts.push(
      `Margem apertada (${margin_percent_at_median.toFixed(0)}%). Menos de 20% de margem e pouco saudavel — qualquer imprevisto vira prejuizo.`
    );
  } else if (margin_percent_at_median > 60) {
    alerts.push(
      `Margem alta (${margin_percent_at_median.toFixed(0)}%). Otimo! Avalie se nao consegue um cache no topo da faixa (R$ ${suggested_max.toLocaleString('pt-BR')}) — pode haver espaco.`
    );
  }

  // Sugestoes de negociacao se margem baixa
  if (profit_at_median < break_even * 0.3) {
    // Encontra os 2 maiores gastos pra sugerir negociar
    const topExpenses = [...expenseEntries].sort((a, b) => b.value - a.value).slice(0, 3);
    for (const exp of topExpenses) {
      if (exp.key === 'accommodation') {
        suggestions.push('Peca hospedagem ao CONTRATANTE como parte das obrigacoes do show.');
      } else if (exp.key === 'transport') {
        suggestions.push('Negocie transporte (ou reembolso) com o CONTRATANTE.');
      } else if (exp.key === 'meals') {
        suggestions.push('Inclua alimentacao no rider como obrigacao do CONTRATANTE.');
      } else if (exp.key === 'hired_musicians') {
        suggestions.push('Avalie reduzir a formacao — pode viajar com menos musicos nesse show.');
      } else if (exp.key === 'commission') {
        suggestions.push('Se a comissao do empresario aperta o lucro, renegocie a porcentagem ou proponha piso fixo.');
      } else if (exp.key === 'equipment') {
        suggestions.push('Inclua equipamento no rider tecnico como obrigacao do CONTRATANTE.');
      }
    }
    if (suggestions.length === 0) {
      suggestions.push('Tente negociar o cache pelo teto da faixa sugerida.');
    }
  }

  // Se cache sugerido ja cobre bem, gera sugestoes estrategicas
  if (profit_at_median >= break_even * 0.3) {
    const tierLabel = CITY_TIER_META[input.show_city_tier].label;
    if (input.show_city_tier === 'tier1') {
      suggestions.push(`${tierLabel}: mercado mais caro. Se o CONTRATANTE aceita a faixa alta, peca valor proximo do maximo (R$ ${suggested_max.toLocaleString('pt-BR')}).`);
    } else {
      suggestions.push(`Voce esta em regiao ${tierLabel.toLowerCase()} — ajuste feito. Se for capital proxima, pode testar pedir 10% a mais.`);
    }
    if (input.venue_type === 'corporate' || input.venue_type === 'private') {
      suggestions.push('Eventos corporativos/privados tipicamente pagam acima da faixa de publico. Negocie com confianca.');
    }
  }

  return {
    suggested_min,
    suggested_median,
    suggested_max,
    total_expenses,
    break_even,
    profit_at_median,
    margin_percent_at_median,
    expense_breakdown,
    alerts,
    suggestions,
  };
}

/**
 * Retorna true se ha dados de referencia para essa combinacao.
 */
export function hasReferenceData(stage: ArtistStage, venue: VenueType): boolean {
  return REFERENCE_TABLE[stage][venue] !== null && REFERENCE_TABLE[stage][venue] !== undefined;
}
