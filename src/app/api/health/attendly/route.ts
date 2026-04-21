export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const checks: Record<string, { ok: boolean; latency_ms: number; error?: string }> = {};

  const sbStart = Date.now();
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    await supabase.from('attendly_businesses').select('id').limit(1);
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

  const allOk = Object.values(checks).every(c => c.ok);

  return NextResponse.json({
    status: allOk ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
  }, { status: allOk ? 200 : 503 });
}
