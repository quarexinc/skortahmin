// Sayfa görüntüleme sayacı (çerezsiz; tarayıcıda üretilen anonim ziyaretçi kimliği günlük tekilleştirme için kullanılır).
import { NextResponse } from 'next/server';
import { dbConfigured, q } from '@/lib/db';

export const dynamic = 'force-dynamic';

const norm = (p: string) =>
  p
    .split('?')[0]
    .replace(/\/\d+(?=\/|$)/g, '/:id')
    .slice(0, 120) || '/';

export async function POST(req: Request) {
  if (!dbConfigured()) return new NextResponse(null, { status: 204 });
  try {
    const b = (await req.json()) as { path?: string; vid?: string };
    const path = typeof b.path === 'string' && b.path.startsWith('/') ? norm(b.path) : null;
    if (!path || path.startsWith('/admin') || path.startsWith('/api')) return new NextResponse(null, { status: 204 });
    const ua = req.headers.get('user-agent') ?? '';
    if (/bot|crawl|spider|preview|headless/i.test(ua)) return new NextResponse(null, { status: 204 });
    await q(
      `INSERT INTO page_views (day, path, views) VALUES ((NOW() AT TIME ZONE 'Europe/Istanbul')::date, $1, 1)
       ON CONFLICT (day, path) DO UPDATE SET views = page_views.views + 1`,
      [path],
    );
    if (typeof b.vid === 'string' && /^[a-z0-9]{8,40}$/i.test(b.vid))
      await q(
        `INSERT INTO daily_visitors (day, visitor) VALUES ((NOW() AT TIME ZONE 'Europe/Istanbul')::date, $1) ON CONFLICT DO NOTHING`,
        [b.vid],
      );
  } catch {
    /* sayaç hatası kullanıcıyı etkilememeli */
  }
  return new NextResponse(null, { status: 204 });
}
