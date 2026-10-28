'use client';

import { Activity, Flame } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Avatar } from '@/components/ui';
import { timeAgo } from '@/lib/client';
import { fmtCredits, fmtMult } from '@/lib/money';
import { GAME_META } from './meta';

interface B { id: number; game: keyof typeof GAME_META; amount: string; payout: string; multiplier: string; created_at: string; user_id: number; name: string; avatar_color: string }

export default function LiveFeed({ game, compact = false }: { game?: string; compact?: boolean }) {
  const [tab, setTab] = useState<'recent' | 'big'>('recent');
  const [d, setD] = useState<{ recent: B[]; big: B[] } | null>(null);
  useEffect(() => {
    const load = () => fetch('/api/bets/feed', { cache: 'no-store' }).then((r) => r.json()).then(setD).catch(() => undefined);
    load();
    const t = setInterval(() => document.visibilityState === 'visible' && load(), 5000);
    return () => clearInterval(t);
  }, []);
  const rows = (d?.[tab] ?? []).filter((b) => !game || b.game === game).slice(0, compact ? 8 : 15);
  return (
    <div className="card overflow-hidden p-0">
      <div className="flex items-center gap-1 border-b border-white/5 p-2">
        <button onClick={() => setTab('recent')} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold ${tab === 'recent' ? 'bg-white/5 text-white' : 'text-slate-400'}`}>
          <Activity size={15} /> Son bahisler
        </button>
        <button onClick={() => setTab('big')} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold ${tab === 'big' ? 'bg-white/5 text-white' : 'text-slate-400'}`}>
          <Flame size={15} /> Büyük kazançlar
        </button>
        <span className="ml-auto mr-2 flex items-center gap-1.5 text-[11px] text-slate-500"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" /> canlı</span>
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-slate-500">Henüz bahis yok.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-4 py-2">Oyun</th><th className="px-2 py-2">Oyuncu</th><th className="px-2 py-2 text-right">Bahis</th><th className="px-2 py-2 text-right">Çarpan</th><th className="px-4 py-2 text-right">Sonuç</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((b) => {
                const M = GAME_META[b.game];
                const profit = Number(b.payout) - Number(b.amount);
                return (
                  <tr key={b.id} className="animate-fade-in">
                    <td className="px-4 py-2"><span className="inline-flex items-center gap-1.5 text-slate-300">{M && <M.icon size={14} style={{ color: M.color }} />} {M?.name}</span></td>
                    <td className="px-2 py-2"><Link href={`/uye/${b.user_id}`} className="inline-flex items-center gap-1.5 hover:text-white"><Avatar name={b.name} color={b.avatar_color} size={20} /> <span className="max-w-[8rem] truncate text-slate-300">{b.name}</span></Link></td>
                    <td className="px-2 py-2 text-right tabular-nums text-slate-400">{fmtCredits(b.amount)}</td>
                    <td className={`px-2 py-2 text-right font-semibold tabular-nums ${Number(b.multiplier) >= 1 ? 'text-white' : 'text-slate-500'}`}>{fmtMult(b.multiplier)}</td>
                    <td className={`px-4 py-2 text-right font-bold tabular-nums ${profit > 0 ? 'text-accent-soft' : 'text-slate-500'}`} title={timeAgo(b.created_at)}>
                      {profit > 0 ? '+' : ''}{fmtCredits(profit)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
