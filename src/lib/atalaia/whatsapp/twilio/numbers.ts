import { getTwilioClient } from './client';

/**
 * Phone number rental on Twilio.
 *
 * Renting a Brazilian number is a 2-step process:
 *   1. Search available numbers in Twilio's inventory (filtered by country/area).
 *   2. Buy one of the available numbers (POST creates the rented IncomingPhoneNumber).
 *
 * BR numbers are not always available in Twilio's marketplace at every DDD.
 * If a specific area code returns empty, fall back to any available BR mobile.
 */

export interface RentedNumber {
  ok: boolean;
  phone_sid: string | null;     // Twilio's PNxxxxxx SID for the rented number
  phone_number: string | null;  // E.164 format, e.g. "+5511999999999"
  error?: string;
  raw?: unknown;
}

interface AvailableNumber {
  phone_number?: string;
  friendly_name?: string;
}

interface AvailableSearch {
  available_phone_numbers?: AvailableNumber[];
}

interface IncomingPhoneNumberCreate {
  sid?: string;
  phone_number?: string;
}

/**
 * Search and rent a Brazilian mobile WhatsApp-eligible number.
 *
 * @param areaCode 2-digit BR DDD, e.g. "11" (São Paulo). Falls back to any BR mobile if specific DDD has no inventory.
 */
export async function rentBrazilianNumber(areaCode?: string): Promise<RentedNumber> {
  const client = getTwilioClient();
  if (!client.configured) {
    return { ok: false, phone_sid: null, phone_number: null, error: 'twilio not configured' };
  }

  // Step 1: search available BR mobile numbers.
  // Twilio API: GET /2010-04-01/Accounts/{Sid}/AvailablePhoneNumbers/{CountryCode}/Mobile.json
  const searchPath = `/2010-04-01/Accounts/${client.sid}/AvailablePhoneNumbers/BR/Mobile.json`;
  const queryParts: string[] = ['SmsEnabled=true'];
  if (areaCode) queryParts.push(`AreaCode=${encodeURIComponent(areaCode)}`);
  const searchPathWithQuery = `${searchPath}?${queryParts.join('&')}`;

  const search = await client.request<AvailableSearch>('GET', 'api', searchPathWithQuery);
  let candidate = search.data?.available_phone_numbers?.[0]?.phone_number;

  // Fallback: if nothing in the requested DDD, search again without AreaCode filter.
  if (!candidate && areaCode) {
    const fallback = await client.request<AvailableSearch>(
      'GET',
      'api',
      `${searchPath}?SmsEnabled=true`
    );
    candidate = fallback.data?.available_phone_numbers?.[0]?.phone_number;
  }

  if (!candidate) {
    return {
      ok: false,
      phone_sid: null,
      phone_number: null,
      error: 'no Brazilian numbers available in Twilio inventory',
    };
  }

  // Step 2: buy the candidate number.
  // Twilio API: POST /2010-04-01/Accounts/{Sid}/IncomingPhoneNumbers.json
  const buyPath = `/2010-04-01/Accounts/${client.sid}/IncomingPhoneNumbers.json`;
  const buy = await client.request<IncomingPhoneNumberCreate>('POST', 'api', buyPath, {
    PhoneNumber: candidate,
    FriendlyName: `atalaia_${candidate}`,
  });

  if (!buy.ok || !buy.data?.sid) {
    return {
      ok: false,
      phone_sid: null,
      phone_number: candidate,
      error: buy.error || 'twilio number purchase failed',
      raw: buy.data,
    };
  }

  return {
    ok: true,
    phone_sid: buy.data.sid,
    phone_number: buy.data.phone_number || candidate,
    raw: buy.data,
  };
}

/**
 * Release a previously rented number. Idempotent — 404 is treated as success.
 */
export async function releaseNumber(phoneSid: string): Promise<{ ok: boolean; error?: string }> {
  const client = getTwilioClient();
  if (!client.configured) {
    return { ok: false, error: 'twilio not configured' };
  }
  const path = `/2010-04-01/Accounts/${client.sid}/IncomingPhoneNumbers/${phoneSid}.json`;
  const res = await client.request('DELETE', 'api', path);
  if (res.ok || res.status === 404) {
    return { ok: true };
  }
  return { ok: false, error: res.error };
}

/**
 * Extract a 2-digit DDD from a Brazilian phone number, falling back to '11'
 * (São Paulo) when the input is missing or unparseable.
 */
export function extractAreaCode(phone: string | null | undefined): string {
  if (!phone) return '11';
  const digits = phone.replace(/\D/g, '');
  // BR mobile in E.164: +5511999999999 -> "5511999999999". DDD is positions 2-4 after country code.
  if (digits.startsWith('55') && digits.length >= 12) {
    return digits.slice(2, 4);
  }
  // Without country code, DDD is the first 2 digits (e.g. "11999999999").
  if (digits.length >= 10) {
    return digits.slice(0, 2);
  }
  return '11';
}
