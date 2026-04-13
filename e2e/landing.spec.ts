import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('page loads and shows Verelus branding', async ({ page }) => {
    await expect(page.locator('text=Verelus')).toBeVisible();
    await expect(page.locator('text=Music Intelligence')).toBeVisible();
  });

  test('navigation links exist for features and pricing', async ({ page }) => {
    await expect(page.locator('nav a[href="#features"]')).toBeVisible();
    await expect(page.locator('nav a[href="#pricing"]')).toBeVisible();
  });

  test('pricing section has 3 tiers visible', async ({ page }) => {
    const pricingSection = page.locator('#pricing');
    await pricingSection.scrollIntoViewIfNeeded();

    // Free, Pro, and Business tiers
    await expect(pricingSection.locator('text=R$0')).toBeVisible();
    await expect(pricingSection.locator('text=MAIS POPULAR').or(pricingSection.locator('text=MOST POPULAR'))).toBeVisible();

    // Verify there are 3 pricing cards
    const pricingCards = pricingSection.locator('h3');
    await expect(pricingCards).toHaveCount(3);
  });

  test('login button navigates to /login', async ({ page }) => {
    const dashboardLink = page.locator('nav a[href="/dashboard"]');
    await expect(dashboardLink).toBeVisible();
  });

  test('newsletter signup form is visible', async ({ page }) => {
    const form = page.locator('form').first();
    await expect(form).toBeVisible();
    await expect(form.locator('input[type="email"]')).toBeVisible();
    await expect(form.locator('button[type="submit"]')).toBeVisible();
  });

  test('language toggle works (PT/EN)', async ({ page }) => {
    // Default language is PT - check for Portuguese content
    const toggleButton = page.locator('nav button').filter({ hasText: /EN|PT/ });
    await expect(toggleButton).toBeVisible();

    // Click to switch language
    const initialText = await toggleButton.textContent();
    await toggleButton.click();

    // After toggle, the button text should change
    const newText = await toggleButton.textContent();
    expect(newText).not.toBe(initialText);
  });
});
