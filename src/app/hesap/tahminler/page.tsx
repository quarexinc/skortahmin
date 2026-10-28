'use client';
import { Target } from 'lucide-react';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Badge, Empty, LinkButton, PageHeader, Spinner } from '@/components/ui';
import { api, fmtDateTime } from '@/lib/client';

interface P { fixture_id: number; home_goals: number; away_goals: number; fixture_date: string; home_name: string; away_name: string; league_name: string | null; status: string; actual_home: number | null; actual_away: number | null; points: number | null }
interface S { total: number; scored: number; pending: number; points: number; exact: number; correct: number }

export default function MyPredictions() {
  const [d, setD] = useState<{ items: P[]; stats: S } | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'scored'>('all');
  useEffect(() => {
    api<{ items: P[]; stats: S }>('/api/predictions/mine').then((r) => setD(r.data));
  }, []);
  if (!d) return <Spinner />;
  const s = d.stats;
  const items = d.items.filter((p) => filter === 'all' || p.status === filter);
  return (
    <div>
      <PageHeader title="Tahminlerim" subtitle="Maç bitiminden yaklaşık 2 saat sonra tahminlerin otomatik puanlanır." />
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          ['Puan', s.points],
          ['Tahmin', s.total],
          ['Bekleyen', s.pending],
          ['Tam skor', s.exact],
          ['İsabet', s.scored ? `%${Math.round((s.correct / s.scored) * 100)}` : '—'],
        ].map(([k, v]) => (
          <div key={k as string} className="card p-4"><p className="text-xs text-slate-500">{k}</p><p className="text-2xl font-black tabular-nums">{v}</p></div>
        ))}
      </div>
      <div className="mb-4 flex gap-2">
        {(['all', 'pending', 'scored'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`chip ${filter === f ? 'chip-active' : ''}`}>{f === 'all' ? 'Tümü' : f === 'pending' ? 'Bekleyen' : 'Sonuçlanan'}</button>
        ))}
      </div>
      {items.length === 0 ? (
        <Empty icon={Target} title="Burada tahmin yok">
          Bir maç seç ve skor tahminini gir.
          <div className="mt-4"><LinkButton href="/maclar">Maçlara git</LinkButton></div>
        </Empty>
      ) : (
        <div className="card divide-y divide-white/5 p-0">
          {items.map((p) => (
            <Link key={p.fixture_id} href={`/mac/${p.fixture_id}`} className="flex flex-wrap items-center gap-3 px-5 py-3.5 transition hover:bg-white/5">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{p.home_name} – {p.away_name}</p>
                <p className="text-xs text-slate-500">{p.league_name} · {fmtDateTime(p.fixture_date)}</p>
              </div>
              <div className="text-center text-sm">
                <p className="text-[11px] text-slate-500">Tahmin</p>
                <p className="font-bold tabular-nums">{p.home_goals}–{p.away_goals}</p>
              </div>
              <div className="w-14 text-center text-sm">
                <p className="text-[11px] text-slate-500">Sonuç</p>
                <p className="font-bold tabular-nums">{p.actual_home != null ? `${p.actual_home}–${p.actual_away}` : '—'}</p>
              </div>
              <div className="w-24 text-right">
                {p.status === 'scored' ? (
                  <Badge color={p.points === 3 ? 'green' : p.points === 1 ? 'blue' : 'slate'}>{p.points} puan</Badge>
                ) : p.status === 'void' ? (
                  <Badge color="red">İptal</Badge>
                ) : (
                  <Badge color="amber">Bekliyor</Badge>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
