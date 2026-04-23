export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireUser, errorResponse } from '@/lib/api-auth';
import { getPlanFromSubscription, getPlanLimits } from '@/lib/attendly/plans';
import { validateVoiceInput, estimateVoiceSeconds } from '@/lib/attendly/voice-validation';

export async function POST(request: Request) {
  try {
    const { userId, supabase } = await requireUser();
    const body = await request.json();
    const { message_id, text } = body;

    const validation = validateVoiceInput(message_id, text);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('product')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .limit(1)
      .single();

    const plan = getPlanFromSubscription(sub?.product || null);
    const limits = getPlanLimits(plan);

    if (!limits.voice_enabled) {
      return NextResponse.json({ error: 'Voz não disponível no seu plano. Faça upgrade.' }, { status: 403 });
    }

    const { data: business } = await supabase
      .from('attendly_businesses')
      .select('id, voice_id')
      .eq('user_id', userId)
      .single();

    if (!business) {
      return NextResponse.json({ error: 'Negócio não encontrado' }, { status: 404 });
    }

    const voiceId = business.voice_id === 'default' ? '21m00Tcm4TlvDq8ikWAM' : business.voice_id;
    const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    });

    if (!ttsRes.ok) {
      return NextResponse.json({ error: 'Erro ao gerar áudio' }, { status: 502 });
    }

    const audioBuffer = await ttsRes.arrayBuffer();

    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const fileName = `voice/${message_id}.mp3`;
    const { error: uploadErr } = await serviceSupabase.storage
      .from('attendly-audio')
      .upload(fileName, audioBuffer, { contentType: 'audio/mpeg', upsert: true });

    if (uploadErr) throw uploadErr;

    // Signed URL with 1h TTL — LGPD-friendly: audio is customer PII and should not
    // be permanently public. Client re-fetches for replay via the same endpoint.
    const { data: signed, error: signErr } = await serviceSupabase.storage
      .from('attendly-audio')
      .createSignedUrl(fileName, 60 * 60);

    if (signErr || !signed?.signedUrl) {
      return NextResponse.json({ error: 'Erro ao gerar URL do áudio' }, { status: 500 });
    }

    await serviceSupabase
      .from('attendly_messages')
      .update({ audio_url: signed.signedUrl })
      .eq('id', message_id);

    const estimatedSeconds = estimateVoiceSeconds(text);
    const period = new Date().toISOString().slice(0, 7) + '-01';
    await serviceSupabase.rpc('increment_voice_usage', {
      biz_id: business.id,
      period_date: period,
      seconds_to_add: estimatedSeconds,
    });

    return NextResponse.json({ audio_url: signed.signedUrl });
  } catch (err) {
    const { error, status } = errorResponse(err);
    return NextResponse.json({ error }, { status });
  }
}
