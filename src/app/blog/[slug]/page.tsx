import { ArrowLeft, CalendarDays, Clock, Eye, Tag } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AdSlot from '@/components/AdSlot';
import ReadingProgress from '@/components/ReadingProgress';
import ShareButtons from '@/components/ShareButtons';
import { dbConfigured, q, q1 } from '@/lib/db';
import { readingMinutes, renderMarkdown } from '@/lib/markdown';

export const dynamic = 'force-dynamic';

interface P { id: number; slug: string; title: string; excerpt: string | null; cover_url: string | null; tags: string | null; views: number; created_at: Date; body: string; author: string | null }

async function load(slug: string) {
  if (!dbConfigured()) return null;
  return q1<P>(
    `SELECT p.*, u.name AS author FROM posts p LEFT JOIN users u ON u.id = p.author_id WHERE p.slug = $1 AND p.published`,
    [slug],
  ).catch(() => null);
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await load(params.slug);
  if (!p) return { title: 'Yazı bulunamadı' };
  return { title: p.title, description: p.excerpt ?? undefined, openGraph: { title: p.title, description: p.excerpt ?? undefined, images: p.cover_url ? [p.cover_url] : undefined } };
}

export default async function Post({ params }: { params: { slug: string } }) {
  const p = await load(params.slug);
  if (!p) notFound();
  q('UPDATE posts SET views = views + 1 WHERE id = $1', [p.id]).catch(() => undefined);
  const more = await q<{ slug: string; title: string }>(
    `SELECT slug, title FROM posts WHERE published AND id <> $1 ORDER BY created_at DESC LIMIT 4`,
    [p.id],
  ).catch(() => []);
  const tags = (p.tags ?? '').split(',').map((x) => x.trim()).filter(Boolean);
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <ReadingProgress />
      <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"><ArrowLeft size={14} /> Blog</Link>
      <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight sm:text-4xl">{p.title}</h1>
      <p className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
        <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} /> {new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(p.created_at))}</span>
        <span className="inline-flex items-center gap-1.5"><Clock size={14} /> {readingMinutes(p.body)} dk okuma</span>
        <span className="inline-flex items-center gap-1.5"><Eye size={14} /> {p.views + 1}</span>
        {p.author && <span>{p.author}</span>}
      </p>
      {p.cover_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.cover_url} alt="" className="mt-6 w-full rounded-3xl border border-white/5 object-cover" />
      )}
      {p.excerpt && <p className="mt-6 text-lg leading-relaxed text-slate-300">{p.excerpt}</p>}
      <article className="prose-skor mt-6 space-y-4 text-[15px] leading-relaxed text-slate-300" dangerouslySetInnerHTML={{ __html: renderMarkdown(p.body) }} />
      {tags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {tags.map((t) => (
            <Link key={t} href={`/blog?etiket=${encodeURIComponent(t)}`} className="chip"><Tag size={13} /> {t}</Link>
          ))}
        </div>
      )}
      <div className="mt-8 border-t border-white/5 pt-6">
        <ShareButtons title={p.title} />
      </div>
      <AdSlot placement="blog_inline" className="mt-8" />
      {more.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 font-bold">Diğer yazılar</h2>
          <ul className="space-y-2">
            {more.map((m) => (
              <li key={m.slug}><Link href={`/blog/${m.slug}`} className="text-slate-300 hover:text-accent-soft">{m.title}</Link></li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
