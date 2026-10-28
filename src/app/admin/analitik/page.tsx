'use client';

import { Eye, Target, UserPlus, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import MiniChart from '@/components/admin/MiniChart';
import { Card, PageHeader, Spinner } from '@/components/ui';
import { api } from '@/lib/client';

interface D {
  series: { day: string; views: number; visitors: number; signups: number; predictions: number }[];
  topPages: { path: string; views: number }[];
  totals: { views: number; visitors: number; signups: number; predictions: number };
}

export default function Analytics() {
  const [days, setDays] = useState(30);
  const [d, setD] = useState<D | null>(null);
  useEffect(() => {
    setD(null);
    api<D>(`/api/admin/analytics?days=${days}`).then((r) => setD(r.data));
  }, [days]);
  const maxTop = Math.max(1, ...(d?.topPages.map((p) => p.views) ?? [1]));
  return (
    <div className="space-y-6">
      <PageHeader
        title="Ziyaret analitiği"
        subtitle="Çerezsiz, anonim sayfa görüntüleme sayacı. Bot trafiği ve yönetim sayfaları hariç."
        actions={[7, 30, 90].map((n) => (
          <button key={n} onClick={() => setDays(n)} className={`chip ${days === n ? 'chip-active' : ''}`}>Son {n} gün</button>
        ))}
      />
      {!d ? (
        <Spinner />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { l: 'Sayfa görüntüleme', v: d.totals.views, i: Eye },
              { l: 'Tekil ziyaretçi (günlük toplam)', v: d.totals.visitors, i: Users },
              { l: 'Yeni üye', v: d.totals.signups, i: UserPlus },
              { l: 'Yapılan tahmin', v: d.totals.predictions, i: Target },
            ].map((t) => (
              <div key={t.l} className="card p-4">
                <p className="flex items-center gap-1.5 text-xs text-slate-500"><t.i size={14} /> {t.l}</p>
                <p className="mt-1 text-2xl font-black tabular-nums">{t.v.toLocaleString('tr-TR')}</p>
              </div>
            ))}
          </div>
          <Card>
            <p className="label-muted mb-4">Trafik</p>
            <MiniChart
              labels={d.series.map((s) => s.day)}
              series={[
                { name: 'Görüntüleme', color: '#22c55e', values: d.series.map((s) => s.views) },
                { name: 'Tekil ziyaretçi', color: '#38bdf8', values: d.series.map((s) => s.visitors) },
              ]}
            />
          </Card>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <p className="label-muted mb-4">Üye ve tahmin aktivitesi</p>
              <MiniChart
                height={180}
                labels={d.series.map((s) => s.day)}
                series={[
                  { name: 'Yeni üye', color: '#a78bfa', values: d.series.map((s) => s.signups) },
                  { name: 'Tahmin', color: '#f59e0b', values: d.series.map((s) => s.predictions) },
                ]}
              />
            </Card>
            <Card>
              <p className="label-muted mb-4">En çok görüntülenen sayfalar</p>
              {d.topPages.length === 0 ? (
                <p className="text-sm text-slate-500">Henüz veri yok.</p>
              ) : (
                <ul className="space-y-2.5">
                  {d.topPages.map((p) => (
                    <li key={p.path} className="text-sm">
                      <div className="flex justify-between gap-2"><code className="truncate text-xs">{p.path}</code><b className="tabular-nums">{p.views}</b></div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-accent/70" style={{ width: `${(p.views / maxTop) * 100}%` }} /></div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
