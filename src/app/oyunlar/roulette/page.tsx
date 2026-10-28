'use client';

import { Eraser, Undo2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import BetInput from '@/components/games/BetInput';
import GameShell, { FairBox } from '@/components/games/GameShell';
import { PlayButton, ResultBar, num, useEdge, usePlay } from '@/components/games/kit';
import { Button } from '@/components/ui';
import { RED, rouletteMult, type RouletteType } from '@/lib/games/instant';

interface D { number: number; color: 'red' | 'black' | 'green'; lines: { t: string; v: number | null; a: number; win: boolean; pay: number }[] }
interface Chip { t: RouletteType; v?: number; a: number }

const fm = (n: number) => n.toLocaleString('tr-TR', { maximumFractionDigits: 2 });
const key = (t: string, v?: number) => `${t}:${v ?? ''}`;
const colorOf = (n: number) => (n === 0 ? 'green' : RED.has(n) ? 'red' : 'black');
const BG = { red: 'bg-red-600', black: 'bg-slate-900', green: 'bg-emerald-600' } as const;

export default function Roulette() {
  const edge = useEdge('roulette');
  const [chipVal, setChipVal] = useState('10');
  const [chips, setChips] = useState<Chip[]>([]);
  const { play, busy, fair, res, setBalance } = usePlay<D>('roulette');
  const [spinNo, setSpinNo] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [recent, setRecent] = useState<number[]>([]);
  const iv = useRef<ReturnType<typeof setInterval>>();
  useEffect(() => () => clearInterval(iv.current), []);

  const add = (t: RouletteType, v?: number) => {
    if (busy || spinning) return;
    const a = num(chipVal);
    if (a <= 0) return;
    setChips((c) => [...c, { t, v, a }]);
  };
  const total = chips.reduce((s, c) => s + c.a, 0);
  const sum = (t: string, v?: number) => chips.filter((c) => key(c.t, c.v) === key(t, v)).reduce((s, c) => s + c.a, 0);

  const spin = async () => {
    if (!chips.length) return;
    setSpinning(true);
    iv.current = setInterval(() => setSpinNo(Math.floor(Math.random() * 37)), 70);
    const r = await play({ bets: chips.map((c) => ({ t: c.t, v: c.v, a: c.a })) }, { deferBalance: true });
    await new Promise((ok) => setTimeout(ok, 1100));
    clearInterval(iv.current);
    setSpinning(false);
    if (!r) return setSpinNo(null);
    setSpinNo(r.detail.number);
    setRecent((x) => [r.detail.number, ...x].slice(0, 12));
    setBalance(r.balance);
  };

  const Cell = ({ t, v, className = '', children }: { t: RouletteType; v?: number; className?: string; children: React.ReactNode }) => {
    const a = sum(t, v);
    return (
      <button
        type="button"
        onClick={() => add(t, v)}
        title={`${fm(rouletteMult(t, edge))}x`}
        className={`relative grid place-items-center rounded-md py-2.5 text-xs font-bold text-white transition hover:brightness-125 ${className}`}
        aria-label={`${t} ${v ?? ''}`}
      >
        {children}
        {a > 0 && <span className="absolute -right-1 -top-1 z-10 rounded-full bg-amber-300 px-1.5 text-[10px] font-black leading-4 text-ink-950 shadow">{a >= 1000 ? `${Math.round(a / 100) / 10}k` : a}</span>}
      </button>
    );
  };

  const nums = (row: number) => Array.from({ length: 12 }, (_, i) => i * 3 + (3 - row)); // row 0: 3,6,..; row 2: 1,4,..
  const shownNo = spinNo ?? res?.detail.number ?? null;
  const dis = busy || spinning;

  const controls = (
    <>
      <BetInput value={chipVal} onChange={setChipVal} disabled={dis} label="Çip değeri" />
      <div className="grid grid-cols-4 gap-1.5">
        {[1, 10, 100, 1000].map((v) => <button key={v} type="button" onClick={() => setChipVal(String(v))} disabled={dis} className={`rounded-lg py-1.5 text-xs font-bold ${num(chipVal) === v ? 'bg-amber-300 text-ink-950' : 'bg-ink-900 text-slate-300 hover:bg-white/5'}`}>{v}</button>)}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" size="sm" onClick={() => setChips((c) => c.slice(0, -1))} disabled={dis || !chips.length}><Undo2 size={14} /> Geri al</Button>
        <Button variant="secondary" size="sm" onClick={() => setChips([])} disabled={dis || !chips.length}><Eraser size={14} /> Temizle</Button>
      </div>
      <div className="rounded-xl bg-ink-900 px-3 py-2.5 text-sm"><span className="text-slate-400">Toplam bahis: </span><b className="tabular-nums">{total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</b></div>
      <PlayButton onClick={spin} busy={dis} disabled={!chips.length}>Çevir</PlayButton>
      <p className="text-xs text-slate-500">Tek sıfırlı Avrupa ruleti. Sayı {fm(rouletteMult('straight', edge))}x, düzine/sütun {fm(rouletteMult('dozen', edge))}x, renk/tek-çift/yarım {fm(rouletteMult('red', edge))}x. Kasa payı %{(edge * 100).toFixed(2).replace('.', ',')}.</p>
    </>
  );

  const board = (
    <div className="card space-y-4 p-3 sm:p-5">
      <div className="flex items-center gap-3">
        <div className={`grid h-20 w-20 shrink-0 place-items-center rounded-full border-4 border-amber-400/70 text-3xl font-black text-white shadow-lg ${shownNo == null ? 'bg-ink-800 text-slate-600' : BG[colorOf(shownNo)]} ${spinning ? '' : 'animate-pop'}`}>{shownNo ?? '—'}</div>
        <div className="no-scrollbar flex min-w-0 gap-1.5 overflow-x-auto">
          {recent.map((n, i) => <span key={i} className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold text-white ${BG[colorOf(n)]}`}>{n}</span>)}
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[620px] space-y-1.5">
          <div className="grid gap-1" style={{ gridTemplateColumns: '3rem repeat(12, minmax(0, 1fr)) 3.2rem' }}>
            <div className="row-span-3 grid">
              <Cell t="straight" v={0} className={`h-full ${BG.green}`}>0</Cell>
            </div>
            {[0, 1, 2].flatMap((row) => [
              ...nums(row).map((n) => <Cell key={n} t="straight" v={n} className={BG[colorOf(n)]}>{n}</Cell>),
              <Cell key={`c${row}`} t="column" v={2 - row} className="bg-ink-700 text-[10px]">2:1</Cell>,
            ])}
          </div>
          <div className="grid grid-cols-3 gap-1 pl-[3.25rem] pr-[3.45rem]">
            {['1–12', '13–24', '25–36'].map((l, i) => <Cell key={l} t="dozen" v={i} className="bg-ink-700">{l}</Cell>)}
          </div>
          <div className="grid grid-cols-6 gap-1 pl-[3.25rem] pr-[3.45rem]">
            <Cell t="low" className="bg-ink-700">1–18</Cell>
            <Cell t="even" className="bg-ink-700">Çift</Cell>
            <Cell t="red" className="bg-red-600">Kırmızı</Cell>
            <Cell t="black" className="bg-slate-900">Siyah</Cell>
            <Cell t="odd" className="bg-ink-700">Tek</Cell>
            <Cell t="high" className="bg-ink-700">19–36</Cell>
          </div>
        </div>
      </div>
      <ResultBar res={res && !spinning ? res : null} />
    </div>
  );
  return <GameShell game="roulette" controls={controls} board={board} fair={<FairBox fair={fair} />} />;
}
