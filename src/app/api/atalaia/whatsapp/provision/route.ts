export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSubaccount, submitKyc } from '@/lib/atalaia/whatsapp/zenvia/subaccounts';
import { notifyOwnerEmail, buildBSPProvisioningEmail } from '@/lib/atalaia/notifications';
import { logAtalaia } from '@/lib/atalaia/logger';

/**
 * Service-role endpoint to provision a Zenvia sub-account for a business.
 *
 * Idempotent — safe to call multiple times. If the business already has
 * `bsp_subaccount_id`, the call is a noop (returns 200 with `already_provisioned`).
 *
 * Auth: `Authorization: Bearer ${CRON_SECRET}` (also used by Stripe webhook
 * post-checkout and by manual founder curls).
 *
 * Effects on success:
 *   - Calls Zenvia createSubaccount + submitKyc.
 *   - Updates atalaia_businesses: bsp_subaccount_id, bsp_kyc_status='pending',
 *     bsp_kyc_started_at, bsp_evolution_bridge_until=now+14d.
 *   - Inserts atalaia_bsp_provisioning_log entries.
 *   - Sends buildBSPProvisioningEmail to the owner.
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

  // Resolve business — prefer business_id, fall back to user_id.
  const bizQuery = supabase
    .from('atalaia_businesses')
    .select('id, name, user_id, whatsapp_byo, bsp_subaccount_id, bsp_kyc_status');
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
  if (biz.bsp_subaccount_id) {
    return NextResponse.json({
      ok: true,
      already_provisioned: true,
      business_id: biz.id,
      bsp_subaccount_id: biz.bsp_subaccount_id,
      bsp_kyc_status: biz.bsp_kyc_status,
    });
  }

  // Lookup owner email (for the provisioning notification).
  const { data: ownerUser } = await supabase
    .from('users')
    .select('email')
    .eq('id', biz.user_id)
    .maybeSingle();

  // Step 1 — Create sub-account on Zenvia.
  const sub = await createSubaccount({
    business_id: biz.id,
    business_name: biz.name,
    contact_email: ownerUser?.email || process.env.FOUNDER_EMAIL || 'contato@verelus.com',
  });

  if (!sub.ok || !sub.subaccount_id) {
    await logAtalaia(supabase, {
      business_id: biz.id,
      endpoint: '/api/atalaia/whatsapp/provision',
      channel: 'whatsapp',
      status_code: 0,
      error: `subaccount_create_failed: ${sub.error || 'unknown'}`,
    });
    return NextResponse.json({ error: 'Subaccount creation failed', detail: sub.error }, { status: 502 });
  }

  await supabase.from('atalaia_bsp_provisioning_log').insert({
    business_id: biz.id,
    event: 'subaccount_created',
    details: { subaccount_id: sub.subaccount_id },
  });

  // Step 2 — Submit KYC. Verelus is the entity being verified (master KYC),
  // so we use Verelus's CNPJ. Sub-accounts inherit master verification per
  // partner contract; if Zenvia requires per-sub-account KYC instead, the
  // status returned here will reflect that.
  const kyc = await submitKyc({
    subaccount_id: sub.subaccount_id,
    business_name: biz.name,
    document: process.env.VERELUS_CNPJ || '',
    display_name: biz.name.slice(0, 25), // WhatsApp display name limit
  });

  if (!kyc.ok) {
    await logAtalaia(supabase, {
      business_id: biz.id,
      endpoint: '/api/atalaia/whatsapp/provision',
      channel: 'whatsapp',
      status_code: 0,
      error: `kyc_submit_failed: ${kyc.error || 'unknown'}`,
    });
    // Persist sub-account creation; founder can retry KYC manually.
    await supabase
      .from('atalaia_businesses')
      .update({ bsp_subaccount_id: sub.subaccount_id })
      .eq('id', biz.id);
    return NextResponse.json(
      { error: 'KYC submission failed', detail: kyc.error, bsp_subaccount_id: sub.subaccount_id },
      { status: 502 }
    );
  }

  const bridgeUntil = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  await supabase
    .from('atalaia_businesses')
    .update({
      bsp_subaccount_id: sub.subaccount_id,
      bsp_kyc_status: kyc.status || 'pending',
      bsp_kyc_started_at: new Date().toISOString(),
      bsp_evolution_bridge_until: bridgeUntil,
    })
    .eq('id', biz.id);

  await supabase.from('atalaia_bsp_provisioning_log').insert([
    {
      business_id: biz.id,
      event: 'kyc_submitted',
      details: { kyc_id: kyc.kyc_id, status: kyc.status },
    },
    {
      business_id: biz.id,
      event: 'evolution_bridge_started',
      details: { bridge_until: bridgeUntil },
    },
  ]);

  // Notify owner — non-blocking. Failure here doesn't roll back provisioning.
  if (ownerUser?.email) {
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://atalaia.verelus.com'}/dashboard/atalaia/settings?tab=whatsapp`;
    const emailData = buildBSPProvisioningEmail(biz.name, dashboardUrl);
    emailData.to = ownerUser.email;
    notifyOwnerEmail(emailData).catch(() => {});
  }

  return NextResponse.json({
    ok: true,
    business_id: biz.id,
    bsp_subaccount_id: sub.subaccount_id,
    bsp_kyc_status: kyc.status || 'pending',
    bsp_evolution_bridge_until: bridgeUntil,
  });
}
