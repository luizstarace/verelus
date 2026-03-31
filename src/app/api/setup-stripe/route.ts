import { NextResponse } from "next/server";

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const { action } = await request.json();
    
    if (action !== "setup_stripe_products") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ error: "No Stripe key configured" }, { status: 500 });
    }

    async function stripePost(endpoint, params) {
      const res = await fetch("https://api.stripe.com/v1" + endpoint, {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + stripeKey,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(params).toString(),
      });
      return res.json();
    }

    // 1. Create TuneSignal Premium product + price
    const prod1 = await stripePost("/products", {
      name: "TuneSignal Premium",
      description: "Newsletter premium com oportunidades exclusivas de sync, analises profundas e acesso antecipado ao BandBrain.",
    });
    const price1 = await stripePost("/prices", {
      product: prod1.id,
      unit_amount: "2990",
      currency: "brl",
      "recurring[interval]": "month",
    });

    // 2. Create BandBrain Essencial product + price
    const prod2 = await stripePost("/products", {
      name: "BandBrain Essencial",
      description: "Gerente de banda inteligente com calendario de redes sociais, press releases, setlists e relatorios mensais.",
    });
    const price2 = await stripePost("/prices", {
      product: prod2.id,
      unit_amount: "4700",
      currency: "brl",
      "recurring[interval]": "month",
    });

    // 3. Create BandBrain Pro product + price
    const prod3 = await stripePost("/products", {
      name: "BandBrain Pro",
      description: "Tudo do Essencial mais calendarios e relatorios ilimitados, pitches para curadores de playlists e analytics avancados.",
    });
    const price3 = await stripePost("/prices", {
      product: prod3.id,
      unit_amount: "9700",
      currency: "brl",
      "recurring[interval]": "month",
    });

    return NextResponse.json({
      success: true,
      products: {
        tunesignal_premium: { productId: prod1.id, priceId: price1.id },
        bandbrain_essencial: { productId: prod2.id, priceId: price2.id },
        bandbrain_pro: { productId: prod3.id, priceId: price3.id },
      }
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
