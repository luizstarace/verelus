import { describe, it, expect } from 'vitest';
import { getPlanFromSubscription, getPlanLimits, ATALAIA_PLANS } from '@/lib/atalaia/plans';

describe('Atalaia Plans', () => {
  it('returns starter for null product', () => {
    expect(getPlanFromSubscription(null)).toBe('starter');
  });

  it('returns correct plan for product strings', () => {
    expect(getPlanFromSubscription('atalaia_pro')).toBe('pro');
    expect(getPlanFromSubscription('atalaia_business')).toBe('business');
    expect(getPlanFromSubscription('unknown')).toBe('starter');
  });

  it('starter has no voice', () => {
    const limits = getPlanLimits('starter');
    expect(limits.voice_enabled).toBe(false);
    expect(limits.voice_seconds).toBe(0);
  });

  it('pro has 30min voice', () => {
    const limits = getPlanLimits('pro');
    expect(limits.voice_enabled).toBe(true);
    expect(limits.voice_seconds).toBe(1800);
  });

  it('business has 2h voice but no clone (self-serve)', () => {
    const limits = getPlanLimits('business');
    expect(limits.voice_clone).toBe(false);
    expect(limits.voice_seconds).toBe(7200);
  });

  it('all plans have text messages', () => {
    expect(ATALAIA_PLANS.starter.text_messages).toBe(500);
    expect(ATALAIA_PLANS.pro.text_messages).toBe(2500);
    expect(ATALAIA_PLANS.business.text_messages).toBe(10000);
  });
});
