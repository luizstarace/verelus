import { describe, it, expect } from 'vitest';
import { buildMessageHistory, getCurrentPeriod } from '@/lib/attendly/chat';

describe('buildMessageHistory', () => {
  it('returns last 20 messages', () => {
    const messages = Array.from({ length: 30 }, (_, i) => ({
      role: i % 2 === 0 ? 'customer' as const : 'assistant' as const,
      content: `Message ${i}`,
    }));
    const result = buildMessageHistory(messages);
    expect(result).toHaveLength(20);
    expect(result[0].content).toBe('Message 10');
    expect(result[19].content).toBe('Message 29');
  });

  it('returns all messages if less than 20', () => {
    const messages = [
      { role: 'customer' as const, content: 'oi' },
      { role: 'assistant' as const, content: 'olá!' },
    ];
    const result = buildMessageHistory(messages);
    expect(result).toHaveLength(2);
  });

  it('filters out human role messages for AI context', () => {
    const messages = [
      { role: 'customer' as const, content: 'oi' },
      { role: 'human' as const, content: 'resposta do dono' },
      { role: 'customer' as const, content: 'obrigado' },
    ];
    const result = buildMessageHistory(messages);
    expect(result).toHaveLength(2);
    expect(result.every(m => m.role !== 'human')).toBe(true);
  });
});

describe('getCurrentPeriod', () => {
  it('returns first day of current month', () => {
    const period = getCurrentPeriod();
    expect(period).toMatch(/^\d{4}-\d{2}-01$/);
  });
});
