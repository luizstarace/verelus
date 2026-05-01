export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, getRateLimitHeaders } from '@/lib/atalaia/rate-limit';
import { isInsideBusinessHours } from '@/lib/atalaia/hours';
import { phoneVariants } from '@/lib/atalaia/phone';
import { logAtalaia } from '@/lib/atalaia/logger';
import { parseInbound, sendText as zenviaSendText } from '@/lib/atalaia/whatsapp/zenvia/messaging';

/**
 * Verify HMAC-SHA256 signature using ZENVIA_WEBHOOK_SECRET.
 *
 * Zenvia's exact header name and signature format may vary between API
 * versions (`X-Zenvia-Signature`, `X-Hub-Signature-256`, etc). We try the
 * common candidates and accept either hex or `sha256=<hex>` prefixed forms.
 * Confirm against the dashboard config when wiring webhooks for the first time.
 */
async function verifySignature(rawBody: string, headers: Headers, secret: string): Promise<boolean> {
  const candidate =
    headers.get('x-zenvia-signature') ||
    headers.get('x-hub-signature-256') ||
    headers.get('x-signature') ||
    '';
  if (!candidate) return false;
  const provided = candidate.replace(/^sha256=/i, '').trim().toLowerCase();
  if (!provided) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
  const computed = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  if (computed.length !== provided.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) {
    diff |= computed.charCodeAt(i) ^ provided.charCodeAt(i);
  }
  return diff === 0;
}

export async function POST(request: Request) {
  const secret = process.env.ZENVIA_WEBHOOK_SECRET || '';
  if (!secret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 503 });
  }

  const rawBody = await request.text();
  const valid = await verifySignature(rawBody, request.headers, secret);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const inbound = parseInbound(body);
  if (!inbound) {
    // Non-message events (delivery receipts, etc) — accept silently.
    return NextResponse.json({ ok: true, ignored: 'non_message_or_unparseable' });
  }

  // Rate-limit by destination phone (the business number we own), so a single
  // misbehaving sub-account can't saturate Function limits.
  const rl = rateLimit(`zw:${inbound.to}`, 120, 60000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: getRateLimitHeaders(rl.remaining, 120) }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Idempotency: dedupe by Zenvia message id. Zenvia retries on 5xx; without
  // this we'd reply twice to the same inbound message.
  const { error: dupErr } = await supabase
    .from('atalaia_zenvia_events_processed')
    .insert({ event_id: inbound.id });
  if (dupErr) {
    if ((dupErr as { code?: string }).code === '23505') {
      return NextResponse.json({ ok: true, deduped: true });
    }
    // Other errors: log and continue (fail-open to avoid dropping msgs).
    await logAtalaia(supabase, {
      endpoint: '/api/atalaia/whatsapp/zenvia/webhook',
      channel: 'whatsapp',
      status_code: 0,
      error: dupErr,
    });
  }

  // Resolve business from the destination phone (our number).
  // Match against bsp_phone_number_id first (Zenvia's stable identifier);
  // fall back to whatsapp_number (when payload sends the human-readable number).
  const toRaw = inbound.to.replace(/^\+/, '');

  const byId = await supabase
    .from('atalaia_businesses')
    .select('id, status, hours, whatsapp_provider, whatsapp_number, bsp_phone_number_id, whatsapp_whitelist_enabled, whatsapp_whitelist, whatsapp_hours_only')
    .eq('bsp_phone_number_id', inbound.to)
    .maybeSingle();

  const byNumber = byId.data
    ? null
    : await supabase
        .from('atalaia_businesses')
        .select('id, status, hours, whatsapp_provider, whatsapp_number, bsp_phone_number_id, whatsapp_whitelist_enabled, whatsapp_whitelist, whatsapp_hours_only')
        .eq('whatsapp_number', toRaw)
        .maybeSingle();

  const business = byId.data ?? byNumber?.data ?? null;

  if (!business) {
    return NextResponse.json({ ok: true, ignored: 'unknown_destination' });
  }

  if (business.status !== 'active') {
    return NextResponse.json({ ok: true, ignored: 'business_not_active' });
  }

  // Whitelist + hours guards (mirror Evolution webhook).
  const customerPhone = inbound.from.replace(/^\+/, '');

  if (business.whatsapp_whitelist_enabled) {
    const whitelist: string[] = Array.isArray(business.whatsapp_whitelist)
      ? business.whatsapp_whitelist
      : [];
    const customerVariants = new Set(phoneVariants(customerPhone));
    const match = whitelist.some((stored) =>
      phoneVariants(String(stored)).some((v) => customerVariants.has(v))
    );
    if (!match) {
      return NextResponse.json({ ok: true, skipped: 'not_whitelisted' });
    }
  }

  if (business.whatsapp_hours_only && isInsideBusinessHours(business.hours)) {
    return NextResponse.json({ ok: true, skipped: 'inside_business_hours' });
  }

  const chatRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/atalaia/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      business_id: business.id,
      message: inbound.text,
      channel: 'whatsapp',
      customer_phone: customerPhone,
      customer_name: inbound.pushName || null,
    }),
  });

  if (!chatRes.ok || !chatRes.body) {
    return NextResponse.json({ ok: true });
  }

  const reader = chatRes.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    for (const line of chunk.split('\n')) {
      if (line.startsWith('data: ')) {
        try {
          const parsed = JSON.parse(line.slice(6));
          if (parsed.text) fullText += parsed.text;
        } catch {}
      }
    }
  }

  const cleanText = fullText.replace(/\[TRANSFER\]/g, '').trim();
  if (cleanText) {
    // `inbound.to` is the from-side of our reply (the business's Zenvia number).
    await zenviaSendText(supabase, business.id, inbound.to, customerPhone, cleanText);
  }

  return NextResponse.json({ ok: true });
}
