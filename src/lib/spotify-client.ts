import type { SpotifyArtistData, SpotifyTrack } from '@/lib/types/career';

/**
 * Extrai o ID do artista do Spotify a partir de uma URL ou URI.
 * Aceita: open.spotify.com/artist/ID, open.spotify.com/intl-xx/artist/ID, spotify:artist:ID, ID bruto.
 * Retorna null se nao for uma URL valida de artista.
 */
export function parseSpotifyArtistId(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  // ID bruto (22 caracteres alfanumericos do Spotify)
  if (/^[a-zA-Z0-9]{22}$/.test(trimmed)) return trimmed;

  // spotify:artist:ID
  const uriMatch = trimmed.match(/^spotify:artist:([a-zA-Z0-9]{22})$/);
  if (uriMatch) return uriMatch[1];

  // open.spotify.com/artist/ID ou open.spotify.com/intl-xx/artist/ID
  const urlMatch = trimmed.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?artist\/([a-zA-Z0-9]{22})/);
  if (urlMatch) return urlMatch[1];

  return null;
}

/**
 * Obtem access token do Spotify via Client Credentials flow.
 * Requer SPOTIFY_CLIENT_ID e SPOTIFY_CLIENT_SECRET no ambiente.
 * Token dura 1 hora; fetch novo a cada chamada (sem cache por ora).
 */
export async function getSpotifyAccessToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET not set');
  }

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }).toString(),
  });

  if (!res.ok) {
    throw new Error(`Spotify auth failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

/**
 * Busca dados do artista no Spotify Web API.
 * Retorna artista + top 10 tracks.
 * Throws se artista nao existe ou Spotify retorna erro.
 */
export async function fetchSpotifyArtistData(artistId: string): Promise<SpotifyArtistData> {
  const token = await getSpotifyAccessToken();
  const headers = { Authorization: `Bearer ${token}` };

  // Fetch artist info
  const artistRes = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, { headers });
  if (!artistRes.ok) {
    if (artistRes.status === 404) throw new Error(`Artist not found: ${artistId}`);
    throw new Error(`Spotify artist fetch failed: ${artistRes.status}`);
  }
  const artist = (await artistRes.json()) as {
    id: string;
    name: string;
    genres: string[];
    followers: { total: number };
    popularity: number;
    external_urls: { spotify: string };
  };

  // Fetch top tracks (BR market)
  const tracksRes = await fetch(
    `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=BR`,
    { headers }
  );
  if (!tracksRes.ok) throw new Error(`Spotify top tracks fetch failed: ${tracksRes.status}`);
  const tracksData = (await tracksRes.json()) as {
    tracks: Array<{
      id: string;
      name: string;
      popularity: number;
      preview_url: string | null;
      duration_ms: number;
      album: { images: Array<{ url: string }> };
    }>;
  };

  const topTracks: SpotifyTrack[] = tracksData.tracks.slice(0, 10).map((t) => ({
    id: t.id,
    name: t.name,
    popularity: t.popularity,
    preview_url: t.preview_url,
    duration_ms: t.duration_ms,
    album_image_url: t.album.images[0]?.url ?? null,
  }));

  return {
    spotify_artist_id: artist.id,
    spotify_url: artist.external_urls.spotify,
    name: artist.name,
    genres: artist.genres,
    followers: artist.followers.total,
    popularity: artist.popularity,
    monthly_listeners: undefined, // Nao disponivel via API publica; fica para Plano 2 (scraping)
    top_tracks: topTracks,
  };
}
