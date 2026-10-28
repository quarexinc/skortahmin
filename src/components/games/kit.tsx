'use client';

// Oyun sayfaları için ortak kancalar ve küçük bileşenler.
import { Play, Repeat, StopCircle } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui';
import { api } from '@/lib/client';
import { fmtCredits, fmtMult } from '@/lib/money';

export interface Fair { serverHash: string; clientSeed: string; nonce: number }
export interface PlayRes<D = Record<string, unknown>> {
  game: string;
  detail: D;
  edge: number;
  multiplier: number;
  payout: number;
  amount: number;
  balance: number;
  fair: Fair;
  betId: number;
}

/** Tek atışlık oyunlar için /api/games/play çağrısı. Bakiyeyi günceller, hata olursa toast gösterir. */
export function usePlay<D = Record<string, unknown>>(game: string) {
  const { setBalance, toast } = useAuth();
  const [busy, setBusy] = useState(false);
  const [fair, setFair] = useState<Fair | null>(null);
  const [res, setRes] = useState<PlayRes<D> | null>(null);
  const [history, setHistory] = useState<{ m: number; win: boolean }[]>([]);
  const play = useCallback(
    async (payload: Record<string, unknown>, opts: { deferBalance?: boolean } = {}): Promise<PlayRes<D> | null> => {
      setBusy(true);
      const r = await api<PlayRes<D>>('/api/games/play', { body: { game, ...payload } });
      setBusy(false);
      if (r.error || !r.data) {
        toast(r.error ?? 'Hata', 'error');
        return null;
      }
      setFair(r.data.fair);
      setRes(r.data);
      setHistory((h) => [{ m: r.data!.multiplier, win: r.data!.payout > r.data!.amount }, ...h].slice(0, 14));
      if (!opts.deferBalance) setBalance(r.data.balance);
      return r.data;
    },
    [game, setBalance, toast],
  );
  return { play, busy, fair, res, setRes, history, setBalance };
}

/** Otomatik bahis: run() başarıyla biterse true döndürmeli. */
export function useAuto(run: () => Promise<boolean>, delay = 650) {
  const [left, setLeft] = useState(0);
  const ref = useRef(0);
  const runRef = useRef(run);
  runRef.current = run;
  const stop = useCallback(() => {
    ref.current = 0;
    setLeft(0);
  }, []);
  const start = useCallback(
    async (n: number) => {
      ref.current = n;
      setLeft(n);
      while (ref.current > 0) {
        const ok = await runRef.current();
        if (!ok) break;
        ref.current -= 1;
        setLeft(ref.current);
        await new Promise((r) => setTimeout(r, delay));
      }
      stop();
    },
    [delay, stop],
  );
  useEffect(() => () => void (ref.current = 0), []);
  return { left, start, stop };
}

export function AutoButtons({ left, start, stop, disabled }: { left: number; start: (n: number) => void; stop: () => void; disabled?: boolean }) {
  if (left > 0)
    return (
      <Button variant="danger" className="w-full" onClick={stop}>
        <StopCircle size={16} /> Otomatiği durdur ({left})
      </Button>
    );
  return (
    <div className="grid grid-cols-3 gap-2">
      {[10, 25, 50].map((n) => (
        <Button key={n} variant="secondary" size="sm" disabled={disabled} onClick={() => start(n)}><Repeat size={13} /> {n}</Button>
      ))}
    </div>
  );
}

export function PlayButton({ onClick, busy, disabled, children }: { onClick: () => void; busy?: boolean; disabled?: boolean; children?: ReactNode }) {
  return (
    <Button className="w-full" size="lg" onClick={onClick} loading={busy} disabled={busy || disabled}>
      <Play size={18} /> {children ?? 'Bahis yap'}
    </Button>
  );
}

/** Sonuç şeridi: kazanç veya kayıp */
export function ResultBar({ res }: { res: { payout: number; amount: number; multiplier: number } | null }) {
  return (
    <div className="h-10 text-center">
      {res &&
        (res.payout > 0 ? (
          <p key={res.payout + res.multiplier} className="animate-pop text-2xl font-black text-amber-300">
            +{fmtCredits(res.payout)} <span className="text-base text-slate-300">({fmtMult(res.multiplier)})</span>
          </p>
        ) : (
          <p className="text-sm text-slate-500">Bu sefer olmadı.</p>
        ))}
    </div>
  );
}

export function HistoryChips({ items }: { items: { m: number; win: boolean }[] }) {
  if (!items.length) return null;
  return (
    <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
      {items.map((h, i) => (
        <span key={i} className={`shrink-0 rounded-lg px-2 py-1 text-xs font-bold tabular-nums ${h.win ? 'bg-emerald-500/15 text-emerald-300' : h.m > 0 ? 'bg-sky-500/15 text-sky-300' : 'bg-white/5 text-slate-500'}`}>
          {fmtMult(h.m)}
        </span>
      ))}
    </div>
  );
}

export function Seg<T extends string | number>({ value, onChange, options, disabled, cols }: { value: T; onChange: (v: T) => void; options: { v: T; l: ReactNode }[]; disabled?: boolean; cols?: number }) {
  return (
    <div className="grid gap-1.5 rounded-xl bg-ink-900 p-1" style={{ gridTemplateColumns: `repeat(${cols ?? options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => (
        <button
          key={String(o.v)}
          type="button"
          disabled={disabled}
          onClick={() => onChange(o.v)}
          className={`rounded-lg px-2 py-2 text-xs font-bold transition disabled:opacity-60 ${value === o.v ? 'bg-violet-500 text-white shadow' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

export function Stat({ label, value, tone }: { label: string; value: ReactNode; tone?: 'win' | 'muted' }) {
  return (
    <div className="rounded-xl bg-ink-900 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-0.5 text-sm font-bold tabular-nums ${tone === 'win' ? 'text-accent-soft' : tone === 'muted' ? 'text-slate-400' : ''}`}>{value}</p>
    </div>
  );
}

export const num = (v: string) => Number(v.replace(',', '.')) || 0;
export const useEdge = (game: string, fallback = 1) => {
  const { site } = useAuth();
  return (site.edges[game] ?? fallback) / 100;
};
