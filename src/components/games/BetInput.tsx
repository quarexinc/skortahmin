'use client';

import { Coins } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { toCredits } from '@/lib/money';

export default function BetInput({ value, onChange, disabled, label = 'Bahis miktarı' }: { value: string; onChange: (v: string) => void; disabled?: boolean; label?: string }) {
  const { user } = useAuth();
  const n = Number(value.replace(',', '.')) || 0;
  const set = (x: number) => onChange(String(Math.max(0, Math.floor(x * 100) / 100)));
  const max = user ? toCredits(user.balance) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span className="tabular-nums">Bakiye: {max.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
      </div>
      <div className="flex overflow-hidden rounded-xl border border-white/10 bg-ink-900 focus-within:border-violet-400/60">
        <span className="grid w-9 place-items-center text-amber-300"><Coins size={16} /></span>
        <input
          inputMode="decimal"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9.,]/g, ''))}
          className="min-w-0 flex-1 bg-transparent py-2.5 text-sm font-bold tabular-nums outline-none disabled:opacity-60"
          aria-label={label}
        />
        {[
          ['½', () => set(n / 2)],
          ['2x', () => set(n * 2)],
          ['Max', () => set(max)],
        ].map(([l, f]) => (
          <button key={l as string} type="button" disabled={disabled} onClick={f as () => void} className="border-l border-white/10 px-3 text-xs font-bold text-slate-300 hover:bg-white/5 disabled:opacity-50">
            {l as string}
          </button>
        ))}
      </div>
    </div>
  );
}
