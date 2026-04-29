import { describe, it, expect } from 'vitest';
import { mapProduct, isAtalaiaProduct, mapStatus, type StripePrices } from '@/lib/stripe/mapping';

const PRICES: StripePrices = {
  pro: 'price_pro_legacy',
  business: 'price_biz_legacy',
  atalaiaStarter: 'price_atalaia_starter',
  atalaiaPro: 'price_atalaia_pro',
  atalaiaBusiness: 'price_atalaia_business',
};

describe('mapProduct', () => {
  it('maps atalaia business price to atalaia_business', () => {
    expect(mapProduct('price_atalaia_business', PRICES)).toBe('atalaia_business');
  });

  it('maps atalaia pro price to atalaia_pro', () => {
    expect(mapProduct('price_atalaia_pro', PRICES)).toBe('atalaia_pro');
  });

  it('maps atalaia starter price to atalaia_starter', () => {
    expect(mapProduct('price_atalaia_starter', PRICES)).toBe('atalaia_starter');
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

  it('prefers atalaia price match over generic substring', () => {
    // atalaia_pro price happens to contain "pro" substring; should resolve to atalaia_pro
    expect(mapProduct('price_atalaia_pro', PRICES)).toBe('atalaia_pro');
  });

  it('does not treat empty string as matching empty env prices', () => {
    const emptyPrices: StripePrices = {
      pro: '',
      business: '',
      atalaiaStarter: '',
      atalaiaPro: '',
      atalaiaBusiness: '',
    };
    // Empty priceId with empty envs should NOT short-circuit to atalaia_* — falls through to "pro" default
    expect(mapProduct('', emptyPrices)).toBe('pro');
  });
});

describe('isAtalaiaProduct', () => {
  it('returns true for atalaia_starter', () => {
    expect(isAtalaiaProduct('atalaia_starter')).toBe(true);
  });

  it('returns true for atalaia_pro', () => {
    expect(isAtalaiaProduct('atalaia_pro')).toBe(true);
  });

  it('returns true for atalaia_business', () => {
    expect(isAtalaiaProduct('atalaia_business')).toBe(true);
  });

  it('returns false for legacy "pro"', () => {
    expect(isAtalaiaProduct('pro')).toBe(false);
  });

  it('returns false for legacy "business"', () => {
    expect(isAtalaiaProduct('business')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isAtalaiaProduct('')).toBe(false);
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
