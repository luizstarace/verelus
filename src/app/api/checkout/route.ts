import { NextResponse } from "next/server";

export const runtime = 'edge';

const PRICES: Record<string, string> = {
  tunesignal_premium: process.env.STRIPE_PRICE_PREMIUM || "price_1TGtsKRzZZ2nAWDFRLlBt5iO",
  bandbrain_essencial: process.env.STRIPE_PRICE_ESSENCIAL || "price_1TGtsKRzZZ2nAWDFCZcSjnqc",
  bandbrain_pro: process.env.STRIPE_PRICE_PRO || "price_1TGtsLRzZZ2nAWDFXA2quqsI",
};

async function stripePost(endpoint: string, params: Record<string, string>) {
  const res = await fetch("https://api.stripe.com/v1" + endpoint, {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + process.env.STRIPE_SECRET_KEY,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params).toString(),
  });
  return res.json();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { priceId } = body;

    // Resolve the Stripe price ID
    let stripePriceId = PRICES[priceId] || "";
    if (!stripePriceId && priceId && priceId.startsWith("price_")) {
      stripePriceId = priceId;
    }

    if (!stripePriceId) {
      return NextResponse.json(
        { error: "Invalid price ID: " + priceId },
        { status: 400 }
      );
    }

    // Create Stripe Checkout Session
    const session = await stripePost("/checkout/sessions", {
      mode: "subscription",
      "line_items[0][price]": stripePriceId,
      "line_items[0][quantity]": "1",
      success_url: "https://verelus.com?success=true",
      cancel_url: "https://verelus.com?canceled=true",
    });

    if (session.error) {
      return NextResponse.json(
        { error: session.error.message || "Failed to create checkout session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
