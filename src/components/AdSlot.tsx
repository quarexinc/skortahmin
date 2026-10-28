'use client';

// Reklam alanı: yerleşime göre reklam çeker. Reklam yoksa hiçbir şey göstermez.
import { ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { AdPlacement } from '@/config/ads';

interface Ad { id: number; kind: 'image' | 'text' | 'html'; image: string | null; title: string | null; body: string | null; cta: string | null; html: string | null; hasLink: boolean }

export default function AdSlot({ placement, className = '' }: { placement: AdPlacement; className?: string }) {
  const [ad, setAd] = useState<Ad | null>(null);
  useEffect(() => {
    let off = false;
    fetch(`/api/ads?placement=${placement}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => !off && setAd(j.ad ?? null))
      .catch(() => undefined);
    return () => {
      off = true;
    };
  }, [placement]);
  if (!ad) return null;
  const href = `/api/ads/click/${ad.id}`;

  return (
    <aside className={`animate-fade-in ${className}`} aria-label="Reklam">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Reklam</p>
      {ad.kind === 'html' && ad.html ? (
        <iframe
          title="Reklam"
          srcDoc={ad.html}
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
          className="h-[120px] w-full overflow-hidden rounded-2xl border border-white/5 bg-ink-900"
        />
      ) : ad.kind === 'image' && ad.image ? (
        <a href={ad.hasLink ? href : undefined} target="_blank" rel="sponsored noopener" className="block overflow-hidden rounded-2xl border border-white/5 transition hover:border-white/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ad.image} alt={ad.title ?? 'Reklam'} className="h-auto max-h-56 w-full object-cover" loading="lazy" />
        </a>
      ) : (
        <a
          href={ad.hasLink ? href : undefined}
          target="_blank"
          rel="sponsored noopener"
          className="group relative flex flex-wrap items-center gap-4 overflow-hidden rounded-2xl border border-amber-400/20 bg-gradient-to-r from-amber-400/10 via-ink-800 to-ink-800 p-5 transition hover:border-amber-400/40"
        >
          {ad.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ad.image} alt="" className="h-14 w-14 rounded-xl object-cover" loading="lazy" />
          )}
          <div className="min-w-0 flex-1">
            {ad.title && <p className="font-bold text-white">{ad.title}</p>}
            {ad.body && <p className="mt-0.5 text-sm text-slate-300">{ad.body}</p>}
          </div>
          {ad.cta && (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-ink-950 transition group-hover:bg-amber-300">
              {ad.cta} <ExternalLink size={14} />
            </span>
          )}
        </a>
      )}
    </aside>
  );
}
