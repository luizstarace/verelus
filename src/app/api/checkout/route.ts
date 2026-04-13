import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = 'edge';

// Unified plan price mapping
const PRICES: Record<string, string> = {
  pro: process.env.STRIPE_PRICE_PRO || "",
  business: process.env.STRIPE_PRICE_BUSINESS || "",
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

    if (!priceId || typeof priceId !== 'string') {
      return NextResponse.json({ error: "Price ID is required" }, { status: 400 });
    }

    let stripePriceId = PRICES[priceId] || "";

    // Accept direct Stripe price IDs as fallback
    if (!stripePriceId && priceId.startsWith("price_")) {
      stripePriceId = priceId;
    }

    if (!stripePriceId) {
      return NextResponse.json(
        { error: "Invalid price ID" },
        { status: 400 }
      );
    }

    const origin = new URL(request.url).origin || process.env.NEXT_PUBLIC_APP_URL || "https://verelus.com";

    // Get authenticated user email to pre-fill Stripe checkout
    const checkoutParams: Record<string, string> = {
      mode: "subscription",
      "line_items[0][price]": stripePriceId,
      "line_items[0][quantity]": "1",
      success_url: origin + "/dashboard?welcome=true",
      cancel_url: origin + "/#pricing",
    };

    try {
      const cookieStore = cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value;
            },
          },
        }
      );
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        checkoutParams.customer_email = user.email;
      }
    } catch {
      // Continue without email if auth fails
    }

    const session = await stripePost("/checkout/sessions", checkoutParams);

    if (session.error) {
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
