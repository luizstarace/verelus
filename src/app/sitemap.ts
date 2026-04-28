import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://verelus.com';
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${base}/attendly`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/attendly/salao`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/attendly/clinica`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/attendly/restaurante`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/attendly/academia`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/ajuda`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/login`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
