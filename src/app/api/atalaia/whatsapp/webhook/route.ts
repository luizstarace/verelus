export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { rateLimit, getRateLimitHeaders } from '@/lib/atalaia/rate-limit';
import { isInsideBusinessHours } from '@/lib/atalaia/hours';
import { phoneVariants, timingSafeEqual } from '@/lib/atalaia/phone';
import { logAtalaia } from '@/lib/atalaia/logger';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;

async function sendWhatsAppMessage(
  supabase: SupabaseClient,
  businessId: string,
  instanceName: string,
  toJid: string,
  text: string
): Promise<{ ok: boolean; status: number; error?: unknown }> {
  if (!text.trim()) return { ok: true, status: 0 };
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
    await logAtalaia(supabase, {
      business_id: businessId,
      endpoint: '/api/atalaia/whatsapp/send',
      channel: 'whatsapp',
      status_code: 0,
      error: 'EVOLUTION_API_URL or EVOLUTION_API_KEY missing',
    });
    return { ok: false, status: 0, error: 'env_missing' };
  }

  // Retry on transient 5xx / network errors. Cap total wait < 2s so we stay
  // within CF Workers wall-clock budget.
  const BACKOFFS_MS = [150, 500]; // 3 tries total (initial + 2 retries)
  let lastStatus = 0;
  let lastErr: unknown = null;

  for (let attempt = 0; attempt <= BACKOFFS_MS.length; attempt++) {
    try {
      const res = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
        method: 'POST',
        headers: {
          'apikey': EVOLUTION_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ number: toJid, text }),
      });
      lastStatus = res.status;
      if (res.ok) return { ok: true, status: res.status };
      // 4xx is not retryable (bad input, auth) — bail out
      if (res.status >= 400 && res.status < 500) {
        lastErr = `Evolution returned ${res.status}`;
        break;
      }
      lastErr = `Evolution returned ${res.status}`;
    } catch (err) {
      lastErr = err;
    }
    if (attempt < BACKOFFS_MS.length) {
      await new Promise((r) => setTimeout(r, BACKOFFS_MS[attempt]));
    }
  }

  await logAtalaia(supabase, {
    business_id: businessId,
    endpoint: '/api/atalaia/whatsapp/send',
    channel: 'whatsapp',
    status_code: lastStatus || 502,
    error: lastErr,
  });
  return { ok: false, status: lastStatus, error: lastErr };
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

    if (!instance.startsWith('atalaia_')) {
      return NextResponse.json({ ok: true });
    }
    const businessId = instance.replace('atalaia_', '');

    // Connection-state events: persist + alert owner when an established
    // connection drops unexpectedly (typical timelock/ban signature).
    if (event === 'connection.update' || event === 'CONNECTION_UPDATE') {
      const newState: string = msgData?.state || body.data?.state || 'unknown';
      const { data: bizBefore } = await supabase
        .from('atalaia_businesses')
        .select('id, name, user_id, whatsapp_number, whatsapp_last_state')
        .eq('id', businessId)
        .single();

      if (!bizBefore) {
        return NextResponse.json({ ok: true, ignored: 'unknown_business' });
      }

      // Only update + alert if state actually changed (Evolution may resend).
      if (bizBefore.whatsapp_last_state === newState) {
        return NextResponse.json({ ok: true, no_change: true });
      }

      await supabase
        .from('atalaia_businesses')
        .update({
          whatsapp_last_state: newState,
          whatsapp_state_changed_at: new Date().toISOString(),
        })
        .eq('id', businessId);

      // Drop alert: number was previously connected (whatsapp_number is set
      // and last state was 'open') and now closed/disconnected. Don't fire on
      // initial setup transitions (qr → connecting → open).
      const droppedFromOpen =
        bizBefore.whatsapp_number &&
        bizBefore.whatsapp_last_state === 'open' &&
        (newState === 'close' || newState === 'closed');

      if (droppedFromOpen) {
        try {
          const { notifyOwnerEmail, buildWhatsAppDisconnectedEmail } = await import('@/lib/atalaia/notifications');
          const { data: ownerUser } = await supabase
            .from('users')
            .select('email')
            .eq('id', bizBefore.user_id)
            .maybeSingle();
          if (ownerUser?.email) {
            const supportUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://atalaia.verelus.com'}/dashboard/atalaia/support?category=whatsapp_disconnect&prefill=1`;
            const emailData = buildWhatsAppDisconnectedEmail(bizBefore.name, supportUrl);
            emailData.to = ownerUser.email;
            notifyOwnerEmail(emailData).catch(() => {});
          }
        } catch (err) {
          await logAtalaia(supabase, {
            business_id: businessId,
            endpoint: '/api/atalaia/whatsapp/webhook',
            channel: 'whatsapp',
            status_code: 0,
            error: `disconnect alert email failed: ${err instanceof Error ? err.message : String(err)}`,
          });
        }
      }

      return NextResponse.json({ ok: true, state: newState });
    }

    // Ignore other non-message events
    if (event && event !== 'messages.upsert' && event !== 'MESSAGES_UPSERT') {
      return NextResponse.json({ ok: true });
    }

    // Ignore our own outbound messages
    if (msgData?.key?.fromMe) {
      return NextResponse.json({ ok: true });
    }

    // Idempotency: dedupe by WhatsApp message id. Evolution retries on failure;
    // without this we'd reply twice to the same inbound message.
    const eventId: string = msgData?.key?.id || '';
    if (eventId) {
      const { error: dupErr } = await supabase
        .from('atalaia_evolution_events_processed')
        .insert({ event_id: eventId });
      if (dupErr) {
        // 23505 = unique_violation => already processed, stop silently
        if ((dupErr as { code?: string }).code === '23505') {
          return NextResponse.json({ ok: true, deduped: true });
        }
        // Other errors: log and continue processing (fail-open to avoid dropping msgs)
        await logAtalaia(supabase, {
          business_id: businessId,
          endpoint: '/api/atalaia/whatsapp/webhook',
          channel: 'whatsapp',
          status_code: 0,
          error: dupErr,
        });
      }
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
      .from('atalaia_businesses')
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

    const chatRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/atalaia/chat`, {
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
      await sendWhatsAppMessage(supabase, businessId, instance, remoteJid, cleanText);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    await logAtalaia(supabase, {
      endpoint: '/api/atalaia/whatsapp/webhook',
      channel: 'whatsapp',
      status_code: 500,
      error: err,
    });
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 });
  }
}
