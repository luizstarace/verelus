import { getZenviaClient } from './client';

/**
 * Phone number provisioning under a Zenvia sub-account. Called after KYC
 * approval to allocate a fresh WhatsApp Business number. See subaccounts.ts
 * for the partner-tier caveat.
 */

const NUMBERS_BASE = process.env.ZENVIA_NUMBERS_PATH || '/v2/channels/whatsapp/numbers';

export interface ProvisionPhoneInput {
  subaccount_id: string;
  area_code?: string;        // BR DDD preference (e.g., '11')
  country_code?: string;     // default '55'
  display_name: string;
}

export interface ProvisionedPhone {
  ok: boolean;
  phone_number_id: string | null;
  e164: string | null;
  waba_id?: string | null;
  error?: string;
  raw?: unknown;
}

export async function provisionPhoneNumber(input: ProvisionPhoneInput): Promise<ProvisionedPhone> {
  const client = getZenviaClient();
  const res = await client.request<{
    id?: string;
    phone?: string;
    e164?: string;
    waba_id?: string;
  }>(
    'POST',
    NUMBERS_BASE,
    {
      subaccount_id: input.subaccount_id,
      country_code: input.country_code || '55',
      area_code: input.area_code,
      display_name: input.display_name,
    }
  );
  if (!res.ok || !res.data) {
    return { ok: false, phone_number_id: null, e164: null, error: res.error, raw: res.data };
  }
  return {
    ok: Boolean(res.data.id),
    phone_number_id: res.data.id || null,
    e164: res.data.e164 || res.data.phone || null,
    waba_id: res.data.waba_id || null,
    raw: res.data,
  };
}

export async function releasePhoneNumber(phoneNumberId: string): Promise<{ ok: boolean; error?: string }> {
  const client = getZenviaClient();
  const res = await client.request('DELETE', `${NUMBERS_BASE}/${phoneNumberId}`);
  return { ok: res.ok, error: res.error };
}
