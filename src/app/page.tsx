// Açılış sayfası (animasyonlu)
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  Check,
  Crown,
  FileText,
  Gem,
  GitCompareArrows,
  Headset,
  LineChart,
  Medal,
  MessageSquare,
  MousePointerClick,
  Plus,
  Receipt,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import AdSlot from '@/components/AdSlot';
import FixtureCard from '@/components/FixtureCard';
import CountUp from '@/components/landing/CountUp';
import PoissonDemo from '@/components/landing/PoissonDemo';
import Reveal from '@/components/landing/Reveal';
import RotatingWord from '@/components/landing/RotatingWord';
import NewsletterForm from '@/components/NewsletterForm';
import { Avatar, LinkButton } from '@/components/ui';
import { istDateKey } from '@/config';
import { LEAGUES } from '@/config/leagues';
import { getUser } from '@/lib/auth';
import { dbConfigured, q } from '@/lib/db';
import { DEFAULT_FAQS } from '@/lib/faqs';
import { getDayFixtures } from '@/lib/fixtures';
import { getSettings } from '@/lib/settings';
import type { LightFixture } from '@/lib/types';

export const dynamic = 'force-dynamic';

const FEATURES = [
  { icon: BarChart3, title: 'Poisson skor modeli', text: 'Sezon, form ve karşılıklı maç verisinden her skor için olasılık; formül ve girdiler açık.' },
  { icon: GitCompareArrows, title: 'Form & H2H analizi', text: 'Son 10 maç, ev/deplasman ortalamaları ve iki takımın geçmişi tek ekranda.' },
  { icon: Target, title: 'Tahmin yarışması', text: 'Maç başlamadan skorunu gir; tam skor 3, doğru sonuç 1 puan.' },
  { icon: Trophy, title: 'Liderlik & rozetler', text: 'Haftalık, aylık ve tüm zamanlar sıralaması; başarılarına göre rozet kazan.' },
  { icon: Receipt, title: 'Kupon oluşturucu', text: 'Model olasılıklarından seçim ekle, toplam olasılığı ve adil oranı gör.' },
  { icon: Star, title: 'Favoriler', text: 'Takımlarını ve maçlarını favorile, hesabından tek dokunuşla ulaş.' },
  { icon: Headset, title: 'Canlı destek', text: 'Sorun mu var? Canlı destekten yaz ya da destek talebi aç.' },
  { icon: MessageSquare, title: 'Maç yorumları', text: 'Her maçın altında diğer üyelerle analizlerini paylaş.' },
  { icon: Bell, title: 'Anlık bildirimler', text: 'Tahminin sonuçlandığında, talebine yanıt geldiğinde haberin olsun.' },
  { icon: Search, title: 'Hızlı arama', text: 'Ctrl+K ile takım, maç, üye ve sayfalar arasında anında gezin.' },
  { icon: FileText, title: 'Analiz yazıları', text: 'Blogda maç önizlemeleri, model güncellemeleri ve rehberler.' },
  { icon: Gem, title: 'Premium analiz', text: 'En olası 5 skor, KG, Alt/Üst ve modelin tüm hesap detayları.' },
];

const STEPS = [
  { icon: MousePointerClick, title: 'Maçı seç', text: '13 büyük ligden bugünün ve yarının maçlarına göz at.' },
  { icon: LineChart, title: 'Analizi incele', text: 'Olasılıkları, formu, H2H’yi ve puan durumunu karşılaştır.' },
  { icon: Target, title: 'Tahminini yap', text: 'Skorunu gir, kuponuna ekle, sonuçlanınca puanını topla.' },
];

interface Leader { id: number; name: string; avatar_color: string; points: number; total: number }
interface Post { slug: string; title: string; excerpt: string | null; cover_url: string | null; created_at: string }
interface Faq { question: string; answer: string }

async function loadLanding() {
  let today: LightFixture[] = [];
  try {
    today = (await getDayFixtures(istDateKey(new Date()))).fixtures;
  } catch {
    today = [];
  }
  let leaders: Leader[] = [];
  let posts: Post[] = [];
  let faqs: Faq[] = DEFAULT_FAQS.slice(0, 4).map((f) => ({ question: f.q, answer: f.a }));
  let stats = { users: 0, predictions: 0, comments: 0 };
  if (dbConfigured()) {
    try {
      [leaders, posts] = await Promise.all([
        q<Leader>(
          `SELECT u.id, u.name, u.avatar_color, SUM(p.points)::int AS points, COUNT(*)::int AS total
           FROM predictions p JOIN users u ON u.id = p.user_id
           WHERE p.status = 'scored' AND NOT u.banned GROUP BY u.id ORDER BY points DESC, total ASC LIMIT 5`,
        ),
        q<Post>(`SELECT slug, title, excerpt, cover_url, created_at FROM posts WHERE published ORDER BY created_at DESC LIMIT 3`),
      ]);
      const dbFaqs = await q<Faq>(`SELECT question, answer FROM faqs WHERE active ORDER BY sort, id LIMIT 4`);
      if (dbFaqs.length) faqs = dbFaqs;
      const [s] = await q<typeof stats>(
        `SELECT (SELECT COUNT(*)::int FROM users) AS users, (SELECT COUNT(*)::int FROM predictions) AS predictions, (SELECT COUNT(*)::int FROM comments) AS comments`,
      );
      stats = s;
    } catch {
      /* veritabanı geçici olarak erişilemezse ilgili bölümler gizlenir */
    }
  }
  return { today, leaders, posts, faqs, stats };
}

export default async function Landing() {
  const [{ today, leaders, posts, faqs, stats }, user, settings] = await Promise.all([loadLanding(), getUser(), getSettings()]);
  const upcoming = [...today].sort((a, b) => a.date.localeCompare(b.date));
  const members = dbConfigured();
  const [titlePre, titlePost] = settings.heroTitle.includes('sayılarla') ? settings.heroTitle.split('sayılarla') : [settings.heroTitle, null];

  return (
    <main className="overflow-x-clip">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="grid-bg pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute -left-32 -top-32 h-[28rem] w-[28rem] animate-blob rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-20 h-[22rem] w-[22rem] animate-blob rounded-full bg-cyan-400/10 blur-3xl [animation-delay:-6s]" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 animate-blob rounded-full bg-violet-500/10 blur-3xl [animation-delay:-12s]" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:py-24 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent-soft">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                </span>
                Canlı API-Football verisi
              </span>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
                {titlePost !== null ? (
                  <>
                    {titlePre}
                    <RotatingWord words={['sayılarla', 'verilerle', 'olasılıklarla', 'modelle']} />
                    {titlePost}
                  </>
                ) : (
                  titlePre
                )}
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">{settings.heroSubtitle}</p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-8 flex flex-wrap gap-3">
                <LinkButton href="/maclar" size="lg" className="group shadow-lg shadow-accent/20">
                  Maçlara göz at <ArrowRight size={18} className="transition group-hover:translate-x-1" />
                </LinkButton>
                {!user && members ? (
                  <LinkButton href="/kayit" size="lg" variant="secondary">
                    Ücretsiz üye ol
                  </LinkButton>
                ) : (
                  <LinkButton href="/nasil-calisir" size="lg" variant="secondary">
                    Model nasıl çalışır?
                  </LinkButton>
                )}
              </div>
            </Reveal>
            <Reveal delay={320}>
              <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4">
                <div>
                  <dt className="text-3xl font-black text-white"><CountUp to={LEAGUES.length} /></dt>
                  <dd className="text-xs text-slate-400">takip edilen lig</dd>
                </div>
                <div>
                  <dt className="text-3xl font-black text-white"><CountUp to={upcoming.length} /></dt>
                  <dd className="text-xs text-slate-400">bugünkü maç</dd>
                </div>
                <div>
                  <dt className="text-3xl font-black text-white">{stats.predictions > 0 ? <CountUp to={stats.predictions} /> : <CountUp to={100} prefix="%" />}</dt>
                  <dd className="text-xs text-slate-400">{stats.predictions > 0 ? 'üye tahmini' : 'gerçek veri'}</dd>
                </div>
              </dl>
            </Reveal>
          </div>

          <Reveal delay={200}>
            <div className="relative">
              <div className="absolute -right-3 -top-6 z-10 hidden animate-float items-center gap-2 rounded-2xl border border-white/10 bg-ink-800/90 px-3 py-2 text-xs shadow-xl backdrop-blur sm:flex">
                <ShieldCheck size={16} className="text-accent-soft" /> Şeffaf formül
              </div>
              <div className="absolute -bottom-5 -left-4 z-10 hidden animate-float-slow items-center gap-2 rounded-2xl border border-white/10 bg-ink-800/90 px-3 py-2 text-xs shadow-xl backdrop-blur sm:flex">
                <Zap size={16} className="text-amber-300" /> Anında olasılık
              </div>
              <div className="card relative p-5 backdrop-blur">
                <div className="mb-4 flex items-center justify-between">
                  <p className="flex items-center gap-2 font-semibold">
                    <Activity size={18} className="text-accent-soft" /> Bugünün maçları
                  </p>
                  <Link href="/maclar" className="inline-flex items-center gap-1 text-xs text-accent-soft hover:underline">
                    Tümü <ArrowRight size={12} />
                  </Link>
                </div>
                {upcoming.length > 0 ? (
                  <div className="space-y-3">
                    {upcoming.slice(0, 4).map((f, i) => (
                      <div key={f.id} className="animate-fade-in" style={{ animationDelay: `${300 + i * 120}ms`, animationFillMode: 'both' }}>
                        <FixtureCard f={f} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-10 text-center text-sm text-slate-400">
                    Bugün takip ettiğimiz liglerde maç yok.{' '}
                    <Link href="/maclar" className="text-accent-soft underline">
                      Diğer günlere bak
                    </Link>
                  </p>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* LİG ŞERİDİ */}
      <section className="relative border-b border-white/5 bg-ink-900/40 py-5" aria-label="Takip edilen ligler">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-ink-950 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-ink-950 to-transparent" />
        <div className="flex w-max animate-marquee gap-10 hover:[animation-play-state:paused]">
          {[...LEAGUES, ...LEAGUES].map((l, i) => (
            <span key={i} className="flex shrink-0 items-center gap-2.5 text-sm text-slate-400">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={l.logo} alt="" className="h-6 w-6 object-contain" loading="lazy" />
              {l.name}
            </span>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4">
        <AdSlot placement="home_hero" className="mt-8" />
      </div>

      {/* ÖZELLİKLER */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <Reveal>
          <p className="label-muted text-center">Neler var?</p>
          <h2 className="mt-2 text-center text-3xl font-black tracking-tight sm:text-4xl">Analizden yarışmaya, tek platform</h2>
        </Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 90}>
              <div className="card glow-card group h-full p-5 transition duration-300 hover:-translate-y-1">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent/10 text-accent-soft transition group-hover:scale-110 group-hover:bg-accent/20">
                  <f.icon size={22} />
                </span>
                <p className="mt-4 font-semibold text-white">{f.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* MODEL DEMOSU */}
      <section className="relative border-y border-white/5 bg-ink-900/40">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <Reveal>
            <div className="mb-10 max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                <Sparkles size={14} /> Etkileşimli
              </span>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Modeli kendin dene</h2>
              <p className="mt-2 text-slate-400">Beklenen golleri değiştir; 49 skorun olasılığı, 1X2, Alt/Üst ve KG anında yeniden hesaplansın.</p>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="card p-6">
              <PoissonDemo />
            </div>
          </Reveal>
        </div>
      </section>

      {/* NASIL ÇALIŞIR */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <Reveal>
          <h2 className="text-center text-3xl font-black tracking-tight">3 adımda başla</h2>
        </Reveal>
        <div className="relative mt-12 grid gap-8 md:grid-cols-3">
          <div className="absolute left-[16%] right-[16%] top-7 hidden h-px bg-gradient-to-r from-accent/0 via-accent/50 to-accent/0 md:block" />
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 140}>
              <div className="relative flex flex-col items-center text-center">
                <span className="relative grid h-14 w-14 animate-glow place-items-center rounded-2xl bg-accent text-ink-950">
                  <s.icon size={26} />
                  <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-ink-950 text-xs font-black text-accent-soft ring-2 ring-accent">{i + 1}</span>
                </span>
                <p className="mt-4 font-semibold">{s.title}</p>
                <p className="mt-1 max-w-xs text-sm text-slate-400">{s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4">
        <AdSlot placement="home_middle" />
      </div>

      {/* LİDERLER + TOPLULUK */}
      {members && (
        <section className="mx-auto grid max-w-6xl gap-6 px-4 py-20 lg:grid-cols-2">
          <Reveal>
            <div className="card h-full p-6">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-xl font-black"><Crown size={22} className="text-amber-300" /> Tahmin liderleri</h2>
                <Link href="/liderlik" className="inline-flex items-center gap-1 text-sm text-accent-soft hover:underline">Tümü <ArrowRight size={14} /></Link>
              </div>
              {leaders.length > 0 ? (
                <div className="mt-5 divide-y divide-white/5">
                  {leaders.map((l, i) => (
                    <Link key={l.id} href={`/uye/${l.id}`} className="flex items-center gap-3 py-3 transition hover:bg-white/[.02]">
                      <span className="w-6 text-center">
                        {i < 3 ? <Medal size={18} className={['text-amber-300', 'text-slate-300', 'text-orange-400'][i]} /> : <span className="font-bold text-slate-500">{i + 1}</span>}
                      </span>
                      <Avatar name={l.name} color={l.avatar_color} size={32} />
                      <span className="flex-1 truncate font-medium">{l.name}</span>
                      <span className="text-xs text-slate-500">{l.total} tahmin</span>
                      <span className="w-14 text-right font-bold text-accent-soft">{l.points} p</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="mt-6 text-sm text-slate-400">Maçlar sonuçlandıkça ilk liderler burada görünecek. İlk puanı sen al!</p>
              )}
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="card relative h-full overflow-hidden p-6">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 animate-spin-slow rounded-full border border-dashed border-accent/20" />
              <h2 className="flex items-center gap-2 text-xl font-black"><Users size={22} className="text-accent-soft" /> Topluluk</h2>
              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                {[
                  { v: stats.users, l: 'üye' },
                  { v: stats.predictions, l: 'tahmin' },
                  { v: stats.comments, l: 'yorum' },
                ].map((s) => (
                  <div key={s.l} className="rounded-2xl bg-ink-900/70 p-4">
                    <p className="text-2xl font-black"><CountUp to={s.v} /></p>
                    <p className="text-xs text-slate-500">{s.l}</p>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-sm text-slate-400">Tahmin yap, rozet kazan, yorumlarda analizini paylaş. Liderlik tablosu her maç sonrası güncellenir.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <LinkButton href={user ? '/maclar' : '/kayit'} size="sm">{user ? 'Tahmin yap' : 'Topluluğa katıl'}</LinkButton>
                <LinkButton href="/liderlik" size="sm" variant="secondary">Sıralamayı gör</LinkButton>
              </div>
            </div>
          </Reveal>
        </section>
      )}

      {/* BLOG */}
      {posts.length > 0 && settings.blogEnabled && (
        <section className="mx-auto max-w-6xl px-4 pb-20">
          <Reveal>
            <div className="mb-6 flex items-end justify-between">
              <h2 className="text-3xl font-black tracking-tight">Son yazılar</h2>
              <Link href="/blog" className="inline-flex items-center gap-1 text-sm text-accent-soft hover:underline">Blog <ArrowRight size={14} /></Link>
            </div>
          </Reveal>
          <div className="grid gap-4 md:grid-cols-3">
            {posts.map((p, i) => (
              <Reveal key={p.slug} delay={i * 100}>
                <Link href={`/blog/${p.slug}`} className="card group block h-full overflow-hidden p-0 transition hover:-translate-y-1">
                  {p.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.cover_url} alt="" className="h-40 w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
                  ) : (
                    <div className="grid h-40 place-items-center bg-gradient-to-br from-accent/20 to-cyan-400/10"><FileText size={32} className="text-accent-soft" /></div>
                  )}
                  <div className="p-5">
                    <p className="font-bold group-hover:text-accent-soft">{p.title}</p>
                    {p.excerpt && <p className="mt-1.5 line-clamp-2 text-sm text-slate-400">{p.excerpt}</p>}
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* PLANLAR */}
      <section className="border-y border-white/5 bg-ink-900/40">
        <div className="mx-auto max-w-4xl px-4 py-20">
          <Reveal>
            <h2 className="text-center text-3xl font-black tracking-tight">Üyelik planları</h2>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <Reveal>
              <div className="card h-full p-6">
                <p className="font-semibold text-slate-300">Ücretsiz</p>
                <p className="mt-2 text-3xl font-black">0 TL</p>
                <ul className="mt-5 space-y-2.5 text-sm text-slate-300">
                  {['Tüm maçlar ve 1X2 olasılıkları', 'Form, H2H ve puan durumu', 'Tahmin yarışması, rozetler, liderlik', `${settings.freeCouponLimit} kayıtlı kupon`, 'Yorumlar, favoriler, canlı destek'].map((x) => (
                    <li key={x} className="flex items-start gap-2"><Check size={16} className="mt-0.5 shrink-0 text-accent-soft" /> {x}</li>
                  ))}
                </ul>
                <LinkButton href={user ? '/maclar' : '/kayit'} variant="secondary" className="mt-6 w-full">{user ? 'Maçlara git' : 'Ücretsiz başla'}</LinkButton>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className="card relative h-full overflow-hidden border-accent/40 p-6">
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent_25%,rgba(74,222,128,.08)_50%,transparent_75%)] bg-[length:200%_100%] animate-shimmer" />
                <span className="absolute right-5 top-5 rounded-full bg-accent px-3 py-0.5 text-xs font-bold text-ink-950">Önerilen</span>
                <p className="flex items-center gap-2 font-semibold text-accent-soft"><Gem size={18} /> Premium</p>
                <p className="mt-2 text-3xl font-black">{settings.premiumPriceText}</p>
                <ul className="mt-5 space-y-2.5 text-sm text-slate-300">
                  {['Ücretsiz plandaki her şey', 'En olası 5 skor ve skor matrisi', 'KG Var/Yok, Alt/Üst 1.5 · 2.5 · 3.5', 'Model girdileri & API karşılaştırması', 'Sınırsız kayıtlı kupon', 'Reklamsız deneyim', 'Öncelikli destek'].map((x) => (
                    <li key={x} className="flex items-start gap-2"><Check size={16} className="mt-0.5 shrink-0 text-accent-soft" /> {x}</li>
                  ))}
                </ul>
                <LinkButton href="/premium" className="relative mt-6 w-full">Premium&apos;a geç</LinkButton>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* SSS */}
      <section className="mx-auto max-w-3xl px-4 py-20">
        <Reveal>
          <h2 className="text-center text-3xl font-black tracking-tight">Sık sorulanlar</h2>
        </Reveal>
        <div className="mt-8 space-y-3">
          {faqs.map((f, i) => (
            <Reveal key={f.question} delay={i * 60}>
              <details className="card group p-5">
                <summary className="cursor-pointer list-none font-semibold">
                  <span className="flex items-center justify-between gap-3">
                    {f.question}
                    <Plus size={18} className="shrink-0 text-slate-500 transition group-open:rotate-45" />
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">{f.answer}</p>
              </details>
            </Reveal>
          ))}
        </div>
        <p className="mt-6 text-center">
          <Link href="/sss" className="inline-flex items-center gap-1 text-sm text-accent-soft hover:underline">Tüm sorular <ArrowRight size={14} /></Link>
        </p>
      </section>

      {/* CTA + BÜLTEN */}
      <section className="mx-auto max-w-6xl px-4">
        <Reveal>
          <div className="card relative overflow-hidden px-6 py-14 text-center">
            <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 animate-blob rounded-full bg-accent/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 animate-blob rounded-full bg-cyan-400/10 blur-3xl [animation-delay:-8s]" />
            <div className="relative">
              <h2 className="text-2xl font-black sm:text-4xl">Bir sonraki maçı birlikte analiz edelim.</h2>
              <p className="mx-auto mt-3 max-w-lg text-slate-300">Haftalık maç önizlemeleri ve model güncellemeleri için bültene katıl.</p>
              {settings.newsletterEnabled && members && (
                <div className="mx-auto mt-6 max-w-md">
                  <NewsletterForm />
                </div>
              )}
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <LinkButton href="/maclar" size="lg">Bugünün maçları <ArrowRight size={18} /></LinkButton>
                {!user && members && <LinkButton href="/kayit" size="lg" variant="secondary">Üye ol</LinkButton>}
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
