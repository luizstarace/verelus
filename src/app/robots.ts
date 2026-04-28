import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/api', '/auth', '/p/'],
      },
    ],
    sitemap: 'https://verelus.com/sitemap.xml',
    host: 'https://verelus.com',
  };
}
