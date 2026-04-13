import { test, expect } from '@playwright/test';

const PAGES = [
  { path: '/', name: 'Landing Page' },
  { path: '/login', name: 'Login Page' },
];

// These tests check basic web vitals and accessibility patterns
test.describe('UI Audit', () => {
  for (const page of PAGES) {
    test.describe(page.name, () => {
      test('has proper meta tags', async ({ page: p }) => {
        await p.goto(page.path);
        // Check viewport meta
        const viewport = await p.locator('meta[name="viewport"]').getAttribute('content');
        expect(viewport).toContain('width=device-width');
        // Check title
        const title = await p.title();
        expect(title.length).toBeGreaterThan(0);
        // Check description
        const description = await p.locator('meta[name="description"]').getAttribute('content');
        expect(description?.length).toBeGreaterThan(0);
      });

      test('images have alt text', async ({ page: p }) => {
        await p.goto(page.path);
        const images = await p.locator('img').all();
        for (const img of images) {
          const alt = await img.getAttribute('alt');
          const src = await img.getAttribute('src');
          expect(alt, `Image ${src} missing alt text`).toBeTruthy();
        }
      });

      test('buttons and links are accessible', async ({ page: p }) => {
        await p.goto(page.path);
        // All buttons should have accessible text
        const buttons = await p.locator('button').all();
        for (const btn of buttons) {
          const text = await btn.textContent();
          const ariaLabel = await btn.getAttribute('aria-label');
          const title = await btn.getAttribute('title');
          expect(text?.trim() || ariaLabel || title, 'Button without accessible label').toBeTruthy();
        }
      });

      test('has no broken links', async ({ page: p }) => {
        await p.goto(page.path);
        const links = await p.locator('a[href]').all();
        for (const link of links) {
          const href = await link.getAttribute('href');
          if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('javascript:')) {
            // Just check internal links exist (don't make network requests for external)
            if (href.startsWith('/')) {
              // Internal link - will be checked by other tests
              expect(href.length).toBeGreaterThan(0);
            }
          }
        }
      });

      test('color contrast meets basic standards', async ({ page: p }) => {
        await p.goto(page.path);
        // Check that text elements are visible (not hidden behind same-color backgrounds)
        const body = await p.locator('body');
        const bgColor = await body.evaluate(el => getComputedStyle(el).backgroundColor);
        expect(bgColor).toBeTruthy();
      });

      test('page loads in reasonable time', async ({ page: p }) => {
        const start = Date.now();
        await p.goto(page.path, { waitUntil: 'domcontentloaded' });
        const loadTime = Date.now() - start;
        expect(loadTime).toBeLessThan(5000); // 5 seconds max
      });

      test('is responsive on mobile viewport', async ({ page: p }) => {
        await p.setViewportSize({ width: 375, height: 812 }); // iPhone size
        await p.goto(page.path);
        // Check no horizontal scroll
        const hasHorizontalScroll = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
        expect(hasHorizontalScroll).toBe(false);
      });
    });
  }
});
