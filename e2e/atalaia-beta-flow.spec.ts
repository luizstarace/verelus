import { test, expect } from '@playwright/test';

// Validates the public-facing surface and API validation paths that a beta
// client can hit without being logged in. These must not regress.
// Intentionally does NOT exercise the authenticated signup → Claude flow —
// that requires DB seeding and burns Anthropic credits; covered by manual QA.

test.describe('Atalaia public pages', () => {
  test('landing page loads with key CTAs', async ({ page }) => {
    await page.goto('/atalaia');
    await expect(page.locator('h1').first()).toBeVisible();
    // "Teste grátis" or "Começar" CTA should be findable
    const cta = page.getByText(/Teste grátis|Começar|Assine|Experimente/i).first();
    await expect(cta).toBeVisible();
  });

  test('privacy page is about Atalaia, not old music product', async ({ page }) => {
    await page.goto('/privacy');
    const body = await page.locator('body').innerText();
    expect(body.toLowerCase()).toContain('atalaia');
    expect(body.toLowerCase()).toContain('lgpd');
    // Guard against regression to old Verelus music copy
    expect(body.toLowerCase()).not.toContain('press release');
    expect(body.toLowerCase()).not.toContain('gênero musical');
    expect(body.toLowerCase()).not.toContain('nome artístico');
  });

  test('terms page is about Atalaia', async ({ page }) => {
    await page.goto('/terms');
    const body = await page.locator('body').innerText();
    expect(body.toLowerCase()).toContain('atalaia');
    // WhatsApp / LGPD clauses must exist for a customer-service product
    expect(body.toLowerCase()).toMatch(/whatsapp/i);
  });
});

test.describe('Atalaia API validation', () => {
  test('/api/atalaia/chat rejects missing fields', async ({ request }) => {
    const res = await request.post('/api/atalaia/chat', {
      data: { business_id: '00000000-0000-0000-0000-000000000000' },
    });
    expect(res.status()).toBe(400);
  });

  test('/api/atalaia/chat rejects non-existent business_id', async ({ request }) => {
    const res = await request.post('/api/atalaia/chat', {
      data: {
        business_id: '00000000-0000-0000-0000-000000000000',
        message: 'hi',
        channel: 'widget',
      },
    });
    expect(res.status()).toBe(404);
  });

  test('/api/atalaia/chat rejects unauthenticated preview=true', async ({ request }) => {
    // preview mode must require auth + ownership; unauthenticated call with
    // any business_id must return 401 or 403 (not proceed to Claude).
    const res = await request.post('/api/atalaia/chat', {
      data: {
        business_id: '00000000-0000-0000-0000-000000000000',
        message: 'test',
        channel: 'widget',
        preview: true,
      },
    });
    // Either 401 (no auth) or 404 (business not found, returned before preview check).
    // 200 would mean the bypass is back — fail.
    expect([401, 403, 404]).toContain(res.status());
  });

  test('/api/atalaia/widget/lead rejects invalid business_id', async ({ request }) => {
    const res = await request.post('/api/atalaia/widget/lead', {
      data: { business_id: 'not-a-uuid', customer_name: 'Teste' },
    });
    expect(res.status()).toBe(400);
  });

  test('/api/atalaia/widget/lead rejects missing customer_name', async ({ request }) => {
    const res = await request.post('/api/atalaia/widget/lead', {
      data: { business_id: '00000000-0000-0000-0000-000000000000' },
    });
    expect(res.status()).toBe(400);
  });

  test('/api/atalaia/widget/lead returns 404 for unknown business', async ({ request }) => {
    const res = await request.post('/api/atalaia/widget/lead', {
      data: {
        business_id: '00000000-0000-0000-0000-000000000000',
        customer_name: 'Teste',
      },
    });
    expect(res.status()).toBe(404);
  });

  test('/api/atalaia/whatsapp/webhook rejects missing/bad apikey', async ({ request }) => {
    const res = await request.post('/api/atalaia/whatsapp/webhook', {
      headers: { apikey: 'wrong-key' },
      data: { event: 'messages.upsert', instance: 'atalaia_test', data: {} },
    });
    expect(res.status()).toBe(401);
  });
});

test.describe('Atalaia CORS', () => {
  test('widget chat OPTIONS allows cross-origin', async ({ request }) => {
    // The widget is embedded on third-party customer sites; OPTIONS must succeed.
    const res = await request.fetch('/api/atalaia/chat', {
      method: 'OPTIONS',
      headers: { Origin: 'https://cliente-teste.example.com' },
    });
    expect(res.status()).toBe(204);
  });
});

test.describe('Atalaia rate limiting', () => {
  test('widget lead rate-limits per IP after threshold', async ({ request }) => {
    // Fire 12 requests quickly (limit is 10/min per IP) — 11th or 12th should 429.
    const responses = await Promise.all(
      Array.from({ length: 12 }, () =>
        request.post('/api/atalaia/widget/lead', {
          data: { business_id: 'not-a-uuid', customer_name: 'x' },
        })
      )
    );
    const has429 = responses.some((r) => r.status() === 429);
    expect(has429).toBe(true);
  });
});
