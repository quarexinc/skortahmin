'use client';

import { Eraser, Shuffle } from 'lucide-react';
import { useMemo, useState } from 'react';
import BetInput from '@/components/games/BetInput';
import GameShell, { FairBox } from '@/components/games/GameShell';
import { PlayButton, ResultBar, useEdge, usePlay } from '@/components/games/kit';
import { Button } from '@/components/ui';
import { kenoProbs, kenoTable, KENO_N } from '@/lib/games/instant';
import { fmtMult } from '@/lib/money';

interface D { picks: number[]; drawn: number[]; hits: number[]; mult: number }

export default function Keno() {
  const edge = useEdge('keno');
  const [amount, setAmount] = useState('10');
  const [picks, setPicks] = useState<number[]>([]);
  const { play, busy, fair, res, setRes, setBalance } = usePlay<D>('keno');
  const [reveal, setReveal] = useState<number[]>([]);
  const [anim, setAnim] = useState(false);

  const toggle = (n: number) => {
    if (busy || anim) return;
    if (res) setRes(null), setReveal([]);
    setPicks((p) => (p.includes(n) ? p.filter((x) => x !== n) : p.length >= 10 ? p : [...p, n]));
  };
  const random = () => {
    if (busy || anim) return;
    setRes(null);
    setReveal([]);
    const pool = Array.from({ length: KENO_N }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    setPicks(pool.slice(0, picks.length || 5));
  };

  const table = useMemo(() => (picks.length ? kenoTable(picks.length, edge) : []), [picks.length, edge]);
  const probs = useMemo(() => (picks.length ? kenoProbs(picks.length) : []), [picks.length]);

  const go = async () => {
    setReveal([]);
    const r = await play({ amount, picks }, { deferBalance: true });
    if (!r) return;
    setAnim(true);
    for (let i = 0; i < r.detail.drawn.length; i++) {
      await new Promise((ok) => setTimeout(ok, 130));
      setReveal(r.detail.drawn.slice(0, i + 1));
    }
    setBalance(r.balance);
    setAnim(false);
  };

  const controls = (
    <>
      <BetInput value={amount} onChange={setAmount} disabled={busy || anim} />
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" size="sm" onClick={random} disabled={busy || anim}><Shuffle size={14} /> Rastgele</Button>
        <Button variant="secondary" size="sm" onClick={() => { setPicks([]); setRes(null); setReveal([]); }} disabled={busy || anim}><Eraser size={14} /> Temizle</Button>
      </div>
      <PlayButton onClick={go} busy={busy || anim} disabled={picks.length === 0}>Çekilişi başlat</PlayButton>
      <p className="text-xs text-slate-500">1–10 sayı seç ({picks.length}/10). Çekilişte 40 sayıdan 10 tanesi açılır.</p>
    </>
  );

  const hits = res ? res.detail.hits.length : -1;
  const board = (
    <div className="card space-y-4 p-4 sm:p-6">
      <div className="grid grid-cols-8 gap-1.5 sm:gap-2">
        {Array.from({ length: KENO_N }, (_, i) => i + 1).map((n) => {
          const sel = picks.includes(n);
          const drawn = reveal.includes(n);
          const cls = drawn && sel ? 'bg-emerald-500 text-white ring-2 ring-emerald-300 animate-pop' : drawn ? 'bg-sky-500/30 text-sky-200 animate-pop' : sel ? 'bg-violet-500 text-white' : 'bg-ink-800 text-slate-300 hover:bg-ink-700';
          return (
            <button key={n} onClick={() => toggle(n)} className={`aspect-square rounded-lg text-sm font-bold tabular-nums transition ${cls}`} aria-pressed={sel}>
              {n}
            </button>
          );
        })}
      </div>
      <ResultBar res={res && !anim ? res : null} />
      {table.length > 0 && (
        <div className="no-scrollbar overflow-x-auto">
          <div className="flex min-w-max gap-1.5">
            {table.map((m, h) => (
              <div key={h} className={`w-[4.2rem] rounded-lg px-2 py-1.5 text-center text-xs ${hits === h && !anim ? 'bg-emerald-500/25 ring-1 ring-emerald-400' : 'bg-ink-900'}`}>
                <p className="text-[10px] text-slate-500">{h} isabet</p>
                <p className={`font-bold tabular-nums ${m > 0 ? 'text-white' : 'text-slate-600'}`}>{fmtMult(m)}</p>
                <p className="text-[9px] text-slate-600">%{(probs[h] * 100).toFixed(probs[h] < 0.001 ? 4 : 2).replace('.', ',')}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
  return <GameShell game="keno" controls={controls} board={board} fair={<FairBox fair={fair} />} />;
}
