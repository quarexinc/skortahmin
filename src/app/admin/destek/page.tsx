'use client';
import { LifeBuoy } from 'lucide-react';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Badge, CATEGORY_TR, Empty, Input, PageHeader, PRIORITY_TR, Spinner, STATUS_TR } from '@/components/ui';
import { api, timeAgo } from '@/lib/client';

interface T { id: number; subject: string; category: string; priority: string; status: string; updated_at: string; who: string | null; email: string | null; guest: boolean; premium: boolean; messages: number }

export default function TicketsAdmin() {
  const [status, setStatus] = useState('active');
  const [qText, setQ] = useState('');
  const [items, setItems] = useState<T[] | null>(null);
  useEffect(() => {
    const t = setTimeout(() => api<{ items: T[] }>(`/api/admin/tickets?status=${status}&q=${encodeURIComponent(qText)}`).then((r) => setItems(r.data?.items ?? [])), 250);
    return () => clearTimeout(t);
  }, [status, qText]);
  return (
    <div>
      <PageHeader title="Destek talepleri" subtitle="Öncelik ve duruma göre sıralı. Ziyaretçi taleplerine e-postayla dönüş yapılmalı." />
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="min-w-[200px] flex-1"><Input value={qText} onChange={(e) => setQ(e.target.value)} placeholder="Konu, e-posta veya #no ara…" /></div>
        {[['active', 'Aktif'], ['open', 'Yanıt bekleyen'], ['answered', 'Yanıtlanan'], ['closed', 'Kapalı'], ['all', 'Tümü']].map(([k, l]) => (
          <button key={k} onClick={() => setStatus(k)} className={`chip ${status === k ? 'chip-active' : ''}`}>{l}</button>
        ))}
      </div>
      {!items ? <Spinner /> : items.length === 0 ? <Empty icon={LifeBuoy} title="Talep yok" /> : (
        <div className="card divide-y divide-white/5 p-0">
          {items.map((t) => (
            <Link key={t.id} href={`/admin/destek/${t.id}`} className="flex flex-wrap items-center gap-3 px-5 py-3.5 transition hover:bg-white/5">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">#{t.id} · {t.subject}</p>
                <p className="truncate text-xs text-slate-500">{t.who} · {t.email} {t.guest && '· ziyaretçi'} {t.premium && '· Premium'} · {CATEGORY_TR[t.category] ?? t.category} · {t.messages} mesaj · {timeAgo(t.updated_at)}</p>
              </div>
              <Badge color={PRIORITY_TR[t.priority]?.color}>{PRIORITY_TR[t.priority]?.label}</Badge>
              <Badge color={STATUS_TR[t.status]?.color}>{STATUS_TR[t.status]?.label}</Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
