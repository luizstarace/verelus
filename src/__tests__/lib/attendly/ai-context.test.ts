import { describe, it, expect } from 'vitest';
import { buildAiContext } from '@/lib/attendly/ai-context';

const mockBusiness = {
  name: 'Clínica Saúde Plena',
  category: 'clinica',
  phone: '11999887766',
  address: 'Rua das Flores, 123',
  services: [
    { name: 'Consulta Geral', price_cents: 15000, duration_min: 30, description: 'Consulta médica geral' },
    { name: 'Exame de Sangue', price_cents: 8000, duration_min: 15, description: 'Coleta e análise de sangue' },
  ],
  hours: {
    mon: { open: '08:00', close: '18:00' },
    tue: { open: '08:00', close: '18:00' },
    wed: { open: '08:00', close: '18:00' },
    thu: { open: '08:00', close: '18:00' },
    fri: { open: '08:00', close: '17:00' },
  },
  faq: [
    { question: 'Aceitam convênio?', answer: 'Sim, aceitamos Unimed e Amil.' },
  ],
};

describe('buildAiContext', () => {
  it('includes business name', () => {
    const ctx = buildAiContext(mockBusiness);
    expect(ctx).toContain('Clínica Saúde Plena');
  });

  it('includes services with formatted prices', () => {
    const ctx = buildAiContext(mockBusiness);
    expect(ctx).toContain('Consulta Geral');
    expect(ctx).toContain('R$ 150,00');
    expect(ctx).toContain('30 minutos');
  });

  it('includes business hours', () => {
    const ctx = buildAiContext(mockBusiness);
    expect(ctx).toContain('08:00');
    expect(ctx).toContain('18:00');
  });

  it('includes FAQ', () => {
    const ctx = buildAiContext(mockBusiness);
    expect(ctx).toContain('Aceitam convênio?');
    expect(ctx).toContain('Unimed e Amil');
  });

  it('includes transfer instruction with [TRANSFER] tag', () => {
    const ctx = buildAiContext(mockBusiness);
    expect(ctx).toContain('[TRANSFER]');
  });

  it('includes phone for contact fallback', () => {
    const ctx = buildAiContext(mockBusiness);
    expect(ctx).toContain('11999887766');
  });
});
