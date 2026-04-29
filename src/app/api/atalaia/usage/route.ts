export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { requireUser, errorResponse } from '@/lib/api-auth';
import { getCurrentPeriod } from '@/lib/atalaia/chat';
import { getPlanFromSubscription, getPlanLimits } from '@/lib/atalaia/plans';

export async function GET() {
  try {
    const { userId, supabase } = await requireUser();

    const { data: business } = await supabase
      .from('atalaia_businesses')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!business) {
      return NextResponse.json({ error: 'Negócio não encontrado' }, { status: 404 });
    }

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('product, status')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const plan = getPlanFromSubscription(sub?.product || null);
    const limits = getPlanLimits(plan);

    const hasActiveSubscription = Boolean(sub);

    const period = getCurrentPeriod();
    const { data: usage } = await supabase
      .from('atalaia_usage')
      .select('*')
      .eq('business_id', business.id)
      .eq('period', period)
      .single();

    const textUsed = usage?.text_messages || 0;
    const voiceUsed = usage?.voice_seconds || 0;
    const textPercentage = Math.round((textUsed / limits.text_messages) * 100);
    const voicePercentage = limits.voice_seconds > 0
      ? Math.round((voiceUsed / limits.voice_seconds) * 100)
      : 0;

    return NextResponse.json({
      plan,
      period,
      has_active_subscription: hasActiveSubscription,
      subscription_status: sub?.status || null,
      text: {
        used: textUsed,
        limit: limits.text_messages,
        percentage: textPercentage,
      },
      voice: {
        used_seconds: voiceUsed,
        limit_seconds: limits.voice_seconds,
        percentage: voicePercentage,
        enabled: limits.voice_enabled,
      },
      overage_notified: usage?.overage_notified || false,
    });
  } catch (err) {
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
