import type { SupabaseClient } from '@supabase/supabase-js';
import { logAtalaia } from '@/lib/atalaia/logger';
import { getTwilioClient } from './client';

/**
 * Twilio sends inbound WhatsApp messages as application/x-www-form-urlencoded
 * to the configured webhook URL. The fields we care about (snake_case is
 * Twilio's convention here):
 *
 *   MessageSid    - unique id for the inbound message (used for dedupe)
 *   From          - sender JID, e.g. "whatsapp:+5511999999999"
 *   To            - recipient JID (our number), e.g. "whatsapp:+5511888888888"
 *   Body          - text content
 *   ProfileName   - sender's WhatsApp display name (optional)
 */

interface TwilioInboundMessage {
  id: string;
  from: string;        // E.164 without "whatsapp:" prefix
  to: string;          // E.164 without "whatsapp:" prefix
  text: string;
  pushName: string | null;
  raw: Record<string, string>;
}

/**
 * Send a WhatsApp text via Twilio's classic Messages API.
 *
 * Endpoint: POST /2010-04-01/Accounts/{Sid}/Messages.json
 * Auth: Basic (handled by client).
 *
 * `fromE164` and `toE164` are bare E.164 numbers ("+5511999999999").
 * Twilio's WhatsApp channel needs them prefixed with "whatsapp:".
 */
export async function sendText(
  supabase: SupabaseClient,
  businessId: string,
  fromE164: string,
  toE164: string,
  text: string
): Promise<{ ok: boolean; status: number; error?: unknown }> {
  if (!text.trim()) return { ok: true, status: 0 };
  if (!fromE164 || !toE164) {
    await logAtalaia(supabase, {
      business_id: businessId,
      endpoint: '/api/atalaia/whatsapp/send',
      channel: 'whatsapp',
      status_code: 0,
      error: 'twilio: missing from/to phone',
    });
    return { ok: false, status: 0, error: 'missing_phone' };
  }

  const client = getTwilioClient();
  if (!client.configured) {
    await logAtalaia(supabase, {
      business_id: businessId,
      endpoint: '/api/atalaia/whatsapp/send',
      channel: 'whatsapp',
      status_code: 0,
      error: 'TWILIO_ACCOUNT_SID/AUTH_TOKEN missing',
    });
    return { ok: false, status: 0, error: 'env_missing' };
  }

  // Retry budget mirrors Evolution / Zenvia paths (3 tries, < 2s total).
  const BACKOFFS_MS = [150, 500];
  let lastStatus = 0;
  let lastErr: unknown = null;

  const path = `/2010-04-01/Accounts/${client.sid}/Messages.json`;

  for (let attempt = 0; attempt <= BACKOFFS_MS.length; attempt++) {
    const res = await client.request('POST', 'api', path, {
      From: ensureWhatsAppPrefix(fromE164),
      To: ensureWhatsAppPrefix(toE164),
      Body: text,
    });
    lastStatus = res.status;
    if (res.ok) return { ok: true, status: res.status };
    if (res.status >= 400 && res.status < 500) {
      lastErr = res.error || `Twilio returned ${res.status}`;
      break;
    }
    lastErr = res.error || `Twilio returned ${res.status}`;
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

/**
 * Parse a Twilio inbound webhook form-encoded body into our normalized shape.
 * Returns null when required fields are missing or it's not a text message.
 */
export function parseInbound(form: Record<string, string>): TwilioInboundMessage | null {
  const id = form.MessageSid || form.SmsMessageSid || '';
  const fromRaw = form.From || '';
  const toRaw = form.To || '';
  const text = form.Body || '';
  if (!id || !fromRaw || !toRaw || !text) return null;

  return {
    id,
    from: stripWhatsAppPrefix(fromRaw),
    to: stripWhatsAppPrefix(toRaw),
    text,
    pushName: form.ProfileName || null,
    raw: form,
  };
}

function ensureWhatsAppPrefix(phone: string): string {
  if (phone.startsWith('whatsapp:')) return phone;
  // Always include leading +.
  return `whatsapp:${phone.startsWith('+') ? phone : `+${phone.replace(/^\+?/, '')}`}`;
}

function stripWhatsAppPrefix(jid: string): string {
  return jid.replace(/^whatsapp:/, '').replace(/^\+/, '');
}
