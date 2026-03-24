import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Kiwify Product IDs → subscription types
const PRODUCT_MAP: Record<string, string> = {
  "d4298c50-2747-11f1-991b-1fd0929e8e1e": "tunesignal",
  "ab2aa410-2788-11f1-9de0-5b90a23268ea": "bandbrain_starter",
  "fec16a00-2788-11f1-b2b2-7b8bed92639d": "bandbrain_pro",
};

// Map Kiwify product to our subscription types (by ID first, then fallback to name)
function mapProduct(productId: string, productName: string): string {
  if (PRODUCT_MAP[productId]) return PRODUCT_MAP[productId];
  const lower = (productName || "").toLowerCase();
  if (lower.includes("pro") && lower.includes("band")) return "bandbrain_pro";
  if (lower.includes("starter") || lower.includes("band")) return "bandbrain_starter";
  if (lower.includes("tunesignal") || lower.includes("signal")) return "tunesignal";
  return "tunesignal";
}

// Map Kiwify status to our status
function mapStatus(kiwifyStatus: string): string {
  switch (kiwifyStatus) {
    case "paid":
    case "approved":
      return "active";
    case "refunded":
    case "chargedback":
      return "canceled";
    case "waiting_payment":
      return "past_due";
    case "expired":
      return "expired";
    default:
      return "active";
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Verify webhook signature (optional but recommended)
    const signature = req.headers.get("x-kiwify-signature");
    if (process.env.KIWIFY_WEBHOOK_SECRET && signature) {
      // Kiwify sends a signature header you can verify
      // For now we accept all webhooks, add verification later
    }

    const {
      order_id,
      order_status,
      product,
      Customer: customer,
      Subscription: subscription,
    } = body;

    if (!customer?.email) {
      return NextResponse.json({ error: "No customer email" }, { status: 400 });
    }

    const email = customer.email.toLowerCase().trim();
    const fullName = customer.full_name || customer.name || "";

    // Upsert user
    const { data: user } = await supabase
      .from("users")
      .upsert({ email, full_name: fullName }, { onConflict: "email" })
      .select()
      .single();

    if (!user) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }

    // Upsert subscription
    const productType = mapProduct(product?.id || "", product?.name || "");
    const status = mapStatus(order_status);

    await supabase.from("subscriptions").upsert(
      {
        user_id: user.id,
        product: productType,
        status,
        kiwify_subscription_id: subscription?.id || order_id,
        kiwify_customer_id: customer.id || null,
        current_period_start: subscription?.start_date || new Date().toISOString(),
        current_period_end: subscription?.next_payment || null,
        canceled_at: status === "canceled" ? new Date().toISOString() : null,
      },
      { onConflict: "kiwify_subscription_id" }
    );

    // Also add to newsletter subscribers
    await supabase.from("email_subscribers").upsert(
      {
        email,
        full_name: fullName,
        source: "bandbrain",
        status: "active",
      },
      { onConflict: "email" }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Kiwify webhook error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
