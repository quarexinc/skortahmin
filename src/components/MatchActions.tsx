'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/client';
import type { AnalysisResponse } from '@/lib/types';
import { useAuth } from './AuthProvider';

interface Fav { kind: string; ref_id: number }

export default function MatchActions({ data }: { data: AnalysisResponse }) {
  const { user, toast } = useAuth();
  const [favs, setFavs] = useState<Fav[]>([]);
  const f = data.fixture;
  useEffect(() => {
    if (user) api<{ items: Fav[] }>('/api/favorites').then((r) => setFavs(r.data?.items ?? []));
  }, [user]);

  const has = (kind: string, id: number) => favs.some((x) => x.kind === kind && x.ref_id === id);
  const toggle = async (kind: 'team' | 'fixture', refId: number, label: string, logo: string | null, extra?: unknown) => {
    if (!user) return toast('Favorilere eklemek için giriş yap.', 'info');
    const { data: r, error } = await api<{ on: boolean }>('/api/favorites', { body: { kind, refId, label, logo, extra } });
    if (error || !r) return toast(error ?? 'Hata', 'error');
    setFavs((x) => (r.on ? [...x, { kind, ref_id: refId }] : x.filter((y) => !(y.kind === kind && y.ref_id === refId))));
    toast(r.on ? `⭐ Favorilere eklendi: ${label}` : 'Favorilerden çıkarıldı', r.on ? 'success' : 'info');
  };

  const share = async () => {
    const url = window.location.href;
    const title = `${f.home?.name} – ${f.away?.name} maç analizi`;
    try {
      if (navigator.share) await navigator.share({ title, url });
      else {
        await navigator.clipboard.writeText(url);
        toast('Bağlantı kopyalandı.');
      }
    } catch {
      /* kullanıcı iptal etti */
    }
  };

  const btn = (on: boolean) =>
    `inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
      on ? 'border-amber-400/40 bg-amber-400/10 text-amber-300' : 'border-white/10 text-slate-300 hover:border-white/25 hover:text-white'
    }`;

  return (
    <div className="flex flex-wrap gap-2">
      <button
        className={btn(has('fixture', f.id))}
        onClick={() => toggle('fixture', f.id, `${f.home?.name} – ${f.away?.name}`, f.league?.logo ?? null, { date: f.date, league: f.league?.name })}
      >
        {has('fixture', f.id) ? '★' : '☆'} Maçı favorile
      </button>
      {[data.home.team, data.away.team].map((t) => (
        <button key={t.id} className={btn(has('team', t.id))} onClick={() => toggle('team', t.id, t.name, t.logo)}>
          {has('team', t.id) ? '★' : '☆'} {t.name}
        </button>
      ))}
      <button className={btn(false)} onClick={share}>↗ Paylaş</button>
      <Link href="/kupon" className={btn(false)}>🧾 Kuponum</Link>
    </div>
  );
}
