import type { MetadataRoute } from 'next';
import { dbConfigured, q } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://skortahmin-kappa.vercel.app';
  const statics = ['', '/maclar', '/liderlik', '/kupon', '/blog', '/premium', '/sss', '/iletisim', '/nasil-calisir', '/hakkimizda', '/kullanim-kosullari', '/gizlilik', '/kvkk', '/sorumlu-oyun'];
  const out: MetadataRoute.Sitemap = statics.map((p) => ({ url: `${base}${p}`, changeFrequency: p === '/maclar' ? 'hourly' : 'weekly', priority: p === '' ? 1 : 0.6 }));
  if (dbConfigured()) {
    const [posts, pages] = await Promise.all([
      q<{ slug: string; updated_at: Date }>('SELECT slug, updated_at FROM posts WHERE published').catch(() => []),
      q<{ slug: string; updated_at: Date }>('SELECT slug, updated_at FROM pages WHERE published').catch(() => []),
    ]);
    posts.forEach((p) => out.push({ url: `${base}/blog/${p.slug}`, lastModified: p.updated_at, priority: 0.7 }));
    pages.forEach((p) => out.push({ url: `${base}/sayfa/${p.slug}`, lastModified: p.updated_at, priority: 0.4 }));
  }
  return out;
}
