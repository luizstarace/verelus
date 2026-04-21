import { describe, it, expect } from 'vitest';
import { detectTransfer, TRANSFER_KEYWORDS } from '@/lib/attendly/transfer';

describe('detectTransfer', () => {
  it('detects [TRANSFER] in AI response', () => {
    const result = detectTransfer({
      aiResponse: '[TRANSFER] Cliente quer falar sobre desconto.',
      customerMessage: 'quanto custa?',
    });
    expect(result.shouldTransfer).toBe(true);
    expect(result.reason).toBe('Cliente quer falar sobre desconto.');
    expect(result.source).toBe('ai');
  });

  it('detects customer keyword "humano"', () => {
    const result = detectTransfer({
      aiResponse: 'Posso ajudar com algo?',
      customerMessage: 'quero falar com um humano',
    });
    expect(result.shouldTransfer).toBe(true);
    expect(result.source).toBe('keyword');
  });

  it('detects customer keyword "atendente"', () => {
    const result = detectTransfer({
      aiResponse: 'Claro!',
      customerMessage: 'me passe para o atendente por favor',
    });
    expect(result.shouldTransfer).toBe(true);
  });

  it('does not trigger on normal messages', () => {
    const result = detectTransfer({
      aiResponse: 'Nosso horário é das 8 às 18.',
      customerMessage: 'qual o horário?',
    });
    expect(result.shouldTransfer).toBe(false);
  });

  it('is case insensitive for keywords', () => {
    const result = detectTransfer({
      aiResponse: 'ok',
      customerMessage: 'QUERO FALAR COM PESSOA',
    });
    expect(result.shouldTransfer).toBe(true);
  });
});
