// Açılış sayfası
import Link from 'next/link';
import FixtureCard from '@/components/FixtureCard';
import { Avatar, LinkButton } from '@/components/ui';
import { istDateKey } from '@/config';
import { LEAGUES } from '@/config/leagues';
import { getUser } from '@/lib/auth';
import { dbConfigured, q } from '@/lib/db';
import { getDayFixtures } from '@/lib/fixtures';
import { getSettings } from '@/lib/settings';
import type { LightFixture } from '@/lib/types';

export const dynamic = 'force-dynamic';

const FEATURES = [
  { icon: '📊', title: 'Poisson skor modeli', text: 'Sezon, form ve karşılıklı maç verisinden her skor için olasılık hesaplanır; formül ve girdiler açıkça gösterilir.' },
  { icon: '🔁', title: 'Form & H2H analizi', text: 'Son 10 maç, ev/deplasman ortalamaları ve iki takımın geçmiş karşılaşmaları tek ekranda.' },
  { icon: '🎯', title: 'Tahmin yarışması', text: 'Maç başlamadan skor tahmini yap; tam skor 3, doğru sonuç 1 puan. Liderlik tablosunda yarış.' },
  { icon: '🧾', title: 'Kupon oluşturucu', text: 'Modelin olasılıklarından seçim ekle, kuponunun toplam olasılığını ve adil oranını gör, kaydet.' },
  { icon: '⭐', title: 'Favoriler', text: 'Takımlarını ve maçlarını favorile, hesabından hızlıca ulaş.' },
  { icon: '💬', title: 'Canlı destek & talepler', text: 'Sorun mu var? Canlı destekten yaz ya da destek talebi aç, yanıtları bildirim olarak al.' },
  { icon: '🗨️', title: 'Maç yorumları', text: 'Her maçın altında diğer üyelerle analizlerini paylaş.' },
  { icon: '🔔', title: 'Bildirimler', text: 'Tahminin sonuçlandığında, talebine yanıt geldiğinde anında haberin olsun.' },
  { icon: '💎', title: 'Premium analiz', text: 'En olası 5 skor, KG Var/Yok, Alt/Üst 1.5–3.5 ve modelin tüm hesap detayları.' },
];

const STEPS = [
  { n: 1, title: 'Maçı seç', text: '13 büyük ligden bugünün ve yarının maçlarına göz at.' },
  { n: 2, title: 'Analizi incele', text: 'Model olasılıkları, form, H2H ve puan durumunu karşılaştır.' },
  { n: 3, title: 'Tahminini yap', text: 'Skorunu gir, kuponuna ekle, sonuçlanınca puanını topla.' },
];

const FAQ = [
  { q: 'Veriler nereden geliyor?', a: 'Tüm maç, istatistik ve oyuncu verileri API-Football v3 servisinden çalışma anında çekilir; uydurma veri kullanılmaz.' },
  { q: 'Tahminler kesin mi?', a: 'Hayır. Tahminler istatistiksel olasılıklardır ve hiçbir sonucu garanti etmez.' },
  { q: 'Üyelik ücretli mi?', a: 'Üyelik ücretsizdir. Detaylı analizler için isteğe bağlı Premium üyelik vardır.' },
];

interface Leader {
  name: string;
  avatar_color: string;
  points: number;
  total: number;
}

async function loadLanding() {
  let today: LightFixture[] = [];
  try {
    today = (await getDayFixtures(istDateKey(new Date()))).fixtures;
  } catch {
    today = [];
  }
  let leaders: Leader[] = [];
  let stats = { users: 0, predictions: 0 };
  if (dbConfigured()) {
    try {
      leaders = await q<Leader>(
        `SELECT u.name, u.avatar_color, SUM(p.points)::int AS points, COUNT(*)::int AS total
         FROM predictions p JOIN users u ON u.id = p.user_id
         WHERE p.status = 'scored' AND NOT u.banned
         GROUP BY u.id ORDER BY points DESC, total ASC LIMIT 5`,
      );
      const [s] = await q<{ users: number; predictions: number }>(
        `SELECT (SELECT COUNT(*)::int FROM users) AS users, (SELECT COUNT(*)::int FROM predictions) AS predictions`,
      );
      stats = s;
    } catch {
      /* veritabanı geçici olarak erişilemezse bölümler gizlenir */
    }
  }
  return { today, leaders, stats };
}

export default async function Landing() {
  const [{ today, leaders, stats }, user, settings] = await Promise.all([loadLanding(), getUser(), getSettings()]);
  const upcoming = [...today].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);

  return (
    <main>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(60% 50% at 20% 10%, rgba(34,197,94,0.18), transparent 70%), radial-gradient(40% 40% at 90% 30%, rgba(56,189,248,0.10), transparent 70%)',
          }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:py-24 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent-soft">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" /> Canlı API-Football verisi
            </span>
            <h1 className="mt-5 text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
              Futbolu <span className="text-accent-soft">sayılarla</span> oku.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-300">
              Gerçek maç verileri ve şeffaf bir Poisson modeliyle her maç için skor olasılıkları. Analizi incele, tahminini
              yap, liderlik tablosunda yarış.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href="/maclar" size="lg">
                Maçlara göz at →
              </LinkButton>
              {!user && dbConfigured() && (
                <LinkButton href="/kayit" size="lg" variant="secondary">
                  Ücretsiz üye ol
                </LinkButton>
              )}
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4">
              {[
                { k: `${LEAGUES.length}`, v: 'lig' },
                { k: '4', v: 'analiz sekmesi' },
                { k: '%100', v: 'gerçek veri' },
              ].map((s) => (
                <div key={s.v}>
                  <dt className="text-2xl font-black text-white">{s.k}</dt>
                  <dd className="text-xs text-slate-400">{s.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-semibold">Bugünün maçları</p>
              <Link href="/maclar" className="text-xs text-accent-soft hover:underline">
                Tümü →
              </Link>
            </div>
            {upcoming.length > 0 ? (
              <div className="space-y-3">
                {upcoming.slice(0, 4).map((f) => (
                  <FixtureCard key={f.id} f={f} />
                ))}
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-slate-400">
                Bugün takip ettiğimiz liglerde maç yok. <Link href="/maclar" className="text-accent-soft underline">Diğer günlere bak</Link>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* LİGLER */}
      <section className="border-b border-white/5 bg-ink-900/40">
        <div className="no-scrollbar mx-auto flex max-w-6xl gap-6 overflow-x-auto px-4 py-5">
          {LEAGUES.map((l) => (
            <span key={l.id} className="flex shrink-0 items-center gap-2 text-sm text-slate-400">
              <img src={l.logo} alt="" className="h-5 w-5 object-contain" loading="lazy" />
              {l.name}
            </span>
          ))}
        </div>
      </section>

      {/* ÖZELLİKLER */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <p className="label-muted text-center">Neler var?</p>
        <h2 className="mt-2 text-center text-3xl font-black tracking-tight sm:text-4xl">Analizden yarışmaya, tek platform</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-5 transition hover:border-accent/30">
              <span className="text-2xl">{f.icon}</span>
              <p className="mt-3 font-semibold text-white">{f.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* NASIL ÇALIŞIR */}
      <section className="border-y border-white/5 bg-ink-900/40">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-center text-3xl font-black tracking-tight">3 adımda başla</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="flex gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-accent text-lg font-black text-ink-950">{s.n}</span>
                <div>
                  <p className="font-semibold">{s.title}</p>
                  <p className="mt-1 text-sm text-slate-400">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-10 text-center text-sm text-slate-400">
            Modelin nasıl çalıştığını merak ediyor musun?{' '}
            <Link href="/nasil-calisir" className="text-accent-soft underline">
              Hesaplama yöntemini oku
            </Link>
          </p>
        </div>
      </section>

      {/* LİDERLİK */}
      {leaders.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-20">
          <div className="mx-auto max-w-xl">
            <h2 className="text-center text-3xl font-black tracking-tight">Tahmin liderleri</h2>
            <div className="card mt-8 divide-y divide-white/5 p-0">
              {leaders.map((l, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <span className="w-6 text-center font-bold text-slate-500">{['🥇', '🥈', '🥉'][i] ?? i + 1}</span>
                  <Avatar name={l.name} color={l.avatar_color} size={32} />
                  <span className="flex-1 truncate font-medium">{l.name}</span>
                  <span className="text-sm text-slate-400">{l.total} tahmin</span>
                  <span className="w-16 text-right font-bold text-accent-soft">{l.points} p</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-center">
              <Link href="/liderlik" className="text-sm text-accent-soft hover:underline">
                Tüm tablo →
              </Link>
            </p>
          </div>
        </section>
      )}

      {/* FİYAT */}
      <section className="border-y border-white/5 bg-ink-900/40">
        <div className="mx-auto max-w-4xl px-4 py-20">
          <h2 className="text-center text-3xl font-black tracking-tight">Üyelik planları</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <div className="card p-6">
              <p className="font-semibold text-slate-300">Ücretsiz</p>
              <p className="mt-2 text-3xl font-black">0 TL</p>
              <ul className="mt-5 space-y-2 text-sm text-slate-300">
                {['Tüm maçlar ve 1X2 olasılıkları', 'Form, H2H ve puan durumu', 'Tahmin yarışması & liderlik', `${settings.freeCouponLimit} kayıtlı kupon`, 'Yorumlar, favoriler, canlı destek'].map((x) => (
                  <li key={x}>✓ {x}</li>
                ))}
              </ul>
              <LinkButton href={user ? '/maclar' : '/kayit'} variant="secondary" className="mt-6 w-full">
                {user ? 'Maçlara git' : 'Ücretsiz başla'}
              </LinkButton>
            </div>
            <div className="card relative border-accent/40 p-6">
              <span className="absolute -top-3 right-5 rounded-full bg-accent px-3 py-0.5 text-xs font-bold text-ink-950">Önerilen</span>
              <p className="font-semibold text-accent-soft">💎 Premium</p>
              <p className="mt-2 text-3xl font-black">{settings.premiumPriceText}</p>
              <ul className="mt-5 space-y-2 text-sm text-slate-300">
                {['Ücretsiz plandaki her şey', 'En olası 5 skor ve skor matrisi', 'KG Var/Yok, Alt/Üst 1.5 · 2.5 · 3.5', 'Model girdileri & API tahmini karşılaştırması', 'Sınırsız kayıtlı kupon', 'Öncelikli destek'].map((x) => (
                  <li key={x}>✓ {x}</li>
                ))}
              </ul>
              <LinkButton href="/premium" className="mt-6 w-full">
                Premium&apos;a geç
              </LinkButton>
            </div>
          </div>
        </div>
      </section>

      {/* SSS */}
      <section className="mx-auto max-w-3xl px-4 py-20">
        <h2 className="text-center text-3xl font-black tracking-tight">Sık sorulanlar</h2>
        <div className="mt-8 space-y-3">
          {FAQ.map((f) => (
            <details key={f.q} className="card group p-5">
              <summary className="cursor-pointer list-none font-semibold marker:hidden">
                <span className="flex items-center justify-between gap-3">
                  {f.q}
                  <span className="text-slate-500 transition group-open:rotate-45">＋</span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">{f.a}</p>
            </details>
          ))}
        </div>
        <p className="mt-6 text-center">
          <Link href="/sss" className="text-sm text-accent-soft hover:underline">
            Tüm sorular →
          </Link>
        </p>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4">
        <div className="card flex flex-col items-center gap-4 bg-gradient-to-br from-accent/15 to-transparent px-6 py-12 text-center">
          <h2 className="text-2xl font-black sm:text-3xl">Bir sonraki maçı birlikte analiz edelim.</h2>
          <p className="max-w-lg text-slate-300">
            {stats.users > 0 ? `${stats.users} üye şimdiden ${stats.predictions} tahmin yaptı. ` : ''}Hemen başla, ücretsiz.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <LinkButton href="/maclar" size="lg">
              Bugünün maçları
            </LinkButton>
            {!user && dbConfigured() && (
              <LinkButton href="/kayit" size="lg" variant="secondary">
                Üye ol
              </LinkButton>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
