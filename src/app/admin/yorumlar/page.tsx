'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Badge, Button, Empty, PageHeader, Spinner } from '@/components/ui';
import { api, timeAgo } from '@/lib/client';

interface C { id: number; fixture_id: number; body: string; hidden: boolean; reports: number; created_at: string; user_id: number; name: string; email: string }

export default function CommentsAdmin() {
  const { toast } = useAuth();
  const [filter, setFilter] = useState('flagged');
  const [items, setItems] = useState<C[] | null>(null);
  const load = useCallback(() => api<{ items: C[] }>(`/api/admin/comments?filter=${filter}`).then((r) => setItems(r.data?.items ?? [])), [filter]);
  useEffect(() => {
    setItems(null);
    load();
  }, [load]);
  const setHidden = async (c: C, hidden: boolean) => {
    await api('/api/admin/comments', { method: 'PATCH', body: { id: c.id, hidden } });
    toast(hidden ? 'Yorum gizlendi.' : 'Yorum yayına alındı.', 'info');
    load();
  };
  const del = async (c: C) => {
    if (!confirm('Yorum kalıcı olarak silinsin mi?')) return;
    await api(`/api/comments?id=${c.id}`, { method: 'DELETE' });
    load();
  };
  return (
    <div>
      <PageHeader title="Yorum moderasyonu" subtitle="3 farklı üyeden şikâyet alan yorumlar otomatik gizlenir." />
      <div className="mb-4 flex gap-2">
        {[['flagged', 'Şikâyetli / gizli'], ['all', 'Tümü']].map(([k, l]) => <button key={k} onClick={() => setFilter(k)} className={`chip ${filter === k ? 'chip-active' : ''}`}>{l}</button>)}
      </div>
      {!items ? <Spinner /> : items.length === 0 ? <Empty icon="🗨️" title="İncelenecek yorum yok" /> : (
        <div className="card divide-y divide-white/5 p-0">
          {items.map((c) => (
            <div key={c.id} className="px-5 py-4">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Link href={`/admin/kullanicilar?q=${c.user_id}`} className="font-semibold hover:text-violet-200">{c.name}</Link>
                <span className="text-xs text-slate-500">{c.email} · {timeAgo(c.created_at)} · <Link href={`/mac/${c.fixture_id}`} className="underline">maç #{c.fixture_id}</Link></span>
                {c.reports > 0 && <Badge color="amber">{c.reports} şikâyet</Badge>}
                {c.hidden && <Badge color="red">Gizli</Badge>}
              </div>
              <p className="mt-1.5 whitespace-pre-wrap text-sm text-slate-200">{c.body}</p>
              <div className="mt-2 flex gap-2">
                {c.hidden ? <Button size="sm" variant="secondary" onClick={() => setHidden(c, false)}>Yayına al</Button> : <Button size="sm" variant="secondary" onClick={() => setHidden(c, true)}>Gizle</Button>}
                <Button size="sm" variant="danger" onClick={() => del(c)}>Sil</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
