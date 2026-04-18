import { describe, it, expect } from 'vitest';
import { calculateCache, inferStageFromListeners, hasReferenceData } from '@/lib/cache-reference-table';
import type { CacheInput, CacheExpenses } from '@/lib/types/tools';

const ZERO_EXPENSES: CacheExpenses = {
  transport: 0,
  accommodation: 0,
  meals: 0,
  hired_musicians: 0,
  equipment: 0,
  tech_crew: 0,
  commission: 0,
  other: 0,
};

describe('inferStageFromListeners', () => {
  it('maps ouvintes para estagio correto', () => {
    expect(inferStageFromListeners(100)).toBe('seed');
    expect(inferStageFromListeners(499)).toBe('seed');
    expect(inferStageFromListeners(500)).toBe('emerging');
    expect(inferStageFromListeners(4999)).toBe('emerging');
    expect(inferStageFromListeners(5000)).toBe('growing');
    expect(inferStageFromListeners(49999)).toBe('growing');
    expect(inferStageFromListeners(50000)).toBe('established');
    expect(inferStageFromListeners(499999)).toBe('established');
    expect(inferStageFromListeners(500000)).toBe('reference');
    expect(inferStageFromListeners(2_000_000)).toBe('reference');
  });
});

describe('hasReferenceData', () => {
  it('emerging em bar small tem dados', () => {
    expect(hasReferenceData('emerging', 'bar_small')).toBe(true);
  });
  it('reference em bar small nao tem dados', () => {
    expect(hasReferenceData('reference', 'bar_small')).toBe(false);
  });
  it('seed em festival large nao tem dados', () => {
    expect(hasReferenceData('seed', 'festival_large')).toBe(false);
  });
});

describe('calculateCache', () => {
  const baseInput: CacheInput = {
    stage: 'emerging',
    venue_type: 'club_small',
    show_city_tier: 'tier2',
    musicians_traveling: 3,
    expenses: { ...ZERO_EXPENSES, transport: 300, meals: 150 },
  };

  it('retorna faixa de cache ajustada por tier da cidade', () => {
    const tier1Result = calculateCache({ ...baseInput, show_city_tier: 'tier1' });
    const tier4Result = calculateCache({ ...baseInput, show_city_tier: 'tier4' });
    // Tier 1 paga mais que tier 4
    expect(tier1Result.suggested_median).toBeGreaterThan(tier4Result.suggested_median);
  });

  it('calcula break-even = total de despesas', () => {
    const result = calculateCache(baseInput);
    expect(result.break_even).toBe(450); // 300 + 150
    expect(result.total_expenses).toBe(450);
  });

  it('alerta se cache mediano nao cobre despesas', () => {
    const result = calculateCache({
      ...baseInput,
      stage: 'seed',
      venue_type: 'bar_small',
      expenses: { ...ZERO_EXPENSES, transport: 5000 }, // despesas altas pro estagio
    });
    expect(result.alerts.some((a) => a.toLowerCase().includes('prejuízo'))).toBe(true);
  });

  it('gera sugestoes de negociacao quando margem apertada', () => {
    const result = calculateCache({
      ...baseInput,
      expenses: { ...ZERO_EXPENSES, accommodation: 1500, transport: 500, meals: 200 },
    });
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it('calcula margem percentual correta', () => {
    const result = calculateCache({
      ...baseInput,
      expenses: { ...ZERO_EXPENSES, transport: 200 },
    });
    const expected = ((result.suggested_median - result.break_even) / result.suggested_median) * 100;
    expect(result.margin_percent_at_median).toBeCloseTo(expected, 1);
  });

  it('retorna expense breakdown com percentuais corretos', () => {
    const result = calculateCache({
      ...baseInput,
      expenses: { ...ZERO_EXPENSES, transport: 500, meals: 500 },
    });
    expect(result.expense_breakdown).toHaveLength(2);
    expect(result.expense_breakdown[0].percent).toBeCloseTo(50, 1);
    expect(result.expense_breakdown[1].percent).toBeCloseTo(50, 1);
  });

  it('lida com combinacao sem dados (reference em bar)', () => {
    const result = calculateCache({
      ...baseInput,
      stage: 'reference',
      venue_type: 'bar_small',
      expenses: { ...ZERO_EXPENSES, transport: 500 },
    });
    expect(result.alerts.length).toBeGreaterThan(0);
    expect(result.alerts[0].toLowerCase()).toContain('rara');
    // Fallback: media baseada em despesas
    expect(result.suggested_median).toBeGreaterThanOrEqual(result.break_even);
  });

  it('margem alta gera sugestao de cobrar teto', () => {
    const result = calculateCache({
      ...baseInput,
      stage: 'growing',
      venue_type: 'corporate',  // paga bem
      expenses: { ...ZERO_EXPENSES, transport: 300 },
    });
    // Deve ter alerta sobre margem alta E sugestao de cobrar teto
    const hasHighMarginAlert = result.alerts.some((a) => a.toLowerCase().includes('alta'));
    expect(hasHighMarginAlert || result.margin_percent_at_median > 60).toBe(true);
  });
});
