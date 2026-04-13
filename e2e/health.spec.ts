import { test, expect } from '@playwright/test';

test.describe('Health Endpoints', () => {
  test('/api/health/ping returns 200 with { ok: true }', async ({ request }) => {
    const response = await request.get('/api/health/ping');

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toEqual({ ok: true });
  });

  test('/api/health returns valid JSON structure', async ({ request }) => {
    const response = await request.get('/api/health');

    const body = await response.json();

    // Verify the response has the expected structure
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('uptime');
    expect(body).toHaveProperty('services');
    expect(body).toHaveProperty('version');

    // Status should be one of the valid values
    expect(['healthy', 'degraded', 'unhealthy']).toContain(body.status);

    // Services should have the expected keys
    expect(body.services).toHaveProperty('supabase');
    expect(body.services).toHaveProperty('stripe');
    expect(body.services).toHaveProperty('anthropic');
    expect(body.services).toHaveProperty('resend');
  });
});
