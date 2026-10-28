import type { ReactNode } from 'react';

export default function Prose({ title, updated, intro, children }: { title: string; updated?: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-black tracking-tight">{title}</h1>
      {updated && <p className="mt-2 text-xs text-slate-500">Son güncelleme: {updated}</p>}
      {intro && <p className="mt-4 text-lg leading-relaxed text-slate-300">{intro}</p>}
      <div className="prose-skor mt-8 space-y-4 text-[15px] leading-relaxed text-slate-300">{children}</div>
    </main>
  );
}
