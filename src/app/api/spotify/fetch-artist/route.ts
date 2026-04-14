import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { parseSpotifyArtistId, fetchSpotifyArtistData } from '@/lib/spotify-client';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { spotify_url?: string; social_urls?: Record<string, string> };
    const spotifyUrl = body.spotify_url;
    const socialUrls = body.social_urls ?? {};

    if (!spotifyUrl) {
      return NextResponse.json({ error: 'spotify_url is required' }, { status: 400 });
    }

    const artistId = parseSpotifyArtistId(spotifyUrl);
    if (!artistId) {
      return NextResponse.json({ error: 'URL de Spotify invalida' }, { status: 400 });
    }

    // Autenticar usuario
    const cookieStore = cookies();
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
        },
      }
    );
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
    }

    // Buscar usuario na tabela users
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: dbUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', user.email!.toLowerCase().trim())
      .single();
    if (!dbUser) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 });
    }

    // Fetch do Spotify (inclui monthly listeners via scraping + catalogo via albums)
    const artistData = await fetchSpotifyArtistData(artistId);

    // Salvar em artist_data (upsert por user_id + spotify_artist_id)
    const { error: upsertError } = await supabase
      .from('artist_data')
      .upsert(
        {
          user_id: dbUser.id,
          spotify_artist_id: artistData.spotify_artist_id,
          spotify_url: artistData.spotify_url,
          name: artistData.name,
          genres: artistData.genres,
          followers: artistData.followers,
          popularity: artistData.popularity,
          monthly_listeners: artistData.monthly_listeners ?? null,
          top_tracks: artistData.top_tracks,
          social_urls: socialUrls,
          last_synced_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,spotify_artist_id' }
      );

    if (upsertError) {
      console.error('Upsert error:', upsertError);
      return NextResponse.json({ error: 'Falha ao salvar dados do artista' }, { status: 500 });
    }

    return NextResponse.json({ artist: artistData });
  } catch (err) {
    console.error('fetch-artist error:', err);
    const msg = err instanceof Error ? err.message : 'erro desconhecido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
