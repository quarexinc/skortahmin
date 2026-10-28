import { Mail } from 'lucide-react';
import Link from 'next/link';
import AdSlot from './AdSlot';
import { Logo } from './Logo';
import NewsletterForm from './NewsletterForm';
import { dbConfigured, q } from '@/lib/db';
import { getSettings } from '@/lib/settings';

const COLS = [
  {
    title: 'Oyunlar',
    links: [
      { href: '/oyunlar/crash', label: 'Crash' },
      { href: '/oyunlar/mines', label: 'Mines' },
      { href: '/oyunlar/slots', label: 'Slots' },
      { href: '/oyunlar/blackjack', label: 'Blackjack' },
      { href: '/liderlik', label: 'Liderlik tablosu' },
      { href: '/vip', label: 'VIP kulübü' },
    ],
  },
  {
    title: 'Destek',
    links: [
      { href: '/sss', label: 'Sıkça sorulan sorular' },
      { href: '/adil-oyun', label: 'Adil oyun & doğrulama' },
      { href: '/destek', label: 'Destek talepleri' },
      { href: '/iletisim', label: 'İletişim' },
      { href: '/blog', label: 'Blog' },
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

export default async function Footer() {
  const s = await getSettings();
  const pages = dbConfigured()
    ? await q<{ slug: string; title: string }>('SELECT slug, title FROM pages WHERE published AND show_in_footer ORDER BY title').catch(() => [])
    : [];
  const cols = COLS.map((c) => (c.title === 'Kurumsal' ? { ...c, links: [...c.links, ...pages.map((p) => ({ href: `/sayfa/${p.slug}`, label: p.title }))] } : c));
  return (
    <>
      <div className="mx-auto mt-12 w-full max-w-6xl px-4">
        <AdSlot placement="footer_top" />
      </div>
      <footer className="mt-12 border-t border-white/5 bg-ink-900/60">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" aria-label="Ana sayfa">
              <Logo size={30} />
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Sanal kredilerle oynanan sosyal casino. Doğrulanabilir adil sonuçlar, günlük bonuslar ve VIP seviyeleri. Gerçek para yatırılmaz, kazanılmaz, çekilmez.
            </p>
            {s.newsletterEnabled && dbConfigured() && (
              <div className="mt-5">
                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><Mail size={15} /> Etkinlik bülteni</p>
                <NewsletterForm compact />
              </div>
            )}
          </div>
          {cols.map((c) => (
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
            <span className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-full border border-red-400/50 text-[9px] font-black text-red-300">18+</span>
              © {new Date().getFullYear()} BloxyBet
            </span>
            <span>
              Krediler sanaldır; para, ürün veya herhangi bir değerle alınıp satılamaz ve dışarı çekilemez.{' '}
              <Link href="/sorumlu-oyun" className="underline hover:text-slate-300">Sorumlu oyun</Link>
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}
