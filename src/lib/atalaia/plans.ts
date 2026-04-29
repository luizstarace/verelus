import { AtalaiaPlan, AtalaiaPlanLimits } from '@/lib/types/atalaia';

export const ATALAIA_PLANS: Record<AtalaiaPlan, AtalaiaPlanLimits> = {
  starter: {
    text_messages: 500,
    voice_seconds: 0,
    voice_enabled: false,
    voice_clone: false,
    overage_text_cents: 12,
    overage_voice_cents: 0,
  },
  pro: {
    text_messages: 2500,
    voice_seconds: 1800,
    voice_enabled: true,
    voice_clone: false,
    overage_text_cents: 8,
    overage_voice_cents: 70,
  },
  business: {
    text_messages: 10000,
    voice_seconds: 7200,
    voice_enabled: true,
    voice_clone: false,
    overage_text_cents: 5,
    overage_voice_cents: 50,
  },
};

export const ATALAIA_PRICES = {
  starter_monthly: 14700,
  pro_monthly: 29700,
  business_monthly: 59700,
  starter_annual: 147000,
  pro_annual: 297000,
  business_annual: 597000,
} as const;

export const TRIAL_DAYS = 7;

export function getPlanFromSubscription(product: string | null): AtalaiaPlan {
  if (product === 'atalaia_business') return 'business';
  if (product === 'atalaia_pro') return 'pro';
  return 'starter';
}

export function getPlanLimits(plan: AtalaiaPlan): AtalaiaPlanLimits {
  return ATALAIA_PLANS[plan];
}
