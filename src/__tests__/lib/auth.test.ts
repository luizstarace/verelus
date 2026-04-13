import { describe, it, expect } from 'vitest';
import { canAccessModule, MODULE_ACCESS, type PlanTier } from '@/lib/auth';

describe('MODULE_ACCESS constant', () => {
  it('should define access for all three tiers', () => {
    expect(MODULE_ACCESS).toHaveProperty('free');
    expect(MODULE_ACCESS).toHaveProperty('pro');
    expect(MODULE_ACCESS).toHaveProperty('business');
  });

  it('free tier should include artist_analysis, playlist_pitch, and epk', () => {
    expect(MODULE_ACCESS.free).toContain('artist_analysis');
    expect(MODULE_ACCESS.free).toContain('playlist_pitch');
    expect(MODULE_ACCESS.free).toContain('epk');
  });

  it('free tier should NOT include pro-only modules', () => {
    expect(MODULE_ACCESS.free).not.toContain('press_release');
    expect(MODULE_ACCESS.free).not.toContain('social_calendar');
    expect(MODULE_ACCESS.free).not.toContain('contract');
    expect(MODULE_ACCESS.free).not.toContain('tour_plan');
  });

  it('pro tier should include all free modules plus additional ones', () => {
    for (const mod of MODULE_ACCESS.free) {
      expect(MODULE_ACCESS.pro).toContain(mod);
    }
    expect(MODULE_ACCESS.pro).toContain('press_release');
    expect(MODULE_ACCESS.pro).toContain('social_calendar');
    expect(MODULE_ACCESS.pro).toContain('setlist');
    expect(MODULE_ACCESS.pro).toContain('budget');
    expect(MODULE_ACCESS.pro).toContain('rider');
    expect(MODULE_ACCESS.pro).toContain('contract');
    expect(MODULE_ACCESS.pro).toContain('monthly_report');
  });

  it('business tier should include all pro modules plus tour_plan', () => {
    // Business should have everything pro has
    for (const mod of MODULE_ACCESS.pro) {
      expect(MODULE_ACCESS.business).toContain(mod);
    }
    expect(MODULE_ACCESS.business).toContain('tour_plan');
  });

  it('pro tier should NOT include tour_plan', () => {
    expect(MODULE_ACCESS.pro).not.toContain('tour_plan');
  });
});

describe('canAccessModule', () => {
  it('should allow free tier to access artist_analysis', () => {
    expect(canAccessModule('free', 'artist_analysis')).toBe(true);
  });

  it('should allow free tier to access playlist_pitch', () => {
    expect(canAccessModule('free', 'playlist_pitch')).toBe(true);
  });

  it('should allow free tier to access epk', () => {
    expect(canAccessModule('free', 'epk')).toBe(true);
  });

  it('should deny free tier access to press_release', () => {
    expect(canAccessModule('free', 'press_release')).toBe(false);
  });

  it('should deny free tier access to contract', () => {
    expect(canAccessModule('free', 'contract')).toBe(false);
  });

  it('should deny free tier access to tour_plan', () => {
    expect(canAccessModule('free', 'tour_plan')).toBe(false);
  });

  it('should allow pro tier to access press_release', () => {
    expect(canAccessModule('pro', 'press_release')).toBe(true);
  });

  it('should allow pro tier to access contract', () => {
    expect(canAccessModule('pro', 'contract')).toBe(true);
  });

  it('should deny pro tier access to tour_plan', () => {
    expect(canAccessModule('pro', 'tour_plan')).toBe(false);
  });

  it('should allow business tier to access tour_plan', () => {
    expect(canAccessModule('business', 'tour_plan')).toBe(true);
  });

  it('should allow business tier to access all modules', () => {
    for (const mod of MODULE_ACCESS.business) {
      expect(canAccessModule('business', mod)).toBe(true);
    }
  });

  it('should deny access to a nonexistent module for any tier', () => {
    const tiers: PlanTier[] = ['free', 'pro', 'business'];
    for (const tier of tiers) {
      expect(canAccessModule(tier, 'nonexistent_module')).toBe(false);
    }
  });

  it('should fall back to free tier for unknown tier value', () => {
    // The function uses MODULE_ACCESS[tier] || MODULE_ACCESS.free
    const result = canAccessModule('unknown' as PlanTier, 'artist_analysis');
    expect(result).toBe(true);

    const denied = canAccessModule('unknown' as PlanTier, 'press_release');
    expect(denied).toBe(false);
  });
});
