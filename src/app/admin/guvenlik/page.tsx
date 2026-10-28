'use client';

import { Lock, ShieldAlert, ShieldCheck, Unlock } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Button, Card, PageHeader, Spinner } from '@/components/ui';
import { api, fmtDateTime, timeAgo } from '@/lib/client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type D = any;

export default function Security() {
  const { toast } = useAuth();
  const [d, setD] = useState<D | null>(null);
  const load = useCallback(() => api<D>('/api/admin/security').then((r) => setD(r.data)), []);
  useEffect(() => {
    load();
  }, [load]);
  const unlock = async (email: string) => {
    await api('/api/admin/security', { body: { email } });
    toast(`${email} kilidi açıldı.`);
    load();
  };
  if (!d) return <Spinner />;
  return (
    <div className="space-y-6">
      <PageHeader title="Güvenlik" subtitle="Giriş denemeleri ve kilitlenen hesaplar. 15 dakikada 5 hatalı denemede hesap geçici olarak kilitlenir." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <div className="card p-4"><p className="flex items-center gap-1.5 text-xs text-slate-500"><ShieldCheck size={14} /> Başarılı giriş (24 sa)</p><p className="mt-1 text-2xl font-black">{d.stats.ok24}</p></div>
        <div className="card p-4"><p className="flex items-center gap-1.5 text-xs text-slate-500"><ShieldAlert size={14} /> Hatalı deneme (24 sa)</p><p className="mt-1 text-2xl font-black">{d.stats.fail24}</p></div>
        <div className="card p-4"><p className="flex items-center gap-1.5 text-xs text-slate-500"><Lock size={14} /> Şu an kilitli</p><p className="mt-1 text-2xl font-black">{d.locked.length}</p></div>
      </div>
      {d.locked.length > 0 && (
        <Card>
          <p className="label-muted mb-3">Kilitli hesaplar</p>
          <ul className="divide-y divide-white/5">
            {d.locked.map((l: { email: string; n: number; last: string }) => (
              <li key={l.email} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <span>{l.email} <span className="text-xs text-slate-500">· {l.n} deneme · {timeAgo(l.last)}</span></span>
                <Button size="sm" variant="secondary" onClick={() => unlock(l.email)}><Unlock size={14} /> Kilidi aç</Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card>
          <p className="label-muted mb-3">En çok hatalı deneme yapan IP (7 gün)</p>
          {d.topIps.length === 0 ? <p className="text-sm text-slate-500">Kayıt yok.</p> : (
            <ul className="space-y-2 text-sm">
              {d.topIps.map((x: { ip: string; n: number }) => <li key={x.ip} className="flex justify-between"><code className="text-xs">{x.ip}</code><b>{x.n}</b></li>)}
            </ul>
          )}
        </Card>
        <Card>
          <p className="label-muted mb-3">Son hatalı denemeler</p>
          {d.failed.length === 0 ? <p className="text-sm text-slate-500">Kayıt yok.</p> : (
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-white/5">
                  {d.failed.map((f: { email: string; ip: string; created_at: string }, i: number) => (
                    <tr key={i}><td className="py-1.5">{f.email}</td><td className="py-1.5 text-xs text-slate-500">{f.ip}</td><td className="py-1.5 text-right text-xs text-slate-500">{fmtDateTime(f.created_at)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
