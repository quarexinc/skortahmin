'use client';

import { ListOrdered } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button, Card, Empty, PageHeader, Select, Spinner } from '@/components/ui';
import { TX_TYPES, txType } from '@/config/txTypes';
import { api, fmtDateTime } from '@/lib/client';
import { fmtCredits } from '@/lib/money';

interface Tx { id: number; type: string; amount: string; balance_after: string; ref: string | null; note: string | null; created_at: string }

export default function Transactions() {
  const [type, setType] = useState('');
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<Tx[] | null>(null);
  const [more, setMore] = useState(false);
  const [totals, setTotals] = useState<{ type: string; n: number; sum: string }[]>([]);

  useEffect(() => {
    setItems(null);
    api<{ items: Tx[]; more: boolean; totals: typeof totals }>(`/api/transactions?page=${page}${type ? `&type=${type}` : ''}`).then((r) => {
      setItems(r.data?.items ?? []);
      setMore(!!r.data?.more);
      setTotals(r.data?.totals ?? []);
    });
  }, [type, page]);

  const bonus = totals.filter((t) => !['bet', 'win', 'refund', 'vault_in', 'vault_out'].includes(t.type)).reduce((a, t) => a + Number(t.sum), 0);

  return (
    <div>
      <PageHeader title="Kredi işlemleri" subtitle="Bakiyendeki her değişiklik burada, işlem sonrası bakiyesiyle birlikte kayıtlıdır." />
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Card className="p-4"><p className="text-xs text-slate-400">Toplam işlem</p><p className="text-2xl font-black">{totals.reduce((a, t) => a + t.n, 0).toLocaleString('tr-TR')}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-400">Bonus ve ödüllerden gelen</p><p className="text-2xl font-black text-accent-soft">+{fmtCredits(bonus, { compact: true })}</p></Card>
        <Card className="p-4">
          <p className="mb-1.5 text-xs text-slate-400">Türe göre filtrele</p>
          <Select value={type} onChange={(e) => { setType(e.target.value); setPage(0); }}>
            <option value="">Tümü</option>
            {Object.entries(TX_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </Select>
        </Card>
      </div>
      {items == null ? (
        <Spinner />
      ) : items.length === 0 ? (
        <Empty icon={ListOrdered} title="İşlem bulunamadı" />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-white/[0.03] text-left text-xs text-slate-400">
                <tr><th className="px-4 py-3">İşlem</th><th className="px-2 py-3">Tarih</th><th className="px-2 py-3 text-right">Tutar</th><th className="px-4 py-3 text-right">Bakiye</th></tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map((t) => {
                  const ty = txType(t.type);
                  const a = Number(t.amount);
                  return (
                    <tr key={t.id}>
                      <td className="px-4 py-2.5">
                        <span className="flex items-center gap-2"><ty.icon size={15} className={ty.color} /> {ty.label}</span>
                        {(t.ref || t.note) && <span className="block truncate pl-6 text-xs text-slate-500">{[t.ref, t.note].filter(Boolean).join(' · ')}</span>}
                      </td>
                      <td className="px-2 py-2.5 text-xs text-slate-400">{fmtDateTime(t.created_at)}</td>
                      <td className={`px-2 py-2.5 text-right font-semibold tabular-nums ${a >= 0 ? 'text-accent-soft' : 'text-slate-300'}`}>{a >= 0 ? '+' : ''}{fmtCredits(a)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-slate-400">{fmtCredits(t.balance_after)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      <div className="mt-4 flex justify-between">
        <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Önceki</Button>
        <Button variant="secondary" size="sm" disabled={!more} onClick={() => setPage((p) => p + 1)}>Sonraki</Button>
      </div>
    </div>
  );
}
