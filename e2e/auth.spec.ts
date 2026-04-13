import { test, expect } from '@playwright/test';

test.describe('Auth Flow', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('text=VERELUS')).toBeVisible();
    await expect(page.locator('text=Music Intelligence Platform')).toBeVisible();
  });

  test('shows email and password form', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('shows Google OAuth button', async ({ page }) => {
    await page.goto('/login');

    const googleButton = page.locator('button', { hasText: 'Continuar com Google' });
    await expect(googleButton).toBeVisible();
  });

  test('dashboard redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');

    // The dashboard layout checks auth and redirects to /login
    await page.waitForURL('**/login', { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });

  test('invalid login shows error', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input#email', 'invalid@test.com');
    await page.fill('input#password', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Wait for the error message to appear
    const errorMessage = page.locator('.bg-red-500\\/10');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
  });
});
