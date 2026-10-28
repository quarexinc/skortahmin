'use client';

import { Download, Mail, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Empty, Input, PageHeader, Spinner } from '@/components/ui';
import { api, fmtDateTime } from '@/lib/client';

interface S { id: number; email: string; created_at: string }

export default function NewsletterAdmin() {
  const { toast } = useAuth();
  const [items, setItems] = useState<S[] | null>(null);
  const [qText, setQ] = useState('');
  const load = () => api<{ items: S[] }>('/api/admin/newsletter').then((r) => setItems(r.data?.items ?? []));
  useEffect(() => {
    load();
  }, []);
  const del = async (s: S) => {
    if (!confirm(`${s.email} listeden çıkarılsın mı?`)) return;
    await api(`/api/admin/newsletter?id=${s.id}`, { method: 'DELETE' });
    toast('Silindi.', 'info');
    load();
  };
  const list = items?.filter((s) => s.email.includes(qText.toLowerCase())) ?? null;
  return (
    <div>
      <PageHeader
        title="Bülten aboneleri"
        subtitle={items ? `${items.length} abone` : undefined}
        actions={<a href="/api/admin/export?type=newsletter" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-ink-700 px-4 py-2.5 text-sm font-semibold hover:border-white/25"><Download size={15} /> CSV indir</a>}
      />
      <div className="mb-4 max-w-sm"><Input value={qText} onChange={(e) => setQ(e.target.value)} placeholder="E-posta ara…" /></div>
      {!list ? <Spinner /> : list.length === 0 ? <Empty icon={Mail} title="Abone yok" /> : (
        <div className="card divide-y divide-white/5 p-0">
          {list.map((s) => (
            <div key={s.id} className="flex items-center gap-3 px-5 py-3 text-sm">
              <Mail size={15} className="text-slate-500" />
              <span className="flex-1 truncate">{s.email}</span>
              <span className="text-xs text-slate-500">{fmtDateTime(s.created_at)}</span>
              <button onClick={() => del(s)} className="text-slate-500 hover:text-red-300" aria-label="Sil"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
