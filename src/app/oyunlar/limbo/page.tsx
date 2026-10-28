'use client';

import { useEffect, useRef, useState } from 'react';
import BetInput from '@/components/games/BetInput';
import GameShell, { FairBox } from '@/components/games/GameShell';
import { AutoButtons, HistoryChips, num, PlayButton, ResultBar, Stat, useAuto, useEdge, usePlay } from '@/components/games/kit';
import { Input } from '@/components/ui';
import { fmtMult } from '@/lib/money';

interface D { point: number; target: number; win: boolean }

export default function Limbo() {
  const edge = useEdge('limbo');
  const [amount, setAmount] = useState('10');
  const [target, setTarget] = useState('2.00');
  const { play, busy, fair, res, history, setBalance } = usePlay<D>('limbo');
  const [shown, setShown] = useState(1);
  const raf = useRef(0);

  const t = Math.max(1.01, Math.min(1000, num(target)));
  const chance = (1 - edge) / t;

  const animate = (to: number) =>
    new Promise<void>((done) => {
      const start = performance.now();
      const dur = 650;
      const tick = (now: number) => {
        const k = Math.min(1, (now - start) / dur);
        setShown(1 + (to - 1) * (1 - Math.pow(1 - k, 3)));
        if (k < 1) raf.current = requestAnimationFrame(tick);
        else done();
      };
      raf.current = requestAnimationFrame(tick);
    });
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const go = async () => {
    const r = await play({ amount, target: t }, { deferBalance: true });
    if (!r) return false;
    await animate(r.detail.point);
    setBalance(r.balance);
    return true;
  };
  const auto = useAuto(go, 400);
  const win = res?.detail.win;

  const controls = (
    <>
      <BetInput value={amount} onChange={setAmount} disabled={busy || auto.left > 0} />
      <div>
        <p className="mb-1.5 text-xs text-slate-400">Hedef çarpan</p>
        <Input inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value.replace(/[^0-9.,]/g, ''))} disabled={busy} aria-label="Hedef çarpan" />
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {['1.50', '2.00', '5.00', '10.00'].map((v) => <button key={v} type="button" onClick={() => setTarget(v)} className="rounded-lg bg-ink-900 py-1.5 text-xs font-bold text-slate-300 hover:bg-white/5">{v}x</button>)}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Kazanma şansı" value={`%${(chance * 100).toFixed(2).replace('.', ',')}`} />
        <Stat label="Kazanç" value={(num(amount) * t).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} tone="win" />
      </div>
      <PlayButton onClick={go} busy={busy && auto.left === 0} disabled={auto.left > 0}>Bahis yap</PlayButton>
      <AutoButtons {...auto} disabled={busy} />
    </>
  );

  const board = (
    <div className="card space-y-6 p-5 sm:p-8">
      <HistoryChips items={history} />
      <div className="grid place-items-center py-8">
        <p className={`text-7xl font-black tabular-nums transition-colors sm:text-8xl ${res == null ? 'text-slate-600' : win ? 'text-emerald-400' : 'text-rose-400'}`}>{fmtMult(shown)}</p>
        <p className="mt-3 text-sm text-slate-400">Hedef: <b className="text-white">{fmtMult(t)}</b></p>
      </div>
      <ResultBar res={res} />
    </div>
  );
  return <GameShell game="limbo" controls={controls} board={board} fair={<FairBox fair={fair} />} />;
}
