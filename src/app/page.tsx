// BloxyBet açılış sayfası
import { ArrowRight, BadgeCheck, CalendarCheck, Coins, Crown, Fingerprint, Gift, HeartHandshake, Lock, Plus, ShieldCheck, Sparkles, TicketPercent, Trophy, Vault, Zap } from 'lucide-react';
import Link from 'next/link';
import AdSlot from '@/components/AdSlot';
import GameCards from '@/components/games/GameCards';
import LiveFeed from '@/components/games/LiveFeed';
import CountUp from '@/components/landing/CountUp';
import Reveal from '@/components/landing/Reveal';
import RotatingWord from '@/components/landing/RotatingWord';
import NewsletterForm from '@/components/NewsletterForm';
import { Avatar, LinkButton } from '@/components/ui';
import { VIP_LEVELS } from '@/config/vip';
import { getUser } from '@/lib/auth';
import { dbConfigured, q } from '@/lib/db';
import { DEFAULT_FAQS } from '@/lib/faqs';
import { fmtCredits } from '@/lib/money';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

const PERKS = [
  { icon: Gift, title: 'Hoş geldin kredisi', text: 'Üye olduğun anda hesabına başlangıç kredisi eklenir.' },
  { icon: CalendarCheck, title: 'Günlük bonus', text: 'Her 24 saatte bir, VIP seviyene göre artan bonus.' },
  { icon: Crown, title: '13 VIP seviyesi', text: 'Oynadıkça seviye atla, seviye ödüllerini topla.' },
  { icon: Zap, title: 'Rakeback', text: 'Oynadığın her kredinin bir kısmı sana geri döner.' },
  { icon: Vault, title: 'Kasa', text: 'Kredilerini kasaya kilitle, oyun bakiyenden ayrı tut.' },
  { icon: TicketPercent, title: 'Promosyon kodları', text: 'Etkinliklerde dağıtılan kodlarla ekstra kredi.' },
  { icon: Fingerprint, title: 'Doğrulanabilir adil oyun', text: 'Her sonucu sunucu tohumu, istemci tohumu ve nonce ile kendin doğrula.' },
  { icon: HeartHandshake, title: 'Sorumlu oyun araçları', text: 'Mola, 24 saatlik limit ve oturum hatırlatıcısı.' },
];

interface Big { id: number; game: string; payout: string; multiplier: string; name: string; avatar_color: string; user_id: number }

async function load() {
  let stats = { users: 0, bets: 0, wagered: 0 };
  let big: Big[] = [];
  let faqs = DEFAULT_FAQS.slice(0, 5).map((f) => ({ question: f.q, answer: f.a }));
  if (dbConfigured()) {
    try {
      const [s] = await q(`SELECT (SELECT COUNT(*)::int FROM users) AS users, (SELECT COUNT(*)::int FROM bets) AS bets, (SELECT COALESCE(SUM(amount),0)::bigint FROM bets) AS wagered`);
      stats = { users: s.users, bets: s.bets, wagered: Number(s.wagered) };
      big = await q<Big>(
        `SELECT b.id, b.game, b.payout, b.multiplier, u.name, u.avatar_color, u.id AS user_id FROM bets b JOIN users u ON u.id = b.user_id
         WHERE NOT u.banned AND b.payout > b.amount ORDER BY b.multiplier DESC, b.id DESC LIMIT 6`,
      );
      const db = await q<{ question: string; answer: string }>(`SELECT question, answer FROM faqs WHERE active ORDER BY sort, id LIMIT 5`);
      if (db.length) faqs = db;
    } catch {
      /* geçici veritabanı hatası: ilgili bölümler boş kalır */
    }
  }
  return { stats, big, faqs };
}

export default async function Landing() {
  const [{ stats, big, faqs }, user, s] = await Promise.all([load(), getUser(), getSettings()]);
  const members = dbConfigured();
  const [pre, post] = s.heroTitle.includes('sanal kredilerle') ? s.heroTitle.split('sanal kredilerle') : [s.heroTitle, null];

  return (
    <main className="overflow-x-clip">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="grid-bg pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute -left-32 -top-32 h-[30rem] w-[30rem] animate-blob rounded-full bg-violet-600/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-24 h-[24rem] w-[24rem] animate-blob rounded-full bg-pink-500/15 blur-3xl [animation-delay:-6s]" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 animate-blob rounded-full bg-emerald-500/10 blur-3xl [animation-delay:-12s]" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:py-24 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-200">
                <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-70" /><span className="relative inline-flex h-2 w-2 rounded-full bg-violet-400" /></span>
                Sosyal casino · 18+ · Gerçek para yok
              </span>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
                {post !== null ? (
                  <>
                    {pre}
                    <RotatingWord words={['sanal kredilerle', 'adil sonuçlarla', 'günlük bonuslarla']} />
                    {post}
                  </>
                ) : (
                  pre
                )}
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">{s.heroSubtitle}</p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/oyunlar" className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 px-6 py-3 font-bold text-white shadow-lg shadow-violet-500/25 transition hover:brightness-110">
                  Oyunlara git <ArrowRight size={18} className="transition group-hover:translate-x-1" />
                </Link>
                {!user && members && (
                  <LinkButton href="/kayit" size="lg" variant="secondary">
                    <Gift size={18} /> {s.signupBonus.toLocaleString('tr-TR')} kredi ile başla
                  </LinkButton>
                )}
              </div>
            </Reveal>
            <Reveal delay={320}>
              <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4">
                <div><dt className="text-3xl font-black"><CountUp to={4} /></dt><dd className="text-xs text-slate-400">oyun</dd></div>
                <div><dt className="text-3xl font-black"><CountUp to={stats.bets} /></dt><dd className="text-xs text-slate-400">oynanan el</dd></div>
                <div><dt className="text-3xl font-black"><CountUp to={stats.users} /></dt><dd className="text-xs text-slate-400">oyuncu</dd></div>
              </dl>
            </Reveal>
          </div>

          <Reveal delay={200}>
            <div className="relative mx-auto aspect-square w-full max-w-md">
              <div className="absolute inset-6 animate-spin-slow rounded-full border border-dashed border-violet-400/25" />
              <div className="absolute inset-16 animate-spin-slow rounded-full border border-dashed border-pink-400/20 [animation-direction:reverse]" />
              <div className="absolute inset-0 grid place-items-center">
                <div className="grid h-40 w-40 animate-float place-items-center rounded-[2.5rem] bg-gradient-to-br from-violet-500 to-pink-500 shadow-2xl shadow-violet-500/40">
                  <Coins size={72} className="text-white" strokeWidth={1.5} />
                </div>
              </div>
              {[
                { t: 'left-0 top-10', i: Sparkles, l: 'Günlük bonus', c: 'text-amber-300', d: '' },
                { t: 'right-0 top-24', i: ShieldCheck, l: 'Adil oyun', c: 'text-accent-soft', d: '[animation-delay:-2s]' },
                { t: 'left-4 bottom-16', i: Crown, l: 'VIP ödülleri', c: 'text-violet-300', d: '[animation-delay:-4s]' },
                { t: 'right-6 bottom-6', i: Trophy, l: 'Liderlik', c: 'text-pink-300', d: '[animation-delay:-1s]' },
              ].map((b) => (
                <div key={b.l} className={`absolute ${b.t} flex animate-float-slow items-center gap-2 rounded-2xl border border-white/10 bg-ink-800/90 px-3 py-2 text-xs shadow-xl backdrop-blur ${b.d}`}>
                  <b.i size={16} className={b.c} /> {b.l}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4">
        <AdSlot placement="home_hero" className="mt-8" />
      </div>

      {/* OYUNLAR */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <Reveal>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="label-muted">Oyunlar</p>
              <h2 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Dört oyun, tek cüzdan</h2>
            </div>
            <Link href="/oyunlar" className="inline-flex items-center gap-1 text-sm text-violet-300 hover:underline">Lobiye git <ArrowRight size={14} /></Link>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <GameCards enabled={{ mines: s.minesEnabled, crash: s.crashEnabled, slots: s.slotsEnabled, blackjack: s.blackjackEnabled }} />
        </Reveal>
      </section>

      {/* CANLI */}
      <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-16 lg:grid-cols-[1.4fr_1fr]">
        <Reveal><LiveFeed compact /></Reveal>
        <Reveal delay={120}>
          <div className="card h-full p-5">
            <h3 className="flex items-center gap-2 font-black"><Trophy size={18} className="text-amber-300" /> En yüksek çarpanlar</h3>
            {big.length === 0 ? (
              <p className="mt-4 text-sm text-slate-400">İlk büyük kazanç senin olabilir.</p>
            ) : (
              <ul className="mt-4 space-y-2.5">
                {big.map((b) => (
                  <li key={b.id} className="flex items-center gap-3 text-sm">
                    <Avatar name={b.name} color={b.avatar_color} size={28} />
                    <Link href={`/uye/${b.user_id}`} className="min-w-0 flex-1 truncate hover:text-white">{b.name}</Link>
                    <span className="text-xs capitalize text-slate-500">{b.game}</span>
                    <span className="w-16 text-right font-black tabular-nums text-amber-300">{Number(b.multiplier).toFixed(2).replace('.', ',')}x</span>
                    <span className="w-20 text-right tabular-nums text-accent-soft">+{fmtCredits(b.payout, { compact: true })}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Reveal>
      </section>

      {/* AVANTAJLAR */}
      <section className="border-y border-white/5 bg-ink-900/40">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <Reveal><h2 className="text-center text-3xl font-black tracking-tight sm:text-4xl">Kredini büyütmenin yolları</h2></Reveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PERKS.map((p, i) => (
              <Reveal key={p.title} delay={(i % 4) * 80}>
                <div className="card glow-card group h-full p-5 transition hover:-translate-y-1">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-violet-500/15 text-violet-300 transition group-hover:scale-110"><p.icon size={22} /></span>
                  <p className="mt-4 font-semibold">{p.title}</p>
                  <p className="mt-1.5 text-sm text-slate-400">{p.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* VIP */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <Reveal>
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">VIP yolculuğu</h2>
            <p className="mt-2 text-slate-400">Oynadığın her kredi seni bir sonraki seviyeye taşır.</p>
          </div>
        </Reveal>
        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
          {VIP_LEVELS.slice(1).map((l, i) => (
            <Reveal key={l.level} delay={i * 40}>
              <div className="card w-40 shrink-0 p-4 text-center">
                <Crown size={26} className="mx-auto" style={{ color: l.color }} />
                <p className="mt-2 font-bold">{l.name}</p>
                <p className="text-[11px] text-slate-500">{l.minWager.toLocaleString('tr-TR')} kredi oyna</p>
                <p className="mt-2 text-sm font-semibold text-accent-soft">+{l.reward.toLocaleString('tr-TR')}</p>
                <p className="text-[11px] text-slate-500">%{l.rakeback.toString().replace('.', ',')} rakeback</p>
              </div>
            </Reveal>
          ))}
        </div>
        <p className="mt-4 text-center"><Link href="/vip" className="inline-flex items-center gap-1 text-sm text-violet-300 hover:underline">VIP ayrıntıları <ArrowRight size={14} /></Link></p>
      </section>

      <div className="mx-auto max-w-6xl px-4"><AdSlot placement="home_middle" /></div>

      {/* GÜVEN */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { i: BadgeCheck, t: 'Doğrulanabilir', d: 'Her sonucun sunucu tohumu oyundan önce hash olarak gösterilir; tohumu değiştirdiğinde eskisi açıklanır.', h: '/adil-oyun' },
            { i: Lock, t: 'Gerçek para yok', d: 'Krediler sanaldır; para, ürün ya da herhangi bir değerle alınıp satılamaz, dışarı çekilemez.', h: '/kullanim-kosullari' },
            { i: HeartHandshake, t: 'Sorumlu oyun', d: '18 yaş sınırı, mola, 24 saatlik limit ve oturum hatırlatıcısı her zaman elinin altında.', h: '/sorumlu-oyun' },
          ].map((x, i) => (
            <Reveal key={x.t} delay={i * 100}>
              <Link href={x.h} className="card group block h-full p-6 transition hover:border-violet-400/30">
                <x.i size={28} className="text-violet-300" />
                <p className="mt-4 text-lg font-bold">{x.t}</p>
                <p className="mt-1.5 text-sm text-slate-400">{x.d}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* SSS */}
      <section className="mx-auto max-w-3xl px-4 pb-20">
        <Reveal><h2 className="text-center text-3xl font-black tracking-tight">Sık sorulanlar</h2></Reveal>
        <div className="mt-8 space-y-3">
          {faqs.map((f, i) => (
            <Reveal key={f.question} delay={i * 60}>
              <details className="card group p-5">
                <summary className="cursor-pointer list-none font-semibold">
                  <span className="flex items-center justify-between gap-3">{f.question}<Plus size={18} className="shrink-0 text-slate-500 transition group-open:rotate-45" /></span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">{f.answer}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4">
        <Reveal>
          <div className="card relative overflow-hidden px-6 py-14 text-center">
            <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 animate-blob rounded-full bg-violet-500/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 animate-blob rounded-full bg-pink-500/20 blur-3xl [animation-delay:-8s]" />
            <div className="relative">
              <h2 className="text-2xl font-black sm:text-4xl">Hazır mısın?</h2>
              <p className="mx-auto mt-3 max-w-lg text-slate-300">Etkinlikler, promosyon kodları ve yeni oyunlar için bültene katıl.</p>
              {s.newsletterEnabled && members && <div className="mx-auto mt-6 max-w-md"><NewsletterForm /></div>}
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link href="/oyunlar" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 px-6 py-3 font-bold text-white">Oyna <ArrowRight size={18} /></Link>
                {!user && members && <LinkButton href="/kayit" size="lg" variant="secondary">Üye ol</LinkButton>}
              </div>
              <p className="mt-6 text-xs text-slate-500">18+ · Krediler sanaldır ve paraya çevrilemez · Toplam oynanan: {fmtCredits(stats.wagered, { compact: true })} kredi</p>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
