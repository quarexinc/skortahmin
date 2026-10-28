import { Bomb, CalendarDays, Cherry, Coins, Crown, Gamepad2, Rocket, ShieldCheck, Spade, Trophy, Zap } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BadgeGrid from '@/components/BadgeGrid';
import { Avatar, Card } from '@/components/ui';
import { vipFor } from '@/config/vip';
import { dbConfigured, q, q1 } from '@/lib/db';
import { fmtCredits, fmtMult } from '@/lib/money';
import { userBadges } from '@/lib/userStats';
import { GAME_META } from '@/components/games/meta';

export const dynamic = 'force-dynamic';

interface U { id: number; name: string; avatar_color: string; favorite_team: string | null; bio: string | null; created_at: Date; admin: boolean }
const GAMES: Record<string, { n: string; i: (p: { size?: number; className?: string }) => JSX.Element }> = Object.fromEntries(Object.entries(GAME_META).map(([k, m]) => [k, { n: m.name, i: m.icon }]));

async function load(id: number) {
  if (!dbConfigured() || !Number.isInteger(id)) return null;
  const user = await q1<U>(`SELECT id, name, avatar_color, favorite_team, bio, created_at, role = 'admin' AS admin FROM users WHERE id = $1 AND NOT banned`, [id]);
  if (!user) return null;
  const b = await userBadges(id);
  const big = await q<{ id: number; game: string; amount: string; payout: string; multiplier: string }>(
    `SELECT id, game, amount, payout, multiplier FROM bets WHERE user_id = $1 AND payout > amount ORDER BY payout - amount DESC LIMIT 8`,
    [id],
  );
  return { user, stats: b!.stats, badges: b!.badges, big };
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const d = await load(Number(params.id)).catch(() => null);
  return { title: d ? `${d.user.name} · Oyuncu profili` : 'Oyuncu profili' };
}

export default async function Profile({ params }: { params: { id: string } }) {
  const d = await load(Number(params.id));
  if (!d) notFound();
  const { user: u, stats: s, badges, big } = d;
  const lvl = vipFor(s.wagered).current;
  const fav = u.favorite_team ? GAMES[u.favorite_team] : null;
  const winRate = s.bets ? Math.round((s.wins / s.bets) * 100) : null;

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
              <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-xs" style={{ color: lvl.color }}><Crown size={12} /> {lvl.name}</span>
            </h1>
            <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400">
              <span className="inline-flex items-center gap-1"><CalendarDays size={14} /> {new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(new Date(u.created_at))} tarihinden beri üye</span>
              {fav && <span className="inline-flex items-center gap-1"><fav.i size={14} /> Favori oyun: {fav.n}</span>}
            </p>
            {u.bio && <p className="mt-3 max-w-2xl text-sm text-slate-300">{u.bio}</p>}
          </div>
        </div>
      </Card>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: 'Oynanan el', v: s.bets.toLocaleString('tr-TR'), i: Gamepad2 },
          { l: 'Toplam oynanan', v: fmtCredits(s.wagered * 100, { compact: true }), i: Coins },
          { l: 'En yüksek çarpan', v: s.bestMult ? fmtMult(s.bestMult) : '—', i: Zap },
          { l: 'Kazanma oranı', v: winRate == null ? '—' : `%${winRate}`, i: Trophy },
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
        <h2 className="mb-4 text-lg font-bold">En büyük kazançlar</h2>
        {big.length === 0 ? (
          <p className="text-sm text-slate-500">Henüz kazanç yok.</p>
        ) : (
          <div className="card divide-y divide-white/5 p-0">
            {big.map((b) => {
              const G = GAMES[b.game] ?? GAMES.mines;
              return (
                <div key={b.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                  <G.i size={16} className="text-violet-300" />
                  <span className="flex-1">{G.n}</span>
                  <span className="text-slate-400">{fmtCredits(b.amount)} bahis</span>
                  <span className="w-16 text-right font-bold text-amber-300">{fmtMult(b.multiplier)}</span>
                  <span className="w-24 text-right font-bold tabular-nums text-accent-soft">+{fmtCredits(Number(b.payout) - Number(b.amount))}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
