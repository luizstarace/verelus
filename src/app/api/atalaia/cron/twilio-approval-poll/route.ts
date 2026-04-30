export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchSenderStatus, mapSenderStatusToKyc } from '@/lib/atalaia/whatsapp/twilio/sender';
import {
  notifyOwnerEmail,
  buildTwilioApprovedEmail,
  buildTwilioRejectedEmail,
} from '@/lib/atalaia/notifications';
import { logAtalaia } from '@/lib/atalaia/logger';

/**
 * Cron endpoint that polls Twilio for Sender approval status changes.
 *
 * Schedule (suggested): every hour. Walks businesses with
 * `whatsapp_provider='twilio'` AND `bsp_kyc_status='pending'` AND
 * `twilio_sender_sid IS NOT NULL`. For each, fetches the current Twilio
 * Sender status. Transitions:
 *
 *   pending → approved : business goes active, owner gets number-ready email.
 *   pending → rejected : business stays as-is, owner gets actionable email.
 *   pending → pending  : noop.
 *
 * Auth: `Authorization: Bearer ${CRON_SECRET}`.
 */
export async function POST(request: Request) {
  const auth = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: businesses, error } = await supabase
    .from('atalaia_businesses')
    .select('id, name, user_id, whatsapp_number, twilio_sender_sid')
    .eq('whatsapp_provider', 'twilio')
    .eq('bsp_kyc_status', 'pending')
    .not('twilio_sender_sid', 'is', null)
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!businesses || businesses.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, approved: 0, rejected: 0 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://atalaia.verelus.com';
  let approved = 0;
  let rejected = 0;

  for (const biz of businesses) {
    if (!biz.twilio_sender_sid) continue;

    const status = await fetchSenderStatus(biz.twilio_sender_sid);
    if (!status.ok) {
      await logAtalaia(supabase, {
        business_id: biz.id,
        endpoint: '/api/atalaia/cron/twilio-approval-poll',
        channel: 'whatsapp',
        status_code: 0,
        error: `fetch_status_failed: ${status.error}`,
      });
      continue;
    }

    const kyc = mapSenderStatusToKyc(status.status);
    if (kyc === 'pending') continue;

    const now = new Date().toISOString();

    if (kyc === 'approved') {
      await supabase
        .from('atalaia_businesses')
        .update({
          bsp_kyc_status: 'approved',
          bsp_kyc_decided_at: now,
          bsp_provisioned_at: now,
          bsp_active_at: now,
          status: 'active',
        })
        .eq('id', biz.id);

      await supabase.from('atalaia_bsp_provisioning_log').insert([
        { business_id: biz.id, event: 'twilio_sender_approved', details: { status: status.status } },
        { business_id: biz.id, event: 'phone_provisioned', details: { phone: biz.whatsapp_number } },
      ]);

      const { data: ownerUser } = await supabase
        .from('users')
        .select('email')
        .eq('id', biz.user_id)
        .maybeSingle();
      if (ownerUser?.email && biz.whatsapp_number) {
        const emailData = buildTwilioApprovedEmail(
          biz.name,
          `+${biz.whatsapp_number}`,
          `${baseUrl}/dashboard/atalaia/inbox`
        );
        emailData.to = ownerUser.email;
        notifyOwnerEmail(emailData).catch(() => {});
      }

      approved += 1;
    } else if (kyc === 'rejected') {
      await supabase
        .from('atalaia_businesses')
        .update({
          bsp_kyc_status: 'rejected',
          bsp_kyc_decided_at: now,
          bsp_kyc_rejection_reason: status.status_reason || null,
        })
        .eq('id', biz.id);

      await supabase.from('atalaia_bsp_provisioning_log').insert({
        business_id: biz.id,
        event: 'twilio_sender_rejected',
        details: { status: status.status, reason: status.status_reason },
      });

      const { data: ownerUser } = await supabase
        .from('users')
        .select('email')
        .eq('id', biz.user_id)
        .maybeSingle();
      if (ownerUser?.email) {
        const emailData = buildTwilioRejectedEmail(
          biz.name,
          status.status_reason || 'verificação Meta retornou pendência',
          `${baseUrl}/dashboard/atalaia/support?category=whatsapp_disconnect`
        );
        emailData.to = ownerUser.email;
        notifyOwnerEmail(emailData).catch(() => {});
      }

      rejected += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    processed: businesses.length,
    approved,
    rejected,
  });
}
