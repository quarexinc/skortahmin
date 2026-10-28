'use client';

import { Bomb, Cherry, Crown, Gamepad2, HeartHandshake, LifeBuoy, Rocket, Spade, Trophy, Wallet, Zap } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import BadgeGrid from '@/components/BadgeGrid';
import AgeVerify from '@/components/games/AgeVerify';
import { Avatar, Badge, Card, Spinner } from '@/components/ui';
import type { BadgeStats, EarnedBadge } from '@/config/badges';
import { vipFor } from '@/config/vip';
import { api, fmtDate, timeAgo } from '@/lib/client';
import { fmtCredits, fmtMult, toCredits } from '@/lib/money';

interface Summary {
  stats: BadgeStats | null;
  badges: EarnedBadge[];
  games: { game: string; bets: number; wagered: number; payout: number; best: number }[];
  recent: { id: number; game: string; amount: string; payout: string; multiplier: string; created_at: string }[];
  openTickets: number;
  unread: number;
  rakeback: number;
}

const GAME = { mines: { n: 'Mines', i: Bomb, c: 'text-rose-300' }, crash: { n: 'Crash', i: Rocket, c: 'text-pink-300' }, slots: { n: 'Slots', i: Cherry, c: 'text-amber-300' }, blackjack: { n: 'Blackjack', i: Spade, c: 'text-emerald-300' } } as Record<string, { n: string; i: typeof Bomb; c: string }>;

export default function AccountHome() {
  const { user } = useAuth();
  const [d, setD] = useState<Summary | null>(null);
  useEffect(() => {
    api<Summary>('/api/account').then((r) => setD(r.data));
  }, []);
  if (!user) return null;
  const vip = vipFor(toCredits(user.wagered));
  const earned = d?.badges.filter((b) => b.earned) ?? [];

  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-center gap-4">
        <Avatar name={user.name} color={user.avatarColor} size={60} />
        <div className="min-w-0 flex-1">
          <p className="text-xl font-black">{user.name}</p>
          <p className="text-sm text-slate-400">{user.email} · üye {fmtDate(user.createdAt)}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge color="violet"><Crown size={12} /> {vip.current.name}</Badge>
            {user.isAdmin && <Badge color="red">Yönetici</Badge>}
            {user.selfExcludedUntil && <Badge color="amber">Molada · {fmtDate(user.selfExcludedUntil)}</Badge>}
          </div>
        </div>
        <Link href={`/uye/${user.id}`} className="text-sm text-violet-300 hover:underline">Herkese açık profil</Link>
      </Card>

      {!user.ageVerified && <AgeVerify />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { l: 'Oyun bakiyesi', v: fmtCredits(user.balance), h: '/cuzdan', i: Wallet },
          { l: 'Kasa', v: fmtCredits(user.vault), h: '/cuzdan', i: Wallet },
          { l: 'Toplanacak rakeback', v: d ? fmtCredits(d.rakeback) : '…', h: '/cuzdan', i: Zap },
          { l: 'Toplam oynanan', v: fmtCredits(user.wagered, { compact: true }), h: '/vip', i: Crown },
        ].map((x) => (
          <Link key={x.l} href={x.h} className="card p-4 transition hover:border-violet-400/30">
            <p className="flex items-center gap-1.5 text-xs text-slate-400"><x.i size={13} /> {x.l}</p>
            <p className="mt-1 text-2xl font-black tabular-nums">{x.v}</p>
          </Link>
        ))}
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <p className="font-bold">VIP ilerlemesi</p>
          <Link href="/vip" className="text-sm text-violet-300 hover:underline">Seviyeler</Link>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/5">
          <div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-pink-400" style={{ width: `${Math.round(vip.progress * 100)}%` }} />
        </div>
        <p className="mt-2 text-xs text-slate-400">{vip.next ? `${vip.current.name} → ${vip.next.name} · %${Math.round(vip.progress * 100)}` : 'En yüksek seviyedesin.'}</p>
      </Card>

      {!d ? (
        <Spinner />
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <p className="mb-3 flex items-center gap-2 font-bold"><Gamepad2 size={18} className="text-violet-300" /> Oyunlara göre</p>
              {d.games.length === 0 ? (
                <p className="text-sm text-slate-400">Henüz oynamadın. <Link href="/oyunlar" className="text-violet-300 underline">Bir oyun seç</Link>.</p>
              ) : (
                <ul className="space-y-2.5 text-sm">
                  {d.games.map((g) => {
                    const m = GAME[g.game];
                    const net = g.payout - g.wagered;
                    return (
                      <li key={g.game} className="flex items-center gap-3">
                        <m.i size={18} className={m.c} />
                        <span className="flex-1 font-medium">{m.n}</span>
                        <span className="text-xs text-slate-500">{g.bets} el</span>
                        <span className="w-20 text-right tabular-nums text-slate-300">{fmtCredits(g.wagered, { compact: true })}</span>
                        <span className={`w-20 text-right tabular-nums ${net >= 0 ? 'text-accent-soft' : 'text-red-300'}`}>{net >= 0 ? '+' : ''}{fmtCredits(net, { compact: true })}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <p className="font-bold">Son eller</p>
                <Link href="/hesap/oyun-gecmisi" className="text-sm text-violet-300 hover:underline">Tümü</Link>
              </div>
              {d.recent.length === 0 ? (
                <p className="text-sm text-slate-400">Oyun geçmişin burada görünecek.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {d.recent.map((b) => {
                    const m = GAME[b.game];
                    const net = Number(b.payout) - Number(b.amount);
                    return (
                      <li key={b.id} className="flex items-center gap-3">
                        <m.i size={16} className={m.c} />
                        <span className="flex-1 text-slate-400">{timeAgo(b.created_at)}</span>
                        <span className="w-14 text-right tabular-nums text-slate-400">{fmtMult(b.multiplier)}</span>
                        <span className={`w-20 text-right tabular-nums ${net >= 0 ? 'text-accent-soft' : 'text-red-300'}`}>{net >= 0 ? '+' : ''}{fmtCredits(net)}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </div>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <p className="font-bold">Rozetler <span className="text-sm font-normal text-slate-500">{earned.length}/{d.badges.length}</span></p>
              <Link href="/hesap/rozetler" className="text-sm text-violet-300 hover:underline">Tümü</Link>
            </div>
            {earned.length ? <BadgeGrid badges={earned} compact showLocked={false} /> : <p className="text-sm text-slate-400">İlk elini oynayarak ilk rozetini kazan.</p>}
          </Card>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { href: '/oyunlar', icon: Gamepad2, t: 'Oyna', d: 'Crash, Mines, Slots ve Blackjack.' },
              { href: '/destek', icon: LifeBuoy, t: 'Destek', d: d.openTickets ? `${d.openTickets} açık talebin var.` : 'Bir sorun mu var? Bize yaz.' },
              { href: '/hesap/sorumlu-oyun', icon: HeartHandshake, t: 'Sorumlu oyun', d: 'Mola, limit ve hatırlatıcılar.' },
            ].map((x) => (
              <Link key={x.href} href={x.href} className="card group p-5 transition hover:border-violet-400/30">
                <x.icon size={22} className="text-violet-300" />
                <p className="mt-3 font-semibold">{x.t}</p>
                <p className="mt-1 text-sm text-slate-400">{x.d}</p>
              </Link>
            ))}
          </div>
          {d.stats && d.stats.rank && (
            <p className="flex items-center gap-2 text-sm text-slate-400"><Trophy size={16} className="text-amber-300" /> Toplam oynanan sıralamasında <b className="text-white">#{d.stats.rank}</b></p>
          )}
        </>
      )}
    </div>
  );
}
