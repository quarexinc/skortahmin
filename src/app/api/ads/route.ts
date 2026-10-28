// Yerleşim alanı için ağırlıklı rastgele reklam seçer ve gösterimi sayar.
import { NextResponse } from 'next/server';
import { AD_PLACEMENT_IDS } from '@/config/ads';
import { dbConfigured, q } from '@/lib/db';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

interface Ad { id: number; kind: string; image_url: string | null; link_url: string | null; title: string | null; body: string | null; cta: string | null; html: string | null; weight: number }

export async function GET(req: Request) {
  const placement = new URL(req.url).searchParams.get('placement') ?? '';
  if (!dbConfigured() || !AD_PLACEMENT_IDS.includes(placement)) return NextResponse.json({ ad: null });
  try {
    const s = await getSettings();
    if (!s.adsEnabled) return NextResponse.json({ ad: null });
    const ads = await q<Ad>(
      `SELECT id, kind, image_url, link_url, title, body, cta, html, weight FROM ads
       WHERE active AND placement = $1 AND (starts_at IS NULL OR starts_at <= NOW()) AND (ends_at IS NULL OR ends_at > NOW())`,
      [placement],
    );
    if (ads.length === 0) return NextResponse.json({ ad: null });
    const total = ads.reduce((a, x) => a + Math.max(1, x.weight), 0);
    let r = Math.random() * total;
    const ad = ads.find((x) => (r -= Math.max(1, x.weight)) < 0) ?? ads[0];
    q('UPDATE ads SET impressions = impressions + 1 WHERE id = $1', [ad.id]).catch(() => undefined);
    return NextResponse.json({
      ad: { id: ad.id, kind: ad.kind, image: ad.image_url, title: ad.title, body: ad.body, cta: ad.cta, html: ad.html, hasLink: !!ad.link_url },
    });
  } catch {
    return NextResponse.json({ ad: null });
  }
}
