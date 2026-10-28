'use client';

import { Timer } from 'lucide-react';
import { useEffect, useState } from 'react';

// Maç başlangıcına kalan süre
export default function Countdown({ to, label = 'Başlamasına' }: { to: string; label?: string }) {
  const target = new Date(to).getTime();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const ms = target - now;
  if (ms <= 0) return null;
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  const parts = d > 0 ? [[d, 'gün'], [h, 'sa'], [m, 'dk']] : [[h, 'sa'], [m, 'dk'], [s, 'sn']];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
      <Timer size={14} className="text-accent-soft" /> {label}
      {parts.map(([v, u]) => (
        <b key={u as string} className="rounded-md bg-ink-900 px-1.5 py-0.5 tabular-nums text-white">{String(v).padStart(2, '0')}<span className="ml-0.5 font-normal text-slate-500">{u}</span></b>
      ))}
    </span>
  );
}
