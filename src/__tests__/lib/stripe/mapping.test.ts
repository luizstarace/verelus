import { describe, it, expect } from 'vitest';
import { mapProduct, isAttendlyProduct, mapStatus, type StripePrices } from '@/lib/stripe/mapping';

const PRICES: StripePrices = {
  pro: 'price_pro_legacy',
  business: 'price_biz_legacy',
  attendlyStarter: 'price_attendly_starter',
  attendlyPro: 'price_attendly_pro',
  attendlyBusiness: 'price_attendly_business',
};

describe('mapProduct', () => {
  it('maps attendly business price to attendly_business', () => {
    expect(mapProduct('price_attendly_business', PRICES)).toBe('attendly_business');
  });

  it('maps attendly pro price to attendly_pro', () => {
    expect(mapProduct('price_attendly_pro', PRICES)).toBe('attendly_pro');
  });

  it('maps attendly starter price to attendly_starter', () => {
    expect(mapProduct('price_attendly_starter', PRICES)).toBe('attendly_starter');
  });

  it('maps legacy business price to business', () => {
    expect(mapProduct('price_biz_legacy', PRICES)).toBe('business');
  });

  it('maps legacy pro price to pro', () => {
    expect(mapProduct('price_pro_legacy', PRICES)).toBe('pro');
  });

  it('falls back to pro for unknown price ID', () => {
    expect(mapProduct('price_totally_unknown', PRICES)).toBe('pro');
  });

  it('uses substring heuristic "business" when price ID matches neither env', () => {
    expect(mapProduct('price_custom_business_plan', PRICES)).toBe('business');
  });

  it('uses substring heuristic "pro" when price ID matches neither env', () => {
    expect(mapProduct('price_custom_pro_plan', PRICES)).toBe('pro');
  });

  it('prefers attendly price match over generic substring', () => {
    // attendly_pro price happens to contain "pro" substring; should resolve to attendly_pro
    expect(mapProduct('price_attendly_pro', PRICES)).toBe('attendly_pro');
  });

  it('does not treat empty string as matching empty env prices', () => {
    const emptyPrices: StripePrices = {
      pro: '',
      business: '',
      attendlyStarter: '',
      attendlyPro: '',
      attendlyBusiness: '',
    };
    // Empty priceId with empty envs should NOT short-circuit to attendly_* — falls through to "pro" default
    expect(mapProduct('', emptyPrices)).toBe('pro');
  });
});

describe('isAttendlyProduct', () => {
  it('returns true for attendly_starter', () => {
    expect(isAttendlyProduct('attendly_starter')).toBe(true);
  });

  it('returns true for attendly_pro', () => {
    expect(isAttendlyProduct('attendly_pro')).toBe(true);
  });

  it('returns true for attendly_business', () => {
    expect(isAttendlyProduct('attendly_business')).toBe(true);
  });

  it('returns false for legacy "pro"', () => {
    expect(isAttendlyProduct('pro')).toBe(false);
  });

  it('returns false for legacy "business"', () => {
    expect(isAttendlyProduct('business')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isAttendlyProduct('')).toBe(false);
  });
});

describe('mapStatus', () => {
  it('maps active to active', () => {
    expect(mapStatus('active')).toBe('active');
  });

  it('maps trialing to active', () => {
    expect(mapStatus('trialing')).toBe('active');
  });

  it('maps past_due to past_due', () => {
    expect(mapStatus('past_due')).toBe('past_due');
  });

  it('maps canceled to canceled', () => {
    expect(mapStatus('canceled')).toBe('canceled');
  });

  it('maps incomplete_expired to canceled', () => {
    expect(mapStatus('incomplete_expired')).toBe('canceled');
  });

  it('defaults unknown status to active', () => {
    expect(mapStatus('unpaid')).toBe('active');
    expect(mapStatus('incomplete')).toBe('active');
    expect(mapStatus('')).toBe('active');
  });
});
