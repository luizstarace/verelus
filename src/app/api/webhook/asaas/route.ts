import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

type AsaasEvent = {
  event: string;
  payment?: {
    id: string;
    customer: string;
    subscription?: string;
    value: number;
    status: string;
    externalReference?: string;
    description?: string;
  };
  subscription?: {
    id: string;
    customer: string;
    value: number;
    status: string;
    externalReference?: string;
    description?: string;
  };
};

function mapProduct(description?: string): string {
  if (!description) return 'tunesignal';
  const d = description.toLowerCase();
  if (d.includes('pro')) return 'bandbrain_pro';
  if (d.includes('essencial')) return 'bandbrain_essencial';
  if (d.includes('premium')) return 'tunesignal_premium';
  return 'tunesignal';
}

function mapStatus(asaasStatus: string): string {
  switch (asaasStatus) {
    case 'CONFIRMED':
    case 'RECEIVED':
    case 'RECEIVED_IN_CASH':
      return 'active';
    case 'PENDING':
    case 'AWAITING_RISK_ANALYSIS':
      return 'pending';
    case 'OVERDUE':
      return 'past_due';
    case 'REFUNDED':
    case 'REFUND_REQUESTED':
    case 'CHARGEBACK_REQUESTED':
    case 'CHARGEBACK_DISPUTE':
      return 'refunded';
    case 'CANCELLED':
    case 'DELETED':
      return 'cancelled';
    default:
      return 'pending';
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: AsaasEvent = await request.json();
    const { event } = body;

    console.log('[Asaas Webhook] Event received:', event);

    if (event.startsWith('PAYMENT_') && body.payment) {
      const payment = body.payment;
      const status = mapStatus(payment.status);
      const product = mapProduct(payment.description);

      let customerEmail = '';
      let customerName = '';

      if (process.env.ASAAS_API_KEY) {
        try {
          const customerRes = await fetch(
            `https://api.asaas.com/v3/customers/${payment.customer}`,
            {
              headers: {
                'access_token': process.env.ASAAS_API_KEY,
              },
            }
          );
          if (customerRes.ok) {
            const customerData = await customerRes.json();
            customerEmail = customerData.email || '';
            customerName = customerData.name || '';
          }
        } catch (err) {
          console.error('[Asaas Webhook] Error fetching customer:', err);
        }
      }

      if (customerEmail) {
        const { data: user, error: userError } = await supabase
          .from('users')
          .upsert(
            {
              email: customerEmail,
              name: customerName,
              asaas_customer_id: payment.customer,
              current_product: product,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'email' }
          )
          .select()
          .single();

        if (userError) {
          console.error('[Asaas Webhook] Error upserting user:', userError);
        }

        if (user) {
          const { error: subError } = await supabase
            .from('subscriptions')
            .upsert(
              {
                user_id: user.id,
                asaas_subscription_id: payment.subscription || payment.id,
                product: product,
                status: status,
                amount: payment.value,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'asaas_subscription_id' }
            );

          if (subError) {
            console.error('[Asaas Webhook] Error upserting subscription:', subError);
          }
        }

        if (status === 'active') {
          await supabase
            .from('email_subscribers')
            .upsert(
              {
                email: customerEmail,
                name: customerName,
                status: 'active',
                source: 'asaas',
                subscribed_at: new Date().toISOString(),
              },
              { onConflict: 'email' }
            );
        }
      }
    }

    if (event.startsWith('SUBSCRIPTION_') && body.subscription) {
      const sub = body.subscription;
      const status = sub.status === 'ACTIVE' ? 'active' : 'cancelled';

      if (sub.status === 'INACTIVE' || sub.status === 'EXPIRED') {
        await supabase
          .from('subscriptions')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('asaas_subscription_id', sub.id);
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('[Asaas Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

