'use client';

import { Zap } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/client';

interface C { id: number; title: string; body: string }

// Hazır yanıt seçici: seçilen metni çağırana verir.
export default function CannedPicker({ onPick, up = false }: { onPick: (text: string) => void; up?: boolean }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<C[] | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open && !items) api<{ items: C[] }>('/api/admin/canned').then((r) => setItems(r.data?.items ?? []));
  }, [open, items]);
  useEffect(() => {
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-white/25">
        <Zap size={14} /> Hazır yanıt
      </button>
      {open && (
        <div className={`absolute left-0 z-30 w-72 overflow-hidden rounded-2xl border border-white/10 bg-ink-800 shadow-2xl ${up ? 'bottom-full mb-2' : 'mt-2'}`}>
          {!items ? (
            <p className="p-4 text-sm text-slate-500">Yükleniyor…</p>
          ) : items.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">
              Henüz hazır yanıt yok. <Link href="/admin/hazir-yanitlar" className="text-accent-soft underline">Ekle</Link>
            </p>
          ) : (
            <ul className="max-h-72 overflow-y-auto py-1">
              {items.map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => { onPick(c.body); setOpen(false); }} className="block w-full px-4 py-2.5 text-left hover:bg-white/5">
                    <p className="text-sm font-medium">{c.title}</p>
                    <p className="line-clamp-1 text-xs text-slate-500">{c.body}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
