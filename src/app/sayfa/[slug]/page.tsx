import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { dbConfigured, q1 } from '@/lib/db';
import { renderMarkdown } from '@/lib/markdown';

export const dynamic = 'force-dynamic';

interface Pg { title: string; body: string; updated_at: Date }

async function load(slug: string) {
  if (!dbConfigured()) return null;
  return q1<Pg>('SELECT title, body, updated_at FROM pages WHERE slug = $1 AND published', [slug]).catch(() => null);
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await load(params.slug);
  return { title: p?.title ?? 'Sayfa bulunamadı' };
}

export default async function CustomPage({ params }: { params: { slug: string } }) {
  const p = await load(params.slug);
  if (!p) notFound();
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-black tracking-tight">{p.title}</h1>
      <p className="mt-2 text-xs text-slate-500">Son güncelleme: {new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(p.updated_at))}</p>
      <article className="prose-skor mt-8 space-y-4 text-[15px] leading-relaxed text-slate-300" dangerouslySetInnerHTML={{ __html: renderMarkdown(p.body) }} />
    </main>
  );
}
