'use client';

import { useEffect, useState } from 'react';
import { Empty, PageHeader, Spinner } from '@/components/ui';
import { api, fmtDateTime } from '@/lib/client';

interface L { id: number; action: string; target: string | null; meta: unknown; created_at: string; actor_name: string | null; actor_email: string | null }

const FILTERS = [['', 'Tümü'], ['admin.', 'Yönetici işlemleri'], ['user.', 'Üye işlemleri'], ['ticket.', 'Destek']];

export default function AuditPage() {
  const [f, setF] = useState('');
  const [items, setItems] = useState<L[] | null>(null);
  useEffect(() => {
    setItems(null);
    api<{ items: L[] }>(`/api/admin/audit?action=${f}`).then((r) => setItems(r.data?.items ?? []));
  }, [f]);
  return (
    <div>
      <PageHeader title="İşlem kayıtları" subtitle="Son 300 kayıt" />
      <div className="mb-4 flex flex-wrap gap-2">{FILTERS.map(([k, l]) => <button key={k} onClick={() => setF(k)} className={`chip ${f === k ? 'chip-active' : ''}`}>{l}</button>)}</div>
      {!items ? <Spinner /> : items.length === 0 ? <Empty icon="📜" title="Kayıt yok" /> : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead><tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-slate-500"><th className="px-4 py-3">Zaman</th><th className="px-2 py-3">Kim</th><th className="px-2 py-3">İşlem</th><th className="px-4 py-3">Hedef / ayrıntı</th></tr></thead>
            <tbody className="divide-y divide-white/5">
              {items.map((l) => (
                <tr key={l.id}>
                  <td className="whitespace-nowrap px-4 py-2 text-xs text-slate-400">{fmtDateTime(l.created_at)}</td>
                  <td className="px-2 py-2 text-xs">{l.actor_name ?? '—'}<br /><span className="text-slate-500">{l.actor_email}</span></td>
                  <td className="px-2 py-2"><code>{l.action}</code></td>
                  <td className="max-w-xs px-4 py-2 text-xs text-slate-400"><span className="text-slate-300">{l.target}</span> {l.meta ? <span className="break-all">{JSON.stringify(l.meta).slice(0, 160)}</span> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
