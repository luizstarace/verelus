import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = 'edge';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Map Stripe price ID to our unified product tier
function mapProduct(priceId: string): string {
  const proPriceId = process.env.STRIPE_PRICE_PRO || "";
  const businessPriceId = process.env.STRIPE_PRICE_BUSINESS || "";

  if (priceId === businessPriceId || priceId.includes("business")) {
    return "business";
  }
  if (priceId === proPriceId || priceId.includes("pro")) {
    return "pro";
  }
  // Legacy mappings
  if (priceId.includes("bandbrain_pro") || priceId.includes("bandbrain_essencial")) {
    return "pro";
  }
  if (priceId.includes("tunesignal_premium")) {
    return "pro";
  }
  return "pro"; // default paid tier
}

// Map Stripe subscription status to our status
function mapStatus(stripeStatus: string): string {
  switch (stripeStatus) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    default:
      return "active";
  }
}

export async function POST(req: NextRequest) {
  try {
  try {
    // Verify Stripe webhook signature (edge-compatible)
    const rawBody = await req.text();
    const sig = req.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
      return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
    }

    // Parse Stripe signature header
    const sigParts = Object.fromEntries(
      sig.split(',').map(part => {
        const [key, value] = part.split('=');
        return [key, value];
      })
    );
    const timestamp = sigParts['t'];
    const expectedSig = sigParts['v1'];

    // Verify timestamp (reject if older than 5 minutes)
    const tolerance = 300;
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parseInt(timestamp)) > tolerance) {
      return NextResponse.json({ error: 'Timestamp too old' }, { status: 400 });
    }

    // Compute expected signature using Web Crypto API
    const encoder = new TextEncoder();
    const keyData = encoder.encode(webhookSecret);
    const key = await crypto.subtle.importKey(
      'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const payload = encoder.encode(`${timestamp}.${rawBody}`);
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, payload);
    const computedSig = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0')).join('');

    if (computedSig !== expectedSig) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    // Stripe webhook event structure
    const { type, data } = body as {
      type: string;
      data: {
        object: {
          id: string;
          customer: string;
          email?: string;
          items?: {
            data: Array<{ price: { id: string } }>;
          };
          status?: string;
          current_period_start?: number;
          current_period_end?: number;
          canceled_at?: number;
        };
      };
    };

    const event = data?.object;
    if (!event) {
      return NextResponse.json({ error: "No event object" }, { status: 400 });
    }

    // Handle different Stripe event types
    switch (type) {
      case "checkout.session.completed": {
        // New subscription created via checkout
        const customerId = event.customer;
        const email = event.email;

        if (!email) {
          return NextResponse.json({ error: "No customer email" }, { status: 400 });
        }

        const priceId = event.items?.data?.[0]?.price?.id || "";
        const productType = mapProduct(priceId);

        // Upsert user
        const { data: user } = await supabase
          .from("users")
          .upsert({ email: email.toLowerCase().trim() }, { onConflict: "email" })
          .select()
          .single();

        if (!user) {
          return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
        }

        // Upsert subscription
        await supabase.from("subscriptions").upsert(
          {
            user_id: user.id,
            product: productType,
            status: "active",
            payment_provider: "stripe",
            stripe_subscription_id: event.id,
            stripe_customer_id: customerId,
            current_period_start: event.current_period_start ? new Date(event.current_period_start * 1000).toISOString() : new Date().toISOString(),
            current_period_end: event.current_period_end ? new Date(event.current_period_end * 1000).toISOString() : null,
            canceled_at: null,
          },
          { onConflict: "stripe_subscription_id" }
        );

        // Add to newsletter subscribers
        await supabase.from("email_subscribers").upsert(
          {
            email: email.toLowerCase().trim(),
            source: "dashboard",
            status: "active",
          },
          { onConflict: "email" }
        );

        console.log(`Stripe checkout completed: ${email} (${productType})`);
        break;
      }

      case "customer.subscription.updated": {
        // Subscription updated
        const customerId = event.customer;
        const status = mapStatus(event.status || "active");
        const priceId = event.items?.data?.[0]?.price?.id || "";
        const productType = mapProduct(priceId);

        await supabase.from("subscriptions").upsert(
          {
            product: productType,
            status,
            payment_provider: "stripe",
            stripe_subscription_id: event.id,
            stripe_customer_id: customerId,
            current_period_start: event.current_period_start ? new Date(event.current_period_start * 1000).toISOString() : new Date().toISOString(),
            current_period_end: event.current_period_end ? new Date(event.current_period_end * 1000).toISOString() : null,
            canceled_at: event.canceled_at ? new Date(event.canceled_at * 1000).toISOString() : null,
          },
          { onConflict: "stripe_subscription_id" }
        );

        console.log(`Stripe subscription updated: ${event.id} (${status})`);
        break;
      }

      case "customer.subscription.deleted": {
        // Subscription canceled
        const customerId = event.customer;

        await supabase.from("subscriptions").upsert(
          {
            status: "canceled",
            payment_provider: "stripe",
            stripe_subscription_id: event.id,
            stripe_customer_id: customerId,
            canceled_at: new Date().toISOString(),
          },
          { onConflict: "stripe_subscription_id" }
        );

        console.log(`Stripe subscription deleted: ${event.id}`);
        break;
      }

      case "invoice.payment_succeeded": {
        // Payment received
        const customerId = event.customer;

        // Update subscription status to active
        await supabase
          .from("subscriptions")
          .update({ status: "active" })
          .eq("stripe_customer_id", customerId);

        console.log(`Stripe payment succeeded for customer: ${customerId}`);
        break;
      }

      case "invoice.payment_failed": {
        // Payment failed
        const customerId = event.customer;

        // Update subscription status to past_due
        await supabase
          .from("subscriptions")
          .update({ status: "past_due" })
          .eq("stripe_customer_id", customerId);

        console.log(`Stripe payment failed for customer: ${customerId}`);
        break;
      }

      default:
        // Ignore other event types
        break;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Stripe webhook error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
