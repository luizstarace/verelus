import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { mapProduct, isAttendlyProduct, mapStatus } from "@/lib/stripe/mapping";

export const runtime = 'edge';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
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
        from: "Verelus <contato@verelus.com>",
        to: [email],
        subject: `Bem-vindo ao Verelus ${planLabel}!`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #e5e5e5; padding: 40px 30px; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #f5f5f5; font-size: 28px; margin: 0;">Verelus</h1>
              <p style="color: #00f5a0; font-size: 14px; margin: 4px 0 0;">Ferramentas para músicos</p>
            </div>
            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px; padding: 30px; margin-bottom: 24px; border: 1px solid #262626;">
              <h2 style="color: #00f5a0; margin: 0 0 16px; font-size: 22px;">Parabéns! Seu plano ${planLabel} está ativo.</h2>
              <p style="color: #d4d4d4; line-height: 1.7; margin: 0 0 16px;">
                Agora você tem acesso ilimitado a todas as 11 ferramentas do Verelus.
              </p>
              <p style="color: #d4d4d4; line-height: 1.7; margin: 0;">
                Aqui está o que você pode fazer agora:
              </p>
            </div>
            <div style="margin-bottom: 24px;">
              <div style="margin-bottom: 12px;">
                <strong style="color: #f5f5f5;">Bio, Rider, Contrato, Cachê</strong>
                <p style="color: #a3a3a3; margin: 4px 0 0; font-size: 14px;">Ferramentas profissionais com PDF, ilimitadas</p>
              </div>
              <div style="margin-bottom: 12px;">
                <strong style="color: #f5f5f5;">Growth Tracker + Metas</strong>
                <p style="color: #a3a3a3; margin: 4px 0 0; font-size: 14px;">Email semanal com dados reais + projeções</p>
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
                <strong style="color: #a3a3a3;">Verelus</strong> — Ferramentas para músicos
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

    // Constant-time comparison of signatures
    let sigMatch = computedSig.length === expectedSig.length;
    if (sigMatch) {
      let diff = 0;
      for (let i = 0; i < computedSig.length; i++) {
        diff |= computedSig.charCodeAt(i) ^ expectedSig.charCodeAt(i);
      }
      sigMatch = diff === 0;
    }
    if (!sigMatch) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const supabase = getSupabase();
    const body = JSON.parse(rawBody);

    // Idempotency: Stripe retries webhooks on failure (up to 3×). Dedup by event.id
    // so we don't send 3 welcome emails or double-update subscriptions.
    const eventId = (body as { id?: string }).id;
    if (eventId) {
      const { error: dupErr } = await supabase
        .from('stripe_events_processed')
        .insert({ event_id: eventId });
      if (dupErr) {
        // PG unique constraint violation code is "23505"
        if ((dupErr as { code?: string }).code === '23505') {
          return NextResponse.json({ ok: true, deduped: true });
        }
        // Any other insert error: log and keep going (don't block on observability errors)
        console.error('stripe_events_processed insert failed:', dupErr);
      }
    }
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

        // Fetch subscription to get price ID AND period fields (checkout.session.completed
        // does NOT carry current_period_*; those live on the subscription object).
        let priceId = "";
        let subPeriodStart: number | null = null;
        let subPeriodEnd: number | null = null;
        if (event.subscription) {
          const sub = await getSubscriptionDetails(event.subscription);
          priceId = sub.items?.data?.[0]?.price?.id || "";
          subPeriodStart = typeof sub.current_period_start === "number" ? sub.current_period_start : null;
          subPeriodEnd = typeof sub.current_period_end === "number" ? sub.current_period_end : null;
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
            current_period_start: subPeriodStart ? new Date(subPeriodStart * 1000).toISOString() : new Date().toISOString(),
            current_period_end: subPeriodEnd ? new Date(subPeriodEnd * 1000).toISOString() : null,
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

        // If Attendly subscription, activate the business
        if (isAttendlyProduct(productType)) {
          await supabase
            .from("attendly_businesses")
            .update({ status: "active" })
            .eq("user_id", user.id);
        }

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

        // Sync Attendly business status with subscription
        if (isAttendlyProduct(productType)) {
          const { data: sub } = await supabase
            .from("subscriptions")
            .select("user_id")
            .eq("stripe_subscription_id", event.id)
            .single();

          if (sub?.user_id) {
            const bizStatus = status === "active" ? "active" : "paused";
            await supabase
              .from("attendly_businesses")
              .update({ status: bizStatus })
              .eq("user_id", sub.user_id);
          }
        }

        break;
      }

      case "customer.subscription.deleted": {
        const customerId = event.customer;

        // Get subscription before updating to check if Attendly
        const { data: existingSub } = await supabase
          .from("subscriptions")
          .select("user_id, product")
          .eq("stripe_subscription_id", event.id)
          .single();

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

        // Pause Attendly business on cancellation
        if (existingSub && isAttendlyProduct(existingSub.product)) {
          await supabase
            .from("attendly_businesses")
            .update({ status: "paused" })
            .eq("user_id", existingSub.user_id);
        }

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
