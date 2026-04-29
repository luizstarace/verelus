import { describe, it, expect } from 'vitest';
import {
  validateVoiceInput,
  estimateVoiceSeconds,
  MAX_VOICE_TEXT_LEN,
} from '@/lib/atalaia/voice-validation';

describe('validateVoiceInput', () => {
  it('accepts valid message_id and text', () => {
    const result = validateVoiceInput('msg_123', 'Olá, como posso ajudar?');
    expect(result.ok).toBe(true);
  });

  it('rejects missing message_id', () => {
    const result = validateVoiceInput(undefined, 'Oi');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
      expect(result.error).toBe('message_id and text required');
    }
  });

  it('rejects empty message_id', () => {
    const result = validateVoiceInput('', 'Oi');
    expect(result.ok).toBe(false);
  });

  it('rejects non-string message_id', () => {
    const result = validateVoiceInput(123, 'Oi');
    expect(result.ok).toBe(false);
  });

  it('rejects missing text', () => {
    const result = validateVoiceInput('msg_123', undefined);
    expect(result.ok).toBe(false);
  });

  it('rejects empty text', () => {
    const result = validateVoiceInput('msg_123', '');
    expect(result.ok).toBe(false);
  });

  it('rejects text over max length', () => {
    const tooLong = 'a'.repeat(MAX_VOICE_TEXT_LEN + 1);
    const result = validateVoiceInput('msg_123', tooLong);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
      expect(result.error).toContain('Máximo');
      expect(result.error).toContain('5000');
    }
  });

  it('accepts text exactly at max length', () => {
    const atLimit = 'a'.repeat(MAX_VOICE_TEXT_LEN);
    const result = validateVoiceInput('msg_123', atLimit);
    expect(result.ok).toBe(true);
  });

  it('error message for length limit is in PT-BR', () => {
    const result = validateVoiceInput('msg_123', 'a'.repeat(MAX_VOICE_TEXT_LEN + 1));
    if (!result.ok) {
      expect(result.error).toMatch(/Texto muito longo/);
    }
  });
});

describe('estimateVoiceSeconds', () => {
  it('estimates ~1 second for ~12 chars', () => {
    // 12 chars / 750 chars_per_min * 60 = 0.96 sec → ceil = 1
    expect(estimateVoiceSeconds('Olá, bom dia')).toBe(1);
  });

  it('estimates 60 seconds for 750 chars', () => {
    expect(estimateVoiceSeconds('a'.repeat(750))).toBe(60);
  });

  it('always rounds up (ceil)', () => {
    expect(estimateVoiceSeconds('a')).toBe(1);
    expect(estimateVoiceSeconds('ab')).toBe(1);
  });

  it('handles empty string (returns 0)', () => {
    expect(estimateVoiceSeconds('')).toBe(0);
  });

  it('estimates long text proportionally', () => {
    // 1500 chars = 2 minutes = 120 seconds
    expect(estimateVoiceSeconds('a'.repeat(1500))).toBe(120);
  });
});
