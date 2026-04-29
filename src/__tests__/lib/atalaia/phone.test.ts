import { describe, it, expect } from 'vitest';
import { phoneVariants, phonesMatch, timingSafeEqual } from '@/lib/atalaia/phone';

describe('phoneVariants', () => {
  it('strips non-digit characters', () => {
    const variants = phoneVariants('(11) 99123-4567');
    expect(variants).toContain('11991234567');
  });

  it('expands a 13-digit JID (55+DDD+9+8dig) to without-country and without-9 forms', () => {
    const variants = phoneVariants('5511991234567');
    expect(variants).toContain('5511991234567');
    expect(variants).toContain('11991234567');
    expect(variants).toContain('1191234567');
  });

  it('expands an 11-digit number (DDD+9+8dig) to with-country and without-9 forms', () => {
    const variants = phoneVariants('11991234567');
    expect(variants).toContain('11991234567');
    expect(variants).toContain('5511991234567');
    expect(variants).toContain('1191234567');
  });

  it('expands a 10-digit legacy mobile (DDD+8dig) to with-9 and with-country forms', () => {
    const variants = phoneVariants('1191234567');
    expect(variants).toContain('1191234567');
    expect(variants).toContain('551191234567');
    expect(variants).toContain('11991234567');
    expect(variants).toContain('5511991234567');
  });

  it('does not mutate non-BR numbers', () => {
    const variants = phoneVariants('14155551234'); // US number
    expect(variants).toContain('14155551234');
    // No country-code stripping should happen — it doesn't start with 55
    expect(variants.every((v) => v.length >= 10)).toBe(true);
  });

  it('deduplicates variants', () => {
    const variants = phoneVariants('11991234567');
    expect(variants.length).toBe(new Set(variants).size);
  });
});

describe('phonesMatch', () => {
  it('matches the same number in different formats', () => {
    expect(phonesMatch('5511991234567', '11991234567')).toBe(true);
    expect(phonesMatch('5511991234567', '(11) 99123-4567')).toBe(true);
    expect(phonesMatch('11991234567', '+55 11 99123-4567')).toBe(true);
  });

  it('matches mobile w/ and w/o the 9th digit', () => {
    expect(phonesMatch('5511991234567', '551191234567')).toBe(true);
    expect(phonesMatch('11991234567', '1191234567')).toBe(true);
  });

  it('does not match different numbers', () => {
    expect(phonesMatch('5511991234567', '5511998887766')).toBe(false);
    expect(phonesMatch('11991234567', '21991234567')).toBe(false);
  });

  it('is symmetric', () => {
    expect(phonesMatch('11991234567', '5511991234567')).toBe(
      phonesMatch('5511991234567', '11991234567')
    );
  });
});

describe('timingSafeEqual', () => {
  it('returns true for identical strings', () => {
    expect(timingSafeEqual('abc123', 'abc123')).toBe(true);
  });

  it('returns false for different strings of same length', () => {
    expect(timingSafeEqual('abc123', 'abc124')).toBe(false);
  });

  it('returns false for strings of different lengths', () => {
    expect(timingSafeEqual('abc', 'abcd')).toBe(false);
    expect(timingSafeEqual('', 'a')).toBe(false);
  });

  it('handles empty strings', () => {
    expect(timingSafeEqual('', '')).toBe(true);
  });

  it('differs from !== in that it does not short-circuit on length mismatch in content', () => {
    // Not easy to observe timing here; just assert functional correctness for 64-hex keys
    const a = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    const b = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdee';
    expect(timingSafeEqual(a, b)).toBe(false);
    expect(timingSafeEqual(a, a)).toBe(true);
  });
});
