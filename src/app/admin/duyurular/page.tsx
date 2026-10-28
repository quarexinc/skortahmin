'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Badge, Button, Card, Empty, Field, Input, PageHeader, Select, Spinner } from '@/components/ui';
import { api, fmtDateTime } from '@/lib/client';

interface A { id: number; title: string; body: string | null; level: string; active: boolean; created_at: string }

export default function Announcements() {
  const { toast } = useAuth();
  const [items, setItems] = useState<A[] | null>(null);
  const [f, setF] = useState({ title: '', body: '', level: 'info' });
  const [busy, setBusy] = useState(false);
  const load = () => api<{ items: A[] }>('/api/admin/announcements').then((r) => setItems(r.data?.items ?? []));
  useEffect(() => {
    load();
  }, []);
  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await api('/api/admin/announcements', { body: f });
    setBusy(false);
    if (error) return toast(error, 'error');
    toast('Duyuru yayınlandı.');
    setF({ title: '', body: '', level: 'info' });
    load();
  };
  const toggle = async (a: A) => {
    await api('/api/admin/announcements', { method: 'PATCH', body: { id: a.id, active: !a.active } });
    load();
  };
  const del = async (a: A) => {
    if (!confirm('Duyuru silinsin mi?')) return;
    await api(`/api/admin/announcements?id=${a.id}`, { method: 'DELETE' });
    load();
  };
  return (
    <div className="space-y-6">
      <PageHeader title="Duyurular" subtitle="Aktif duyurular sitenin üstünde şerit olarak görünür (en fazla 3)." />
      <Card>
        <form onSubmit={create} className="grid gap-4 sm:grid-cols-[1fr_160px]">
          <Field label="Başlık"><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required maxLength={120} /></Field>
          <Field label="Tür"><Select value={f.level} onChange={(e) => setF({ ...f, level: e.target.value })}><option value="info">📢 Bilgi</option><option value="success">🎉 Müjde</option><option value="warning">⚠️ Uyarı</option></Select></Field>
          <div className="sm:col-span-2"><Field label="Metin (isteğe bağlı)"><Input value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} maxLength={400} /></Field></div>
          <div><Button type="submit" loading={busy}>Yayınla</Button></div>
        </form>
      </Card>
      {!items ? <Spinner /> : items.length === 0 ? <Empty icon="📢" title="Duyuru yok" /> : (
        <div className="card divide-y divide-white/5 p-0">
          {items.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{a.title}</p>
                {a.body && <p className="text-sm text-slate-400">{a.body}</p>}
                <p className="text-xs text-slate-500">{fmtDateTime(a.created_at)}</p>
              </div>
              <Badge color={a.active ? 'green' : 'slate'}>{a.active ? 'Yayında' : 'Pasif'}</Badge>
              <Button size="sm" variant="secondary" onClick={() => toggle(a)}>{a.active ? 'Yayından kaldır' : 'Yayınla'}</Button>
              <Button size="sm" variant="ghost" onClick={() => del(a)}>Sil</Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
