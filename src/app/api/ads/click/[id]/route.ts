// Reklam tıklaması: sayacı artırır ve hedef adrese yönlendirir.
import { NextResponse } from 'next/server';
import { dbConfigured, q1 } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const home = new URL('/', req.url);
  const id = Number(params.id);
  if (!dbConfigured() || !Number.isInteger(id)) return NextResponse.redirect(home);
  const ad = await q1<{ link_url: string | null }>('UPDATE ads SET clicks = clicks + 1 WHERE id = $1 RETURNING link_url', [id]).catch(() => null);
  const url = ad?.link_url ?? '';
  if (/^https?:\/\//i.test(url) || url.startsWith('/')) return NextResponse.redirect(new URL(url, req.url), 302);
  return NextResponse.redirect(home);
}
