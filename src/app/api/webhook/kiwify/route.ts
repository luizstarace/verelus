import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Map Kiwify product names to our subscription types
function mapProduct(productName: string): string {
  const lower = productName.toLowerCase();
  if (lower.includes("pro") && lower.includes("band")) return "bandbrain_pro";
  if (lower.includes("starter") || lower.includes("band")) return "bandbrain_starter";
  if (lower.includes("tunesignal") || lower.includes("signal")) return "tunesignal";
  return "tunesignal";
}

function mapStatus(kiwifyStatus: string): string {
  switch (kiwifyStatus) {
    case "paid": case "approved": return "active";
    case "refunded": case "chargeback": return "canceled";
    case "waiting_payment": return "past_due";
    case "expired": return "expired";
    default: return "active";
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const signature = req.headers.get("x-kiwify-signature");
    const { order_id, order_status, product, Customer: customer, Subscription: subscription } = body;

    if (!customer?.email) return NextResponse.json({ error: "No customer email" }, { status: 400 });

    const email = customer.email.toLowerCase().trim();
    const fullName = customer.full_name || customer.name || "";

    const { data: user } = await supabase.from("users").upsert({ email, full_name: fullName }, { onConflict: "email" }).select().single();
    if (!user) return NextResponse.json({ error: "Failed to create user" }, { status: 500 });

    await supabase.from("subscriptions").upsert({
      user_id: user.id, product: mapProduct(product?.name || ""), status: mapStatus(order_status),
      kiwify_subscription_id: subscription?.id || order_id,
      kiwify_customer_id: customer.id || null,
      current_period_start: subscription?.start_date || new Date().toISOString(),
      current_period_end: subscription?.next_payment || null,
      canceled_at: mapStatus(order_status) === "canceled" ? new Date().toISOString() : null,
    }, { onConflict: "kiwify_subscription_id" });

    await supabase.from("email_subscribers").upsert({ email, full_name: fullName, source: "bandbrain", status: "active" }, { onConflict: "email" });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Kiwify webhook error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
