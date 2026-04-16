import { NextResponse } from 'next/server';
import { requireUser, errorResponse } from '@/lib/api-auth';
import { captureAutomaticSnapshots, generateWeeklyInsight, getGrowthDashboardData } from '@/lib/growth-aggregator';
import type { GrowthProfile } from '@/lib/types/tools';

export const runtime = 'edge';

/**
 * Refresh manual: user clica "atualizar agora" no dashboard.
 * Captura snapshots Spotify + YouTube e atualiza insight.
 */
export async function POST() {
  try {
    const { userId, supabase } = await requireUser();

    const { data: profileRow } = await supabase
      .from('growth_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!profileRow) {
      return NextResponse.json({ error: 'Configure seu perfil primeiro (Spotify/YouTube URLs)' }, { status: 400 });
    }

    const profile: GrowthProfile = {
      user_id: userId,
      spotify_artist_url: profileRow.spotify_artist_url ?? undefined,
      youtube_channel_id: profileRow.youtube_channel_id ?? undefined,
      youtube_channel_url: profileRow.youtube_channel_url ?? undefined,
      instagram_handle: profileRow.instagram_handle ?? undefined,
      tiktok_handle: profileRow.tiktok_handle ?? undefined,
      enabled: profileRow.enabled ?? true,
    };

    const { captured, errors } = await captureAutomaticSnapshots(profile, supabase);

    // Gerar insight se capturou algo
    const dashData = await getGrowthDashboardData(userId, supabase);
    let insight: string | undefined;
    try {
      insight = await generateWeeklyInsight(dashData);
      await supabase
        .from('growth_profiles')
        .update({ weekly_insight: insight, last_cron_run_at: new Date().toISOString() })
        .eq('user_id', userId);
    } catch (err) {
      console.error('insight gen error:', err);
    }

    return NextResponse.json({ captured, errors, insight });
  } catch (err) {
    console.error('growth refresh error:', err);
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
