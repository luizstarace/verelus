import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import {
  buildContentCalendarPrompt,
  getContentCalendarSystemPrompt,
  parseContentCalendarResponse,
  calculatePostDate,
} from '@/lib/content-calendar-prompt';
import type { ContentCalendarInput, PostPlatform } from '@/lib/types/tools';
import { POST_PLATFORM_META } from '@/lib/types/tools';

export const runtime = 'edge';

const VALID_PLATFORMS = Object.keys(POST_PLATFORM_META) as PostPlatform[];

function validateInput(raw: unknown): ContentCalendarInput | { error: string } {
  if (!raw || typeof raw !== 'object') return { error: 'Input invalido' };
  const r = raw as Record<string, unknown>;

  const required = ['artist_name', 'song_title', 'release_type', 'release_date', 'genre', 'mood'];
  for (const k of required) {
    if (typeof r[k] !== 'string' || !(r[k] as string).trim()) return { error: `${k} obrigatorio` };
  }

  if (!['single', 'ep', 'album'].includes(r.release_type as string)) {
    return { error: 'release_type invalido' };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.release_date as string)) {
    return { error: 'release_date formato YYYY-MM-DD' };
  }
  if (!Array.isArray(r.platforms) || r.platforms.length === 0) {
    return { error: 'Selecione ao menos 1 plataforma' };
  }
  for (const p of r.platforms) {
    if (!VALID_PLATFORMS.includes(p as PostPlatform)) {
      return { error: `plataforma invalida: ${p}` };
    }
  }

  return {
    artist_name: String(r.artist_name).trim(),
    song_title: String(r.song_title).trim(),
    release_type: r.release_type as ContentCalendarInput['release_type'],
    release_date: String(r.release_date).trim(),
    genre: String(r.genre).trim(),
    mood: String(r.mood).trim(),
    platforms: r.platforms as PostPlatform[],
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

    const userPrompt = buildContentCalendarPrompt(validated);
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 8192,
        system: getContentCalendarSystemPrompt(),
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!claudeRes.ok) {
      console.error('Claude error:', claudeRes.status, await claudeRes.text());
      return NextResponse.json({ error: 'Falha ao gerar cronograma. Tente novamente.' }, { status: 502 });
    }

    const claudeData = (await claudeRes.json()) as { content: Array<{ text: string }> };
    const rawText = claudeData.content?.[0]?.text ?? '';

    let output;
    try {
      output = parseContentCalendarResponse(rawText);
    } catch (e) {
      console.error('Parse error:', e, 'raw:', rawText);
      return NextResponse.json({ error: 'Resposta da IA nao parseavel. Tente novamente.' }, { status: 502 });
    }

    // Enriquece posts com suggested_date calculado
    output.posts = output.posts
      .filter((p) => validated.platforms.includes(p.platform))
      .map((p) => ({
        ...p,
        suggested_date: calculatePostDate(validated.release_date, p.day_offset),
      }))
      .sort((a, b) => a.day_offset - b.day_offset);

    const { data: generation } = await supabase.from('tool_generations').insert({
      user_id: dbUser.id,
      tool_key: 'content_calendar',
      input: validated,
      output,
    }).select('id').single();

    return NextResponse.json({
      output,
      generation_id: generation?.id ?? null,
    });
  } catch (err) {
    console.error('content calendar error:', err);
    const msg = err instanceof Error ? err.message : 'erro desconhecido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
