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
    sitemap: 'https://atalaia.verelus.com/sitemap.xml',
    host: 'https://atalaia.verelus.com',
  };
}
