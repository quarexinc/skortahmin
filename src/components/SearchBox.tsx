'use client';

interface SearchBoxProps {
  value: string;
  onChange: (v: string) => void;
}

export default function SearchBox({ value, onChange }: SearchBoxProps) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
        🔍
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Takım ara…"
        aria-label="Takım ara"
        className="w-full rounded-2xl border border-white/10 bg-ink-800 py-2.5 pl-10 pr-9 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          aria-label="Aramayı temizle"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
        >
          ✕
        </button>
      )}
    </div>
  );
}
