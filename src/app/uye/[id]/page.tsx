import { CalendarDays, Crosshair, Gem, Heart, ShieldCheck, Target, Trophy } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import BadgeGrid from '@/components/BadgeGrid';
import { Avatar, Card } from '@/components/ui';
import { dbConfigured, q, q1 } from '@/lib/db';
import { userBadges } from '@/lib/userStats';

export const dynamic = 'force-dynamic';

interface U { id: number; name: string; avatar_color: string; favorite_team: string | null; bio: string | null; created_at: Date; admin: boolean; premium: boolean }

async function load(id: number) {
  if (!dbConfigured() || !Number.isInteger(id)) return null;
  const user = await q1<U>(
    `SELECT id, name, avatar_color, favorite_team, bio, created_at, role = 'admin' AS admin,
       (plan = 'premium' AND (premium_until IS NULL OR premium_until > NOW())) AS premium
     FROM users WHERE id = $1 AND NOT banned`,
    [id],
  );
  if (!user) return null;
  const b = await userBadges(id);
  const recent = await q<{ fixture_id: number; home_name: string; away_name: string; home_goals: number; away_goals: number; actual_home: number; actual_away: number; points: number }>(
    `SELECT fixture_id, home_name, away_name, home_goals, away_goals, actual_home, actual_away, points
     FROM predictions WHERE user_id = $1 AND status = 'scored' ORDER BY fixture_date DESC LIMIT 10`,
    [id],
  );
  return { user, stats: b!.stats, badges: b!.badges, recent };
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const d = await load(Number(params.id)).catch(() => null);
  return { title: d ? `${d.user.name} · Üye profili` : 'Üye profili' };
}

export default async function Profile({ params }: { params: { id: string } }) {
  const d = await load(Number(params.id));
  if (!d) notFound();
  const { user: u, stats: s, badges, recent } = d;
  const acc = s.predictions ? Math.round((s.correct / Math.max(1, s.predictions)) * 100) : null;
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Card className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl" style={{ background: `${u.avatar_color}33` }} />
        <div className="relative flex flex-wrap items-center gap-5">
          <Avatar name={u.name} color={u.avatar_color} size={80} />
          <div className="min-w-0 flex-1">
            <h1 className="flex flex-wrap items-center gap-2 text-2xl font-black">
              {u.name}
              {u.admin && <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-2 py-0.5 text-xs text-violet-300"><ShieldCheck size={12} /> Yönetici</span>}
              {!u.admin && u.premium && <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-xs text-amber-300"><Gem size={12} /> Premium</span>}
            </h1>
            <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400">
              <span className="inline-flex items-center gap-1"><CalendarDays size={14} /> {new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(new Date(u.created_at))} tarihinden beri üye</span>
              {u.favorite_team && <span className="inline-flex items-center gap-1"><Heart size={14} /> {u.favorite_team}</span>}
            </p>
            {u.bio && <p className="mt-3 max-w-2xl text-sm text-slate-300">{u.bio}</p>}
          </div>
        </div>
      </Card>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: 'Puan', v: s.points, i: Trophy },
          { l: 'Sıralama', v: s.rank ? `#${s.rank}` : '—', i: Target },
          { l: 'Tam skor', v: s.exact, i: Crosshair },
          { l: 'İsabet', v: acc == null ? '—' : `%${acc}`, i: Target },
        ].map((t) => (
          <div key={t.l} className="card p-4">
            <p className="flex items-center gap-1.5 text-xs text-slate-500"><t.i size={14} /> {t.l}</p>
            <p className="mt-1 text-2xl font-black tabular-nums">{t.v}</p>
          </div>
        ))}
      </div>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-bold">Rozetler <span className="text-sm font-normal text-slate-500">({badges.filter((b) => b.earned).length})</span></h2>
        <BadgeGrid badges={badges} showLocked={false} />
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-bold">Son sonuçlanan tahminler</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-slate-500">Henüz sonuçlanmış tahmin yok.</p>
        ) : (
          <div className="card divide-y divide-white/5 p-0">
            {recent.map((p) => (
              <Link key={p.fixture_id} href={`/mac/${p.fixture_id}`} className="flex items-center gap-3 px-5 py-3 text-sm transition hover:bg-white/5">
                <span className="min-w-0 flex-1 truncate">{p.home_name} – {p.away_name}</span>
                <span className="text-slate-400">Tahmin <b className="text-white">{p.home_goals}–{p.away_goals}</b></span>
                <span className="text-slate-400">Sonuç <b className="text-white">{p.actual_home}–{p.actual_away}</b></span>
                <span className={`w-14 text-right font-bold ${p.points === 3 ? 'text-accent-soft' : p.points === 1 ? 'text-sky-400' : 'text-slate-500'}`}>+{p.points}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
