/**
 * Thin Zenvia API client.
 *
 * Auth: header `X-API-TOKEN: <token>`. Token is a master Verelus credential —
 * NOT per-business. Sub-account scoping happens via path/body params on each call.
 *
 * Default base URL: https://api.zenvia.com (override via ZENVIA_API_URL).
 *
 * NOTE: sub-account/KYC endpoints (`/v2/accounts/*`, `/v2/integrations/*`) are
 * partner-tier features. Confirm exact paths against the contract Verelus has
 * with Zenvia before depending on them in production. Default paths used here
 * mirror Zenvia's public docs as of 2026-Q2.
 */

export class ZenviaClient {
  private readonly baseUrl: string;
  private readonly token: string;

  constructor() {
    this.baseUrl = (process.env.ZENVIA_API_URL || 'https://api.zenvia.com').replace(/\/+$/, '');
    this.token = process.env.ZENVIA_API_KEY || '';
    if (!this.token) {
      // Don't throw at construction time — let individual calls fail with clear errors
      // so health-check and tooling can probe configuration without crashing imports.
    }
  }

  get configured(): boolean {
    return Boolean(this.token);
  }

  async request<T = unknown>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    path: string,
    body?: unknown,
    extraHeaders?: Record<string, string>
  ): Promise<{ ok: boolean; status: number; data: T | null; error?: string }> {
    if (!this.token) {
      return { ok: false, status: 0, data: null, error: 'ZENVIA_API_KEY missing' };
    }
    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    try {
      const res = await fetch(url, {
        method,
        headers: {
          'X-API-TOKEN': this.token,
          'Content-Type': 'application/json',
          ...extraHeaders,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
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
        return {
          ok: false,
          status: res.status,
          data: data as T,
          error: typeof data === 'string' ? data : `Zenvia ${method} ${path} -> ${res.status}`,
        };
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

let _client: ZenviaClient | null = null;
export function getZenviaClient(): ZenviaClient {
  if (!_client) _client = new ZenviaClient();
  return _client;
}
