import { test, expect } from '@playwright/test';

test.describe('Dashboard (requires auth)', () => {
  // These tests require authentication. Skip when no auth session is available.
  // To run these tests, set up auth state via storageState or login fixture.
  test.skip(
    () => !process.env.E2E_AUTH_ENABLED,
    'Skipped: set E2E_AUTH_ENABLED=true and configure auth to run dashboard tests'
  );

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('dashboard layout has sidebar', async ({ page }) => {
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
  });

  test('all navigation items are present', async ({ page }) => {
    const expectedItems = [
      'Painel',
      'Analise',
      'Social',
      'Imprensa',
      'Setlists',
      'Financeiro',
      'Contratos',
      'Turnes',
      'Relatorios',
      'EPK',
      'Pitching',
      'Perfil',
    ];

    for (const label of expectedItems) {
      await expect(page.locator('aside').locator(`text=${label}`)).toBeVisible();
    }
  });

  test('profile page is accessible', async ({ page }) => {
    await page.click('aside a[href="/dashboard/profile"]');
    await page.waitForURL('**/dashboard/profile');
    expect(page.url()).toContain('/dashboard/profile');
  });
});
