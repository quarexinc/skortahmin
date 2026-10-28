import Link from 'next/link';

const COLS = [
  {
    title: 'Platform',
    links: [
      { href: '/maclar', label: 'Maç programı' },
      { href: '/liderlik', label: 'Liderlik tablosu' },
      { href: '/kupon', label: 'Kupon oluşturucu' },
      { href: '/premium', label: 'Premium üyelik' },
    ],
  },
  {
    title: 'Destek',
    links: [
      { href: '/sss', label: 'Sıkça sorulan sorular' },
      { href: '/destek', label: 'Destek talepleri' },
      { href: '/iletisim', label: 'İletişim' },
      { href: '/nasil-calisir', label: 'Tahminler nasıl hesaplanır?' },
    ],
  },
  {
    title: 'Kurumsal',
    links: [
      { href: '/hakkimizda', label: 'Hakkımızda' },
      { href: '/kullanim-kosullari', label: 'Kullanım koşulları' },
      { href: '/gizlilik', label: 'Gizlilik politikası' },
      { href: '/kvkk', label: 'KVKK aydınlatma metni' },
      { href: '/sorumlu-oyun', label: 'Sorumlu oyun' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-white/5 bg-ink-900/60">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent/15">⚽</span>
            <span className="font-black">
              Skor <span className="text-accent-soft">Çıkartıcı</span>
            </span>
          </Link>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Gerçek maç verileri ve Poisson modeliyle şeffaf futbol analizi. Tüm sayılar API-Football&apos;dan çalışma
            anında gelir.
          </p>
        </div>
        {COLS.map((c) => (
          <div key={c.title}>
            <p className="label-muted mb-3">{c.title}</p>
            <ul className="space-y-2">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-slate-400 transition hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-[11px] text-slate-500">
          <span>© {new Date().getFullYear()} Skor Çıkartıcı · Veri kaynağı: API-Football v3</span>
          <span>
            18+ · Tahminler matematiksel olasılıklardır; garanti sonuç değildir.{' '}
            <Link href="/sorumlu-oyun" className="underline hover:text-slate-300">
              Sorumlu oyun
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
