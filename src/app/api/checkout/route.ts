import { NextResponse } from "next/server";

export const runtime = 'edge';

const PRICES: Record<string, string> = {
  tunesignal_premium: process.env.STRIPE_PRICE_PREMIUM || "",
  bandbrain_essencial: process.env.STRIPE_PRICE_ESSENCIAL || "",
  bandbrain_pro: process.env.STRIPE_PRICE_PRO || "",
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

async function stripeGet(endpoint: string) {
  const res = await fetch("https://api.stripe.com/v1" + endpoint, {
    headers: {
      "Authorization": "Bearer " + process.env.STRIPE_SECRET_KEY,
    },
  });
  return res.json();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Setup mode: create products and prices in Stripe
    if (body.action === "setup_stripe_products") {
      const products = [
        { key: "tunesignal_premium", name: "TuneSignal Premium", amount: "2990", desc: "Newsletter premium com oportunidades exclusivas de sync e acesso antecipado ao BandBrain." },
        { key: "bandbrain_essencial", name: "BandBrain Essencial", amount: "4700", desc: "Gerente de banda inteligente com calendario, press releases, setlists e relatorios mensais." },
        { key: "bandbrain_pro", name: "BandBrain Pro", amount: "9700", desc: "Tudo do Essencial + calendarios ilimitados, pitches para playlists e analytics avancados." },
      ];

      const results: Record<string, { productId: string; priceId: string }> = {};

      for (const p of products) {
        const prod = await stripePost("/products", { name: p.name, description: p.desc });
        const price = await stripePost("/prices", {
          product: prod.id,
          unit_amount: p.amount,
          currency: "brl",
          "recurring[interval]": "month",
        });
        results[p.key] = { productId: prod.id, priceId: price.id };
      }

      return NextResponse.json({ success: true, products: results });
    }

    // Normal checkout mode
    const { priceId } = body;
    
    // Use env var prices if available, otherwise use the priceId directly if it starts with price_
    let stripePriceId = PRICES[priceId] || "";
    
    if (!stripePriceId && priceId && priceId.startsWith("price_")) {
      stripePriceId = priceId;
    }
    
    if (!stripePriceId) {
      return NextResponse.json({ error: "Invalid price ID" }, { status: 400 });
    }

    const session = await stripePost("/checkout/sessions", {
      mode: "subscription",
      "line_items[0][price]": stripePriceId,
      "line_items[0][quantity]": "1",
      success_url: "https://verelus.com?success=true",
      cancel_url: "https://verelus.com?canceled=true",
    });

    if (session.error) {
      console.error("Stripe error:", session.error);
      return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
