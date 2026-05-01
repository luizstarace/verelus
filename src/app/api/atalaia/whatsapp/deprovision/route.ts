export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { releaseNumber } from '@/lib/atalaia/whatsapp/twilio/numbers';
import { deregisterSender } from '@/lib/atalaia/whatsapp/twilio/sender';
import { notifyOwnerEmail, buildTwilioDeprovisionedEmail } from '@/lib/atalaia/notifications';
import { logAtalaia } from '@/lib/atalaia/logger';

/**
 * Service-role endpoint to release a Twilio number and deregister its Sender.
 *
 * Triggered by Stripe `customer.subscription.deleted` (final cancellation
 * after period end) and by manual operator calls.
 *
 * Idempotent — if the business has no Twilio number or already lost it, returns
 * ok with `nothing_to_deprovision`.
 *
 * Intentional behavior on cancel:
 *   - Twilio Sender is deregistered first (stops new inbound messages).
 *   - Twilio number is released (stops monthly rental fee).
 *   - Business is moved to provider='evolution' + status='paused'. Cliente data
 *     is preserved for 90 days (handled by separate retention process).
 */
export async function POST(request: Request) {
  const auth = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { business_id?: string; user_id?: string };
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

  const bizQuery = supabase
    .from('atalaia_businesses')
    .select('id, name, user_id, whatsapp_provider, twilio_phone_sid, twilio_sender_sid');
  const { data: biz, error: bizErr } = body.business_id
    ? await bizQuery.eq('id', body.business_id).maybeSingle()
    : await bizQuery.eq('user_id', body.user_id!).maybeSingle();

  if (bizErr) {
    return NextResponse.json({ error: bizErr.message }, { status: 500 });
  }
  if (!biz) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 });
  }

  // Nothing to release.
  if (!biz.twilio_phone_sid && !biz.twilio_sender_sid) {
    // Still mark as paused so cliente sees correct state.
    await supabase
      .from('atalaia_businesses')
      .update({ status: 'paused' })
      .eq('id', biz.id);
    return NextResponse.json({ ok: true, nothing_to_deprovision: true });
  }

  const errors: string[] = [];

  // Step 1 — Deregister Sender (best effort).
  if (biz.twilio_sender_sid) {
    const dereg = await deregisterSender(biz.twilio_sender_sid);
    if (!dereg.ok) {
      errors.push(`sender_dereg_failed: ${dereg.error}`);
    } else {
      await supabase.from('atalaia_bsp_provisioning_log').insert({
        business_id: biz.id,
        event: 'twilio_sender_deregistered',
        details: { sender_sid: biz.twilio_sender_sid },
      });
    }
  }

  // Step 2 — Release the rented number (best effort).
  if (biz.twilio_phone_sid) {
    const rel = await releaseNumber(biz.twilio_phone_sid);
    if (!rel.ok) {
      errors.push(`number_release_failed: ${rel.error}`);
    } else {
      await supabase.from('atalaia_bsp_provisioning_log').insert({
        business_id: biz.id,
        event: 'twilio_number_released',
        details: { phone_sid: biz.twilio_phone_sid },
      });
    }
  }

  // Step 3 — Persist new state regardless of best-effort errors. Founder
  // can clean up Twilio orphans manually via the audit log if needed.
  await supabase
    .from('atalaia_businesses')
    .update({
      whatsapp_provider: 'evolution',
      status: 'paused',
      twilio_phone_sid: null,
      twilio_sender_sid: null,
      bsp_kyc_status: null,
      bsp_kyc_started_at: null,
      bsp_kyc_decided_at: null,
      bsp_active_at: null,
    })
    .eq('id', biz.id);

  if (errors.length > 0) {
    await logAtalaia(supabase, {
      business_id: biz.id,
      endpoint: '/api/atalaia/whatsapp/deprovision',
      channel: 'whatsapp',
      status_code: 0,
      error: errors.join('; '),
    });
  }

  // Step 4 — Notify owner.
  const { data: ownerUser } = await supabase
    .from('users')
    .select('email')
    .eq('id', biz.user_id)
    .maybeSingle();
  if (ownerUser?.email) {
    const emailData = buildTwilioDeprovisionedEmail(biz.name);
    emailData.to = ownerUser.email;
    notifyOwnerEmail(emailData).catch(() => {});
  }

  return NextResponse.json({
    ok: true,
    business_id: biz.id,
    deprovisioned: true,
    errors: errors.length > 0 ? errors : undefined,
  });
}
