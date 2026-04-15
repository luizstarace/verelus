import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
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

    // Max 10 competidores por user
    const { count } = await supabase
      .from('competitors')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', dbUser.id);
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
        user_id: dbUser.id,
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
    return NextResponse.json({ error: 'erro' }, { status: 500 });
  }
}
