export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logAtalaia } from '@/lib/atalaia/logger';
import { rateLimit } from '@/lib/atalaia/rate-limit';

// Accepts minimal client-side error reports from error boundaries.
// Intentionally tolerant of unauthenticated calls (the boundary fires on
// broken auth cookies too), but rate-limited by IP to prevent flooding.

export async function POST(request: Request) {
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rl = rateLimit(`client-error:${clientIp}`, 20, 60000);
  if (!rl.allowed) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  let body: { pathname?: unknown; message?: unknown; digest?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const pathname = typeof body.pathname === 'string' ? body.pathname.slice(0, 200) : 'unknown';
  const message = typeof body.message === 'string' ? body.message.slice(0, 400) : 'client error';
  const digest = typeof body.digest === 'string' ? body.digest.slice(0, 64) : null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await logAtalaia(supabase, {
    endpoint: `client:${pathname}`,
    status_code: 500,
    error: digest ? `${message} [digest=${digest}]` : message,
  });

  return NextResponse.json({ ok: true });
}
