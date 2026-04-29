export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type Check = { ok: boolean; latency_ms: number; error?: string };

const REQUIRED_ENV = [
  'ANTHROPIC_API_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'RESEND_API_KEY',
  'CRON_SECRET',
  'FOUNDER_EMAIL',
  'NEXT_PUBLIC_APP_URL',
  'STRIPE_PRICE_ATALAIA_STARTER',
  'STRIPE_PRICE_ATALAIA_PRO',
  'STRIPE_PRICE_ATALAIA_BUSINESS',
  'ELEVENLABS_API_KEY',
  'EVOLUTION_API_URL',
  'EVOLUTION_API_KEY',
] as const;

export async function GET() {
  const checks: Record<string, Check> = {};

  const sbStart = Date.now();
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    await supabase.from('atalaia_businesses').select('id').limit(1);
    checks.supabase = { ok: true, latency_ms: Date.now() - sbStart };
  } catch (err) {
    checks.supabase = { ok: false, latency_ms: Date.now() - sbStart, error: String(err) };
  }

  const aiStart = Date.now();
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 5,
        messages: [{ role: 'user', content: 'ping' }],
      }),
    });
    checks.claude = { ok: res.ok, latency_ms: Date.now() - aiStart };
  } catch (err) {
    checks.claude = { ok: false, latency_ms: Date.now() - aiStart, error: String(err) };
  }

  // No live ElevenLabs probe — production keys are scoped to TTS-only (POST
  // /v1/text-to-speech/*), so /v1/user and /v1/voices return 401 even when the
  // key works. A TTS probe would burn credits on every health check.
  // env.ELEVENLABS_API_KEY already reports presence.

  const evStart = Date.now();
  try {
    const url = process.env.EVOLUTION_API_URL;
    const key = process.env.EVOLUTION_API_KEY;
    if (!url || !key) throw new Error('EVOLUTION_API_URL/KEY not set');
    const res = await fetch(`${url}/instance/fetchInstances`, {
      headers: { apikey: key },
    });
    checks.evolution = { ok: res.ok, latency_ms: Date.now() - evStart };
  } catch (err) {
    checks.evolution = { ok: false, latency_ms: Date.now() - evStart, error: String(err) };
  }

  // Env presence — only reports whether keys are set, never their values.
  const env: Record<string, boolean> = {};
  for (const k of REQUIRED_ENV) env[k] = Boolean(process.env[k]);
  const envMissing = REQUIRED_ENV.filter((k) => !env[k]);

  const allChecksOk = Object.values(checks).every((c) => c.ok);
  const allEnvSet = envMissing.length === 0;
  const healthy = allChecksOk && allEnvSet;

  return NextResponse.json(
    {
      status: healthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
      env,
      env_missing: envMissing,
    },
    { status: healthy ? 200 : 503 }
  );
}
