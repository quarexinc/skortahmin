// Hızlı arama: bugün/yarın maçları, üyeler, blog yazıları
import { NextResponse } from 'next/server';
import { istDateKey } from '@/config';
import { dbConfigured, q } from '@/lib/db';
import { getDayFixtures } from '@/lib/fixtures';

export const dynamic = 'force-dynamic';

const norm = (s: string) => s.toLocaleLowerCase('tr-TR');

export async function GET(req: Request) {
  const term = (new URL(req.url).searchParams.get('q') ?? '').trim().slice(0, 60);
  if (term.length < 2) return NextResponse.json({ hits: [] });
  const n = norm(term);
  const hits: { type: string; title: string; sub?: string; href: string }[] = [];
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 86_400_000);
  for (const d of [now, tomorrow]) {
    try {
      const { fixtures } = await getDayFixtures(istDateKey(d));
      for (const f of fixtures) {
        const h = f.home?.name ?? '';
        const a = f.away?.name ?? '';
        if (norm(h).includes(n) || norm(a).includes(n) || norm(f.league?.name ?? '').includes(n))
          hits.push({
            type: 'match',
            title: `${h} – ${a}`,
            sub: `${f.league?.name ?? ''} · ${new Intl.DateTimeFormat('tr-TR', { timeZone: 'Europe/Istanbul', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(f.date))}`,
            href: `/mac/${f.id}`,
          });
      }
    } catch {
      /* plan kısıtı vb. */
    }
  }
  if (dbConfigured()) {
    const like = `%${term}%`;
    const [users, posts] = await Promise.all([
      q<{ id: number; name: string; favorite_team: string | null }>(`SELECT id, name, favorite_team FROM users WHERE NOT banned AND name ILIKE $1 ORDER BY id LIMIT 5`, [like]).catch(() => []),
      q<{ slug: string; title: string }>(`SELECT slug, title FROM posts WHERE published AND (title ILIKE $1 OR tags ILIKE $1) ORDER BY created_at DESC LIMIT 5`, [like]).catch(() => []),
    ]);
    users.forEach((u) => hits.push({ type: 'user', title: u.name, sub: u.favorite_team ?? 'Üye profili', href: `/uye/${u.id}` }));
    posts.forEach((p) => hits.push({ type: 'post', title: p.title, sub: 'Blog', href: `/blog/${p.slug}` }));
  }
  return NextResponse.json({ hits: hits.slice(0, 12) });
}
