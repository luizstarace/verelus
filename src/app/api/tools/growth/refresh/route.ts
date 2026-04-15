import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { captureAutomaticSnapshots, generateWeeklyInsight, getGrowthDashboardData } from '@/lib/growth-aggregator';
import type { GrowthProfile } from '@/lib/types/tools';

export const runtime = 'edge';

/**
 * Refresh manual: user clica "atualizar agora" no dashboard.
 * Captura snapshots Spotify + YouTube e atualiza insight.
 */
export async function POST() {
  try {
    const cookieStore = cookies();
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
    );
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: dbUser } = await supabase.from('users').select('id').eq('email', user.email!.toLowerCase().trim()).single();
    if (!dbUser) return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 });

    const { data: profileRow } = await supabase
      .from('growth_profiles')
      .select('*')
      .eq('user_id', dbUser.id)
      .maybeSingle();

    if (!profileRow) {
      return NextResponse.json({ error: 'Configure seu perfil primeiro (Spotify/YouTube URLs)' }, { status: 400 });
    }

    const profile: GrowthProfile = {
      user_id: dbUser.id,
      spotify_artist_url: profileRow.spotify_artist_url ?? undefined,
      youtube_channel_id: profileRow.youtube_channel_id ?? undefined,
      youtube_channel_url: profileRow.youtube_channel_url ?? undefined,
      instagram_handle: profileRow.instagram_handle ?? undefined,
      tiktok_handle: profileRow.tiktok_handle ?? undefined,
      enabled: profileRow.enabled ?? true,
    };

    const { captured, errors } = await captureAutomaticSnapshots(profile, supabase);

    // Gerar insight se capturou algo
    const dashData = await getGrowthDashboardData(dbUser.id, supabase);
    let insight: string | undefined;
    try {
      insight = await generateWeeklyInsight(dashData);
      await supabase
        .from('growth_profiles')
        .update({ weekly_insight: insight, last_cron_run_at: new Date().toISOString() })
        .eq('user_id', dbUser.id);
    } catch (err) {
      console.error('insight gen error:', err);
    }

    return NextResponse.json({ captured, errors, insight });
  } catch (err) {
    console.error('growth refresh error:', err);
    return NextResponse.json({ error: 'erro' }, { status: 500 });
  }
}
