// Hızlı arama: oyunlar, sayfalar, üyeler, blog yazıları
import { NextResponse } from 'next/server';
import { dbConfigured, q } from '@/lib/db';

export const dynamic = 'force-dynamic';

const norm = (s: string) => s.toLocaleLowerCase('tr-TR');

const STATIC = [
  { type: 'game', title: 'Crash', sub: 'Roket yükselirken çık', href: '/oyunlar/crash' },
  { type: 'game', title: 'Mines', sub: 'Mayınlardan kaçın', href: '/oyunlar/mines' },
  { type: 'game', title: 'Slots', sub: '5 makara, 10 çizgi', href: '/oyunlar/slots' },
  { type: 'game', title: 'Blackjack', sub: '21’e en yakın el', href: '/oyunlar/blackjack' },
  { type: 'page', title: 'Cüzdan', sub: 'Bakiye, kasa, bonuslar', href: '/cuzdan' },
  { type: 'page', title: 'VIP', sub: 'Seviyeler ve ödüller', href: '/vip' },
  { type: 'page', title: 'Adil oyun', sub: 'Tohumlar ve doğrulama', href: '/adil-oyun' },
  { type: 'page', title: 'Liderlik tablosu', sub: 'En çok oynayanlar', href: '/liderlik' },
  { type: 'page', title: 'Sorumlu oyun', sub: 'Mola ve limitler', href: '/hesap/sorumlu-oyun' },
];

export async function GET(req: Request) {
  const term = (new URL(req.url).searchParams.get('q') ?? '').trim().slice(0, 60);
  if (term.length < 2) return NextResponse.json({ hits: [] });
  const n = norm(term);
  const hits: { type: string; title: string; sub?: string; href: string }[] = STATIC.filter((s) => norm(s.title).includes(n) || norm(s.sub).includes(n));
  if (dbConfigured()) {
    const like = `%${term}%`;
    const [users, posts] = await Promise.all([
      q<{ id: number; name: string }>(`SELECT id, name FROM users WHERE NOT banned AND name ILIKE $1 ORDER BY id LIMIT 5`, [like]).catch(() => []),
      q<{ slug: string; title: string }>(`SELECT slug, title FROM posts WHERE published AND (title ILIKE $1 OR tags ILIKE $1) ORDER BY created_at DESC LIMIT 5`, [like]).catch(() => []),
    ]);
    users.forEach((u) => hits.push({ type: 'user', title: u.name, sub: 'Üye profili', href: `/uye/${u.id}` }));
    posts.forEach((p) => hits.push({ type: 'post', title: p.title, sub: 'Blog', href: `/blog/${p.slug}` }));
  }
  return NextResponse.json({ hits: hits.slice(0, 12) });
}
