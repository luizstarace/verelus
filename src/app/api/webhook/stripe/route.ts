import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = 'edge';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

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

async function sendPurchaseEmail(email: string, plan: string) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://verelus.com";
  const planLabel = plan === "business" ? "Business" : "Pro";

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "Verelus <noreply@verelus.com>",
        to: [email],
        subject: `Bem-vindo ao Verelus ${planLabel}!`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #e5e5e5; padding: 40px 30px; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #f5f5f5; font-size: 28px; margin: 0;">Verelus</h1>
              <p style="color: #00f5a0; font-size: 14px; margin: 4px 0 0;">Ferramentas para musicos</p>
            </div>
            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px; padding: 30px; margin-bottom: 24px; border: 1px solid #262626;">
              <h2 style="color: #00f5a0; margin: 0 0 16px; font-size: 22px;">Parabens! Seu plano ${planLabel} esta ativo.</h2>
              <p style="color: #d4d4d4; line-height: 1.7; margin: 0 0 16px;">
                Agora voce tem acesso ilimitado a todas as 11 ferramentas do Verelus.
              </p>
              <p style="color: #d4d4d4; line-height: 1.7; margin: 0;">
                Aqui esta o que voce pode fazer agora:
              </p>
            </div>
            <div style="margin-bottom: 24px;">
              <div style="margin-bottom: 12px;">
                <strong style="color: #f5f5f5;">Bio, Rider, Contrato, Cache</strong>
                <p style="color: #a3a3a3; margin: 4px 0 0; font-size: 14px;">Ferramentas profissionais com PDF, ilimitadas</p>
              </div>
              <div style="margin-bottom: 12px;">
                <strong style="color: #f5f5f5;">Growth Tracker + Metas</strong>
                <p style="color: #a3a3a3; margin: 4px 0 0; font-size: 14px;">Email semanal com dados reais + projecoes</p>
              </div>
              <div style="margin-bottom: 12px;">
                <strong style="color: #f5f5f5;">Pitch Kit + Cronograma</strong>
                <p style="color: #a3a3a3; margin: 4px 0 0; font-size: 14px;">Pitches coordenados + 30 dias de posts</p>
              </div>
            </div>
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${appUrl}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #00f5a0, #00d9f5); color: #000; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px;">
                Acessar meu Dashboard
              </a>
            </div>
            <div style="text-align: center; border-top: 1px solid #262626; padding-top: 20px;">
              <p style="color: #737373; font-size: 13px; margin: 0;">
                <strong style="color: #a3a3a3;">Verelus</strong> — Ferramentas para musicos
              </p>
              <p style="color: #525252; font-size: 12px; margin: 8px 0 0;">
                &copy; 2026 Verelus. Todos os direitos reservados.
              </p>
            </div>
          </div>
        `,
      }),
    });
  } catch (err) {
    console.error("Failed to send purchase email:", err);
  }
}

export async function POST(req: NextRequest) {
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

    const supabase = getSupabase();
    const body = JSON.parse(rawBody);
    // Stripe webhook event structure
    const { type, data } = body as {
      type: string;
      data: {
        object: {
          id: string;
          customer: string;
          subscription?: string;
          customer_email?: string;
          customer_details?: { email?: string };
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

    // Helper to fetch subscription details from Stripe
    const getSubscriptionDetails = async (subscriptionId: string) => {
      const res = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
        headers: { Authorization: "Bearer " + process.env.STRIPE_SECRET_KEY },
      });
      return res.json();
    };

    // Handle different Stripe event types
    switch (type) {
      case "checkout.session.completed": {
        // New subscription created via checkout
        const customerId = event.customer;
        // Stripe checkout session has email in customer_details.email or customer_email
        const email = event.customer_details?.email || event.customer_email;

        if (!email) {
          return NextResponse.json({ error: "No customer email" }, { status: 400 });
        }

        // Fetch subscription to get the price ID (checkout session doesn't include line items directly)
        let priceId = "";
        if (event.subscription) {
          const sub = await getSubscriptionDetails(event.subscription);
          priceId = sub.items?.data?.[0]?.price?.id || "";
        }
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

        // Upsert subscription (use subscription ID, not session ID)
        const subscriptionId = event.subscription || event.id;
        await supabase.from("subscriptions").upsert(
          {
            user_id: user.id,
            product: productType,
            status: "active",
            payment_provider: "stripe",
            stripe_subscription_id: subscriptionId,
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

        // Send post-purchase welcome email via Resend
        await sendPurchaseEmail(email.toLowerCase().trim(), productType);

            break;
      }

      case "customer.subscription.updated": {
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

        break;
      }

      case "customer.subscription.deleted": {
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

        break;
      }

      case "invoice.payment_succeeded": {
        const customerId = event.customer;

        await supabase
          .from("subscriptions")
          .update({ status: "active" })
          .eq("stripe_customer_id", customerId);

        break;
      }

      case "invoice.payment_failed": {
        const customerId = event.customer;

        await supabase
          .from("subscriptions")
          .update({ status: "past_due" })
          .eq("stripe_customer_id", customerId);

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
