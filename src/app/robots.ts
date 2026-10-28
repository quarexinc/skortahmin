import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://skortahmin-kappa.vercel.app';
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/hesap', '/cuzdan'] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
