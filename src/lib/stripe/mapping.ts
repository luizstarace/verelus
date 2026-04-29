export interface StripePrices {
  pro: string;
  business: string;
  atalaiaStarter: string;
  atalaiaPro: string;
  atalaiaBusiness: string;
}

function readPricesFromEnv(): StripePrices {
  return {
    pro: process.env.STRIPE_PRICE_PRO || '',
    business: process.env.STRIPE_PRICE_BUSINESS || '',
    atalaiaStarter: process.env.STRIPE_PRICE_ATALAIA_STARTER || '',
    atalaiaPro: process.env.STRIPE_PRICE_ATALAIA_PRO || '',
    atalaiaBusiness: process.env.STRIPE_PRICE_ATALAIA_BUSINESS || '',
  };
}

export function mapProduct(priceId: string, prices: StripePrices = readPricesFromEnv()): string {
  if (!priceId) return 'pro';

  if (priceId === prices.atalaiaBusiness) return 'atalaia_business';
  if (priceId === prices.atalaiaPro) return 'atalaia_pro';
  if (priceId === prices.atalaiaStarter) return 'atalaia_starter';

  if ((prices.business && priceId === prices.business) || priceId.includes('business')) {
    return 'business';
  }
  if ((prices.pro && priceId === prices.pro) || priceId.includes('pro')) {
    return 'pro';
  }
  return 'pro';
}

export function isAtalaiaProduct(product: string): boolean {
  return product.startsWith('atalaia_');
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
