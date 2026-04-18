import { describe, it, expect } from 'vitest';
import { generateSlug } from '@/lib/proposal-slug';

describe('generateSlug', () => {
  it('generates a slug of correct length', () => {
    const slug = generateSlug();
    expect(slug.length).toBe(10);
  });

  it('generates URL-safe characters only', () => {
    const slug = generateSlug();
    expect(/^[a-z0-9]+$/.test(slug)).toBe(true);
  });

  it('generates unique slugs', () => {
    const slugs = new Set(Array.from({ length: 100 }, () => generateSlug()));
    expect(slugs.size).toBe(100);
  });
});
