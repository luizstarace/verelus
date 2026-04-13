import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabase = getSupabase();

    // Find the user's active subscription
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id, status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (!subscription?.stripe_subscription_id) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 }
      );
    }

    // Cancel at period end via Stripe API (not immediately)
    const stripeRes = await fetch(
      `https://api.stripe.com/v1/subscriptions/${subscription.stripe_subscription_id}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "cancel_at_period_end=true",
      }
    );

    if (!stripeRes.ok) {
      const err = await stripeRes.json();
      console.error("Stripe cancel error:", err);
      return NextResponse.json(
        { error: "Failed to cancel subscription" },
        { status: 500 }
      );
    }

    const stripeData = await stripeRes.json();

    // Update local subscription record
    await supabase
      .from("subscriptions")
      .update({
        canceled_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", subscription.stripe_subscription_id);

    return NextResponse.json({
      success: true,
      cancel_at: stripeData.current_period_end
        ? new Date(stripeData.current_period_end * 1000).toISOString()
        : null,
    });
  } catch (err) {
    console.error("Cancel subscription error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
