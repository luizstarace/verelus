export const runtime = "edge";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/auth';
import { getOnboardingProgress, updateOnboarding } from '@/lib/tracking';
import { checkOnboardingMilestones, getNextOnboardingEmail, ONBOARDING_EMAILS } from '@/lib/onboarding';

/**
 * POST /api/onboarding/send-emails
 *
 * Cron-compatible endpoint that processes onboarding emails for all users
 * with incomplete onboarding. Intended to be called by a cron job
 * (GitHub Actions, Vercel Cron, or external scheduler).
 *
 * Auth: Requires service role key via Authorization header or x-service-key header.
 */
export async function POST(request: NextRequest) {
  // Authenticate with service role key
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    return NextResponse.json(
      { error: 'Server misconfiguration: service role key not set' },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get('authorization');
  const serviceKeyHeader = request.headers.get('x-service-key');
  const providedKey = authHeader?.replace('Bearer ', '') || serviceKeyHeader;

  if (providedKey !== serviceKey) {
    return NextResponse.json(
      { error: 'Unauthorized: invalid service key' },
      { status: 401 }
    );
  }

  const resendKey = process.env.RESEND_API_KEY;

  if (!resendKey) {
    return NextResponse.json(
      { error: 'Server misconfiguration: RESEND_API_KEY not set' },
      { status: 500 }
    );
  }

  const supabase = getServerSupabase();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://verelus.com';

  // Find all users with incomplete onboarding
  const { data: incompleteUsers, error: fetchError } = await supabase
    .from('onboarding_progress')
    .select('user_id')
    .eq('onboarding_completed', false);

  if (fetchError) {
    console.error('[onboarding/send-emails] Failed to fetch incomplete users:', fetchError.message);
    return NextResponse.json(
      { error: 'Failed to fetch users', detail: fetchError.message },
      { status: 500 }
    );
  }

  // Also find users who have no onboarding row yet (new users)
  const { data: allUsers, error: allUsersError } = await supabase
    .from('users')
    .select('id, email');

  if (allUsersError) {
    console.error('[onboarding/send-emails] Failed to fetch all users:', allUsersError.message);
    return NextResponse.json(
      { error: 'Failed to fetch users', detail: allUsersError.message },
      { status: 500 }
    );
  }

  const existingUserIds = new Set((incompleteUsers || []).map((u) => u.user_id));

  // Build a map of user_id -> email for sending
  const userEmailMap = new Map<string, string>();
  for (const user of allUsers || []) {
    if (user.email) {
      userEmailMap.set(user.id, user.email);
    }
  }

  // Collect all user IDs that need processing
  const userIdsToProcess: string[] = [];

  // Users with incomplete onboarding rows
  for (const row of incompleteUsers || []) {
    userIdsToProcess.push(row.user_id);
  }

  // Users with no onboarding row at all
  for (const user of allUsers || []) {
    if (!existingUserIds.has(user.id)) {
      userIdsToProcess.push(user.id);
    }
  }

  const results: {
    user_id: string;
    email_type: string | null;
    status: 'sent' | 'skipped' | 'error';
    detail?: string;
  }[] = [];

  for (const userId of userIdsToProcess) {
    try {
      // Run milestone checks (also initializes row for new users)
      await checkOnboardingMilestones(userId);

      const progress = await getOnboardingProgress(userId);

      if (!progress) {
        results.push({ user_id: userId, email_type: null, status: 'skipped', detail: 'no progress row after check' });
        continue;
      }

      const nextEmail = getNextOnboardingEmail(progress);

      if (!nextEmail) {
        results.push({ user_id: userId, email_type: null, status: 'skipped', detail: 'no pending email' });
        continue;
      }

      const email = userEmailMap.get(userId);

      if (!email) {
        results.push({ user_id: userId, email_type: nextEmail, status: 'skipped', detail: 'no email address' });
        continue;
      }

      const template = ONBOARDING_EMAILS[nextEmail];
      const htmlBody = template.body.replace(/\{\{appUrl\}\}/g, appUrl);

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: 'Verelus <noreply@verelus.com>',
          to: [email],
          subject: template.subject,
          html: htmlBody,
        }),
      });

      if (res.ok) {
        // Mark the appropriate field based on which email was sent
        if (nextEmail === 'welcome') {
          await updateOnboarding(userId, 'welcome_email_sent', true);
        }

        // Update last_active_at to track when we last contacted this user
        await supabase
          .from('onboarding_progress')
          .update({ last_active_at: new Date().toISOString() })
          .eq('user_id', userId);

        results.push({ user_id: userId, email_type: nextEmail, status: 'sent' });
      } else {
        const errorText = await res.text();
        console.error(`[onboarding/send-emails] Resend error for user ${userId}:`, errorText);
        results.push({ user_id: userId, email_type: nextEmail, status: 'error', detail: errorText });
      }
    } catch (error) {
      console.error(`[onboarding/send-emails] Error processing user ${userId}:`, error);
      results.push({
        user_id: userId,
        email_type: null,
        status: 'error',
        detail: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  const sent = results.filter((r) => r.status === 'sent').length;
  const skipped = results.filter((r) => r.status === 'skipped').length;
  const errors = results.filter((r) => r.status === 'error').length;

  return NextResponse.json({
    summary: {
      total_processed: results.length,
      sent,
      skipped,
      errors,
    },
    results,
  });
}
