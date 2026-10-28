'use client';

import { useState } from 'react';
import BetInput from '@/components/games/BetInput';
import GameShell, { FairBox } from '@/components/games/GameShell';
import { AutoButtons, HistoryChips, num, PlayButton, ResultBar, Seg, Stat, useAuto, useEdge, usePlay } from '@/components/games/kit';
import { coinflipMult } from '@/lib/games/instant';
import { fmtMult } from '@/lib/money';

interface D { results: ('heads' | 'tails')[]; win: boolean; side: 'heads' | 'tails'; flips: number }

const Coin = ({ side, size = 72, spin }: { side: 'heads' | 'tails' | null; size?: number; spin?: boolean }) => (
  <div
    className={`grid place-items-center rounded-full border-4 font-black shadow-lg ${spin ? 'animate-spin' : 'animate-pop'} ${side === 'tails' ? 'border-slate-400 bg-gradient-to-br from-slate-200 to-slate-500 text-slate-700' : 'border-amber-600 bg-gradient-to-br from-amber-200 to-amber-500 text-amber-800'}`}
    style={{ width: size, height: size, fontSize: size / 3 }}
  >
    {side === 'tails' ? 'T' : side === 'heads' ? 'Y' : '?'}
  </div>
);

export default function Coinflip() {
  const edge = useEdge('coinflip');
  const [amount, setAmount] = useState('10');
  const [side, setSide] = useState<'heads' | 'tails'>('heads');
  const [flips, setFlips] = useState(1);
  const [spin, setSpin] = useState(false);
  const { play, busy, fair, res, history, setBalance } = usePlay<D>('coinflip');

  const mult = coinflipMult(flips, edge);
  const go = async () => {
    setSpin(true);
    const r = await play({ amount, side, flips }, { deferBalance: true });
    await new Promise((ok) => setTimeout(ok, 600));
    setSpin(false);
    if (!r) return false;
    setBalance(r.balance);
    return true;
  };
  const auto = useAuto(go, 500);

  const controls = (
    <>
      <BetInput value={amount} onChange={setAmount} disabled={busy || auto.left > 0} />
      <Seg value={side} onChange={setSide} disabled={busy} options={[{ v: 'heads', l: 'Yazı' }, { v: 'tails', l: 'Tura' }]} />
      <div>
        <div className="mb-1.5 flex justify-between text-xs text-slate-400"><span>Seri (hepsi tutmalı)</span><b className="text-white">{flips}</b></div>
        <input type="range" min={1} max={8} value={flips} onChange={(e) => setFlips(Number(e.target.value))} disabled={busy} className="w-full accent-violet-500" aria-label="Seri" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Çarpan" value={fmtMult(mult)} />
        <Stat label="Şans" value={`%${((1 - edge) / mult * 100).toFixed(2).replace('.', ',')}`} />
        <Stat label="Kazanç" value={(num(amount) * mult).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} tone="win" />
      </div>
      <PlayButton onClick={go} busy={busy && auto.left === 0} disabled={auto.left > 0}>Parayı at</PlayButton>
      <AutoButtons {...auto} disabled={busy} />
    </>
  );

  const shown = spin || !res ? Array.from({ length: flips }, () => null) : res.detail.results;
  const board = (
    <div className="card space-y-6 p-5 sm:p-8">
      <HistoryChips items={history} />
      <div className="flex min-h-[10rem] flex-wrap items-center justify-center gap-4 py-4">
        {shown.map((s, i) => <Coin key={`${i}-${res?.betId}-${spin}`} side={s} spin={spin} size={shown.length > 4 ? 56 : 88} />)}
      </div>
      <p className="text-center text-sm text-slate-400">Seçimin: <b className="text-white">{side === 'heads' ? 'Yazı' : 'Tura'}</b> · {flips} atış</p>
      <ResultBar res={res} />
    </div>
  );
  return <GameShell game="coinflip" controls={controls} board={board} fair={<FairBox fair={fair} />} />;
}
