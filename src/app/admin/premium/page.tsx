'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Badge, Button, Empty, Input, PageHeader, Select, Spinner, STATUS_TR } from '@/components/ui';
import { api, fmtDateTime } from '@/lib/client';

interface R { id: number; user_id: number; name: string; email: string; months: number; note: string | null; status: string; admin_note: string | null; created_at: string; decided_at: string | null; decided_by_name: string | null }

function Row({ r, onDone }: { r: R; onDone: () => void }) {
  const { toast } = useAuth();
  const [months, setMonths] = useState(String(r.months));
  const [note, setNote] = useState('');
  const decide = async (decision: 'approved' | 'rejected') => {
    if (decision === 'rejected' && !note && !confirm('Not girmeden reddetmek istiyor musun?')) return;
    const { error } = await api(`/api/admin/premium/${r.id}`, { method: 'PATCH', body: { decision, months: Number(months), note } });
    if (error) return toast(error, 'error');
    toast(decision === 'approved' ? 'Premium aktifleştirildi.' : 'Talep reddedildi.', decision === 'approved' ? 'success' : 'info');
    onDone();
  };
  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Link href={`/admin/kullanicilar?q=${r.user_id}`} className="font-semibold hover:text-violet-200">{r.name}</Link>
          <p className="text-sm text-slate-400">{r.email}</p>
          <p className="mt-1 text-xs text-slate-500">#{r.id} · {fmtDateTime(r.created_at)} · istenen süre {r.months} ay</p>
        </div>
        <Badge color={STATUS_TR[r.status]?.color}>{STATUS_TR[r.status]?.label}</Badge>
      </div>
      {r.note && <p className="mt-3 rounded-xl bg-ink-900 p-3 text-sm text-slate-300">“{r.note}”</p>}
      {r.status === 'pending' ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="w-28"><Select value={months} onChange={(e) => setMonths(e.target.value)}>{[1, 2, 3, 6, 12].map((m) => <option key={m} value={m}>{m} ay</option>)}</Select></div>
          <div className="min-w-[180px] flex-1"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Kullanıcıya not (isteğe bağlı)" maxLength={300} /></div>
          <Button size="sm" onClick={() => decide('approved')}>Onayla</Button>
          <Button size="sm" variant="danger" onClick={() => decide('rejected')}>Reddet</Button>
        </div>
      ) : (
        <p className="mt-3 text-xs text-slate-500">{r.decided_by_name} · {fmtDateTime(r.decided_at)}{r.admin_note ? ` · “${r.admin_note}”` : ''}</p>
      )}
    </div>
  );
}

export default function PremiumAdmin() {
  const [status, setStatus] = useState('pending');
  const [items, setItems] = useState<R[] | null>(null);
  const load = useCallback(() => api<{ items: R[] }>(`/api/admin/premium?status=${status}`).then((r) => setItems(r.data?.items ?? [])), [status]);
  useEffect(() => {
    setItems(null);
    load();
  }, [load]);
  return (
    <div>
      <PageHeader title="Premium talepleri" subtitle="Ödemesi alınan talepleri onaylayarak premium üyeliği başlat. Onayda kullanıcıya bildirim gider." />
      <div className="mb-4 flex gap-2">
        {[['pending', 'Bekleyen'], ['approved', 'Onaylanan'], ['rejected', 'Reddedilen'], ['all', 'Tümü']].map(([k, l]) => (
          <button key={k} onClick={() => setStatus(k)} className={`chip ${status === k ? 'chip-active' : ''}`}>{l}</button>
        ))}
      </div>
      {!items ? <Spinner /> : items.length === 0 ? <Empty icon="💎" title="Talep yok" /> : <div className="space-y-3">{items.map((r) => <Row key={r.id} r={r} onDone={load} />)}</div>}
    </div>
  );
}
