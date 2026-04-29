import type { MetadataRoute } from 'next';
import { POSTS } from './blog/posts';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://verelus.com';
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${base}/attendly`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/attendly/salao`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/attendly/clinica`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/attendly/restaurante`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/attendly/academia`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/ajuda`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/login`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const blogPages: MetadataRoute.Sitemap = POSTS.map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt || post.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...blogPages];
}
