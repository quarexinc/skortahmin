'use client';
import { Target } from 'lucide-react';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Badge, Button, Empty, PageHeader, Spinner } from '@/components/ui';
import { api, fmtDateTime } from '@/lib/client';

interface F { fixture_id: number; home_name: string; away_name: string; league_name: string | null; fixture_date: string; n: number; pending: number; actual_home: number | null; actual_away: number | null }

export default function PredictionsAdmin() {
  const { toast } = useAuth();
  const [items, setItems] = useState<F[] | null>(null);
  const [busy, setBusy] = useState(false);
  const load = () => api<{ fixtures: F[] }>('/api/admin/predictions').then((r) => setItems(r.data?.fixtures ?? []));
  useEffect(() => {
    load();
  }, []);
  const score = async () => {
    setBusy(true);
    const { data, error } = await api<{ scored: number }>('/api/admin/predictions', { body: {} });
    setBusy(false);
    toast(error ?? `${data!.scored} tahmin puanlandı.`, error ? 'error' : 'success');
    load();
  };
  return (
    <div>
      <PageHeader
        title="Tahmin yarışması"
        subtitle="Puanlama, kullanıcılar tahminlerine veya liderlik tablosuna baktıkça otomatik çalışır. Gerekirse buradan elle tetikleyebilirsin (maç başına 1 API isteği)."
        actions={<Button onClick={score} loading={busy}>Bekleyenleri şimdi puanla</Button>}
      />
      {!items ? <Spinner /> : items.length === 0 ? <Empty icon={Target} title="Henüz tahmin yok" /> : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[560px] text-sm">
            <thead><tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-slate-500"><th className="px-4 py-3">Maç</th><th className="px-2 py-3">Tarih</th><th className="px-2 py-3 text-right">Tahmin</th><th className="px-2 py-3 text-center">Sonuç</th><th className="px-4 py-3">Durum</th></tr></thead>
            <tbody className="divide-y divide-white/5">
              {items.map((f) => (
                <tr key={f.fixture_id}>
                  <td className="px-4 py-2.5"><Link href={`/mac/${f.fixture_id}`} className="font-medium hover:text-violet-200">{f.home_name} – {f.away_name}</Link><p className="text-xs text-slate-500">{f.league_name}</p></td>
                  <td className="px-2 py-2.5 text-xs text-slate-400">{fmtDateTime(f.fixture_date)}</td>
                  <td className="px-2 py-2.5 text-right tabular-nums">{f.n}</td>
                  <td className="px-2 py-2.5 text-center font-bold tabular-nums">{f.actual_home != null ? `${f.actual_home}–${f.actual_away}` : '—'}</td>
                  <td className="px-4 py-2.5">{f.pending > 0 ? <Badge color="amber">{f.pending} bekliyor</Badge> : <Badge color="green">Puanlandı</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
