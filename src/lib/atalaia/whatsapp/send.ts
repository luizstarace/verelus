import type { SupabaseClient } from '@supabase/supabase-js';
import type { BusinessProviderContext } from './provider';
import { sendText as evolutionSendText, toJid } from './evolution/messaging';
import { sendText as zenviaSendText } from './zenvia/messaging';

/**
 * Send an outbound WhatsApp text using whichever provider is canonical for the
 * business. Caller passes a bare phone (E.164 preferred); we normalize to JID
 * for Evolution and pass through for Zenvia.
 */
export async function sendOutboundMessage(
  supabase: SupabaseClient,
  ctx: BusinessProviderContext,
  toPhone: string,
  text: string
): Promise<{ ok: boolean; status: number; error?: unknown }> {
  if (ctx.provider === 'zenvia') {
    if (!ctx.zenvia_phone) {
      return { ok: false, status: 0, error: 'zenvia: missing from phone (whatsapp_number)' };
    }
    const customer = toPhone.replace(/@s\.whatsapp\.net$/, '').replace(/@c\.us$/, '');
    return zenviaSendText(supabase, ctx.business_id, ctx.zenvia_phone, customer, text);
  }
  // Evolution path: legacy default, BYO, or temporary bridge.
  return evolutionSendText(supabase, ctx.business_id, ctx.evolution_instance, toJid(toPhone), text);
}
