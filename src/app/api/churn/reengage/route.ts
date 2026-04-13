export const runtime = "edge";
import { NextRequest, NextResponse } from 'next/server';
import { analyzeChurnRisk, REENGAGEMENT_EMAILS } from '@/lib/churn-detection';
import { getServerSupabase } from '@/lib/auth';
import { trackEvent } from '@/lib/tracking';

/**
 * POST /api/churn/reengage
 *
 * Triggers re-engagement emails to at-risk users based on churn analysis.
 * Designed to be called by a cron job.
 *
 * Auth: Requires service role key via Authorization header or x-service-key header.
 *
 * - High/critical risk inactive users: sends appropriate re-engagement email
 * - Past due users: sends payment reminder
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://verelus.com';

  try {
    const riskUsers = await analyzeChurnRisk();

    // Only send emails to high and critical risk users
    const targetUsers = riskUsers.filter(
      (u) => u.risk_level === 'high' || u.risk_level === 'critical'
    );

    const results: Array<{
      user_id: string;
      email_type: string | null;
      status: 'sent' | 'skipped' | 'error';
      detail?: string;
    }> = [];

    // Check which users already received a re-engagement email in the last 7 days
    const supabase = getServerSupabase();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const targetUserIds = targetUsers.map((u) => u.user_id);

    const { data: recentEmails } = await supabase
      .from('events')
      .select('user_id')
      .eq('event_name', 'reengage_email_sent')
      .in('user_id', targetUserIds)
      .gte('created_at', sevenDaysAgo);

    const recentlySentSet = new Set((recentEmails || []).map((e) => e.user_id));

    for (const user of targetUsers) {
      try {
        // Skip users who received a re-engagement email in the last 7 days
        if (recentlySentSet.has(user.user_id)) {
          results.push({ user_id: user.user_id, email_type: null, status: 'skipped', detail: 'cooldown: email sent within last 7 days' });
          continue;
        }

        // Determine which email template to use
        let templateKey: string | null = null;

        if (user.subscription_status === 'past_due') {
          templateKey = 'past_due';
        } else if (user.days_inactive > 14) {
          templateKey = 'inactive_14d';
        } else if (user.days_inactive > 7) {
          templateKey = 'inactive_7d';
        }

        if (!templateKey) {
          results.push({ user_id: user.user_id, email_type: null, status: 'skipped', detail: 'no matching template' });
          continue;
        }

        const template = REENGAGEMENT_EMAILS[templateKey];
        const htmlBody = template.body.replace(/\{\{appUrl\}\}/g, appUrl);

        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: 'Verelus <noreply@verelus.com>',
            to: [user.email],
            subject: template.subject,
            html: htmlBody,
          }),
        });

        if (res.ok) {
          // Track the sent email to enforce cooldown on future runs
          await trackEvent('reengage_email_sent', 'feature_use', { template: templateKey }, user.user_id);
          results.push({ user_id: user.user_id, email_type: templateKey, status: 'sent' });
        } else {
          const errorText = await res.text();
          console.error(`[churn/reengage] Resend error for user ${user.user_id}:`, errorText);
          results.push({ user_id: user.user_id, email_type: templateKey, status: 'error', detail: errorText });
        }
      } catch (error) {
        console.error(`[churn/reengage] Error processing user ${user.user_id}:`, error);
        results.push({
          user_id: user.user_id,
          email_type: null,
          status: 'error',
          detail: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const summary = {
      total_at_risk: riskUsers.length,
      targeted: targetUsers.length,
      sent: results.filter((r) => r.status === 'sent').length,
      skipped: results.filter((r) => r.status === 'skipped').length,
      errors: results.filter((r) => r.status === 'error').length,
    };

    return NextResponse.json({ summary, results });
  } catch (error) {
    console.error('[churn/reengage] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process re-engagement', detail: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
