'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Badge, Empty, LinkButton, PageHeader, Spinner } from '@/components/ui';
import { api, fmtDateTime, pct, writeCoupon, type CouponPick } from '@/lib/client';

interface C { id: number; title: string; picks: CouponPick[]; total_prob: number; is_public: boolean; created_at: string }

export default function MyCoupons() {
  const { toast } = useAuth();
  const [items, setItems] = useState<C[] | null>(null);
  const load = () => api<{ items: C[] }>('/api/coupons').then((r) => setItems(r.data?.items ?? []));
  useEffect(() => {
    load();
  }, []);
  const del = async (id: number) => {
    if (!confirm('Kupon silinsin mi?')) return;
    await api(`/api/coupons?id=${id}`, { method: 'DELETE' });
    toast('Kupon silindi.', 'info');
    load();
  };
  if (!items) return <Spinner />;
  return (
    <div>
      <PageHeader title="Kuponlarım" actions={<LinkButton href="/kupon" size="sm">+ Yeni kupon</LinkButton>} />
      {items.length === 0 ? (
        <Empty icon="🧾" title="Kayıtlı kuponun yok"><Link href="/kupon" className="text-accent-soft underline">Kupon oluşturucuyu</Link> dene.</Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((c) => (
            <div key={c.id} className="card p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-bold">{c.title}</p>
                  <p className="text-xs text-slate-500">{fmtDateTime(c.created_at)} · {c.picks.length} seçim</p>
                </div>
                {c.is_public && <Badge color="blue">Herkese açık</Badge>}
              </div>
              <ul className="mt-3 space-y-1.5 text-sm">
                {c.picks.map((p, i) => (
                  <li key={i} className="flex justify-between gap-2">
                    <Link href={`/mac/${p.fixtureId}`} className="truncate text-slate-300 hover:text-accent-soft">{p.home} – {p.away}</Link>
                    <span className="shrink-0"><b>{p.selection}</b> <span className="text-xs text-slate-500">{pct(p.prob)}</span></span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3 text-sm">
                <span className="text-slate-400">Olasılık <b className="text-accent-soft">{pct(c.total_prob, 2)}</b></span>
                <span className="flex gap-3 text-xs">
                  <button onClick={() => { writeCoupon(c.picks); toast('Kupon düzenleyiciye yüklendi.'); }} className="text-slate-400 hover:text-white">Düzenleyiciye yükle</button>
                  <button onClick={() => del(c.id)} className="text-red-300 hover:underline">Sil</button>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
