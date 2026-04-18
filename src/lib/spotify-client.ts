export interface SpotifyArtistData {
  spotify_artist_id: string;
  spotify_url: string;
  name: string;
  genres: string[];
  followers: number;
  popularity: number;
  monthly_listeners?: number;
  top_tracks: { id: string; name: string; popularity: number }[];
}

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
 * Extrai monthly listeners da pagina publica do Spotify via scraping do meta description.
 * A Web API para apps novos (pos-nov-2024) nao retorna mais esse dado — temos que scrapear.
 *
 * Retorna undefined se nao conseguir extrair.
 */
export async function scrapeSpotifyMonthlyListeners(artistId: string): Promise<number | undefined> {
  // Tentativa 1: scraping da pagina publica
  const scraped = await scrapeFromPage(artistId);
  if (scraped !== undefined) return scraped;

  // Tentativa 2: Spotify Web API (funciona pra apps antigos, retorna followers como proxy)
  try {
    const token = await getSpotifyAccessToken();
    const res = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = (await res.json()) as { followers?: { total: number } };
      if (data.followers?.total && data.followers.total > 0) {
        return data.followers.total;
      }
    }
  } catch {
    // API fallback falhou, retorna undefined
  }

  return undefined;
}

async function scrapeFromPage(artistId: string): Promise<number | undefined> {
  try {
    const res = await fetch(`https://open.spotify.com/artist/${artistId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
      },
    });
    if (!res.ok) return undefined;
    const html = await res.text();

    // Procura na meta description: "Artist · 2.2M monthly listeners." ou "2,242,648 monthly listeners"
    // Primeiro pega o numero cheio com virgulas (mais preciso)
    const exactMatch = html.match(/(\d[\d,]+)\s*monthly listeners/);
    if (exactMatch) {
      return parseInt(exactMatch[1].replace(/,/g, ''), 10);
    }

    // Fallback: numero abreviado tipo "2.2M" ou "350K" da meta description
    const metaDesc = html.match(/<meta[^>]*(?:name|property)=["'](?:description|og:description)["'][^>]*content=["']([^"']+)["']/);
    if (metaDesc) {
      const abbrevMatch = metaDesc[1].match(/(\d+(?:\.\d+)?)\s*([KMB])\s*monthly listeners/i);
      if (abbrevMatch) {
        const num = parseFloat(abbrevMatch[1]);
        const mult: Record<string, number> = { K: 1_000, M: 1_000_000, B: 1_000_000_000 };
        return Math.round(num * (mult[abbrevMatch[2].toUpperCase()] ?? 1));
      }
    }

    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Tipo do item de catalogo retornado pelo endpoint /albums.
 */
export interface SpotifyAlbum {
  id: string;
  name: string;
  release_date: string;  // YYYY-MM-DD
  album_type: 'album' | 'single' | 'compilation';
  total_tracks: number;
  image_url: string | null;
}

/**
 * Busca o catalogo recente do artista (albums + singles).
 * Limitado a 5 items nos apps novos do Spotify (pos-nov-2024).
 */
export async function fetchSpotifyCatalog(artistId: string, token: string): Promise<SpotifyAlbum[]> {
  const res = await fetch(
    `https://api.spotify.com/v1/artists/${artistId}/albums?market=BR&limit=5&include_groups=album,single`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) return [];

  const data = (await res.json()) as {
    items: Array<{
      id: string;
      name: string;
      release_date: string;
      album_type: 'album' | 'single' | 'compilation';
      total_tracks: number;
      images: Array<{ url: string }>;
    }>;
  };

  return data.items.map((a) => ({
    id: a.id,
    name: a.name,
    release_date: a.release_date,
    album_type: a.album_type,
    total_tracks: a.total_tracks,
    image_url: a.images[0]?.url ?? null,
  }));
}

/**
 * Busca dados do artista no Spotify.
 *
 * NOTA IMPORTANTE: Para apps novos criados apos nov/2024, a Web API nao retorna mais
 * followers, popularity, genres, nem top-tracks. Esses dados sao obtidos via:
 * - Monthly listeners: scraping da pagina publica (open.spotify.com)
 * - Genres: fornecidos pelo usuario no survey (primary_genre)
 * - Followers/popularity: nao disponiveis no MVP (fallback para 0 no stage calculator)
 * - Top tracks: nao disponiveis no MVP; usamos albums endpoint para catalogo
 */
export async function fetchSpotifyArtistData(artistId: string): Promise<SpotifyArtistData & { albums: SpotifyAlbum[] }> {
  const token = await getSpotifyAccessToken();

  // Fetch basic artist info (nome, id, url, imagem)
  const artistRes = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!artistRes.ok) {
    if (artistRes.status === 404) throw new Error(`Artist not found: ${artistId}`);
    throw new Error(`Spotify artist fetch failed: ${artistRes.status}`);
  }
  const artist = (await artistRes.json()) as {
    id: string;
    name: string;
    external_urls: { spotify: string };
    followers?: { total: number };
    popularity?: number;
    genres?: string[];
  };

  // Fetch monthly listeners via scraping (unica fonte confiavel pos-nov-2024)
  const monthlyListeners = await scrapeSpotifyMonthlyListeners(artistId);

  // Fetch catalogo (albums + singles) via API oficial
  const albums = await fetchSpotifyCatalog(artistId, token);

  return {
    spotify_artist_id: artist.id,
    spotify_url: artist.external_urls.spotify,
    name: artist.name,
    genres: artist.genres ?? [],  // vazio para apps novos; usuario fornece no survey
    followers: artist.followers?.total ?? 0,  // 0 para apps novos
    popularity: artist.popularity ?? 0,  // 0 para apps novos
    monthly_listeners: monthlyListeners,
    top_tracks: [],  // nao disponivel para apps novos; usamos albums
    albums,
  };
}
