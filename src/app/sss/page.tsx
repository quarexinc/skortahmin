import { Plus } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { dbConfigured, q } from '@/lib/db';
import { DEFAULT_FAQS } from '@/lib/faqs';

export const metadata: Metadata = { title: 'Sıkça sorulan sorular' };
export const dynamic = 'force-dynamic';

interface F { category: string; question: string; answer: string }

export default async function Page() {
  let items: F[] = [];
  if (dbConfigured()) items = await q<F>('SELECT category, question, answer FROM faqs WHERE active ORDER BY sort, id').catch(() => []);
  if (items.length === 0) items = DEFAULT_FAQS.map((f) => ({ category: f.category, question: f.q, answer: f.a }));
  const groups = items.reduce<Record<string, F[]>>((acc, f) => ((acc[f.category] ??= []).push(f), acc), {});
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-black tracking-tight">Sıkça sorulan sorular</h1>
      <p className="mt-2 text-slate-400">
        Aradığını bulamadın mı? <Link href="/destek/yeni" className="text-accent-soft underline">Destek talebi aç</Link> ya da{' '}
        <Link href="/adil-oyun" className="text-accent-soft underline">adil oyun</Link> sayfasına göz at.
      </p>
      {Object.entries(groups).map(([cat, list]) => (
        <section key={cat} className="mt-10">
          <h2 className="label-muted mb-3">{cat}</h2>
          <div className="space-y-2.5">
            {list.map((f) => (
              <details key={f.question} className="card group p-5">
                <summary className="cursor-pointer list-none font-semibold">
                  <span className="flex items-center justify-between gap-3">
                    {f.question}
                    <Plus size={18} className="shrink-0 text-slate-500 transition group-open:rotate-45" />
                  </span>
                </summary>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-400">{f.answer}</p>
              </details>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
