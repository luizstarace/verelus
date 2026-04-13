import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkRateLimit,
  resetRateLimiter,
  sanitize,
  VALID_TYPES,
  SYSTEM_PROMPTS,
  generateFallback,
} from '@/lib/ai-helpers';

describe('checkRateLimit', () => {
  beforeEach(() => {
    resetRateLimiter();
  });

  it('should allow the first request from an IP', () => {
    expect(checkRateLimit('192.168.1.1')).toBe(true);
  });

  it('should allow up to 10 requests from the same IP', () => {
    for (let i = 0; i < 10; i++) {
      expect(checkRateLimit('10.0.0.1')).toBe(true);
    }
  });

  it('should block the 11th request from the same IP', () => {
    for (let i = 0; i < 10; i++) {
      checkRateLimit('10.0.0.2');
    }
    expect(checkRateLimit('10.0.0.2')).toBe(false);
  });

  it('should track different IPs independently', () => {
    for (let i = 0; i < 10; i++) {
      checkRateLimit('10.0.0.3');
    }
    // 10.0.0.3 is exhausted
    expect(checkRateLimit('10.0.0.3')).toBe(false);
    // But a new IP should still be allowed
    expect(checkRateLimit('10.0.0.4')).toBe(true);
  });
});

describe('sanitize', () => {
  it('should return empty string for null', () => {
    expect(sanitize(null)).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(sanitize(undefined)).toBe('');
  });

  it('should pass through normal text', () => {
    expect(sanitize('Hello World')).toBe('Hello World');
  });

  it('should strip angle brackets (XSS prevention)', () => {
    expect(sanitize('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
  });

  it('should strip both < and > characters', () => {
    expect(sanitize('a<b>c<d>e')).toBe('abcde');
  });

  it('should truncate to maxLength', () => {
    const long = 'a'.repeat(1000);
    const result = sanitize(long, 100);
    expect(result.length).toBe(100);
  });

  it('should use default maxLength of 500', () => {
    const long = 'b'.repeat(600);
    const result = sanitize(long);
    expect(result.length).toBe(500);
  });

  it('should convert numbers to strings', () => {
    expect(sanitize(42)).toBe('42');
  });

  it('should convert booleans to strings', () => {
    expect(sanitize(true)).toBe('true');
  });

  it('should handle strings with only angle brackets', () => {
    expect(sanitize('<<<>>>')).toBe('');
  });
});

describe('VALID_TYPES', () => {
  it('should contain press_release', () => {
    expect(VALID_TYPES.has('press_release')).toBe(true);
  });

  it('should contain social_post', () => {
    expect(VALID_TYPES.has('social_post')).toBe(true);
  });

  it('should contain setlist', () => {
    expect(VALID_TYPES.has('setlist')).toBe(true);
  });

  it('should contain budget_report', () => {
    expect(VALID_TYPES.has('budget_report')).toBe(true);
  });

  it('should contain contract', () => {
    expect(VALID_TYPES.has('contract')).toBe(true);
  });

  it('should contain monthly_report', () => {
    expect(VALID_TYPES.has('monthly_report')).toBe(true);
  });

  it('should contain tour_plan', () => {
    expect(VALID_TYPES.has('tour_plan')).toBe(true);
  });

  it('should have exactly 7 valid types', () => {
    expect(VALID_TYPES.size).toBe(7);
  });

  it('should not contain arbitrary strings', () => {
    expect(VALID_TYPES.has('invalid_type')).toBe(false);
    expect(VALID_TYPES.has('')).toBe(false);
  });

  it('should match SYSTEM_PROMPTS keys', () => {
    const promptKeys = new Set(Object.keys(SYSTEM_PROMPTS));
    expect(VALID_TYPES).toEqual(promptKeys);
  });
});

describe('generateFallback', () => {
  it('should generate press_release fallback with artist name and topic', () => {
    const content = generateFallback('press_release', {
      artistName: 'Banda X',
      topic: 'novo album',
    });
    expect(content).toContain('PRESS RELEASE');
    expect(content).toContain('Banda X');
    expect(content).toContain('novo album');
  });

  it('should use default values when artist data is missing for press_release', () => {
    const content = generateFallback('press_release', {});
    expect(content).toContain('Artista');
    expect(content).toContain('novo lançamento');
  });

  it('should generate social_post fallback with platform', () => {
    const content = generateFallback('social_post', { platform: 'Twitter', theme: 'show ao vivo' });
    expect(content).toContain('Twitter');
    expect(content).toContain('show ao vivo');
  });

  it('should generate setlist fallback with event type and duration', () => {
    const content = generateFallback('setlist', { eventType: 'Festival', duration: 90 });
    expect(content).toContain('SETLIST - Festival');
    expect(content).toContain('90 minutos');
  });

  it('should clamp setlist duration to min 15 and max 360', () => {
    const tooShort = generateFallback('setlist', { duration: 5 });
    expect(tooShort).toContain('15 minutos');

    const tooLong = generateFallback('setlist', { duration: 999 });
    expect(tooLong).toContain('360 minutos');
  });

  it('should generate tour_plan fallback with region', () => {
    const content = generateFallback('tour_plan', { region: 'Nordeste', numDates: 3 });
    expect(content).toContain('Nordeste');
    expect(content).toContain('3 datas sugeridas');
  });

  it('should return default content for unknown types', () => {
    const content = generateFallback('unknown_type', {});
    expect(content).toContain('ANTHROPIC_API_KEY');
  });

  it('should sanitize HTML in fallback content', () => {
    const content = generateFallback('press_release', {
      artistName: '<script>alert(1)</script>',
      topic: '<img onerror=hack>',
    });
    expect(content).not.toContain('<script>');
    expect(content).not.toContain('<img');
  });
});
