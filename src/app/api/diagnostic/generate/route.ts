import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { calculateStage } from '@/lib/stage-calculator';
import { buildDiagnosticPrompt, getSystemPrompt, parseDiagnosticResponse } from '@/lib/diagnostic-prompts';
import type { SurveyResponse, SpotifyArtistData } from '@/lib/types/career';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { survey: SurveyResponse };
    if (!body.survey) {
      return NextResponse.json({ error: 'survey is required' }, { status: 400 });
    }

    // Autenticar
    const cookieStore = cookies();
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: { get(name: string) { return cookieStore.get(name)?.value; } },
      }
    );
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: dbUser } = await supabase.from('users').select('id').eq('email', user.email!.toLowerCase().trim()).single();
    if (!dbUser) return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 });

    // Buscar artist_data mais recente do usuario
    const { data: artistRow } = await supabase
      .from('artist_data')
      .select('*')
      .eq('user_id', dbUser.id)
      .order('last_synced_at', { ascending: false })
      .limit(1)
      .single();

    if (!artistRow) {
      return NextResponse.json({ error: 'Conecte seu Spotify antes de gerar diagnostico' }, { status: 400 });
    }

    const spotifyData: SpotifyArtistData = {
      spotify_artist_id: artistRow.spotify_artist_id,
      spotify_url: artistRow.spotify_url,
      name: artistRow.name,
      genres: artistRow.genres ?? [],
      followers: artistRow.followers,
      popularity: artistRow.popularity,
      monthly_listeners: artistRow.monthly_listeners ?? undefined,
      top_tracks: artistRow.top_tracks ?? [],
    };

    const socialUrls = (artistRow.social_urls ?? {}) as Record<string, string>;

    // Salvar survey
    await supabase
      .from('artist_survey')
      .insert({ user_id: dbUser.id, responses: body.survey });

    // Calcular estagio
    const { stage, score, dimensions } = calculateStage(spotifyData, body.survey, socialUrls);

    // Montar prompt e chamar Claude
    const userPrompt = buildDiagnosticPrompt(spotifyData, body.survey, stage, score, dimensions, socialUrls);

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: getSystemPrompt(),
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!claudeRes.ok) {
      console.error('Claude error:', claudeRes.status, await claudeRes.text());
      return NextResponse.json({ error: 'Falha ao gerar diagnostico' }, { status: 502 });
    }

    const claudeData = (await claudeRes.json()) as { content: Array<{ text: string }> };
    const rawText = claudeData.content?.[0]?.text ?? '';

    let parsed: ReturnType<typeof parseDiagnosticResponse>;
    try {
      parsed = parseDiagnosticResponse(rawText);
    } catch (e) {
      console.error('Parse error:', e, 'raw:', rawText);
      return NextResponse.json({ error: 'Resposta da IA nao parseavel. Tente novamente.' }, { status: 502 });
    }

    // Salvar diagnostic
    const { data: diagnostic, error: insErr } = await supabase
      .from('diagnostics')
      .insert({
        user_id: dbUser.id,
        artist_data_snapshot: spotifyData,
        survey_snapshot: body.survey,
        stage,
        stage_score: score,
        dimension_scores: dimensions,
        diagnostic_text: parsed.diagnostic_text,
        action_plan: parsed.action_plan,
      })
      .select()
      .single();

    if (insErr) {
      console.error('Insert error:', insErr);
      return NextResponse.json({ error: 'Falha ao salvar diagnostico' }, { status: 500 });
    }

    return NextResponse.json({ diagnostic_id: diagnostic.id });
  } catch (err) {
    console.error('generate diagnostic error:', err);
    const msg = err instanceof Error ? err.message : 'erro desconhecido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
