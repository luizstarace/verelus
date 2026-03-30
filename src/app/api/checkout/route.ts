import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';

// Map price ID to price details
const PRICES: Record<string, { name: string; amount: number; currency: string }> = {
  tunesignal_premium: {
    name: "TuneSignal Premium",
    amount: 2990, // R$29.90 in cents
    currency: "brl",
  },
  bandbrain_essencial: {
    name: "BandBrain Essencial",
    amount: 4700, // R$47 in cents
    currency: "brl",
  },
  bandbrain_pro: {
    name: "BandBrain Pro",
    amount: 9700, // R$97 in cents
    currency: "brl",
  },
};

export async function POST(req: NextRequest) {
  try {
    const { priceId } = await req.json();

    if (!priceId || !PRICES[priceId]) {
      return NextResponse.json({ error: "Invalid price ID" }, { status: 400 });
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: "Stripe key not configured" }, { status: 500 });
    }

    const priceInfo = PRICES[priceId];
    const origin = req.headers.get("origin") || "https://verelus.com";

    // Create checkout session via Stripe REST API
    const formData = new URLSearchParams();
    formData.append("payment_method_types[]", "card");
    formData.append("line_items[0][price_data][currency]", priceInfo.currency);
    formData.append("line_items[0][price_data][product_data][name]", priceInfo.name);
    formData.append("line_items[0][price_data][unit_amount]", priceInfo.amount.toString());
    formData.append("line_items[0][quantity]", "1");
    formData.append("mode", "subscription");
    formData.append("success_url", `${origin}/?success=true`);
    formData.append("cancel_url", `${origin}/?canceled=true`);
    formData.append("customer_email_collection[enabled]", "true");

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Stripe API error:", error);
      return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
    }

    const session = await response.json() as { url: string };

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
