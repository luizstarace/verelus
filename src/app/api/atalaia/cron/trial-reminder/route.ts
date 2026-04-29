export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { notifyOwnerEmail, buildTrialExpiryEmail } from '@/lib/atalaia/notifications';

// Daily cron entry point. Triggered by GitHub Actions (or any scheduler) with
// `Authorization: Bearer ${CRON_SECRET}`. Finds businesses whose in-app trial
// expires in ~3 or ~1 days, has no active subscription, and emails the owner.
//
// Idempotency note: cron runs once a day, the lookup window is 24h centered on
// the target. A double-fire on the same day could resend, but a missed day
// won't double-send the next day (the trial moves out of the window). Trade-off
// chosen over adding a `trial_reminder_sent` column for now.

export async function POST(request: Request) {
  const auth = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = Date.now();
  const windowMs = 12 * 60 * 60 * 1000;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://atalaia.verelus.com';

  const sent: { businessId: string; daysLeft: number; email: string }[] = [];
  const errors: { businessId: string; error: string }[] = [];

  for (const daysAhead of [3, 1]) {
    const target = now + daysAhead * 24 * 60 * 60 * 1000;
    const lower = new Date(target - windowMs).toISOString();
    const upper = new Date(target + windowMs).toISOString();

    const { data: businesses, error: bizErr } = await supabase
      .from('atalaia_businesses')
      .select('id, name, user_id, trial_ends_at')
      .gte('trial_ends_at', lower)
      .lte('trial_ends_at', upper)
      .eq('status', 'active');

    if (bizErr) {
      errors.push({ businessId: 'query', error: bizErr.message });
      continue;
    }
    if (!businesses) continue;

    for (const biz of businesses) {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', biz.user_id)
        .in('status', ['active', 'trialing'])
        .limit(1)
        .maybeSingle();

      if (sub) continue;

      const { data: ownerUser } = await supabase
        .from('users')
        .select('email')
        .eq('id', biz.user_id)
        .maybeSingle();

      if (!ownerUser?.email) continue;

      const checkoutUrl = `${baseUrl}/dashboard/atalaia/billing`;
      const emailData = buildTrialExpiryEmail(biz.name, daysAhead, checkoutUrl);
      emailData.to = ownerUser.email;

      try {
        await notifyOwnerEmail(emailData);
        sent.push({ businessId: biz.id, daysLeft: daysAhead, email: ownerUser.email });
      } catch (err) {
        errors.push({
          businessId: biz.id,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }
  }

  return NextResponse.json({ sent_count: sent.length, sent, errors });
}
