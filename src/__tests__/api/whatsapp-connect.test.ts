import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/api-auth', () => ({
  requireUser: vi.fn(async () => ({
    userId: 'user-1',
    email: 'u@test',
    supabase: {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({
              data: { id: 'biz-123', name: 'Test Biz' },
              error: null,
            }),
          }),
        }),
      }),
    },
  })),
  errorResponse: (err: unknown) => ({
    error: err instanceof Error ? err.message : String(err),
    status: 500,
  }),
}));

describe('POST /api/atalaia/whatsapp/connect', () => {
  const envBefore = { ...process.env };

  beforeEach(() => {
    process.env.EVOLUTION_API_URL = 'https://wa.test.local';
    process.env.EVOLUTION_API_KEY = 'secret-key-123';
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.test.local';
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = { ...envBefore };
  });

  it('sets headers.apikey in the webhook config sent to instance/create', async () => {
    const calls: Array<{ url: string; body: unknown }> = [];
    global.fetch = vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url: String(url), body: init.body ? JSON.parse(String(init.body)) : null });
      return {
        ok: true,
        status: 200,
        json: async () => ({ qrcode: { base64: 'data:image/png;base64,AAA' } }),
        text: async () => '',
      } as unknown as Response;
    }) as unknown as typeof fetch;

    const { POST } = await import('@/app/api/atalaia/whatsapp/connect/route');
    const res = await POST();
    expect(res.status).toBe(200);

    const createCall = calls.find((c) => c.url.endsWith('/instance/create'));
    expect(createCall, 'instance/create should be called').toBeTruthy();
    const body = createCall!.body as {
      instanceName: string;
      webhook: { headers?: Record<string, string>; url: string };
    };
    expect(body.webhook.url).toBe('https://app.test.local/api/atalaia/whatsapp/webhook');
    expect(body.webhook.headers?.apikey).toBe('secret-key-123');
    expect(body.instanceName).toBe('atalaia_biz-123');
  });

  it('also calls /webhook/set to heal pre-existing instances', async () => {
    const calls: Array<{ url: string; body: unknown }> = [];
    global.fetch = vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url: String(url), body: init.body ? JSON.parse(String(init.body)) : null });
      return {
        ok: true,
        status: 200,
        json: async () => ({ qrcode: { base64: 'x' } }),
        text: async () => '',
      } as unknown as Response;
    }) as unknown as typeof fetch;

    const { POST } = await import('@/app/api/atalaia/whatsapp/connect/route');
    await POST();

    const setCall = calls.find((c) => c.url.includes('/webhook/set/atalaia_biz-123'));
    expect(setCall, '/webhook/set should be called').toBeTruthy();
    const body = setCall!.body as { headers?: Record<string, string>; enabled: boolean };
    expect(body.headers?.apikey).toBe('secret-key-123');
    expect(body.enabled).toBe(true);
  });

});
