'use client';

import { Coins } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button, Card, Empty, Input, PageHeader, Select, Spinner } from '@/components/ui';
import { TX_TYPES, txType } from '@/config/txTypes';
import { api, fmtDateTime } from '@/lib/client';
import { fmtCredits } from '@/lib/money';

interface Item { id: number; type: string; amount: string; balance_after: string; ref: string | null; note: string | null; created_at: string; user_id: number; name: string }
interface D { items: Item[]; more: boolean; summary: { type: string; n: number; sum: string; sum_day: string | null }[] }

export default function AdminTx() {
  const [type, setType] = useState('');
  const [user, setUser] = useState('');
  const [page, setPage] = useState(0);
  const [d, setD] = useState<D | null>(null);

  useEffect(() => {
    setD(null);
    const p = new URLSearchParams({ page: String(page) });
    if (type) p.set('type', type);
    if (user) p.set('user', user);
    api<D>(`/api/admin/transactions?${p}`).then((r) => setD(r.data));
  }, [type, user, page]);

  return (
    <div className="space-y-6">
      <PageHeader title="Kredi işlemleri" subtitle="Tüm bakiye hareketlerinin değiştirilemez defteri. Krediler sanaldır; para karşılığı yoktur." />
      {!d ? (
        <Spinner />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {d.summary.map((s) => {
              const t = txType(s.type);
              return (
                <button key={s.type} onClick={() => { setType(s.type); setPage(0); }} className={`card p-4 text-left transition hover:border-violet-400/30 ${type === s.type ? 'ring-1 ring-violet-400/40' : ''}`}>
                  <p className="flex items-center gap-1.5 text-xs text-slate-500"><t.icon size={14} className={t.color} /> {t.label}</p>
                  <p className="mt-1 text-xl font-black tabular-nums">{fmtCredits(s.sum, { compact: true })}</p>
                  <p className="text-[11px] text-slate-500">{s.n} işlem · bugün {fmtCredits(s.sum_day ?? 0, { compact: true })}</p>
                </button>
              );
            })}
          </div>
          <Card className="p-0">
            <div className="flex flex-wrap gap-2 border-b border-white/5 p-4">
              <Select value={type} onChange={(e) => { setType(e.target.value); setPage(0); }} className="w-52">
                <option value="">Tüm türler</option>
                {Object.entries(TX_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </Select>
              <Input value={user} onChange={(e) => { setUser(e.target.value.replace(/\D/g, '')); setPage(0); }} placeholder="Üye ID" className="w-32" />
            </div>
            {d.items.length === 0 ? (
              <Empty icon={Coins} title="İşlem yok" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="bg-white/[0.03] text-left text-xs text-slate-400">
                    <tr><th className="px-4 py-2.5">#</th><th className="px-2">Üye</th><th className="px-2">Tür</th><th className="px-2">Açıklama</th><th className="px-2 text-right">Tutar</th><th className="px-2 text-right">Bakiye</th><th className="px-4">Zaman</th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {d.items.map((t) => {
                      const ty = txType(t.type);
                      const a = Number(t.amount);
                      return (
                        <tr key={t.id}>
                          <td className="px-4 py-2 text-slate-500">{t.id}</td>
                          <td className="px-2"><Link href={`/admin/kullanicilar?q=${t.user_id}`} className="hover:text-violet-200">{t.name}</Link></td>
                          <td className="px-2"><span className="inline-flex items-center gap-1.5"><ty.icon size={14} className={ty.color} /> {ty.label}</span></td>
                          <td className="max-w-[220px] truncate px-2 text-xs text-slate-500">{[t.ref, t.note].filter(Boolean).join(' · ')}</td>
                          <td className={`px-2 text-right tabular-nums ${a >= 0 ? 'text-accent-soft' : 'text-slate-300'}`}>{a >= 0 ? '+' : ''}{fmtCredits(a)}</td>
                          <td className="px-2 text-right tabular-nums text-slate-400">{fmtCredits(t.balance_after)}</td>
                          <td className="px-4 text-xs text-slate-500">{fmtDateTime(t.created_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
          <div className="flex justify-between">
            <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Önceki</Button>
            <Button variant="secondary" size="sm" disabled={!d.more} onClick={() => setPage((p) => p + 1)}>Sonraki</Button>
          </div>
        </>
      )}
    </div>
  );
}
