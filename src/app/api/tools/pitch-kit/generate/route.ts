import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { buildPitchPrompt, getPitchSystemPrompt, parsePitchResponse } from '@/lib/pitch-kit-prompt';
import type { PitchInput } from '@/lib/types/tools';
import { PITCH_RECIPIENT_META } from '@/lib/types/tools';

export const runtime = 'edge';

function validateInput(raw: unknown): PitchInput | { error: string } {
  if (!raw || typeof raw !== 'object') return { error: 'Input invalido' };
  const r = raw as Record<string, unknown>;

  const required = ['artist_name', 'song_title', 'genre_primary', 'mood_keywords', 'release_type',
    'achievements', 'similar_artists', 'recipient_type', 'recipient_name', 'recipient_entity', 'tone', 'language'];
  for (const k of required) {
    if (typeof r[k] !== 'string' || !(r[k] as string).trim()) return { error: `${k} obrigatorio` };
  }

  if (!['single', 'ep', 'album'].includes(r.release_type as string)) return { error: 'release_type invalido' };
  if (!(r.recipient_type as string in PITCH_RECIPIENT_META)) return { error: 'recipient_type invalido' };
  if (!['professional', 'casual', 'bold'].includes(r.tone as string)) return { error: 'tone invalido' };
  if (!['pt', 'en'].includes(r.language as string)) return { error: 'language invalido' };

  return {
    artist_name: String(r.artist_name).trim(),
    song_spotify_url: r.song_spotify_url ? String(r.song_spotify_url).trim() : undefined,
    song_title: String(r.song_title).trim(),
    genre_primary: String(r.genre_primary).trim(),
    mood_keywords: String(r.mood_keywords).trim(),
    release_type: r.release_type as PitchInput['release_type'],
    release_date: r.release_date ? String(r.release_date).trim() : undefined,
    achievements: String(r.achievements).trim(),
    similar_artists: String(r.similar_artists).trim(),
    recipient_type: r.recipient_type as PitchInput['recipient_type'],
    recipient_name: String(r.recipient_name).trim(),
    recipient_entity: String(r.recipient_entity).trim(),
    tone: r.tone as PitchInput['tone'],
    language: r.language as PitchInput['language'],
  };
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const validated = validateInput(raw);
    if ('error' in validated) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
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

    const userPrompt = buildPitchPrompt(validated);
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
        system: getPitchSystemPrompt(),
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!claudeRes.ok) {
      console.error('Claude error:', claudeRes.status, await claudeRes.text());
      return NextResponse.json({ error: 'Falha ao gerar pitch. Tente novamente.' }, { status: 502 });
    }

    const claudeData = (await claudeRes.json()) as { content: Array<{ text: string }> };
    const rawText = claudeData.content?.[0]?.text ?? '';

    let output;
    try {
      output = parsePitchResponse(rawText);
    } catch (e) {
      console.error('Parse error:', e, 'raw:', rawText);
      return NextResponse.json({ error: 'Resposta da IA nao parseavel. Tente novamente.' }, { status: 502 });
    }

    const { data: generation } = await supabase.from('tool_generations').insert({
      user_id: dbUser.id,
      tool_key: 'pitch_kit',
      input: validated,
      output,
    }).select('id').single();

    return NextResponse.json({
      output,
      generation_id: generation?.id ?? null,
    });
  } catch (err) {
    console.error('pitch kit error:', err);
    const msg = err instanceof Error ? err.message : 'erro desconhecido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
