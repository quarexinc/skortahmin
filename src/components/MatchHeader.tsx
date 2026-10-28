import { MapPin } from 'lucide-react';
import { fmtMatchDateTime } from '@/lib/format';
import type { AnalysisResponse } from '@/lib/types';
import TeamLogo from './TeamLogo';

export default function MatchHeader({ data }: { data: AnalysisResponse }) {
  const f = data.fixture;
  const finished = f.goals.home != null && f.goals.away != null;

  return (
    <div className="card animate-fade-in p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <span className="flex items-center gap-2">
          {f.league?.logo && (
            <img src={f.league.logo} alt="" loading="lazy" className="h-4 w-4 object-contain" />
          )}
          <span>
            {f.league?.name}
            {f.league?.round ? ` · ${f.league.round}` : ''}
          </span>
        </span>
        <span className="tabular-nums">{fmtMatchDateTime(f.date)}</span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex flex-col items-center gap-2 text-center">
          <TeamLogo logo={data.home.team.logo} name={data.home.team.name} size="xl" />
          <div>
            <p className="max-w-[9rem] truncate text-sm font-bold text-slate-100 sm:text-base">
              {data.home.team.name}
            </p>
            <p className="text-[10px] font-semibold tracking-wider text-slate-500">EV SAHİBİ</p>
          </div>
        </div>

        <div className="text-center">
          {finished ? (
            <p className="text-5xl font-black tabular-nums tracking-tight text-white sm:text-6xl">
              {f.goals.home}
              <span className="mx-2 text-slate-600">:</span>
              {f.goals.away}
            </p>
          ) : (
            <p className="text-4xl font-black text-slate-600">VS</p>
          )}
          {data.home.profile?.venue && (
            <p className="mt-2 max-w-[14rem] truncate flex items-center gap-1 text-xs text-slate-500"><MapPin size={12} className="shrink-0" /> <span className="truncate">{data.home.profile.venue}</span></p>
          )}
        </div>

        <div className="flex flex-col items-center gap-2 text-center">
          <TeamLogo logo={data.away.team.logo} name={data.away.team.name} size="xl" />
          <div>
            <p className="max-w-[9rem] truncate text-sm font-bold text-slate-100 sm:text-base">
              {data.away.team.name}
            </p>
            <p className="text-[10px] font-semibold tracking-wider text-slate-500">DEPLASMAN</p>
          </div>
        </div>
      </div>
    </div>
  );
}
