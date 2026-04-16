import { NextRequest, NextResponse } from 'next/server';
import { requireUser, errorResponse } from '@/lib/api-auth';
import { parseSpotifyArtistId } from '@/lib/spotify-client';
import { captureCompetitorSnapshots, fetchSpotifyArtistName } from '@/lib/competitor-aggregator';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      spotify_artist_url?: string;
      youtube_channel_url?: string;
      display_name?: string;
    };

    if (!body.spotify_artist_url?.trim()) {
      return NextResponse.json({ error: 'URL do Spotify obrigatoria' }, { status: 400 });
    }
    const spotifyId = parseSpotifyArtistId(body.spotify_artist_url);
    if (!spotifyId) {
      return NextResponse.json({ error: 'URL do Spotify invalida' }, { status: 400 });
    }

    const { userId, supabase } = await requireUser();

    // Max 10 competidores por user
    const { count } = await supabase
      .from('competitors')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    if ((count ?? 0) >= 10) {
      return NextResponse.json({ error: 'Limite de 10 competidores atingido' }, { status: 400 });
    }

    // Resolve display_name via Spotify API se nao fornecido
    let displayName = body.display_name?.trim();
    if (!displayName) {
      displayName = (await fetchSpotifyArtistName(spotifyId)) ?? 'Competidor';
    }

    const { data: competitor, error: insErr } = await supabase
      .from('competitors')
      .insert({
        user_id: userId,
        spotify_artist_url: body.spotify_artist_url.trim(),
        spotify_artist_id: spotifyId,
        youtube_channel_url: body.youtube_channel_url?.trim() || null,
        display_name: displayName,
      })
      .select()
      .single();

    if (insErr || !competitor) {
      return NextResponse.json({ error: 'Falha ao adicionar' }, { status: 500 });
    }

    // Captura snapshot inicial
    await captureCompetitorSnapshots(
      competitor.id,
      spotifyId,
      body.youtube_channel_url?.trim() || null,
      supabase
    );

    return NextResponse.json({ competitor });
  } catch (err) {
    console.error('add competitor error:', err);
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
