'use client';

export interface DayInfo {
  key: string;
  label: string;
  sub: string;
  isToday: boolean;
  count: number | null;
  loading: boolean;
  error: boolean;
  selected: boolean;
}

interface DateStripProps {
  days: DayInfo[];
  onSelect: (key: string) => void;
}

export default function DateStrip({ days, onSelect }: DateStripProps) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label="Günler">
      {days.map((d, i) => (
        <button
          key={d.key}
          role="tab"
          aria-selected={d.selected}
          onClick={() => onSelect(d.key)}
          className={`flex min-w-[78px] shrink-0 flex-col items-center gap-0.5 rounded-2xl border px-3 py-2.5 transition ${
            d.selected
              ? 'border-accent/60 bg-accent/15 text-white'
              : 'border-white/10 bg-ink-800 text-slate-400 hover:border-white/25 hover:text-slate-200'
          }`}
        >
          <span className="text-[11px] font-medium">
            {d.isToday ? 'Bugün' : i === 1 ? 'Yarın' : d.label}
          </span>
          <span className={`text-sm font-bold tabular-nums ${d.selected ? 'text-accent-soft' : ''}`}>{d.sub}</span>
          <span className="text-[10px] text-slate-500">
            {d.loading ? '…' : d.error ? '!' : d.count == null ? '' : d.count === 0 ? 'maç yok' : `${d.count} maç`}
          </span>
        </button>
      ))}
    </div>
  );
}
