import { test, expect } from '@playwright/test';

const DASHBOARD_MODULES = [
  { path: '/dashboard', name: 'Painel' },
  { path: '/dashboard/analysis', name: 'Analise' },
  { path: '/dashboard/social', name: 'Social' },
  { path: '/dashboard/press', name: 'Imprensa' },
  { path: '/dashboard/setlists', name: 'Setlists' },
  { path: '/dashboard/financial', name: 'Financeiro' },
  { path: '/dashboard/contracts', name: 'Contratos' },
  { path: '/dashboard/tours', name: 'Turnes' },
  { path: '/dashboard/reports', name: 'Relatorios' },
  { path: '/dashboard/epk', name: 'EPK' },
  { path: '/dashboard/pitching', name: 'Pitching' },
];

test.describe('Dashboard UI Audit (requires auth)', () => {
  test.skip(
    () => !process.env.E2E_AUTH_ENABLED,
    'Skipped: set E2E_AUTH_ENABLED=true and configure auth to run dashboard audit tests'
  );

  test.describe('Module loading', () => {
    for (const mod of DASHBOARD_MODULES) {
      test(`${mod.name} (${mod.path}) loads without JS errors`, async ({ page }) => {
        const jsErrors: string[] = [];
        page.on('pageerror', (error) => {
          jsErrors.push(error.message);
        });

        await page.goto(mod.path, { waitUntil: 'networkidle' });

        expect(jsErrors, `JS errors on ${mod.name}: ${jsErrors.join(', ')}`).toHaveLength(0);
      });
    }
  });

  test.describe('Loading states', () => {
    for (const mod of DASHBOARD_MODULES) {
      test(`${mod.name} shows loading state or content`, async ({ page }) => {
        // Navigate and check that either a loading indicator or the actual content appears
        await page.goto(mod.path);

        // Wait for either a loading spinner/skeleton or the main content
        const hasContent = await page
          .locator('main, [role="main"], .dashboard-content, [data-testid="module-content"]')
          .first()
          .waitFor({ state: 'visible', timeout: 10000 })
          .then(() => true)
          .catch(() => false);

        const hasLoading = await page
          .locator('[data-testid="loading"], .animate-pulse, .skeleton, [role="progressbar"], .loading')
          .first()
          .isVisible()
          .catch(() => false);

        expect(hasContent || hasLoading, `${mod.name} shows neither loading state nor content`).toBe(true);
      });
    }
  });

  test.describe('Error boundaries', () => {
    for (const mod of DASHBOARD_MODULES) {
      test(`${mod.name} does not trigger error boundary`, async ({ page }) => {
        await page.goto(mod.path, { waitUntil: 'networkidle' });

        // Check that no error boundary UI is visible
        const errorBoundary = page.locator(
          '[data-testid="error-boundary"], .error-boundary, text="Something went wrong", text="Algo deu errado"'
        );
        await expect(errorBoundary).not.toBeVisible();
      });
    }
  });

  test.describe('Sidebar navigation', () => {
    test('sidebar is present and has all navigation items', async ({ page }) => {
      await page.goto('/dashboard');
      const sidebar = page.locator('aside');
      await expect(sidebar).toBeVisible();

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
        await expect(sidebar.locator(`text=${label}`)).toBeVisible();
      }
    });

    test('clicking navigation items changes the route', async ({ page }) => {
      await page.goto('/dashboard');

      // Click on a few navigation items and verify route changes
      const navTests = [
        { label: 'Analise', expectedUrl: '/dashboard/analysis' },
        { label: 'Social', expectedUrl: '/dashboard/social' },
        { label: 'Financeiro', expectedUrl: '/dashboard/financial' },
      ];

      for (const nav of navTests) {
        await page.locator('aside').locator(`text=${nav.label}`).click();
        await page.waitForURL(`**${nav.expectedUrl}`, { timeout: 5000 });
        expect(page.url()).toContain(nav.expectedUrl);
      }
    });
  });

  test.describe('Responsive layout', () => {
    test('dashboard adapts to mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/dashboard');

      // On mobile, sidebar should either be hidden or in a hamburger menu
      const sidebar = page.locator('aside');
      const isSidebarVisible = await sidebar.isVisible().catch(() => false);

      if (!isSidebarVisible) {
        // Look for a hamburger/menu button to open the sidebar
        const menuButton = page.locator(
          'button[aria-label*="menu"], button[aria-label*="Menu"], [data-testid="menu-toggle"], button.hamburger'
        );
        const hasMenuButton = await menuButton.first().isVisible().catch(() => false);
        expect(hasMenuButton, 'Mobile view should have a menu toggle when sidebar is hidden').toBe(true);
      }

      // Check no horizontal scroll on mobile
      const hasHorizontalScroll = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(hasHorizontalScroll).toBe(false);
    });

    test('dashboard content is readable on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/dashboard');

      // Main content area should be visible
      const mainContent = page.locator('main, [role="main"]').first();
      await expect(mainContent).toBeVisible();
    });
  });
});
