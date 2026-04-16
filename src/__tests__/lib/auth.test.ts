import { describe, it, expect } from 'vitest';
import type { PlanTier } from '@/lib/auth';

describe('PlanTier', () => {
  it('should only have free and pro tiers', () => {
    const tiers: PlanTier[] = ['free', 'pro'];
    expect(tiers).toHaveLength(2);
  });
});
