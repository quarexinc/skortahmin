'use client';

import { useEffect, useState } from 'react';
import { Avatar, Empty, LinkButton, PageHeader, Spinner } from '@/components/ui';
import { api } from '@/lib/client';

interface Row { id: number; name: string; avatar_color: string; favorite_team: string | null; premium: boolean; points: number; total: number; exact: number; correct: number }
const PERIODS = [
  { id: 'all', label: 'Tüm zamanlar' },
  { id: 'month', label: 'Son 30 gün' },
  { id: 'week', label: 'Son 7 gün' },
];

export default function Leaderboard() {
  const [period, setPeriod] = useState('all');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [meId, setMeId] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    setRows(null);
    api<{ rows: Row[]; meId: number | null }>(`/api/leaderboard?period=${period}`).then(({ data, error }) => {
      if (error) return setErr(error);
      setRows(data!.rows);
      setMeId(data!.meId);
    });
  }, [period]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <PageHeader title="Liderlik tablosu" subtitle="Tam skor 3 puan, doğru sonuç 1 puan. Eşitlikte tam skor sayısı, sonra daha az tahmin öne geçer." />
      <div className="mb-4 flex gap-2">
        {PERIODS.map((p) => (
          <button key={p.id} onClick={() => setPeriod(p.id)} className={`chip ${period === p.id ? 'chip-active' : ''}`}>{p.label}</button>
        ))}
      </div>
      {err ? (
        <Empty icon="🏆" title="Liderlik tablosu şu anda kullanılamıyor">{err}</Empty>
      ) : rows == null ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <Empty icon="🏆" title="Bu dönemde sonuçlanmış tahmin yok">
          Maçlar bittikçe puanlar burada görünecek.
          <div className="mt-4"><LinkButton href="/maclar">Tahmin yap</LinkButton></div>
        </Empty>
      ) : (
        <>
          {rows.length >= 3 && (
            <div className="mb-5 grid grid-cols-3 items-end gap-3">
              {[1, 0, 2].map((i) => {
                const r = rows[i];
                return (
                  <div key={r.id} className={`card flex flex-col items-center p-4 text-center ${i === 0 ? 'border-amber-400/40 pb-7' : ''}`}>
                    <span className="text-2xl">{['🥇', '🥈', '🥉'][i]}</span>
                    <div className="mt-2"><Avatar name={r.name} color={r.avatar_color} size={i === 0 ? 56 : 44} /></div>
                    <p className="mt-2 w-full truncate text-sm font-semibold">{r.name}</p>
                    <p className="text-lg font-black text-accent-soft">{r.points} p</p>
                  </div>
                );
              })}
            </div>
          )}
          <div className="card overflow-x-auto p-0">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="w-12 px-4 py-3">#</th>
                  <th className="px-2 py-3">Üye</th>
                  <th className="px-2 py-3 text-right">Tahmin</th>
                  <th className="px-2 py-3 text-right">Tam skor</th>
                  <th className="px-2 py-3 text-right">İsabet</th>
                  <th className="px-4 py-3 text-right">Puan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((r, i) => (
                  <tr key={r.id} className={r.id === meId ? 'bg-accent/10' : ''}>
                    <td className="px-4 py-3 font-bold text-slate-500">{i + 1}</td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={r.name} color={r.avatar_color} size={28} />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{r.name} {r.premium && '💎'} {r.id === meId && <span className="text-xs text-accent-soft">(sen)</span>}</p>
                          {r.favorite_team && <p className="truncate text-xs text-slate-500">❤️ {r.favorite_team}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-right tabular-nums">{r.total}</td>
                    <td className="px-2 py-3 text-right tabular-nums">{r.exact}</td>
                    <td className="px-2 py-3 text-right tabular-nums">%{Math.round((r.correct / Math.max(1, r.total)) * 100)}</td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-accent-soft">{r.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
