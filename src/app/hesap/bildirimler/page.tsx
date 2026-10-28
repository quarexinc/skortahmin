'use client';
import { Bell } from 'lucide-react';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Button, Empty, PageHeader, Spinner } from '@/components/ui';
import { api, fmtDateTime } from '@/lib/client';

interface N { id: number; title: string; body: string | null; link: string | null; read: boolean; created_at: string }

export default function NotificationsPage() {
  const { refresh } = useAuth();
  const [items, setItems] = useState<N[] | null>(null);
  const load = () => api<{ items: N[] }>('/api/notifications?all=1').then((r) => setItems(r.data?.items ?? []));
  useEffect(() => {
    load();
  }, []);
  const markAll = async () => {
    await api('/api/notifications', { method: 'PATCH', body: { all: true } });
    await load();
    refresh();
  };
  const clearRead = async () => {
    await api('/api/notifications', { method: 'DELETE', body: {} });
    load();
  };
  return (
    <div>
      <PageHeader
        title="Bildirimler"
        actions={
          <>
            <Button size="sm" variant="secondary" onClick={markAll}>Tümünü okundu say</Button>
            <Button size="sm" variant="ghost" onClick={clearRead}>Okunanları temizle</Button>
          </>
        }
      />
      {items == null ? (
        <Spinner />
      ) : items.length === 0 ? (
        <Empty icon={Bell} title="Bildirim yok">VIP seviye atladığında, kredi eklendiğinde veya taleplerine yanıt geldiğinde burada göreceksin.</Empty>
      ) : (
        <div className="card divide-y divide-white/5 p-0">
          {items.map((n) => (
            <div key={n.id} className={`flex gap-3 px-5 py-4 ${n.read ? 'opacity-60' : ''}`}>
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-transparent' : 'bg-accent'}`} />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{n.title}</p>
                {n.body && <p className="mt-0.5 text-sm text-slate-400">{n.body}</p>}
                <p className="mt-1 text-xs text-slate-500">
                  {fmtDateTime(n.created_at)}
                  {n.link && (
                    <>
                      {' · '}
                      <Link href={n.link} className="text-accent-soft hover:underline">Görüntüle</Link>
                    </>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
