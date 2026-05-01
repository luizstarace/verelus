import type { SupabaseClient } from '@supabase/supabase-js';
import { logAtalaia } from '@/lib/atalaia/logger';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;

/**
 * Send a WhatsApp text via Evolution API. Extracted from the inbound webhook
 * so it can be reused by the cross-provider send dispatcher and the Zenvia
 * migration flow.
 *
 * `toJid` is the WhatsApp JID (e.g. `5511999999999@s.whatsapp.net`). When the
 * caller has only an E.164 number, append `@s.whatsapp.net` first.
 */
export async function sendText(
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
  const BACKOFFS_MS = [150, 500];
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

/**
 * Convert a bare E.164 phone (or already-JID string) to WhatsApp JID format.
 * No-ops if already suffixed.
 */
export function toJid(phoneOrJid: string): string {
  if (phoneOrJid.includes('@')) return phoneOrJid;
  return `${phoneOrJid.replace(/\D/g, '')}@s.whatsapp.net`;
}
