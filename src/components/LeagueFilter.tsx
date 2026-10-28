'use client';

import { LEAGUES } from '@/config/leagues';

interface LeagueFilterProps {
  value: number;
  onChange: (id: number) => void;
}

export default function LeagueFilter({ value, onChange }: LeagueFilterProps) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" role="group" aria-label="Lig filtresi">
      <button onClick={() => onChange(0)} className={`chip shrink-0 ${value === 0 ? 'chip-active' : ''}`}>
        Tümü
      </button>
      {LEAGUES.filter((l) => l.active).map((l) => (
        <button
          key={l.id}
          onClick={() => onChange(l.id)}
          className={`chip shrink-0 ${value === l.id ? 'chip-active' : ''}`}
          title={`${l.name} (${l.country})`}
        >
          <img
            src={l.logo}
            alt=""
            loading="lazy"
            className="h-4 w-4 rounded-sm object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
          {l.name}
        </button>
      ))}
    </div>
  );
}
