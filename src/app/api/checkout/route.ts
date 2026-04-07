import { NextResponse } from "next/server";

export const runtime = 'edge';

// Unified plan price mapping
// Environment variables take precedence, with hardcoded fallbacks for the current Stripe prices
const PRICES: Record<string, string> = {
  pro: process.env.STRIPE_PRICE_PRO || "",
  business: process.env.STRIPE_PRICE_BUSINESS || "",
  // Legacy mappings (backwards compatible)
  tunesignal_premium: process.env.STRIPE_PRICE_PRO || "",
  bandbrain_essencial: process.env.STRIPE_PRICE_PRO || "",
  bandbrain_pro: process.env.STRIPE_PRICE_BUSINESS || "",
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

    // Setup mode: create new Stripe products and prices for unified plans
    if (body.action === "setup_unified_plans") {
      const products = [
        { key: "pro", name: "Verelus Pro", amount: "9700", desc: "Unlimited AI-powered pitching, all career management tools, premium newsletter, advanced reports" },
        { key: "business", name: "Verelus Business", amount: "29700", desc: "Everything in Pro plus multi-artist management, tour planning, API access, dedicated support" },
      ];
      const results: Record<string, { productId: string; priceId: string }> = {};
      for (const p of products) {
        const prod = await stripePost("/products", { name: p.name, description: p.desc });
        const price = await stripePost("/prices", {
          product: prod.id, unit_amount: p.amount, currency: "brl",
          "recurring[interval]": "month",
        });
        results[p.key] = { productId: prod.id, priceId: price.id };
      }
      return NextResponse.json({ success: true, products: results });
    }

    // Normal checkout mode
    let stripePriceId = PRICES[priceId] || "";

    // Accept direct Stripe price IDs as fallback
    if (!stripePriceId && priceId && priceId.startsWith("price_")) {
      stripePriceId = priceId;
    }

    if (!stripePriceId) {
      return NextResponse.json(
        { error: "Invalid price ID: " + priceId },
        { status: 400 }
      );
    }

    const origin = new URL(request.url).origin || "https://verelus.com";

    const session = await stripePost("/checkout/sessions", {
      mode: "subscription",
      "line_items[0][price]": stripePriceId,
      "line_items[0][quantity]": "1",
      success_url: origin + "?success=true",
      cancel_url: origin + "?canceled=true",
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
