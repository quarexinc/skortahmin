'use client';

import { Apple, Bell, Cherry, Citrus, Clover, Crown, Diamond, Gem, Grape, Play, Repeat, Sparkles, Star, StopCircle, type LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import BetInput from '@/components/games/BetInput';
import GameShell, { FairBox } from '@/components/games/GameShell';
import { Button } from '@/components/ui';
import { api } from '@/lib/client';
import { PAYLINES, PAYTABLE, SCATTER_PAY, SYMBOLS, type Sym } from '@/lib/games/slots';
import { fmtCredits, fmtMult } from '@/lib/money';

const ICONS: Record<Sym, { icon: LucideIcon; color: string; label: string }> = {
  cherry: { icon: Cherry, color: '#f43f5e', label: 'Kiraz' },
  lemon: { icon: Citrus, color: '#facc15', label: 'Limon' },
  grape: { icon: Grape, color: '#a855f7', label: 'Üzüm' },
  bell: { icon: Bell, color: '#f59e0b', label: 'Çan' },
  clover: { icon: Clover, color: '#22c55e', label: 'Yonca' },
  star: { icon: Star, color: '#fde047', label: 'Yıldız' },
  gem: { icon: Gem, color: '#22d3ee', label: 'Mücevher' },
  crown: { icon: Crown, color: '#fbbf24', label: 'Taç' },
  wild: { icon: Sparkles, color: '#f472b6', label: 'Joker' },
  scatter: { icon: Diamond, color: '#60a5fa', label: 'Dağınık' },
};
void Apple;

interface Line { line: number; symbol: Sym; count: number; mult: number }
interface Res { grid: Sym[][]; lines: Line[]; scatter: number; scatterMult: number; multiplier: number; payout: number; balance: number; fair: { serverHash: string; clientSeed: string; nonce: number } }

const randomGrid = (): Sym[][] => Array.from({ length: 5 }, () => Array.from({ length: 3 }, () => SYMBOLS[Math.floor(Math.random() * 8)]));

export default function Slots() {
  const { setBalance, toast } = useAuth();
  const [amount, setAmount] = useState('10');
  const [grid, setGrid] = useState<Sym[][]>(randomGrid);
  const [spinning, setSpinning] = useState<boolean[]>([false, false, false, false, false]);
  const [res, setRes] = useState<Res | null>(null);
  const [busy, setBusy] = useState(false);
  const [auto, setAuto] = useState(0);
  const autoRef = useRef(0);
  const [showPay, setShowPay] = useState(false);

  const spin = async (): Promise<boolean> => {
    setBusy(true);
    setRes(null);
    setSpinning([true, true, true, true, true]);
    const tick = setInterval(() => setGrid((g) => g.map((col, r) => (spinningRef.current[r] ? randomGrid()[r] : col))), 70);
    const r = await api<Res>('/api/games/slots', { body: { amount } });
    if (r.error || !r.data) {
      clearInterval(tick);
      setSpinning([false, false, false, false, false]);
      setBusy(false);
      toast(r.error ?? 'Hata', 'error');
      return false;
    }
    const d = r.data;
    for (let i = 0; i < 5; i++) {
      await new Promise((ok) => setTimeout(ok, i === 0 ? 350 : 180));
      setGrid((g) => g.map((col, idx) => (idx === i ? d.grid[i] : col)));
      setSpinning((s) => s.map((x, idx) => (idx === i ? false : x)));
    }
    clearInterval(tick);
    setGrid(d.grid);
    setRes(d);
    setBalance(d.balance);
    setBusy(false);
    return true;
  };
  const spinningRef = useRef(spinning);
  spinningRef.current = spinning;

  useEffect(() => {
    autoRef.current = auto;
  }, [auto]);
  const runAuto = async (n: number) => {
    setAuto(n);
    autoRef.current = n;
    while (autoRef.current > 0) {
      const ok = await spin();
      if (!ok) break;
      autoRef.current -= 1;
      setAuto(autoRef.current);
      await new Promise((r) => setTimeout(r, 600));
    }
    setAuto(0);
  };

  const winCells = new Set<string>();
  res?.lines.forEach((l) => PAYLINES[l.line].slice(0, l.count).forEach((row, reel) => winCells.add(`${reel}-${row}`)));

  const controls = (
    <>
      <BetInput value={amount} onChange={setAmount} disabled={busy || auto > 0} label="Toplam bahis (10 çizgi)" />
      <Button className="w-full" size="lg" onClick={() => spin()} loading={busy && auto === 0} disabled={busy || auto > 0}>
        <Play size={18} /> Çevir
      </Button>
      {auto > 0 ? (
        <Button variant="danger" className="w-full" onClick={() => { autoRef.current = 0; setAuto(0); }}>
          <StopCircle size={16} /> Otomatiği durdur ({auto})
        </Button>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {[10, 25, 50].map((n) => (
            <Button key={n} variant="secondary" size="sm" disabled={busy} onClick={() => runAuto(n)}><Repeat size={13} /> {n}</Button>
          ))}
        </div>
      )}
      <button onClick={() => setShowPay((s) => !s)} className="w-full text-xs text-violet-300 underline">{showPay ? 'Ödeme tablosunu gizle' : 'Ödeme tablosu'}</button>
      {showPay && (
        <div className="space-y-1.5 text-xs">
          {(Object.keys(PAYTABLE) as (keyof typeof PAYTABLE)[]).reverse().map((k) => {
            const I = ICONS[k];
            return (
              <div key={k} className="flex items-center gap-2">
                <I.icon size={16} style={{ color: I.color }} />
                <span className="flex-1 text-slate-400">{I.label}</span>
                <span className="tabular-nums text-slate-300">{PAYTABLE[k].map((m) => `${m / 10}x`).join(' · ')}</span>
              </div>
            );
          })}
          <div className="flex items-center gap-2 border-t border-white/5 pt-1.5">
            <Diamond size={16} style={{ color: ICONS.scatter.color }} />
            <span className="flex-1 text-slate-400">Dağınık (her yerde)</span>
            <span className="tabular-nums text-slate-300">{SCATTER_PAY.map((m) => `${m}x`).join(' · ')}</span>
          </div>
          <p className="text-slate-500">3 · 4 · 5 eşleşme, toplam bahse göre. Joker dağınık hariç tüm sembollerin yerine geçer.</p>
        </div>
      )}
    </>
  );

  const board = (
    <div className="card relative overflow-hidden p-4 sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(167,139,250,.15),transparent_60%)]" />
      <div className="relative mx-auto grid max-w-[560px] grid-cols-5 gap-2 rounded-2xl bg-ink-950/70 p-3 ring-1 ring-white/10">
        {grid.map((col, reel) => (
          <div key={reel} className={`grid gap-2 ${spinning[reel] ? 'blur-[1.5px]' : ''}`}>
            {col.map((s, row) => {
              const I = ICONS[s];
              const win = winCells.has(`${reel}-${row}`) || (s === 'scatter' && (res?.scatter ?? 0) >= 3);
              return (
                <div
                  key={row}
                  className={`grid aspect-square place-items-center rounded-xl bg-ink-800 transition ${win ? 'animate-pop ring-2 ring-amber-300 shadow-[0_0_24px_rgba(252,211,77,.35)]' : ''}`}
                >
                  <I.icon className="h-[55%] w-[55%]" style={{ color: I.color }} strokeWidth={2.2} />
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="relative mt-4 h-12 text-center">
        {res &&
          (res.payout > 0 ? (
            <p className="animate-pop text-2xl font-black text-amber-300">+{fmtCredits(res.payout)} <span className="text-base text-slate-300">({fmtMult(res.multiplier)})</span></p>
          ) : (
            <p className="text-sm text-slate-500">Bu sefer olmadı.</p>
          ))}
      </div>
    </div>
  );

  return <GameShell game="slots" controls={controls} board={board} fair={<FairBox fair={res?.fair ?? null} />} />;
}
