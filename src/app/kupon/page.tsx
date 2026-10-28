'use client';
import { Receipt, X } from 'lucide-react';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Avatar, Button, Card, Empty, Field, Input, LinkButton, Notice, PageHeader } from '@/components/ui';
import { api, fmtDateTime, onCouponChange, pct, readCoupon, timeAgo, writeCoupon, type CouponPick } from '@/lib/client';

interface PublicCoupon { id: number; title: string; picks: CouponPick[]; total_prob: number; created_at: string; user_name: string; avatar_color: string }

export default function CouponPage() {
  const { user, toast } = useAuth();
  const [picks, setPicks] = useState<CouponPick[]>([]);
  const [title, setTitle] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pub, setPub] = useState<PublicCoupon[]>([]);

  useEffect(() => {
    const upd = () => setPicks(readCoupon());
    upd();
    api<{ items: PublicCoupon[] }>('/api/coupons?scope=public').then((r) => setPub(r.data?.items ?? []));
    return onCouponChange(upd);
  }, []);

  const total = picks.reduce((a, p) => a * p.prob, 1);
  const started = picks.filter((p) => new Date(p.date).getTime() <= Date.now());

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await api('/api/coupons', { body: { title, picks, isPublic } });
    setBusy(false);
    setErr(error);
    if (!error) {
      toast('Kupon kaydedildi.');
      writeCoupon([]);
      setTitle('');
    }
  };

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_340px]">
      <div>
        <PageHeader title="Kupon oluşturucu" subtitle="Maç sayfalarındaki “+ Kupon” düğmeleriyle seçim ekle; modelin olasılıklarıyla kuponunun toplam olasılığını gör." />
        {picks.length === 0 ? (
          <Empty icon={Receipt} title="Kuponun boş">
            Bir maç aç ve 1X2{user?.isPremium ? ', KG veya Alt/Üst' : ''} olasılıklarının altındaki “+ Kupon” düğmesine bas.
            <div className="mt-4"><LinkButton href="/maclar">Maçlara git</LinkButton></div>
          </Empty>
        ) : (
          <div className="space-y-3">
            {started.length > 0 && <Notice kind="error">{started.length} seçimin maçı başladı veya bitti; bu seçimleri çıkarman önerilir.</Notice>}
            {picks.map((p) => (
              <div key={`${p.fixtureId}-${p.market}`} className="card flex items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <Link href={`/mac/${p.fixtureId}`} className="block truncate font-semibold hover:text-accent-soft">{p.home} – {p.away}</Link>
                  <p className="text-xs text-slate-500">{p.league} · {fmtDateTime(p.date)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">{p.market}</p>
                  <p className="font-bold">{p.selection}</p>
                </div>
                <div className="w-16 text-right">
                  <p className="font-bold tabular-nums text-accent-soft">{pct(p.prob, 1)}</p>
                  <p className="text-[11px] text-slate-500">oran {(1 / Math.max(p.prob, 0.0001)).toFixed(2)}</p>
                </div>
                <button onClick={() => writeCoupon(picks.filter((x) => x !== p))} className="text-slate-500 hover:text-red-300" aria-label="Çıkar"><X size={18} /></button>
              </div>
            ))}
            <button onClick={() => writeCoupon([])} className="text-sm text-slate-500 hover:text-red-300">Kuponu temizle</button>
          </div>
        )}

        {pub.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 text-lg font-bold">Topluluk kuponları</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {pub.map((c) => (
                <div key={c.id} className="card p-4">
                  <div className="flex items-center gap-2">
                    <Avatar name={c.user_name} color={c.avatar_color} size={26} />
                    <p className="min-w-0 flex-1 truncate text-sm font-semibold">{c.title}</p>
                    <span className="text-xs text-slate-500">{timeAgo(c.created_at)}</span>
                  </div>
                  <ul className="mt-3 space-y-1 text-xs text-slate-300">
                    {c.picks.slice(0, 5).map((p, i) => (
                      <li key={i} className="flex justify-between gap-2"><span className="truncate">{p.home} – {p.away}</span><b>{p.selection}</b></li>
                    ))}
                    {c.picks.length > 5 && <li className="text-slate-500">+{c.picks.length - 5} seçim</li>}
                  </ul>
                  <p className="mt-3 text-xs text-slate-500">{c.user_name} · Model olasılığı <b className="text-accent-soft">{pct(c.total_prob, 2)}</b></p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <aside className="lg:sticky lg:top-20 lg:self-start">
        <Card>
          <p className="label-muted">Özet</p>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-400">Seçim</span><b>{picks.length}</b></div>
            <div className="flex justify-between"><span className="text-slate-400">Model olasılığı</span><b className="text-accent-soft">{picks.length ? pct(total, 2) : '—'}</b></div>
            <div className="flex justify-between"><span className="text-slate-400">Adil oran (1/olasılık)</span><b>{picks.length ? (1 / Math.max(total, 1e-9)).toFixed(2) : '—'}</b></div>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
            Olasılıklar seçimlerin bağımsız olduğu varsayımıyla çarpılır. Bu bir bahis kuponu değildir; sitemizde bahis oynanmaz.
          </p>
          {picks.length > 0 &&
            (user ? (
              <form onSubmit={save} className="mt-4 space-y-3 border-t border-white/5 pt-4">
                {err && <Notice kind="error">{err}</Notice>}
                <Field label="Kupon adı"><Input value={title} onChange={(e) => setTitle(e.target.value)} required minLength={2} maxLength={60} placeholder="Hafta sonu kuponum" /></Field>
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="h-4 w-4 accent-[#22c55e]" />
                  Toplulukla paylaş
                </label>
                <Button type="submit" loading={busy} className="w-full">Kuponu kaydet</Button>
              </form>
            ) : (
              <p className="mt-4 border-t border-white/5 pt-4 text-sm text-slate-400">
                Kuponu kaydetmek için <Link href="/giris?next=/kupon" className="text-accent-soft underline">giriş yap</Link>.
              </p>
            ))}
        </Card>
      </aside>
    </main>
  );
}
