export const runtime = "edge";
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getOnboardingProgress } from '@/lib/tracking';
import { checkOnboardingMilestones, getNextOnboardingEmail, ONBOARDING_EMAILS } from '@/lib/onboarding';

/**
 * Resolve the authenticated Supabase user from the request's
 * Authorization header (Bearer <access_token>).
 */
async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const {
    data: { user },
  } = await supabase.auth.getUser(token);

  return user;
}

/**
 * GET /api/onboarding
 * Returns the current user's onboarding progress.
 */
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);

  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const progress = await getOnboardingProgress(user.id);

  if (!progress) {
    return NextResponse.json({
      progress: null,
      next_email: 'welcome',
      completed: false,
    });
  }

  const nextEmail = getNextOnboardingEmail(progress);

  return NextResponse.json({
    progress,
    next_email: nextEmail,
    completed: !!progress.onboarding_completed,
  });
}

/**
 * POST /api/onboarding
 * Triggers an onboarding milestone check for the current user
 * and sends the next email if needed.
 */
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);

  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  // Run milestone checks
  await checkOnboardingMilestones(user.id);

  // Get updated progress
  const progress = await getOnboardingProgress(user.id);

  if (!progress) {
    return NextResponse.json({
      progress: null,
      email_sent: null,
      completed: false,
    });
  }

  // Determine if we should send an email
  const nextEmail = getNextOnboardingEmail(progress);
  let emailSent: string | null = null;

  if (nextEmail) {
    const resendKey = process.env.RESEND_API_KEY;

    if (resendKey && user.email) {
      const template = ONBOARDING_EMAILS[nextEmail];
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://verelus.com';
      const htmlBody = template.body.replace(/\{\{appUrl\}\}/g, appUrl);

      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: 'Verelus <contato@verelus.com>',
            to: [user.email],
            subject: template.subject,
            html: htmlBody,
          }),
        });

        if (res.ok) {
          emailSent = nextEmail;

          // Mark welcome_email_sent if that was the email we just sent
          if (nextEmail === 'welcome') {
            const { updateOnboarding } = await import('@/lib/tracking');
            await updateOnboarding(user.id, 'welcome_email_sent', true);
          }

          // Update updated_at to prevent the cron job from re-sending
          // the same email within the cooldown window
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          );
          await supabase
            .from('onboarding_progress')
            .update({ updated_at: new Date().toISOString() })
            .eq('user_id', user.id);
        } else {
          console.error('[onboarding] Failed to send email via Resend:', await res.text());
        }
      } catch (error) {
        console.error('[onboarding] Error sending email:', error);
      }
    }
  }

  return NextResponse.json({
    progress,
    email_sent: emailSent,
    completed: !!progress.onboarding_completed,
  });
}
