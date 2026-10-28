'use client';

import { Lock } from 'lucide-react';
import { badgeDef, type EarnedBadge } from '@/config/badges';

export default function BadgeGrid({ badges, showLocked = true, compact = false }: { badges: EarnedBadge[]; showLocked?: boolean; compact?: boolean }) {
  const list = showLocked ? [...badges].sort((a, b) => Number(b.earned) - Number(a.earned)) : badges.filter((b) => b.earned);
  if (list.length === 0) return <p className="text-sm text-slate-500">Henüz rozet kazanılmadı.</p>;
  return (
    <div className={`grid gap-3 ${compact ? 'grid-cols-4 sm:grid-cols-6' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'}`}>
      {list.map((b) => {
        const d = badgeDef(b.key);
        if (!d) return null;
        const Icon = d.icon;
        if (compact)
          return (
            <div key={b.key} title={`${d.name} — ${d.desc}`} className="flex flex-col items-center gap-1 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-2xl" style={{ background: `${d.color}22`, color: d.color }}>
                <Icon size={22} />
              </span>
              <span className="line-clamp-1 text-[10px] text-slate-400">{d.name}</span>
            </div>
          );
        return (
          <div key={b.key} className={`card relative p-4 text-center transition ${b.earned ? 'hover:-translate-y-0.5' : 'opacity-50'}`}>
            <span
              className="mx-auto grid h-14 w-14 place-items-center rounded-2xl"
              style={b.earned ? { background: `${d.color}22`, color: d.color, boxShadow: `0 0 24px ${d.color}33` } : { background: 'rgba(255,255,255,.04)', color: '#64748b' }}
            >
              {b.earned ? <Icon size={26} /> : <Lock size={22} />}
            </span>
            <p className="mt-3 text-sm font-bold">{d.name}</p>
            <p className="mt-0.5 text-xs text-slate-400">{d.desc}</p>
            {!b.earned && (
              <div className="mt-3">
                <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full rounded-full bg-accent/70" style={{ width: `${(b.current / b.target) * 100}%` }} />
                </div>
                <p className="mt-1 text-[10px] text-slate-500">{b.current} / {b.target}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
