'use client';

interface TabsProps<T extends string> {
  tabs: { id: T; label: string }[];
  value: T;
  onChange: (t: T) => void;
}

export default function Tabs<T extends string>({ tabs, value, onChange }: TabsProps<T>) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto border-b border-white/10 px-4" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={`shrink-0 border-b-2 px-4 py-3 text-sm font-semibold transition ${
            value === t.id
              ? 'border-accent text-white'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
