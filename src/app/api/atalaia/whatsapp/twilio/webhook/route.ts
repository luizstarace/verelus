export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, getRateLimitHeaders } from '@/lib/atalaia/rate-limit';
import { isInsideBusinessHours } from '@/lib/atalaia/hours';
import { phoneVariants } from '@/lib/atalaia/phone';
import { logAtalaia } from '@/lib/atalaia/logger';
import { parseInbound, sendText as twilioSendText } from '@/lib/atalaia/whatsapp/twilio/messaging';

/**
 * Validate Twilio's X-Twilio-Signature header against the webhook payload.
 *
 * Twilio computes: HMAC-SHA1(authToken, fullUrl + sortedKeyValuePairs)
 * encoded as base64. `sortedKeyValuePairs` = keys sorted alphabetically,
 * concatenated as "k1v1k2v2..." with no separators.
 *
 * Reference: https://www.twilio.com/docs/usage/webhooks/webhooks-security
 */
async function verifyTwilioSignature(
  fullUrl: string,
  formParams: Record<string, string>,
  authToken: string,
  providedSignature: string
): Promise<boolean> {
  if (!providedSignature) return false;

  const sortedKeys = Object.keys(formParams).sort();
  const concatenated = sortedKeys.reduce((acc, k) => acc + k + formParams[k], fullUrl);

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(authToken),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(concatenated));
  const sigBytes = new Uint8Array(signatureBuffer);
  let binary = '';
  for (let i = 0; i < sigBytes.length; i++) binary += String.fromCharCode(sigBytes[i]);
  const computedBase64 = btoa(binary);

  if (computedBase64.length !== providedSignature.length) return false;
  let diff = 0;
  for (let i = 0; i < computedBase64.length; i++) {
    diff |= computedBase64.charCodeAt(i) ^ providedSignature.charCodeAt(i);
  }
  return diff === 0;
}

export async function POST(request: Request) {
  const authToken = process.env.TWILIO_AUTH_TOKEN || '';
  if (!authToken) {
    return NextResponse.json({ error: 'Twilio auth not configured' }, { status: 503 });
  }

  // Twilio sends form-encoded bodies. Read raw text first for signature
  // computation (we re-parse to a flat object for both validation and parsing).
  const rawBody = await request.text();
  const formParams: Record<string, string> = {};
  const params = new URLSearchParams(rawBody);
  params.forEach((value, key) => {
    formParams[key] = value;
  });

  const fullUrl = request.url;
  const signature = request.headers.get('x-twilio-signature') || '';
  const valid = await verifyTwilioSignature(fullUrl, formParams, authToken, signature);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const inbound = parseInbound(formParams);
  if (!inbound) {
    // Status callbacks, delivery receipts, etc — accept silently.
    return NextResponse.json({ ok: true, ignored: 'non_message_or_unparseable' });
  }

  // Rate-limit by destination phone (our number).
  const rl = rateLimit(`tw:${inbound.to}`, 120, 60000);
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

  // Idempotency: dedupe by Twilio MessageSid.
  const { error: dupErr } = await supabase
    .from('atalaia_twilio_events_processed')
    .insert({ event_id: inbound.id });
  if (dupErr) {
    if ((dupErr as { code?: string }).code === '23505') {
      return NextResponse.json({ ok: true, deduped: true });
    }
    await logAtalaia(supabase, {
      endpoint: '/api/atalaia/whatsapp/twilio/webhook',
      channel: 'whatsapp',
      status_code: 0,
      error: dupErr,
    });
  }

  // Resolve business by destination number.
  const { data: business } = await supabase
    .from('atalaia_businesses')
    .select('id, status, hours, whatsapp_provider, whatsapp_number, whatsapp_whitelist_enabled, whatsapp_whitelist, whatsapp_hours_only')
    .eq('whatsapp_number', inbound.to)
    .maybeSingle();

  if (!business) {
    return NextResponse.json({ ok: true, ignored: 'unknown_destination' });
  }

  if (business.status !== 'active') {
    return NextResponse.json({ ok: true, ignored: 'business_not_active' });
  }

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
      customer_name: inbound.pushName,
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
    await twilioSendText(supabase, business.id, inbound.to, customerPhone, cleanText);
  }

  return NextResponse.json({ ok: true });
}
