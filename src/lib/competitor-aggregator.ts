import type { SupabaseClient } from '@supabase/supabase-js';
import { parseSpotifyArtistId, scrapeSpotifyMonthlyListeners, getSpotifyAccessToken } from '@/lib/spotify-client';
import { parseYouTubeChannelIdentifier, fetchYouTubeChannelData } from '@/lib/youtube-client';
import type { CompetitorWithData, ComparisonDashboard, Competitor, GrowthSource } from '@/lib/types/tools';
import { getGrowthDashboardData } from '@/lib/growth-aggregator';

/**
 * Busca o nome do artista do Spotify (pra display automatico ao adicionar competitor).
 */
export async function fetchSpotifyArtistName(artistId: string): Promise<string | null> {
  try {
    const token = await getSpotifyAccessToken();
    const res = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json() as { name?: string };
    return data.name ?? null;
  } catch {
    return null;
  }
}

/**
 * Captura snapshot atual de cada competitor (Spotify monthly listeners + YouTube subs).
 */
export async function captureCompetitorSnapshots(
  competitorId: string,
  spotifyArtistId: string | null,
  youtubeIdentifier: string | null,
  supabase: SupabaseClient
): Promise<{ captured: Partial<Record<'spotify' | 'youtube', number>>; errors: string[] }> {
  const captured: Partial<Record<'spotify' | 'youtube', number>> = {};
  const errors: string[] = [];
  const today = new Date().toISOString().slice(0, 10);

  if (spotifyArtistId) {
    try {
      const listeners = await scrapeSpotifyMonthlyListeners(spotifyArtistId);
      if (listeners && listeners > 0) {
        captured.spotify = listeners;
        await supabase.from('competitor_snapshots').upsert(
          { competitor_id: competitorId, source: 'spotify', metric_value: listeners, snapshot_date: today },
          { onConflict: 'competitor_id,source,snapshot_date' }
        );
      } else {
        errors.push('Spotify: sem dados');
      }
    } catch (err) {
      errors.push(`Spotify: ${err instanceof Error ? err.message : 'erro'}`);
    }
  }

  if (youtubeIdentifier) {
    try {
      const parsed = parseYouTubeChannelIdentifier(youtubeIdentifier);
      if (parsed) {
        const data = await fetchYouTubeChannelData(parsed);
        if (data && data.subscribers > 0) {
          captured.youtube = data.subscribers;
          await supabase.from('competitor_snapshots').upsert(
            { competitor_id: competitorId, source: 'youtube', metric_value: data.subscribers, snapshot_date: today },
            { onConflict: 'competitor_id,source,snapshot_date' }
          );
          if (data.channel_id) {
            await supabase
              .from('competitors')
              .update({ youtube_channel_id: data.channel_id })
              .eq('id', competitorId);
          }
        }
      }
    } catch (err) {
      errors.push(`YouTube: ${err instanceof Error ? err.message : 'erro'}`);
    }
  }

  return { captured, errors };
}

/**
 * Monta dashboard completo com user + competitors.
 */
export async function getComparisonDashboard(
  userId: string,
  supabase: SupabaseClient
): Promise<ComparisonDashboard> {
  // Dados do proprio user (via Growth Tracker)
  const userData = await getGrowthDashboardData(userId, supabase);

  const twelveWeeksAgo = new Date();
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 12 * 7);
  const twelveWeeksAgoISO = twelveWeeksAgo.toISOString().slice(0, 10);

  // Merge history do user em formato {date, spotify, youtube}
  const userHistoryMap: Record<string, { date: string; spotify?: number; youtube?: number }> = {};
  for (const source of ['spotify', 'youtube'] as GrowthSource[]) {
    for (const p of userData.history[source]) {
      if (!userHistoryMap[p.date]) userHistoryMap[p.date] = { date: p.date };
      if (source === 'spotify') userHistoryMap[p.date].spotify = p.value;
      if (source === 'youtube') userHistoryMap[p.date].youtube = p.value;
    }
  }
  const userHistory = Object.values(userHistoryMap).sort((a, b) => a.date.localeCompare(b.date));

  // Competidores do user
  const { data: competitors } = await supabase
    .from('competitors')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  const competitorsWithData: CompetitorWithData[] = [];
  if (competitors && competitors.length > 0) {
    const compIds = competitors.map((c) => c.id);
    const { data: allSnapshots } = await supabase
      .from('competitor_snapshots')
      .select('*')
      .in('competitor_id', compIds)
      .gte('snapshot_date', twelveWeeksAgoISO)
      .order('snapshot_date', { ascending: true });

    const snapshotsByComp: Record<string, typeof allSnapshots> = {};
    for (const s of allSnapshots ?? []) {
      if (!snapshotsByComp[s.competitor_id]) snapshotsByComp[s.competitor_id] = [];
      snapshotsByComp[s.competitor_id]!.push(s);
    }

    for (const comp of competitors) {
      const snapshots = snapshotsByComp[comp.id] ?? [];
      const historyMap: Record<string, { date: string; spotify?: number; youtube?: number }> = {};
      let lastUpdated: string | null = null;
      let currentSpotify: number | null = null;
      let currentYoutube: number | null = null;

      for (const s of snapshots) {
        if (!historyMap[s.snapshot_date]) historyMap[s.snapshot_date] = { date: s.snapshot_date };
        if (s.source === 'spotify') {
          historyMap[s.snapshot_date].spotify = s.metric_value;
        } else if (s.source === 'youtube') {
          historyMap[s.snapshot_date].youtube = s.metric_value;
        }
        if (!lastUpdated || s.snapshot_date > lastUpdated) lastUpdated = s.snapshot_date;
      }

      const history = Object.values(historyMap).sort((a, b) => a.date.localeCompare(b.date));
      if (history.length > 0) {
        const latest = history[history.length - 1];
        currentSpotify = latest.spotify ?? null;
        currentYoutube = latest.youtube ?? null;
      }

      competitorsWithData.push({
        ...comp,
        current: { spotify: currentSpotify, youtube: currentYoutube },
        history,
        last_updated: lastUpdated,
      });
    }
  }

  return {
    you: {
      display_name: 'Voce',
      current: { spotify: userData.current.spotify, youtube: userData.current.youtube },
      history: userHistory,
    },
    competitors: competitorsWithData,
  };
}

/**
 * Gera leitura IA comparando user com competitors.
 */
export async function generateComparisonInsight(dashboard: ComparisonDashboard): Promise<string> {
  if (dashboard.competitors.length === 0) return '';

  const lines: string[] = [];
  lines.push(`Voce: ${dashboard.you.current.spotify?.toLocaleString('pt-BR') ?? '—'} listeners Spotify, ${dashboard.you.current.youtube?.toLocaleString('pt-BR') ?? '—'} subs YouTube`);
  for (const c of dashboard.competitors) {
    lines.push(`${c.display_name}: ${c.current.spotify?.toLocaleString('pt-BR') ?? '—'} listeners, ${c.current.youtube?.toLocaleString('pt-BR') ?? '—'} subs`);
  }

  const prompt = `Comparacao atual:
${lines.join('\n')}

Escreva 1 paragrafo (2-4 frases) em portugues brasileiro comparando voce com os competidores. Seja especifico aos numeros. Nao use clichees. Se voce esta atras, seja direto e sugira 1 coisa concreta. Se esta na frente, aponte o que esta indo bem.

Responda APENAS com o paragrafo. Sem marcacoes.`;

  const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!claudeRes.ok) return '';
  const data = await claudeRes.json() as { content: Array<{ text: string }> };
  return data.content?.[0]?.text?.trim() ?? '';
}

void ({} as Competitor);
