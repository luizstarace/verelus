export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { requireUser, errorResponse } from '@/lib/api-auth';

export async function POST(request: Request) {
  try {
    const { userId, email } = await requireUser();
    const body = await request.json();
    const { price_key } = body;

    const PRICE_MAP: Record<string, string> = {
      atalaia_starter_monthly: process.env.STRIPE_PRICE_ATTENDLY_STARTER || '',
      atalaia_pro_monthly: process.env.STRIPE_PRICE_ATTENDLY_PRO || '',
      atalaia_business_monthly: process.env.STRIPE_PRICE_ATTENDLY_BUSINESS || '',
    };

    const stripePriceId = PRICE_MAP[price_key];
    if (!stripePriceId) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 });
    }

    // Use Stripe REST API directly (edge-compatible, no stripe SDK needed)
    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'customer_email': email,
        'mode': 'subscription',
        'line_items[0][price]': stripePriceId,
        'line_items[0][quantity]': '1',
        // Trial is enforced in-app via business.trial_ends_at — do NOT request
        // an additional Stripe trial period here, otherwise customers who
        // already burned their 7 in-app days could get another 7 free on Stripe.
        'subscription_data[metadata][user_id]': userId,
        'subscription_data[metadata][product]': price_key.replace('_monthly', ''),
        'success_url': `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/atalaia?checkout=success`,
        'cancel_url': `${process.env.NEXT_PUBLIC_APP_URL}/atalaia#pricing`,
      }).toString(),
    });

    if (!stripeRes.ok) {
      const err = await stripeRes.text();
      console.error('Stripe error:', err);
      return NextResponse.json({ error: 'Erro ao criar sessão de pagamento' }, { status: 502 });
    }

    const session = await stripeRes.json();
    return NextResponse.json({ url: session.url });
  } catch (err) {
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
