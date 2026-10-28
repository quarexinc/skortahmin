'use client';

import { CheckCircle2, Database, Gamepad2, GitCommit, KeyRound, RefreshCw, XCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Card, Notice, PageHeader, Spinner } from '@/components/ui';
import { api, fmtDate } from '@/lib/client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type D = any;

const Ok = ({ ok }: { ok: boolean }) => (ok ? <CheckCircle2 size={16} className="text-accent-soft" /> : <XCircle size={16} className="text-red-400" />);

export default function SystemPage() {
  const [d, setD] = useState<D | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const load = useCallback(() => {
    setD(null);
    api<D>('/api/admin/system').then((r) => (r.error ? setErr(r.error) : setD(r.data)));
  }, []);
  useEffect(load, [load]);
  return (
    <div className="space-y-6">
      <PageHeader title="Sistem durumu" actions={<Button variant="secondary" onClick={load}><RefreshCw size={15} /> Yenile</Button>} />
      {err && <Notice kind="error">{err}</Notice>}
      {!d ? (
        !err && <Spinner />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <p className="flex items-center gap-2 font-bold"><Gamepad2 size={18} className="text-accent-soft" /> Oyun motoru</p>
              <div className="mt-4 space-y-2 text-sm">
                <p className="flex justify-between"><span className="text-slate-400">Crash turları</span><b>{d.game.rounds}</b></p>
                <p className="flex justify-between"><span className="text-slate-400">Son tamamlanan tur</span><b>{d.game.last ? fmtDate(d.game.last) : '—'}</b></p>
                <p className="flex justify-between"><span className="text-slate-400">Açık oyun oturumu</span><b>{d.game.sessions}</b></p>
                <p className="flex justify-between"><span className="text-slate-400">Son 24 saatte el</span><b>{d.game.bets24}</b></p>
                <p className="flex justify-between"><span className="text-slate-400">Bekleyen hesaplama</span>{d.game.unsettled > 0 ? <Badge color="amber">{d.game.unsettled}</Badge> : <Badge color="green">Yok</Badge>}</p>
                <p className="text-xs text-slate-500">Crash turları, ziyaretçi istekleriyle sunucusuz olarak ilerler; bekleyen tur bir sonraki istekte hesaplanır.</p>
              </div>
            </Card>
            <Card>
              <p className="flex items-center gap-2 font-bold"><Database size={18} className="text-accent-soft" /> Veritabanı</p>
              <div className="mt-4 space-y-2 text-sm">
                <p className="flex justify-between"><span className="text-slate-400">Durum</span><Badge color="green">Bağlı</Badge></p>
                <p className="flex justify-between"><span className="text-slate-400">Gecikme</span><b>{d.db.latencyMs} ms</b></p>
                <p className="flex justify-between"><span className="text-slate-400">PostgreSQL</span><b>{d.db.version}</b></p>
                <p className="flex justify-between"><span className="text-slate-400">Boyut</span><b>{d.db.size}</b></p>
              </div>
            </Card>
            <Card>
              <p className="flex items-center gap-2 font-bold"><KeyRound size={18} className="text-accent-soft" /> Ortam değişkenleri</p>
              <ul className="mt-4 space-y-2 text-sm">
                {Object.entries(d.env).map(([k, v]) => (
                  <li key={k} className="flex items-center justify-between"><code className="text-xs">{k}</code><Ok ok={!!v} /></li>
                ))}
              </ul>
            </Card>
            <Card>
              <p className="flex items-center gap-2 font-bold"><GitCommit size={18} className="text-accent-soft" /> Sürüm</p>
              <div className="mt-4 space-y-2 text-sm">
                <p className="flex justify-between"><span className="text-slate-400">Ortam</span><b>{d.runtime.env}</b></p>
                <p className="flex justify-between"><span className="text-slate-400">Bölge</span><b>{d.runtime.region}</b></p>
                <p className="flex justify-between"><span className="text-slate-400">Node.js</span><b>{d.runtime.node}</b></p>
                <p className="flex justify-between gap-4"><span className="text-slate-400">Commit</span><b className="truncate">{d.runtime.commit ?? '—'} {d.runtime.commitMessage && <span className="font-normal text-slate-500">· {d.runtime.commitMessage}</span>}</b></p>
              </div>
            </Card>
          </div>
          <Card>
            <p className="label-muted mb-3">Tablolar ({d.db.tables.length})</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-3 lg:grid-cols-4">
              {d.db.tables.map((t: { name: string; rows: number }) => (
                <p key={t.name} className="flex justify-between gap-2"><code className="truncate text-xs text-slate-400">{t.name}</code><b className="tabular-nums">{t.rows}</b></p>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
