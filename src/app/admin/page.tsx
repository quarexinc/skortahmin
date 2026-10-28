'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Badge, Card, PageHeader, PRIORITY_TR, Spinner, STATUS_TR } from '@/components/ui';
import { api, timeAgo } from '@/lib/client';

interface D {
  counts: Record<string, number>;
  signups: { day: string; n: number }[];
  latestUsers: { id: number; name: string; email: string; created_at: string; plan: string }[];
  latestTickets: { id: number; subject: string; status: string; priority: string; updated_at: string; who: string }[];
}

export default function Dashboard() {
  const [d, setD] = useState<D | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    api<D>('/api/admin/stats').then((r) => (r.error ? setErr(r.error) : setD(r.data)));
  }, []);
  if (err) return <p className="text-red-300">{err}</p>;
  if (!d) return <Spinner />;
  const c = d.counts;
  const tiles: [string, number | string, string, string?][] = [
    ['Toplam üye', c.users, '/admin/kullanicilar', `+${c.users_week} bu hafta`],
    ['Bugün yeni üye', c.users_today, '/admin/kullanicilar'],
    ['Bugün aktif', c.active_today, '/admin/kullanicilar'],
    ['Aktif premium', c.premium, '/admin/kullanicilar?filter=premium'],
    ['Bekleyen premium', c.premium_pending, '/admin/premium'],
    ['Açık destek talebi', c.tickets_open, '/admin/destek', `${c.tickets_active} aktif`],
    ['Okunmamış canlı mesaj', c.chat_unread, '/admin/canli-destek', `${c.chats_open} açık görüşme`],
    ['İşaretli yorum', c.comments_flagged, '/admin/yorumlar', `${c.comments_today} yorum bugün`],
    ['Toplam tahmin', c.predictions, '/admin/tahminler', `${c.predictions_today} bugün`],
    ['Puanlanmayı bekleyen', c.predictions_unscored, '/admin/tahminler'],
    ['Kayıtlı kupon', c.coupons, '/admin'],
    ['Askıdaki hesap', c.banned, '/admin/kullanicilar?filter=banned'],
  ];
  const max = Math.max(1, ...d.signups.map((s) => s.n));
  return (
    <div className="space-y-6">
      <PageHeader title="Gösterge paneli" subtitle="Sitenin genel durumu" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {tiles.map(([label, v, href, sub]) => (
          <Link key={label} href={href} className="card p-4 transition hover:border-violet-400/30">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-black tabular-nums">{v}</p>
            {sub && <p className="text-[11px] text-slate-500">{sub}</p>}
          </Link>
        ))}
      </div>
      <Card>
        <p className="label-muted mb-4">Son 14 günde yeni üyeler</p>
        <div className="flex h-36 items-end gap-1.5">
          {d.signups.map((s) => (
            <div key={s.day} className="group flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100">{s.n}</span>
              <div className="w-full rounded-t bg-violet-400/70" style={{ height: `${(s.n / max) * 100}%`, minHeight: s.n ? 4 : 1 }} />
              <span className="text-[9px] text-slate-600">{s.day.slice(8)}</span>
            </div>
          ))}
        </div>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <p className="label-muted mb-3">Son üyeler</p>
          <ul className="divide-y divide-white/5 text-sm">
            {d.latestUsers.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-2 py-2">
                <Link href={`/admin/kullanicilar?q=${u.id}`} className="min-w-0 truncate hover:text-violet-200">{u.name} <span className="text-slate-500">· {u.email}</span></Link>
                <span className="shrink-0 text-xs text-slate-500">{timeAgo(u.created_at)}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <p className="label-muted mb-3">Aktif destek talepleri</p>
          {d.latestTickets.length === 0 ? (
            <p className="text-sm text-slate-500">Açık talep yok 🎉</p>
          ) : (
            <ul className="divide-y divide-white/5 text-sm">
              {d.latestTickets.map((t) => (
                <li key={t.id} className="flex items-center gap-2 py-2">
                  <Link href={`/admin/destek/${t.id}`} className="min-w-0 flex-1 truncate hover:text-violet-200">#{t.id} {t.subject} <span className="text-slate-500">· {t.who}</span></Link>
                  <Badge color={PRIORITY_TR[t.priority]?.color}>{PRIORITY_TR[t.priority]?.label}</Badge>
                  <Badge color={STATUS_TR[t.status]?.color}>{STATUS_TR[t.status]?.label}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
