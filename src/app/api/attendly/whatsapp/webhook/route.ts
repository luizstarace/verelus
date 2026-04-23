export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, getRateLimitHeaders } from '@/lib/attendly/rate-limit';
import { isInsideBusinessHours } from '@/lib/attendly/hours';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;

// Generate all plausible formats of a BR phone number for whitelist match.
// WhatsApp remoteJid typically comes as "55DDDNNNNNNNN" (13 digits for mobile);
// user may have typed "DDDNNNNNNNN" (11) or even dropped the 9th digit (10).
function phoneVariants(digits: string): string[] {
  const d = digits.replace(/\D/g, '');
  const variants = new Set<string>([d]);
  if (d.startsWith('55') && d.length >= 12) {
    const withoutCountry = d.slice(2);
    variants.add(withoutCountry);
    // Drop leading 9 from mobile (BR 9th digit was mandated 2012+, old contacts may lack)
    if (withoutCountry.length === 11 && withoutCountry[2] === '9') {
      variants.add(withoutCountry.slice(0, 2) + withoutCountry.slice(3));
    }
  }
  if (d.length === 11 && d[2] === '9') {
    variants.add(d.slice(0, 2) + d.slice(3));
    variants.add('55' + d);
  }
  if (d.length === 10) {
    variants.add('55' + d);
    variants.add(d.slice(0, 2) + '9' + d.slice(2));
    variants.add('55' + d.slice(0, 2) + '9' + d.slice(2));
  }
  return Array.from(variants);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function sendWhatsAppMessage(instanceName: string, toJid: string, text: string) {
  if (!text.trim()) return;
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) return;
  try {
    await fetch(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'apikey': EVOLUTION_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        number: toJid,
        text,
      }),
    });
  } catch {}
}

export async function POST(request: Request) {
  // Validate API key FIRST (before rate-limit) so unauthenticated spam
  // cannot consume rate-limit slots intended for the legitimate Evolution instance.
  const apiKey = request.headers.get('apikey') || '';
  const expectedKey = process.env.EVOLUTION_API_KEY || '';
  if (!expectedKey || !timingSafeEqual(apiKey, expectedKey)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate-limit by instance name (not IP), so one runaway instance can't saturate
  // the Function limits for everyone else. Also, Evolution calls from a stable IP
  // so IP-based rate limit is low signal.
  let instanceForLimit = 'unknown';
  let body: any;
  try {
    body = await request.json();
    if (typeof body?.instance === 'string') instanceForLimit = body.instance;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const rl = rateLimit(`wh:${instanceForLimit}`, 120, 60000);
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

  try {
    const event = body.event || '';
    const instance: string = body.instance || '';
    const msgData = body.data;

    if (!instance.startsWith('attendly_')) {
      return NextResponse.json({ ok: true });
    }
    const businessId = instance.replace('attendly_', '');

    // Ignore non-message events (CONNECTION_UPDATE etc.)
    if (event && event !== 'messages.upsert' && event !== 'MESSAGES_UPSERT') {
      return NextResponse.json({ ok: true });
    }

    // Ignore our own outbound messages
    if (msgData?.key?.fromMe) {
      return NextResponse.json({ ok: true });
    }

    const messageText: string =
      msgData?.message?.conversation ||
      msgData?.message?.extendedTextMessage?.text ||
      '';
    if (!messageText) {
      return NextResponse.json({ ok: true });
    }

    const remoteJid: string = msgData?.key?.remoteJid || '';
    const customerPhone = remoteJid.replace(/@s\.whatsapp\.net$/, '').replace(/@c\.us$/, '');
    if (!customerPhone) {
      return NextResponse.json({ ok: true });
    }

    const { data: business } = await supabase
      .from('attendly_businesses')
      .select('id, status, hours, whatsapp_whitelist_enabled, whatsapp_whitelist, whatsapp_hours_only')
      .eq('id', businessId)
      .single();

    if (!business || business.status !== 'active') {
      return NextResponse.json({ ok: true });
    }

    if (business.whatsapp_whitelist_enabled) {
      const whitelist: string[] = Array.isArray(business.whatsapp_whitelist) ? business.whatsapp_whitelist : [];
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

    const chatRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/attendly/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_id: businessId,
        message: messageText,
        channel: 'whatsapp',
        customer_phone: customerPhone,
        customer_name: msgData?.pushName || null,
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

    // Strip the [TRANSFER] tag — customer shouldn't see it
    const cleanText = fullText.replace(/\[TRANSFER\]/g, '').trim();
    if (cleanText) {
      await sendWhatsAppMessage(instance, remoteJid, cleanText);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 });
  }
}
