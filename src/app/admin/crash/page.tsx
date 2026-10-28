'use client';

import { Rocket } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button, Card, Empty, PageHeader, Spinner } from '@/components/ui';
import { api, fmtDateTime } from '@/lib/client';
import { fmtCredits, fmtMult } from '@/lib/money';

interface R { id: number; crash_point: string | null; hash: string; seed: string | null; starts_at: string; crashed_at: string | null; settled: boolean; players: number; wagered: string; paid: string }
interface D { rounds: R[]; more: boolean; dist: { n: number; avg: number | null; median: number | null; instant: number; x2: number; x10: number; x100: number; max: number | null } }

const pct = (a: number, b: number) => (b ? `%${((a / b) * 100).toFixed(1).replace('.', ',')}` : '—');

export default function AdminCrash() {
  const [page, setPage] = useState(0);
  const [d, setD] = useState<D | null>(null);
  useEffect(() => {
    setD(null);
    api<D>(`/api/admin/crash?page=${page}`).then((r) => setD(r.data));
  }, [page]);

  return (
    <div className="space-y-6">
      <PageHeader title="Crash turları" subtitle="Turlar ziyaretçi istekleriyle ilerler. Patlama noktası ve tohum yalnızca tur bittikten sonra gösterilir." />
      {!d ? (
        <Spinner />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ['Tamamlanan tur', d.dist.n.toLocaleString('tr-TR'), ''],
              ['Medyan patlama', d.dist.median ? fmtMult(d.dist.median) : '—', 'teorik ≈ 1,98x'],
              ['1,00x anında patlama', pct(d.dist.instant, d.dist.n), 'teorik ≈ %2'],
              ['2x ve üzeri', pct(d.dist.x2, d.dist.n), 'teorik ≈ %49,5'],
              ['10x ve üzeri', pct(d.dist.x10, d.dist.n), 'teorik ≈ %9,9'],
              ['100x ve üzeri', pct(d.dist.x100, d.dist.n), 'teorik ≈ %0,99'],
              ['En yüksek', d.dist.max ? fmtMult(d.dist.max) : '—', 'üst sınır 1.000x'],
              ['Ortalama', d.dist.avg ? fmtMult(d.dist.avg) : '—', ''],
            ].map(([l, v, s]) => (
              <Card key={l} className="p-4">
                <p className="text-xs text-slate-500">{l}</p>
                <p className="mt-1 text-xl font-black tabular-nums">{v}</p>
                {s && <p className="text-[11px] text-slate-500">{s}</p>}
              </Card>
            ))}
          </div>
          {d.rounds.length === 0 ? (
            <Empty icon={Rocket} title="Henüz tur yok">Crash sayfası ziyaret edildiğinde turlar başlar.</Empty>
          ) : (
            <Card className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="bg-white/[0.03] text-left text-xs text-slate-400">
                    <tr><th className="px-4 py-2.5">Tur</th><th className="px-2">Başlangıç</th><th className="px-2 text-right">Patlama</th><th className="px-2 text-right">Oyuncu</th><th className="px-2 text-right">Oynanan</th><th className="px-2 text-right">Kasa</th><th className="px-4">Hash / tohum</th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {d.rounds.map((r) => {
                      const h = Number(r.wagered) - Number(r.paid);
                      const cp = r.crash_point == null ? null : Number(r.crash_point);
                      return (
                        <tr key={r.id}>
                          <td className="px-4 py-2 text-slate-400">#{r.id}</td>
                          <td className="px-2 text-xs text-slate-500">{fmtDateTime(r.starts_at)}</td>
                          <td className={`px-2 text-right font-bold tabular-nums ${cp == null ? 'text-slate-500' : cp >= 10 ? 'text-amber-300' : cp >= 2 ? 'text-accent-soft' : 'text-red-300'}`}>{cp == null ? 'uçuşta' : fmtMult(cp)}</td>
                          <td className="px-2 text-right tabular-nums">{r.players}</td>
                          <td className="px-2 text-right tabular-nums">{fmtCredits(r.wagered, { compact: true })}</td>
                          <td className={`px-2 text-right tabular-nums ${h >= 0 ? 'text-accent-soft' : 'text-red-300'}`}>{r.settled ? fmtCredits(h, { compact: true }) : '—'}</td>
                          <td className="max-w-[260px] px-4 font-mono text-[10px] text-slate-500"><p className="truncate">{r.hash}</p>{r.seed && <p className="truncate text-slate-400">{r.seed}</p>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
          <div className="flex justify-between">
            <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Önceki</Button>
            <Button variant="secondary" size="sm" disabled={!d.more} onClick={() => setPage((p) => p + 1)}>Sonraki</Button>
          </div>
        </>
      )}
    </div>
  );
}
