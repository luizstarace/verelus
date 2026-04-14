import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { buildBioPrompt, getBioSystemPrompt, parseBioResponse } from '@/lib/bio-prompt';
import type { BioInput } from '@/lib/types/tools';

export const runtime = 'edge';

function validateInput(raw: unknown): BioInput | { error: string } {
  if (!raw || typeof raw !== 'object') return { error: 'Input invalido' };
  const r = raw as Record<string, unknown>;
  const required = ['artist_name', 'differentiator', 'main_achievement', 'mood_three_words', 'unusual_influence', 'direct_influences', 'tone', 'language'];
  for (const k of required) {
    if (typeof r[k] !== 'string' || (r[k] as string).trim().length === 0) {
      return { error: `Campo obrigatorio ausente: ${k}` };
    }
  }
  const validTones = ['formal', 'casual', 'poetico', 'edgy'];
  const validLangs = ['pt', 'en'];
  if (!validTones.includes(r.tone as string)) return { error: 'Tom invalido' };
  if (!validLangs.includes(r.language as string)) return { error: 'Idioma invalido' };

  return {
    artist_name: String(r.artist_name).trim(),
    differentiator: String(r.differentiator).trim(),
    main_achievement: String(r.main_achievement).trim(),
    mood_three_words: String(r.mood_three_words).trim(),
    unusual_influence: String(r.unusual_influence).trim(),
    direct_influences: String(r.direct_influences).trim(),
    genre: r.genre ? String(r.genre).trim() : undefined,
    city: r.city ? String(r.city).trim() : undefined,
    tone: r.tone as BioInput['tone'],
    language: r.language as BioInput['language'],
  };
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const validated = validateInput(raw);
    if ('error' in validated) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    // Auth
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

    // Call Claude
    const userPrompt = buildBioPrompt(validated);
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: getBioSystemPrompt(),
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!claudeRes.ok) {
      console.error('Claude error:', claudeRes.status, await claudeRes.text());
      return NextResponse.json({ error: 'Falha ao gerar bio. Tente novamente.' }, { status: 502 });
    }

    const claudeData = (await claudeRes.json()) as { content: Array<{ text: string }> };
    const rawText = claudeData.content?.[0]?.text ?? '';

    let output;
    try {
      output = parseBioResponse(rawText);
    } catch (e) {
      console.error('Parse error:', e, 'raw:', rawText);
      return NextResponse.json({ error: 'Resposta da IA nao parseavel. Tente novamente.' }, { status: 502 });
    }

    // Salvar no historico
    await supabase.from('tool_generations').insert({
      user_id: dbUser.id,
      tool_key: 'bio',
      input: validated,
      output,
    });

    return NextResponse.json({ output });
  } catch (err) {
    console.error('bio generate error:', err);
    const msg = err instanceof Error ? err.message : 'erro desconhecido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
