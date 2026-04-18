import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { parseSpotifyArtistId, scrapeSpotifyMonthlyListeners } from '@/lib/spotify-client';
import { parseYouTubeChannelIdentifier, fetchYouTubeChannelData } from '@/lib/youtube-client';
import type { GrowthProfile, GrowthSource, GrowthDashboardData } from '@/lib/types/tools';

/**
 * Captura snapshots automaticos pro user (Spotify + YouTube).
 * Instagram e TikTok dependem de input manual do user via UI.
 */
export async function captureAutomaticSnapshots(
  profile: GrowthProfile,
  supabase: SupabaseClient
): Promise<{ captured: Partial<Record<GrowthSource, number>>; errors: string[] }> {
  const captured: Partial<Record<GrowthSource, number>> = {};
  const errors: string[] = [];
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // Spotify
  if (profile.spotify_artist_url) {
    try {
      const artistId = parseSpotifyArtistId(profile.spotify_artist_url);
      if (artistId) {
        const listeners = await scrapeSpotifyMonthlyListeners(artistId);
        if (listeners && listeners > 0) {
          captured.spotify = listeners;
          await upsertSnapshot(supabase, profile.user_id, 'spotify', listeners, today);
        } else {
          errors.push('Spotify: monthly listeners nao retornado pelo scraping');
        }
      } else {
        errors.push('Spotify: URL invalida');
      }
    } catch (err) {
      errors.push(`Spotify: ${err instanceof Error ? err.message : 'erro'}`);
    }
  }

  // YouTube
  if (profile.youtube_channel_url || profile.youtube_channel_id) {
    try {
      const identifier =
        profile.youtube_channel_id
          ? { type: 'id' as const, value: profile.youtube_channel_id }
          : parseYouTubeChannelIdentifier(profile.youtube_channel_url!);
      if (identifier) {
        const data = await fetchYouTubeChannelData(identifier);
        if (data && data.subscribers > 0) {
          captured.youtube = data.subscribers;
          await upsertSnapshot(supabase, profile.user_id, 'youtube', data.subscribers, today);
          // Atualizar channel_id se nao tinha
          if (!profile.youtube_channel_id) {
            await supabase
              .from('growth_profiles')
              .update({ youtube_channel_id: data.channel_id })
              .eq('user_id', profile.user_id);
          }
        } else {
          errors.push('YouTube: canal retornou 0 subs ou nao encontrado');
        }
      } else {
        errors.push('YouTube: URL/handle invalido');
      }
    } catch (err) {
      errors.push(`YouTube: ${err instanceof Error ? err.message : 'erro'}`);
    }
  }

  return { captured, errors };
}

async function upsertSnapshot(
  supabase: SupabaseClient,
  userId: string,
  source: GrowthSource,
  value: number,
  date: string
): Promise<void> {
  await supabase
    .from('growth_snapshots')
    .upsert(
      {
        user_id: userId,
        source,
        metric_value: value,
        snapshot_date: date,
      },
      { onConflict: 'user_id,source,snapshot_date' }
    );
}

/**
 * Monta dashboard data para o user: current, previous_week, delta, history.
 */
export async function getGrowthDashboardData(
  userId: string,
  supabase: SupabaseClient
): Promise<GrowthDashboardData> {
  const { data: profileRow } = await supabase
    .from('growth_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  const profile: GrowthProfile = profileRow
    ? {
        user_id: userId,
        spotify_artist_url: profileRow.spotify_artist_url ?? undefined,
        youtube_channel_id: profileRow.youtube_channel_id ?? undefined,
        youtube_channel_url: profileRow.youtube_channel_url ?? undefined,
        instagram_handle: profileRow.instagram_handle ?? undefined,
        tiktok_handle: profileRow.tiktok_handle ?? undefined,
        enabled: profileRow.enabled ?? true,
      }
    : {
        user_id: userId,
        enabled: false,
      };

  const sources: GrowthSource[] = ['spotify', 'youtube', 'instagram', 'tiktok'];
  const current: Record<GrowthSource, number | null> = { spotify: null, youtube: null, instagram: null, tiktok: null };
  const previous_week: Record<GrowthSource, number | null> = { spotify: null, youtube: null, instagram: null, tiktok: null };
  const delta_pct: Record<GrowthSource, number | null> = { spotify: null, youtube: null, instagram: null, tiktok: null };
  const history: Record<GrowthSource, Array<{ date: string; value: number }>> = {
    spotify: [], youtube: [], instagram: [], tiktok: [],
  };
  const last_updated: Record<GrowthSource, string | null> = { spotify: null, youtube: null, instagram: null, tiktok: null };

  const twelveWeeksAgo = new Date();
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 12 * 7);
  const twelveWeeksAgoISO = twelveWeeksAgo.toISOString().slice(0, 10);

  for (const source of sources) {
    const { data: snapshots } = await supabase
      .from('growth_snapshots')
      .select('metric_value, snapshot_date')
      .eq('user_id', userId)
      .eq('source', source)
      .gte('snapshot_date', twelveWeeksAgoISO)
      .order('snapshot_date', { ascending: true });

    if (!snapshots || snapshots.length === 0) continue;

    const points = snapshots.map((s: { metric_value: number; snapshot_date: string }) => ({
      date: s.snapshot_date,
      value: s.metric_value,
    }));
    history[source] = points;

    const latest = points[points.length - 1];
    current[source] = latest.value;
    last_updated[source] = latest.date;

    // Previous week = snapshot com pelo menos 5 dias atras
    const latestDate = new Date(latest.date + 'T12:00:00');
    const fiveDaysAgo = new Date(latestDate);
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    const fiveDaysAgoISO = fiveDaysAgo.toISOString().slice(0, 10);
    const prev = [...points].reverse().find((p) => p.date <= fiveDaysAgoISO);
    if (prev) {
      previous_week[source] = prev.value;
      if (prev.value > 0) {
        delta_pct[source] = ((latest.value - prev.value) / prev.value) * 100;
      }
    }
  }

  return {
    profile,
    current,
    previous_week,
    delta_pct,
    history,
    last_updated,
    weekly_insight: profileRow?.weekly_insight ?? undefined,
  };
}

/**
 * Gera insight semanal via Claude baseado nos deltas da semana.
 * Retorna texto curto (1-2 paragrafos).
 */
export async function generateWeeklyInsight(data: GrowthDashboardData, artistName?: string): Promise<string> {
  const anyData = Object.values(data.current).some((v) => v !== null);
  if (!anyData) return 'Ainda sem dados suficientes. Volte na proxima segunda.';

  const lines: string[] = [];
  for (const source of ['spotify', 'youtube', 'instagram', 'tiktok'] as const) {
    if (data.current[source] !== null) {
      const delta = data.delta_pct[source];
      const deltaStr = delta !== null ? `${delta > 0 ? '+' : ''}${delta.toFixed(1)}%` : 'sem comparativo';
      lines.push(`${source}: ${data.current[source]?.toLocaleString('pt-BR')} (${deltaStr})`);
    }
  }

  const prompt = `Dados do artista ${artistName ?? 'anonimo'} essa semana:
${lines.join('\n')}

Voce e um consultor de crescimento pra musicos indie brasileiros. Analise os numeros acima de forma DIAGNOSTICA, nao celebratoria.

Em 2-3 frases:
1. Identifique o maior movimento da semana (positivo ou negativo)
2. Sugira UMA hipotese do que pode ter causado (viral? colaboracao? sazonalidade? algoritmo?)
3. Recomende UMA acao acionavel pra proxima semana

Seja especifico. Nao diga "continue assim". Nao seja generico.

Responda APENAS com o paragrafo. Sem marcacoes, sem JSON.`;

  const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!claudeRes.ok) {
    console.error('Claude insight error:', claudeRes.status);
    return lines.join(' · ');
  }

  const claudeData = (await claudeRes.json()) as { content: Array<{ text: string }> };
  return claudeData.content?.[0]?.text?.trim() ?? lines.join(' · ');
}
