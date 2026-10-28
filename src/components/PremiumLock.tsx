import Link from 'next/link';

export default function PremiumLock({ loggedIn }: { loggedIn: boolean }) {
  return (
    <div className="card relative overflow-hidden p-6">
      <div className="pointer-events-none absolute inset-0 select-none opacity-25 blur-[3px]" aria-hidden>
        <div className="space-y-3 p-2">
          {[62, 48, 40, 33, 25].map((w, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-10 text-sm font-bold">{i}–{(i + 1) % 3}</span>
              <span className="h-2 rounded-full bg-accent" style={{ width: `${w}%` }} />
            </div>
          ))}
        </div>
      </div>
      <div className="relative text-center">
        <span className="text-3xl">💎</span>
        <p className="mt-2 text-lg font-bold">Ayrıntılı analiz Premium üyelere özel</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-slate-400">
          En olası 5 skor, KG Var/Yok, Alt/Üst 1.5 · 2.5 · 3.5, modelin tüm hesap adımları ve API tahmini karşılaştırması.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Link href="/premium" className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-ink-950">
            Premium&apos;a geç
          </Link>
          {!loggedIn && (
            <Link href="/giris" className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold">
              Giriş yap
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
