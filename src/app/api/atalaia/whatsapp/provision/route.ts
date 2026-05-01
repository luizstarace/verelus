export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rentBrazilianNumber, extractAreaCode } from '@/lib/atalaia/whatsapp/twilio/numbers';
import { requestSenderApproval } from '@/lib/atalaia/whatsapp/twilio/sender';
import {
  notifyOwnerEmail,
  buildTwilioProvisioningEmail,
  buildOnboardingTrainingEmail2,
} from '@/lib/atalaia/notifications';
import { logAtalaia } from '@/lib/atalaia/logger';

/**
 * Service-role endpoint to provision a Twilio WhatsApp Sender for a business.
 *
 * Idempotent — safe to call multiple times. If `twilio_phone_sid` is already
 * set, returns 200 with the current state.
 *
 * Auth: `Authorization: Bearer ${CRON_SECRET}` (also used by Stripe webhook
 * post-checkout, manual founder curls, and upgrade triggers).
 *
 * Effects on success:
 *   - Rents a Brazilian Twilio number (preferring the cliente's DDD).
 *   - Submits the number to Twilio Senders for Meta approval (3-5 day window).
 *   - Updates atalaia_businesses: provider='twilio', twilio_phone_sid,
 *     twilio_sender_sid, whatsapp_number, bsp_kyc_status='pending'.
 *   - Inserts atalaia_bsp_provisioning_log audit rows.
 *   - Sends Email 1 (training) immediately + Email 2 scheduled +24h.
 */
export async function POST(request: Request) {
  const auth = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { business_id?: string; user_id?: string; area_code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.business_id && !body.user_id) {
    return NextResponse.json({ error: 'business_id or user_id required' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Resolve business — prefer business_id, fall back to user_id.
  const bizQuery = supabase
    .from('atalaia_businesses')
    .select('id, name, user_id, phone, whatsapp_byo, twilio_phone_sid, twilio_sender_sid, bsp_kyc_status, onboarding_email_1_sent_at');
  const { data: biz, error: bizErr } = body.business_id
    ? await bizQuery.eq('id', body.business_id).maybeSingle()
    : await bizQuery.eq('user_id', body.user_id!).maybeSingle();

  if (bizErr) {
    return NextResponse.json({ error: bizErr.message }, { status: 500 });
  }
  if (!biz) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 });
  }

  // Skip BYO clients — they explicitly opted out of managed numbers.
  if (biz.whatsapp_byo) {
    return NextResponse.json({ ok: true, skipped: 'byo' });
  }

  // Idempotency: already provisioned.
  if (biz.twilio_phone_sid) {
    return NextResponse.json({
      ok: true,
      already_provisioned: true,
      business_id: biz.id,
      twilio_phone_sid: biz.twilio_phone_sid,
      twilio_sender_sid: biz.twilio_sender_sid,
      bsp_kyc_status: biz.bsp_kyc_status,
    });
  }

  // Lookup owner email for the provisioning notification.
  const { data: ownerUser } = await supabase
    .from('users')
    .select('email')
    .eq('id', biz.user_id)
    .maybeSingle();

  // Step 1 — Rent a Brazilian Twilio number.
  const areaCode = body.area_code || extractAreaCode(biz.phone);
  const rented = await rentBrazilianNumber(areaCode);

  if (!rented.ok || !rented.phone_sid || !rented.phone_number) {
    await logAtalaia(supabase, {
      business_id: biz.id,
      endpoint: '/api/atalaia/whatsapp/provision',
      channel: 'whatsapp',
      status_code: 0,
      error: `twilio_rent_failed: ${rented.error || 'unknown'}`,
    });
    return NextResponse.json(
      { error: 'Twilio number rental failed', detail: rented.error },
      { status: 502 }
    );
  }

  await supabase.from('atalaia_bsp_provisioning_log').insert({
    business_id: biz.id,
    event: 'twilio_number_rented',
    details: { phone_sid: rented.phone_sid, phone_number: rented.phone_number },
  });

  // Step 2 — Submit Sender approval to Twilio (and downstream Meta).
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://atalaia.verelus.com';
  const sender = await requestSenderApproval({
    phone_sid: rented.phone_sid,
    phone_number: rented.phone_number,
    display_name: biz.name.slice(0, 25),
    business_name: biz.name,
    webhook_url: `${baseUrl}/api/atalaia/whatsapp/twilio/webhook`,
  });

  if (!sender.ok || !sender.sender_sid) {
    // Persist the rented number so the founder can retry sender approval manually.
    await supabase
      .from('atalaia_businesses')
      .update({
        twilio_phone_sid: rented.phone_sid,
        whatsapp_number: rented.phone_number.replace(/^\+/, ''),
      })
      .eq('id', biz.id);
    await logAtalaia(supabase, {
      business_id: biz.id,
      endpoint: '/api/atalaia/whatsapp/provision',
      channel: 'whatsapp',
      status_code: 0,
      error: `twilio_sender_failed: ${sender.error || 'unknown'}`,
    });
    return NextResponse.json(
      {
        error: 'Twilio Sender submission failed',
        detail: sender.error,
        twilio_phone_sid: rented.phone_sid,
      },
      { status: 502 }
    );
  }

  // Step 3 — Persist all the new state in one update.
  const now = new Date();
  const scheduledEmail2 = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

  await supabase
    .from('atalaia_businesses')
    .update({
      whatsapp_provider: 'twilio',
      whatsapp_number: rented.phone_number.replace(/^\+/, ''),
      twilio_phone_sid: rented.phone_sid,
      twilio_sender_sid: sender.sender_sid,
      bsp_kyc_status: 'pending',
      bsp_kyc_started_at: now.toISOString(),
      bsp_evolution_bridge_until: null, // Twilio path doesn't bridge — cliente waits for approval.
      onboarding_email_2_scheduled_at: scheduledEmail2,
    })
    .eq('id', biz.id);

  await supabase.from('atalaia_bsp_provisioning_log').insert([
    {
      business_id: biz.id,
      event: 'twilio_sender_submitted',
      details: { sender_sid: sender.sender_sid, status: sender.status },
    },
  ]);

  // Step 4 — Onboarding emails. Idempotent: skip if already sent.
  if (ownerUser?.email && !biz.onboarding_email_1_sent_at) {
    const setupUrl = `${baseUrl}/dashboard/atalaia/setup`;
    const settingsUrl = `${baseUrl}/dashboard/atalaia/settings`;

    // Email 1 — sent immediately.
    const email1 = buildTwilioProvisioningEmail(biz.name, setupUrl);
    email1.to = ownerUser.email;
    notifyOwnerEmail(email1).catch(() => {});

    // Email 2 — scheduled +24h via Resend `scheduled_at`.
    const email2 = buildOnboardingTrainingEmail2(biz.name, settingsUrl);
    email2.to = ownerUser.email;
    email2.scheduledAt = scheduledEmail2;
    notifyOwnerEmail(email2).catch(() => {});

    await supabase
      .from('atalaia_businesses')
      .update({ onboarding_email_1_sent_at: now.toISOString() })
      .eq('id', biz.id);

    await supabase.from('atalaia_bsp_provisioning_log').insert([
      { business_id: biz.id, event: 'onboarding_email_1_sent', details: {} },
      { business_id: biz.id, event: 'onboarding_email_2_scheduled', details: { scheduled_at: scheduledEmail2 } },
    ]);
  }

  return NextResponse.json({
    ok: true,
    business_id: biz.id,
    whatsapp_provider: 'twilio',
    whatsapp_number: rented.phone_number,
    twilio_phone_sid: rented.phone_sid,
    twilio_sender_sid: sender.sender_sid,
    bsp_kyc_status: 'pending',
  });
}
