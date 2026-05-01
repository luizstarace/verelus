import type { SupabaseClient } from '@supabase/supabase-js';
import { logAtalaia } from '@/lib/atalaia/logger';
import { getZenviaClient } from './client';

interface ZenviaInboundMessage {
  id: string;
  from: string;
  to: string;
  text: string;
  pushName?: string | null;
  raw: unknown;
}

/**
 * Send a WhatsApp text via Zenvia BSP.
 *
 * `from` is the E.164 phone number provisioned for this business (also stored
 * in `atalaia_businesses.whatsapp_number` after migration). `to` is the
 * customer's E.164 number. Zenvia infers the channel from the `from`.
 *
 * Endpoint: POST /v2/channels/whatsapp/messages
 * Body: { from, to, contents: [{ type: 'text', text }] }
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
      error: 'zenvia: missing from/to phone',
    });
    return { ok: false, status: 0, error: 'missing_phone' };
  }

  const client = getZenviaClient();
  if (!client.configured) {
    await logAtalaia(supabase, {
      business_id: businessId,
      endpoint: '/api/atalaia/whatsapp/send',
      channel: 'whatsapp',
      status_code: 0,
      error: 'ZENVIA_API_KEY missing',
    });
    return { ok: false, status: 0, error: 'env_missing' };
  }

  // Retry budget mirrors Evolution path (3 tries, < 2s total).
  const BACKOFFS_MS = [150, 500];
  let lastStatus = 0;
  let lastErr: unknown = null;

  for (let attempt = 0; attempt <= BACKOFFS_MS.length; attempt++) {
    const res = await client.request('POST', '/v2/channels/whatsapp/messages', {
      from: fromE164,
      to: toE164,
      contents: [{ type: 'text', text }],
    });
    lastStatus = res.status;
    if (res.ok) return { ok: true, status: res.status };
    if (res.status >= 400 && res.status < 500) {
      lastErr = res.error || `Zenvia returned ${res.status}`;
      break;
    }
    lastErr = res.error || `Zenvia returned ${res.status}`;
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
 * Parse a Zenvia inbound webhook payload into the shape the rest of the system
 * expects. Best-effort — Zenvia's exact payload may differ between API
 * versions; this normalizer handles the common `MESSAGE` event with text.
 */
export function parseInbound(body: unknown): ZenviaInboundMessage | null {
  if (!body || typeof body !== 'object') return null;
  const root = body as Record<string, unknown>;

  // Zenvia v2 webhook envelope (typical): { type, message: { id, from, to, contents: [...] } }
  // Some configurations flatten to { id, from, to, contents }. Handle both.
  const msg = (root.message as Record<string, unknown> | undefined) || root;

  const id = typeof msg.id === 'string' ? msg.id : (typeof root.id === 'string' ? root.id : '');
  const from = typeof msg.from === 'string' ? msg.from : '';
  const to = typeof msg.to === 'string' ? msg.to : '';
  if (!id || !from || !to) return null;

  const contents = Array.isArray(msg.contents) ? (msg.contents as Array<Record<string, unknown>>) : [];
  const textPart = contents.find((c) => c.type === 'text' && typeof c.text === 'string');
  const text = textPart ? String(textPart.text) : '';
  if (!text) return null;

  const visitor = msg.visitor as Record<string, unknown> | undefined;
  const pushName = visitor && typeof visitor.name === 'string' ? visitor.name : null;

  return { id, from, to, text, pushName, raw: body };
}
