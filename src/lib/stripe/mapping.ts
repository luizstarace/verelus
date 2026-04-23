export interface StripePrices {
  pro: string;
  business: string;
  attendlyStarter: string;
  attendlyPro: string;
  attendlyBusiness: string;
}

function readPricesFromEnv(): StripePrices {
  return {
    pro: process.env.STRIPE_PRICE_PRO || '',
    business: process.env.STRIPE_PRICE_BUSINESS || '',
    attendlyStarter: process.env.STRIPE_PRICE_ATTENDLY_STARTER || '',
    attendlyPro: process.env.STRIPE_PRICE_ATTENDLY_PRO || '',
    attendlyBusiness: process.env.STRIPE_PRICE_ATTENDLY_BUSINESS || '',
  };
}

export function mapProduct(priceId: string, prices: StripePrices = readPricesFromEnv()): string {
  if (!priceId) return 'pro';

  if (priceId === prices.attendlyBusiness) return 'attendly_business';
  if (priceId === prices.attendlyPro) return 'attendly_pro';
  if (priceId === prices.attendlyStarter) return 'attendly_starter';

  if ((prices.business && priceId === prices.business) || priceId.includes('business')) {
    return 'business';
  }
  if ((prices.pro && priceId === prices.pro) || priceId.includes('pro')) {
    return 'pro';
  }
  return 'pro';
}

export function isAttendlyProduct(product: string): boolean {
  return product.startsWith('attendly_');
}

export function mapStatus(stripeStatus: string): string {
  switch (stripeStatus) {
    case 'active':
    case 'trialing':
      return 'active';
    case 'past_due':
      return 'past_due';
    case 'canceled':
    case 'incomplete_expired':
      return 'canceled';
    default:
      return 'active';
  }
}
