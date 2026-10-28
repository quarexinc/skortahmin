import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <p className="text-6xl font-black text-accent-soft">404</p>
      <h1 className="mt-3 text-2xl font-black">Bu sayfa ofsayta düştü</h1>
      <p className="mt-2 text-slate-400">Aradığın sayfa taşınmış ya da hiç var olmamış olabilir.</p>
      <div className="mt-6 flex gap-3">
        <Link href="/" className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-ink-950">Ana sayfa</Link>
        <Link href="/maclar" className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold">Maçlar</Link>
      </div>
    </main>
  );
}
