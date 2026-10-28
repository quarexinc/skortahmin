'use client';
import { Star } from 'lucide-react';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Empty, LinkButton, PageHeader, Spinner } from '@/components/ui';
import { api, fmtDateTime } from '@/lib/client';

interface F { kind: 'team' | 'fixture'; ref_id: number; label: string; logo: string | null; extra: { date?: string; league?: string } | null }

export default function Favorites() {
  const { toast } = useAuth();
  const [items, setItems] = useState<F[] | null>(null);
  const load = () => api<{ items: F[] }>('/api/favorites').then((r) => setItems(r.data?.items ?? []));
  useEffect(() => {
    load();
  }, []);
  const remove = async (f: F) => {
    await api('/api/favorites', { body: { kind: f.kind, refId: f.ref_id, label: f.label } });
    toast('Favorilerden çıkarıldı.', 'info');
    load();
  };
  if (!items) return <Spinner />;
  const teams = items.filter((i) => i.kind === 'team');
  const fixtures = items.filter((i) => i.kind === 'fixture');
  return (
    <div className="space-y-8">
      <PageHeader title="Favorilerim" subtitle="Maç sayfalarındaki yıldız düğmeleriyle takım ve maç ekleyebilirsin." />
      {items.length === 0 && (
        <Empty icon={Star} title="Henüz favorin yok">
          <div className="mt-2"><LinkButton href="/maclar">Maçlara göz at</LinkButton></div>
        </Empty>
      )}
      {teams.length > 0 && (
        <section>
          <h2 className="label-muted mb-3">Takımlar</h2>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {teams.map((t) => (
              <div key={t.ref_id} className="card flex items-center gap-3 p-4">
                {t.logo && <img src={t.logo} alt="" className="h-8 w-8 object-contain" />}
                <span className="flex-1 truncate font-semibold">{t.label}</span>
                <button onClick={() => remove(t)} className="text-amber-300" title="Favorilerden çıkar"><Star size={18} fill="currentColor" /></button>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">İpucu: Maç listesinde takım adını arayarak favori takımının maçlarını hızlıca bulabilirsin.</p>
        </section>
      )}
      {fixtures.length > 0 && (
        <section>
          <h2 className="label-muted mb-3">Maçlar</h2>
          <div className="card divide-y divide-white/5 p-0">
            {fixtures.map((f) => (
              <div key={f.ref_id} className="flex items-center gap-3 px-5 py-3">
                {f.logo && <img src={f.logo} alt="" className="h-5 w-5 object-contain" />}
                <Link href={`/mac/${f.ref_id}`} className="min-w-0 flex-1 hover:text-accent-soft">
                  <p className="truncate font-medium">{f.label}</p>
                  <p className="text-xs text-slate-500">{f.extra?.league} · {fmtDateTime(f.extra?.date)}</p>
                </Link>
                <button onClick={() => remove(f)} className="text-amber-300" title="Favorilerden çıkar"><Star size={18} fill="currentColor" /></button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
