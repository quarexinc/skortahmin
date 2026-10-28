'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Badge, Empty, LinkButton, PageHeader, PRIORITY_TR, Spinner, STATUS_TR, CATEGORY_TR } from '@/components/ui';
import { api, timeAgo } from '@/lib/client';

interface T { id: number; subject: string; category: string; priority: string; status: string; updated_at: string; messages: number; last_by_staff: boolean }

export default function SupportPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<T[] | null>(null);
  useEffect(() => {
    if (user) api<{ items: T[] }>('/api/tickets').then((r) => setItems(r.data?.items ?? []));
  }, [user]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <PageHeader title="Destek talepleri" subtitle="Sorularını ve sorunlarını ekibimize ilet, yanıtları buradan takip et." actions={user && <LinkButton href="/destek/yeni">+ Yeni talep</LinkButton>} />
      {!user ? (
        <Empty icon="🎫" title="Talep açmak için giriş yap">
          Üye değilsen <Link href="/iletisim" className="text-accent-soft underline">iletişim formunu</Link> kullanabilirsin.
          <div className="mt-4 flex justify-center gap-2">
            <LinkButton href="/giris?next=/destek">Giriş yap</LinkButton>
            <LinkButton href="/kayit?next=/destek" variant="secondary">Üye ol</LinkButton>
          </div>
        </Empty>
      ) : items == null ? (
        <Spinner />
      ) : items.length === 0 ? (
        <Empty icon="🎫" title="Henüz destek talebin yok">Bir sorun mu var? <Link href="/destek/yeni" className="text-accent-soft underline">Yeni talep aç</Link> ya da <Link href="/sss" className="text-accent-soft underline">SSS</Link>&apos;ye göz at.</Empty>
      ) : (
        <div className="card divide-y divide-white/5 p-0">
          {items.map((t) => (
            <Link key={t.id} href={`/destek/${t.id}`} className="flex flex-wrap items-center gap-3 px-5 py-4 transition hover:bg-white/5">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{t.subject}</p>
                <p className="mt-0.5 text-xs text-slate-500">#{t.id} · {CATEGORY_TR[t.category] ?? t.category} · {t.messages} mesaj · {timeAgo(t.updated_at)}</p>
              </div>
              {t.last_by_staff && t.status !== 'closed' && <Badge color="green">Yeni yanıt</Badge>}
              <Badge color={PRIORITY_TR[t.priority]?.color}>{PRIORITY_TR[t.priority]?.label}</Badge>
              <Badge color={STATUS_TR[t.status]?.color}>{STATUS_TR[t.status]?.label ?? t.status}</Badge>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
