/**
 * YouTube Data API v3 - client simples para buscar dados publicos de canal.
 * Nao precisa OAuth. Usa API key (YOUTUBE_API_KEY).
 * Quota: 10.000 unidades/dia gratis. channels.list = 1 unidade por request.
 */

export interface YouTubeChannelData {
  channel_id: string;
  title: string;
  subscribers: number;
  total_views: number;
  video_count: number;
  url: string;
}

/**
 * Extrai handle ou channel ID de uma URL do YouTube.
 * Aceita:
 *   https://youtube.com/@handle
 *   https://youtube.com/channel/UCxxxxx
 *   https://www.youtube.com/c/name
 *   @handle
 *   UCxxxxx
 */
export function parseYouTubeChannelIdentifier(input: string): { type: 'handle' | 'id'; value: string } | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  // Channel ID puro (UC + 22 chars)
  if (/^UC[a-zA-Z0-9_-]{22}$/.test(trimmed)) {
    return { type: 'id', value: trimmed };
  }

  // Handle puro @xxx
  const handleMatch = trimmed.match(/^@?([a-zA-Z0-9_.\-]+)$/);
  if (handleMatch && !trimmed.includes('/')) {
    return { type: 'handle', value: handleMatch[1] };
  }

  // URL com /channel/UCxxxxx
  const channelUrlMatch = trimmed.match(/youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{22})/);
  if (channelUrlMatch) return { type: 'id', value: channelUrlMatch[1] };

  // URL com /@handle
  const handleUrlMatch = trimmed.match(/youtube\.com\/@([a-zA-Z0-9_.\-]+)/);
  if (handleUrlMatch) return { type: 'handle', value: handleUrlMatch[1] };

  // URL legado /c/name ou /user/name
  const legacyMatch = trimmed.match(/youtube\.com\/(?:c|user)\/([a-zA-Z0-9_.\-]+)/);
  if (legacyMatch) return { type: 'handle', value: legacyMatch[1] };

  return null;
}

/**
 * Fetch dados do canal via YouTube Data API v3.
 * Se o identificador e um handle, primeiro faz search pra pegar o channel_id.
 */
export async function fetchYouTubeChannelData(
  identifier: { type: 'handle' | 'id'; value: string }
): Promise<YouTubeChannelData | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error('YOUTUBE_API_KEY nao configurada');
  }

  let channelId = identifier.type === 'id' ? identifier.value : null;

  if (!channelId) {
    // Handle -> resolve via channels?forHandle (API V3)
    const handle = identifier.value.startsWith('@') ? identifier.value : '@' + identifier.value;
    const resolveUrl = `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${encodeURIComponent(handle)}&key=${apiKey}`;
    const resolveRes = await fetch(resolveUrl);
    if (!resolveRes.ok) {
      console.error('YouTube resolve handle failed:', resolveRes.status);
      return null;
    }
    const resolveData = (await resolveRes.json()) as { items?: Array<{ id: string }> };
    channelId = resolveData.items?.[0]?.id ?? null;

    if (!channelId) {
      // Fallback: search endpoint
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=id&type=channel&q=${encodeURIComponent(identifier.value)}&maxResults=1&key=${apiKey}`;
      const searchRes = await fetch(searchUrl);
      if (searchRes.ok) {
        const searchData = (await searchRes.json()) as { items?: Array<{ id?: { channelId?: string } }> };
        channelId = searchData.items?.[0]?.id?.channelId ?? null;
      }
    }

    if (!channelId) return null;
  }

  const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${apiKey}`;
  const res = await fetch(channelUrl);
  if (!res.ok) return null;

  const data = (await res.json()) as {
    items?: Array<{
      id: string;
      snippet: { title: string; customUrl?: string };
      statistics: { subscriberCount?: string; viewCount?: string; videoCount?: string };
    }>;
  };

  const channel = data.items?.[0];
  if (!channel) return null;

  return {
    channel_id: channel.id,
    title: channel.snippet.title,
    subscribers: parseInt(channel.statistics.subscriberCount ?? '0', 10),
    total_views: parseInt(channel.statistics.viewCount ?? '0', 10),
    video_count: parseInt(channel.statistics.videoCount ?? '0', 10),
    url: `https://www.youtube.com/channel/${channel.id}`,
  };
}
