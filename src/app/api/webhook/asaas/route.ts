import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Asaas event types we care about
type AsaasEvent =
  | "PAYMENT_CONFIRMED"
  | "PAYMENT_RECEIVED"
  | "PAYMENT_OVERDUE"
  | "PAYMENT_REFUNDED"
  | "PAYMENT_DELETED"
  | "SUBSCRIPTION_CREATED"
  | "SUBSCRIPTION_UPDATED"
  | "SUBSCRIPTION_DELETED"
  | "SUBSCRIPTION_RENEWED";

// Map Asaas subscription value to our product tier
function mapProduct(value: number): string {
  if (value >= 60 && value <= 80) return "bandbrain_pro"; // R$ 69
  if (value >= 25 && value <= 40) return "bandbrain_essencial"; // R$ 29
  if (value >= 15 && value <= 25) return "tunesignal_premium"; // R$ 19.90
  return "tunesignal_premium"; // default
}

// Map Asaas event to subscription status
function mapStatus(event: string): string {
  switch (event) {
    case "PAYMENT_CONFIRMED":
    case "PAYMENT_RECEIVED":
    case "SUBSCRIPTION_CREATED":
    case "SUBSCRIPTION_RENEWED":
      return "active";
    case "PAYMENT_OVERDUE":
      return "past_due";
    case "PAYMENT_REFUNDED":
    case "PAYMENT_DELETED":
    case "SUBSCRIPTION_DELETED":
      return "canceled";
    default:
      return "active";
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Asaas sends: { event, payment?, subscription? }
    const { event, payment, subscription } = body as {
      event: AsaasEvent;
      payment?: {
        id: string;
        customer: string;
        value: number;
        status: string;
        subscription?: string;
        dueDate?: string;
        paymentDate?: string;
      };
      subscription?: {
        id: string;
        customer: string;
        value: number;
        status: string;
        nextDueDate?: string;
        cycle?: string;
      };
    };

    // Verify webhook token (optional security layer)
    const token = req.headers.get("asaas-access-token");
    if (process.env.ASAAS_WEBHOOK_TOKEN && token !== process.env.ASAAS_WEBHOOK_TOKEN) {
      console.warn("Asaas webhook: invalid token");
    }

    // Get customer ID from payment or subscription
    const customerId = payment?.customer || subscription?.customer;
    if (!customerId) {
      return NextResponse.json({ error: "No customer ID" }, { status: 400 });
    }

    // Fetch customer details from Asaas API
    let email = "";
    let fullName = "";

    if (process.env.ASAAS_API_KEY) {
      try {
        const customerRes = await fetch(
          \`https://api.asaas.com/v3/customers/\${customerId}\`,
          {
            headers: {
              access_token: process.env.ASAAS_API_KEY,
            },
          }
        );
        if (customerRes.ok) {
          const customerData = await customerRes.json();
          email = (customerData.email || "").toLowerCase().trim();
          fullName = customerData.name || "";
        }
      } catch (err) {
        console.error("Failed to fetch Asaas customer:", err);
      }
    }

    if (!email) {
      console.error("Asaas webhook: could not determine customer email");
      return NextResponse.json({ error: "No customer email" }, { status: 400 });
    }

    // Upsert user
    const { data: user } = await supabase
      .from("users")
      .upsert({ email, full_name: fullName }, { onConflict: "email" })
      .select()
      .single();

    if (!user) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }

    // Determine product and status
    const value = subscription?.value || payment?.value || 0;
    const productType = mapProduct(value);
    const status = mapStatus(event);
    const subscriptionId = subscription?.id || payment?.subscription || payment?.id;

    // Upsert subscription
    await supabase.from("subscriptions").upsert(
      {
        user_id: user.id,
        product: productType,
        status,
        payment_provider: "asaas",
        asaas_subscription_id: subscriptionId,
        asaas_customer_id: customerId,
        current_period_start: payment?.paymentDate || new Date().toISOString(),
        current_period_end: subscription?.nextDueDate || null,
        canceled_at: status === "canceled" ? new Date().toISOString() : null,
      },
      { onConflict: "asaas_subscription_id" }
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

    console.log(\`Asaas webhook processed: \${event} for \${email} (\${productType})\`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Asaas webhook error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
