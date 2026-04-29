import { describe, it, expect } from 'vitest';
import {
  buildMessageHistory,
  getCurrentPeriod,
  toClaudeMessages,
  checkBusinessAvailability,
} from '@/lib/atalaia/chat';

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

describe('toClaudeMessages', () => {
  it('maps customer to user and assistant to assistant', () => {
    const messages = [
      { role: 'customer' as const, content: 'oi' },
      { role: 'assistant' as const, content: 'olá!' },
    ];
    const result = toClaudeMessages(messages);
    expect(result).toEqual([
      { role: 'user', content: 'oi' },
      { role: 'assistant', content: 'olá!' },
    ]);
  });

  it('filters out human messages', () => {
    const messages = [
      { role: 'customer' as const, content: 'oi' },
      { role: 'human' as const, content: 'resposta do dono' },
      { role: 'assistant' as const, content: 'ok' },
    ];
    const result = toClaudeMessages(messages);
    expect(result).toHaveLength(2);
    expect(result.every(m => m.role === 'user' || m.role === 'assistant')).toBe(true);
  });
});

describe('getCurrentPeriod', () => {
  it('returns first day of current month', () => {
    const period = getCurrentPeriod();
    expect(period).toMatch(/^\d{4}-\d{2}-01$/);
  });
});

describe('checkBusinessAvailability', () => {
  it('paused business returns 503 with contact fallback', () => {
    const result = checkBusinessAvailability(
      { status: 'paused', phone: '(11) 99123-4567' },
      false
    );
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.status).toBe(503);
      expect(result.paused).toBe(true);
      expect(result.response).toContain('(11) 99123-4567');
      expect(result.response).toContain('temporariamente indisponível');
    }
  });

  it('paused business without phone uses default fallback text', () => {
    const result = checkBusinessAvailability(
      { status: 'paused', phone: null },
      false
    );
    if (!result.allowed) {
      expect(result.response).toContain('sem telefone cadastrado');
    }
  });

  it('setup business without preview returns 403', () => {
    const result = checkBusinessAvailability(
      { status: 'setup', phone: null },
      false
    );
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.status).toBe(403);
      expect(result.error).toBe('Atendente ainda não foi ativado');
    }
  });

  it('active business with preview=true returns 400 (preview reserved for setup)', () => {
    const result = checkBusinessAvailability(
      { status: 'active', phone: '123' },
      true
    );
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.status).toBe(400);
      expect(result.error).toBe('preview mode requires business.status=setup');
    }
  });

  it('setup business with preview=true is allowed (owner wizard testing)', () => {
    const result = checkBusinessAvailability(
      { status: 'setup', phone: null },
      true
    );
    expect(result.allowed).toBe(true);
  });

  it('active business without preview is allowed', () => {
    const result = checkBusinessAvailability(
      { status: 'active', phone: '123' },
      false
    );
    expect(result.allowed).toBe(true);
  });
});
