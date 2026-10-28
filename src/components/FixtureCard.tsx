'use client';

import Link from 'next/link';
import {
  CANCELLED_STATUSES,
  fmtTime,
  LIVE_STATUSES,
  POSTPONED_STATUSES,
  statusLabel,
} from '@/lib/format';
import type { LightFixture } from '@/lib/types';
import TeamLogo from './TeamLogo';

function winnerClass(f: LightFixture, side: 'home' | 'away'): string {
  const h = f.goals.home;
  const a = f.goals.away;
  if (h == null || a == null) return 'text-slate-100';
  if (h === a) return 'text-slate-200';
  const won = side === 'home' ? h > a : a > h;
  return won ? 'text-white' : 'text-slate-400';
}

export default function FixtureCard({ f }: { f: LightFixture }) {
  const finished = f.goals.home != null && f.goals.away != null;
  const live = LIVE_STATUSES.has(f.status.short);
  const postponed = POSTPONED_STATUSES.has(f.status.short);
  const cancelled = CANCELLED_STATUSES.has(f.status.short);

  return (
    <Link
      href={`/mac/${f.id}`}
      className="card block p-4 transition animate-fade-in hover:border-accent/40 hover:bg-ink-700/50"
    >
      <div className="mb-3 flex items-center justify-between gap-2 text-xs text-slate-400">
        <span className="flex min-w-0 items-center gap-1.5">
          {f.league?.logo && (
            <img src={f.league.logo} alt="" loading="lazy" className="h-3.5 w-3.5 shrink-0 object-contain" />
          )}
          <span className="truncate">{f.league?.name ?? 'Lig'}</span>
        </span>
        {finished ? (
          <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 font-semibold text-accent-soft">
            {statusLabel(f.status.short)}
          </span>
        ) : live ? (
          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-red-500/15 px-2 py-0.5 font-semibold text-red-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
            CANLI
          </span>
        ) : postponed ? (
          <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 font-semibold text-amber-400">
            {statusLabel(f.status.short)}
          </span>
        ) : cancelled ? (
          <span className="shrink-0 rounded-full bg-red-500/15 px-2 py-0.5 font-semibold text-red-400">
            {statusLabel(f.status.short)}
          </span>
        ) : (
          <span className="shrink-0 font-semibold tabular-nums text-slate-300">{fmtTime(f.date)}</span>
        )}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <TeamLogo logo={f.home?.logo ?? null} name={f.home?.name ?? null} size="md" />
          <span className={`truncate text-sm font-semibold ${finished ? winnerClass(f, 'home') : 'text-slate-100'}`}>
            {f.home?.name}
          </span>
        </div>

        <div
          className={`min-w-[68px] rounded-xl px-3 py-1.5 text-center font-bold tabular-nums ${
            finished ? 'bg-ink-950/70 text-lg text-white' : 'bg-ink-950/50 text-sm text-slate-400'
          }`}
        >
          {finished ? (
            <>
              {f.goals.home} : {f.goals.away}
            </>
          ) : (
            fmtTime(f.date)
          )}
        </div>

        <div className="flex min-w-0 flex-row-reverse items-center gap-2.5">
          <TeamLogo logo={f.away?.logo ?? null} name={f.away?.name ?? null} size="md" />
          <span className={`truncate text-right text-sm font-semibold ${finished ? winnerClass(f, 'away') : 'text-slate-100'}`}>
            {f.away?.name}
          </span>
        </div>
      </div>
    </Link>
  );
}
