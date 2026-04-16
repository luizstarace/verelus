import { NextRequest, NextResponse } from 'next/server';
import { requireUser, errorResponse } from '@/lib/api-auth';

export const runtime = 'edge';

export async function GET() {
  try {
    const { userId, supabase } = await requireUser();
    const { data } = await supabase.from('growth_profiles').select('*').eq('user_id', userId).maybeSingle();
    return NextResponse.json({ profile: data });
  } catch (err) {
    console.error('growth profile GET error:', err);
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      spotify_artist_url?: string;
      youtube_channel_url?: string;
      instagram_handle?: string;
      tiktok_handle?: string;
      enabled?: boolean;
    };

    const { userId, supabase } = await requireUser();

    const payload = {
      user_id: userId,
      spotify_artist_url: body.spotify_artist_url?.trim() || null,
      youtube_channel_url: body.youtube_channel_url?.trim() || null,
      youtube_channel_id: null as string | null,
      instagram_handle: body.instagram_handle?.trim().replace(/^@/, '') || null,
      tiktok_handle: body.tiktok_handle?.trim().replace(/^@/, '') || null,
      enabled: body.enabled ?? true,
      updated_at: new Date().toISOString(),
    };

    const { error: upErr } = await supabase
      .from('growth_profiles')
      .upsert(payload, { onConflict: 'user_id' });

    if (upErr) {
      console.error('growth profile upsert error:', upErr);
      return NextResponse.json({ error: 'Falha ao salvar perfil' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('growth profile error:', err);
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
