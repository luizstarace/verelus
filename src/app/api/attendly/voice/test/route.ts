export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { requireUser, errorResponse } from '@/lib/api-auth';
import { rateLimit, getRateLimitHeaders } from '@/lib/attendly/rate-limit';

export async function POST(request: Request) {
  try {
    const { userId, supabase } = await requireUser();

    // Preview endpoint is open to all plans so users on Starter/trial can
    // hear the voice before deciding to upgrade. Plan gating still applies
    // to /api/attendly/voice (runtime synthesis for chat replies).
    const rl = rateLimit(`voice-test:${userId}`, 10, 3600_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Muitos testes seguidos. Tente novamente em 1 hora.' },
        { status: 429, headers: getRateLimitHeaders(rl.remaining, 10) }
      );
    }

    const body = await request.json().catch(() => ({}));
    const text = typeof body.text === 'string' ? body.text : '';

    if (!text.trim()) {
      return NextResponse.json({ error: 'Texto obrigatório' }, { status: 400 });
    }
    if (text.length > 500) {
      return NextResponse.json({ error: 'Texto de teste máximo 500 caracteres' }, { status: 400 });
    }

    const { data: business } = await supabase
      .from('attendly_businesses')
      .select('voice_id')
      .eq('user_id', userId)
      .single();

    const voiceId =
      !business?.voice_id || business.voice_id === 'default'
        ? '21m00Tcm4TlvDq8ikWAM'
        : business.voice_id;

    const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    });

    if (!ttsRes.ok) {
      const detail = await ttsRes.text().catch(() => '');
      return NextResponse.json(
        { error: 'Erro ao gerar áudio', detail: detail.slice(0, 200) },
        { status: 502 }
      );
    }

    const audio = await ttsRes.arrayBuffer();
    return new Response(audio, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
