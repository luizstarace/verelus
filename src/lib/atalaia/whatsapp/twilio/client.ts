/**
 * Thin Twilio REST client.
 *
 * Auth: HTTP Basic with `Account SID : Auth Token`. Both come from env vars
 * configured by the founder (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN).
 *
 * Twilio's REST surface is split across two host bases:
 *   - https://api.twilio.com         — phone numbers, accounts, classic resources
 *   - https://messaging.twilio.com   — messaging service, senders, channel registration
 *
 * Pass `host: 'messaging'` for endpoints under messaging.twilio.com. The
 * default `'api'` covers most number-rental operations.
 */

type TwilioHost = 'api' | 'messaging';

interface RequestResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
}

export class TwilioClient {
  private readonly accountSid: string;
  private readonly authToken: string;
  private readonly authHeader: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.authHeader =
      this.accountSid && this.authToken
        ? `Basic ${btoa(`${this.accountSid}:${this.authToken}`)}`
        : '';
  }

  get configured(): boolean {
    return Boolean(this.accountSid && this.authToken);
  }

  get sid(): string {
    return this.accountSid;
  }

  /**
   * Twilio REST returns JSON for `application/json` requests OR
   * `application/x-www-form-urlencoded` for some classic endpoints. Always
   * accept JSON in responses.
   */
  async request<T = unknown>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    host: TwilioHost,
    path: string,
    bodyParams?: Record<string, string>
  ): Promise<RequestResult<T>> {
    if (!this.configured) {
      return { ok: false, status: 0, data: null, error: 'TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN missing' };
    }
    const baseUrl = host === 'messaging' ? 'https://messaging.twilio.com' : 'https://api.twilio.com';
    const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

    const headers: Record<string, string> = {
      'Authorization': this.authHeader,
      'Accept': 'application/json',
    };

    let body: string | undefined;
    if (bodyParams && method !== 'GET' && method !== 'DELETE') {
      // Twilio classic + Messaging APIs both accept x-www-form-urlencoded.
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      body = new URLSearchParams(bodyParams).toString();
    }

    try {
      const res = await fetch(url, { method, headers, body });
      const text = await res.text();
      let data: unknown = null;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
      }
      if (!res.ok) {
        const errMsg =
          data && typeof data === 'object' && 'message' in (data as Record<string, unknown>)
            ? String((data as Record<string, unknown>).message)
            : `Twilio ${method} ${path} -> ${res.status}`;
        return { ok: false, status: res.status, data: data as T, error: errMsg };
      }
      return { ok: true, status: res.status, data: data as T };
    } catch (err) {
      return {
        ok: false,
        status: 0,
        data: null,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

let _client: TwilioClient | null = null;
export function getTwilioClient(): TwilioClient {
  if (!_client) _client = new TwilioClient();
  return _client;
}
