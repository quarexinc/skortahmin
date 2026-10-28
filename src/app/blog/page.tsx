import { CalendarDays, Clock, Eye, FileText, Tag } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Empty } from '@/components/ui';
import { dbConfigured, q } from '@/lib/db';
import { readingMinutes } from '@/lib/markdown';
import { getSettings } from '@/lib/settings';

export const metadata: Metadata = { title: 'Blog', description: 'Oyun rehberleri, etkinlikler ve analiz rehberleri.' };
export const revalidate = 60;

interface P { slug: string; title: string; excerpt: string | null; cover_url: string | null; tags: string | null; views: number; created_at: Date; body: string }

export default async function Blog({ searchParams }: { searchParams: { etiket?: string } }) {
  if (!(await getSettings()).blogEnabled) notFound();
  const tag = searchParams.etiket?.trim();
  const posts = dbConfigured()
    ? await q<P>(
        `SELECT slug, title, excerpt, cover_url, tags, views, created_at, body FROM posts
         WHERE published AND ($1::text IS NULL OR tags ILIKE '%' || $1 || '%') ORDER BY created_at DESC LIMIT 60`,
        [tag ?? null],
      ).catch(() => [])
    : [];
  const [first, ...rest] = posts;
  const fmt = (d: Date) => new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(d));
  const tags = (t: string | null) => (t ?? '').split(',').map((x) => x.trim()).filter(Boolean);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Blog</h1>
      <p className="mt-2 text-slate-400">Oyun rehberleri, etkinlikler ve analiz rehberleri.</p>
      {tag && (
        <p className="mt-3 text-sm">
          <span className="text-slate-400">Etiket:</span> <b>{tag}</b> · <Link href="/blog" className="text-accent-soft underline">Tümünü göster</Link>
        </p>
      )}
      {posts.length === 0 ? (
        <div className="mt-8"><Empty icon={FileText} title="Henüz yazı yok">Yakında oyun rehberleri ve etkinlik duyuruları burada olacak.</Empty></div>
      ) : (
        <>
          <Link href={`/blog/${first.slug}`} className="card group mt-8 grid overflow-hidden p-0 transition hover:border-accent/30 md:grid-cols-2">
            {first.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={first.cover_url} alt="" className="h-64 w-full object-cover transition duration-500 group-hover:scale-105 md:h-full" />
            ) : (
              <div className="grid h-64 place-items-center bg-gradient-to-br from-accent/20 to-cyan-400/10 md:h-full"><FileText size={48} className="text-accent-soft" /></div>
            )}
            <div className="p-6 md:p-8">
              <span className="text-xs font-semibold uppercase tracking-wider text-accent-soft">Son yazı</span>
              <h2 className="mt-2 text-2xl font-black group-hover:text-accent-soft">{first.title}</h2>
              {first.excerpt && <p className="mt-3 text-slate-400">{first.excerpt}</p>}
              <p className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1"><CalendarDays size={13} /> {fmt(first.created_at)}</span>
                <span className="inline-flex items-center gap-1"><Clock size={13} /> {readingMinutes(first.body)} dk</span>
                <span className="inline-flex items-center gap-1"><Eye size={13} /> {first.views}</span>
              </p>
            </div>
          </Link>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((p) => (
              <Link key={p.slug} href={`/blog/${p.slug}`} className="card group overflow-hidden p-0 transition hover:-translate-y-1 hover:border-accent/30">
                {p.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.cover_url} alt="" className="h-44 w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
                ) : (
                  <div className="grid h-44 place-items-center bg-gradient-to-br from-accent/15 to-cyan-400/5"><FileText size={32} className="text-accent-soft" /></div>
                )}
                <div className="p-5">
                  <h3 className="font-bold group-hover:text-accent-soft">{p.title}</h3>
                  {p.excerpt && <p className="mt-1.5 line-clamp-2 text-sm text-slate-400">{p.excerpt}</p>}
                  <p className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1"><CalendarDays size={12} /> {fmt(p.created_at)}</span>
                    <span className="inline-flex items-center gap-1"><Clock size={12} /> {readingMinutes(p.body)} dk</span>
                    {tags(p.tags).slice(0, 2).map((t) => <span key={t} className="inline-flex items-center gap-1"><Tag size={12} /> {t}</span>)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
