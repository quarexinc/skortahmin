'use client';

import { Coins, Medal, Rocket, TrendingUp, Trophy } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import AdSlot from '@/components/AdSlot';
import { Avatar, Empty, LinkButton, PageHeader, Spinner } from '@/components/ui';
import { vipFor } from '@/config/vip';
import { api } from '@/lib/client';
import { fmtCredits, fmtMult, toCredits } from '@/lib/money';

interface Row { id: number; name: string; avatar_color: string; total_wagered: string; bets: number; wagered: string; profit: string; best: number }

const PERIODS = [
  { id: 'day', label: 'Bugün' },
  { id: 'week', label: '7 gün' },
  { id: 'month', label: '30 gün' },
  { id: 'all', label: 'Tüm zamanlar' },
];
const METRICS = [
  { id: 'wagered', label: 'En çok oynayan', icon: Coins },
  { id: 'profit', label: 'En çok kazanan', icon: TrendingUp },
  { id: 'multiplier', label: 'En yüksek çarpan', icon: Rocket },
];

const value = (r: Row, m: string) =>
  m === 'profit' ? `${Number(r.profit) >= 0 ? '+' : ''}${fmtCredits(r.profit, { compact: true })}` : m === 'multiplier' ? fmtMult(r.best) : fmtCredits(r.wagered, { compact: true });

export default function Leaderboard() {
  const [period, setPeriod] = useState('week');
  const [metric, setMetric] = useState('wagered');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [meId, setMeId] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setRows(null);
    api<{ rows: Row[]; meId: number | null }>(`/api/leaderboard?period=${period}&metric=${metric}`).then(({ data, error }) => {
      if (error) return setErr(error);
      setRows(data!.rows);
      setMeId(data!.meId);
    });
  }, [period, metric]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <PageHeader title="Liderlik tablosu" subtitle="Sanal kredilerle oynanan ellerden hesaplanır. Ödül veya değer içermez." />
      <AdSlot placement="leaderboard_side" className="mb-5" />
      <div className="mb-3 grid grid-cols-3 gap-2">
        {METRICS.map((m) => (
          <button key={m.id} onClick={() => setMetric(m.id)} className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition ${metric === m.id ? 'bg-violet-500/25 text-white ring-1 ring-violet-400/40' : 'bg-white/5 text-slate-400 hover:text-white'}`}>
            <m.icon size={16} /> <span className="hidden sm:inline">{m.label}</span>
          </button>
        ))}
      </div>
      <div className="mb-5 flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <button key={p.id} onClick={() => setPeriod(p.id)} className={`chip ${period === p.id ? 'chip-active' : ''}`}>{p.label}</button>
        ))}
      </div>
      {err ? (
        <Empty icon={Trophy} title="Liderlik tablosu şu anda kullanılamıyor">{err}</Empty>
      ) : rows == null ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <Empty icon={Trophy} title="Bu dönemde oynanmış el yok">
          İlk sırayı kapmak için bir oyun seç.
          <div className="mt-4"><LinkButton href="/oyunlar">Oyunlara git</LinkButton></div>
        </Empty>
      ) : (
        <>
          {rows.length >= 3 && (
            <div className="mb-5 grid grid-cols-3 items-end gap-3">
              {[1, 0, 2].map((i) => {
                const r = rows[i];
                return (
                  <div key={r.id} className={`card flex flex-col items-center p-4 text-center ${i === 0 ? 'border-amber-400/40 pb-7' : ''}`}>
                    <Medal size={26} className={['text-amber-300', 'text-slate-300', 'text-orange-400'][i]} />
                    <div className="mt-2"><Avatar name={r.name} color={r.avatar_color} size={i === 0 ? 56 : 44} /></div>
                    <Link href={`/uye/${r.id}`} className="mt-2 w-full truncate text-sm font-semibold hover:text-violet-200">{r.name}</Link>
                    <p className="text-lg font-black text-amber-300">{value(r, metric)}</p>
                  </div>
                );
              })}
            </div>
          )}
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead className="bg-white/[0.03] text-left text-xs text-slate-400">
                  <tr>
                    <th className="w-12 px-4 py-3">#</th>
                    <th className="px-2 py-3">Oyuncu</th>
                    <th className="px-2 py-3 text-right">El</th>
                    <th className="px-2 py-3 text-right">Oynanan</th>
                    <th className="px-2 py-3 text-right">Net</th>
                    <th className="px-4 py-3 text-right">En iyi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {rows.map((r, i) => {
                    const lvl = vipFor(toCredits(r.total_wagered)).current;
                    const p = Number(r.profit);
                    return (
                      <tr key={r.id} className={r.id === meId ? 'bg-violet-500/10' : ''}>
                        <td className="px-4 py-3 font-bold text-slate-400">{i + 1}</td>
                        <td className="px-2 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={r.name} color={r.avatar_color} size={28} />
                            <div className="min-w-0">
                              <Link href={`/uye/${r.id}`} className="block truncate font-semibold hover:text-violet-200">{r.name}</Link>
                              <p className="text-[11px]" style={{ color: lvl.color }}>{lvl.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-3 text-right tabular-nums">{r.bets}</td>
                        <td className={`px-2 py-3 text-right tabular-nums ${metric === 'wagered' ? 'font-bold text-white' : 'text-slate-300'}`}>{fmtCredits(r.wagered, { compact: true })}</td>
                        <td className={`px-2 py-3 text-right tabular-nums ${p >= 0 ? 'text-accent-soft' : 'text-red-300'} ${metric === 'profit' ? 'font-bold' : ''}`}>{p >= 0 ? '+' : ''}{fmtCredits(p, { compact: true })}</td>
                        <td className={`px-4 py-3 text-right tabular-nums ${metric === 'multiplier' ? 'font-bold text-amber-300' : 'text-slate-300'}`}>{fmtMult(r.best)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
