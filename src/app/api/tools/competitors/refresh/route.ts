import { NextResponse } from 'next/server';
import { requireUser, errorResponse } from '@/lib/api-auth';
import { captureCompetitorSnapshots } from '@/lib/competitor-aggregator';

export const runtime = 'edge';

export async function POST() {
  try {
    const { userId, supabase } = await requireUser();

    const { data: competitors } = await supabase
      .from('competitors')
      .select('*')
      .eq('user_id', userId);

    if (!competitors || competitors.length === 0) {
      return NextResponse.json({ processed: 0 });
    }

    const results: Array<{ id: string; captured: string[]; errors: string[] }> = [];
    for (const comp of competitors) {
      const { captured, errors } = await captureCompetitorSnapshots(
        comp.id,
        comp.spotify_artist_id,
        comp.youtube_channel_url ?? comp.youtube_channel_id,
        supabase
      );
      results.push({ id: comp.id, captured: Object.keys(captured), errors });
    }

    return NextResponse.json({ processed: results.length, results });
  } catch (err) {
    console.error('refresh competitors error:', err);
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
