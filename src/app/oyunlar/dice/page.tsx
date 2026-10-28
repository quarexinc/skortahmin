'use client';

import { useState } from 'react';
import BetInput from '@/components/games/BetInput';
import GameShell, { FairBox } from '@/components/games/GameShell';
import { AutoButtons, HistoryChips, num, PlayButton, ResultBar, Seg, Stat, useAuto, useEdge, usePlay } from '@/components/games/kit';
import { diceChance, diceMult, type DiceP } from '@/lib/games/instant';
import { fmtMult } from '@/lib/money';

interface D { roll: number; win: boolean; target: number; dir: 'under' | 'over' }

export default function Dice() {
  const edge = useEdge('dice');
  const [amount, setAmount] = useState('10');
  const [target, setTarget] = useState(50);
  const [dir, setDir] = useState<'under' | 'over'>('under');
  const { play, busy, fair, res, history } = usePlay<D>('dice');

  const p: DiceP = { target, dir };
  const chance = diceChance(p);
  const mult = diceMult(p, edge);
  const go = async () => !!(await play({ amount, target, dir }));
  const auto = useAuto(go, 500);
  const roll = res?.detail.roll;

  const controls = (
    <>
      <BetInput value={amount} onChange={setAmount} disabled={busy || auto.left > 0} />
      <Seg value={dir} onChange={setDir} disabled={busy} options={[{ v: 'under', l: 'Altı' }, { v: 'over', l: 'Üstü' }]} />
      <div>
        <div className="mb-1.5 flex justify-between text-xs text-slate-400"><span>Hedef</span><b className="text-white tabular-nums">{target.toFixed(2)}</b></div>
        <input type="range" min={1} max={98} step={0.01} value={target} onChange={(e) => setTarget(num(e.target.value))} disabled={busy || auto.left > 0} className="w-full accent-violet-500" aria-label="Hedef" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Çarpan" value={fmtMult(mult)} />
        <Stat label="Şans" value={`%${(chance * 100).toFixed(2).replace('.', ',')}`} />
        <Stat label="Kazanç" value={(num(amount) * mult).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} tone="win" />
      </div>
      <PlayButton onClick={go} busy={busy && auto.left === 0} disabled={auto.left > 0}>Zar at</PlayButton>
      <AutoButtons {...auto} disabled={busy} />
    </>
  );

  const board = (
    <div className="card space-y-6 p-5 sm:p-8">
      <HistoryChips items={history} />
      <div className="text-center">
        <p key={String(roll)} className={`animate-pop text-7xl font-black tabular-nums sm:text-8xl ${roll == null ? 'text-slate-600' : res?.detail.win ? 'text-emerald-400' : 'text-rose-400'}`}>
          {roll == null ? '—' : roll.toFixed(2)}
        </p>
      </div>
      <div className="relative px-1 pt-6">
        <div className="relative h-4 overflow-hidden rounded-full bg-rose-500/40">
          <div className="absolute inset-y-0 bg-emerald-500/70 transition-all" style={dir === 'under' ? { left: 0, width: `${target}%` } : { left: `${target}%`, right: 0 }} />
        </div>
        <div className="absolute -top-0.5 transition-all duration-500" style={{ left: `${roll ?? 50}%`, opacity: roll == null ? 0 : 1 }}>
          <div className="-translate-x-1/2 rounded-md bg-white px-1.5 py-0.5 text-[10px] font-black text-ink-950">{roll?.toFixed(2)}</div>
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-slate-500"><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></div>
      </div>
      <ResultBar res={res} />
    </div>
  );
  return <GameShell game="dice" controls={controls} board={board} fair={<FairBox fair={fair} />} />;
}
