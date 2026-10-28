'use client';

import { Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SymbolIcon, type SymbolId } from '@/components/icons/GameIcons';
import BetInput from '@/components/games/BetInput';
import GameShell, { FairBox } from '@/components/games/GameShell';
import { PlayButton, ResultBar, useEdge, usePlay } from '@/components/games/kit';
import { Button } from '@/components/ui';
import { scratchPaytable, type ScratchSym } from '@/lib/games/instant';
import { fmtMult } from '@/lib/money';

interface D { cells: ScratchSym[]; wins: { sym: ScratchSym; count: number; mult: number }[] }

export default function Scratch() {
  const edge = useEdge('scratch');
  const [amount, setAmount] = useState('10');
  const { play, busy, fair, res, setRes, setBalance } = usePlay<D>('scratch');
  const [open, setOpen] = useState<boolean[]>(Array(9).fill(false));
  const [pending, setPending] = useState<number | null>(null);
  const pay = useMemo(() => scratchPaytable(edge).filter((p) => p.base > 0), [edge]);

  const done = open.every(Boolean);
  const buy = async () => {
    setOpen(Array(9).fill(false));
    setRes(null);
    const r = await play({ amount }, { deferBalance: true });
    if (r) setPending(r.balance);
  };
  const reveal = (i: number) => {
    if (!res || open[i]) return;
    setOpen((o) => {
      const n = o.map((x, j) => x || j === i);
      if (n.every(Boolean) && pending != null) {
        setBalance(pending);
        setPending(null);
      }
      return n;
    });
  };
  const revealAll = async () => {
    for (let i = 0; i < 9; i++) {
      reveal(i);
      await new Promise((ok) => setTimeout(ok, 90));
    }
  };

  const winSyms = new Set(res?.detail.wins.map((w) => w.sym));
  const controls = (
    <>
      <BetInput value={amount} onChange={setAmount} disabled={busy || (!!res && !done)} />
      <PlayButton onClick={buy} busy={busy} disabled={!!res && !done}>Bilet al</PlayButton>
      {res && !done && <Button variant="secondary" className="w-full" onClick={revealAll}><Sparkles size={15} /> Hepsini kazı</Button>}
      <div className="space-y-1 text-xs">
        <p className="label-muted">3 ve üzeri aynı sembol</p>
        {pay.map((p) => (
          <p key={p.sym} className="flex items-center justify-between rounded-lg bg-ink-900 px-2.5 py-1">
            <span className="flex items-center gap-2"><SymbolIcon id={p.sym as SymbolId} size={22} /> 3 adet</span>
            <b className="tabular-nums">{fmtMult(p.base)}</b>
          </p>
        ))}
        <p className="text-slate-500">Her ek eşleşme (4., 5. …) aynı tutarı bir kez daha öder.</p>
      </div>
    </>
  );

  const board = (
    <div className="card space-y-4 p-4 sm:p-6">
      <div className="mx-auto grid max-w-[360px] grid-cols-3 gap-2.5 rounded-3xl bg-gradient-to-br from-violet-600 to-fuchsia-700 p-3 shadow-xl">
        {Array.from({ length: 9 }, (_, i) => {
          const sym = res?.detail.cells[i];
          const isOpen = open[i];
          return (
            <button
              key={i}
              type="button"
              disabled={!res || isOpen}
              onClick={() => reveal(i)}
              className={`relative grid aspect-square place-items-center overflow-hidden rounded-2xl transition ${isOpen ? 'bg-ink-900' : 'bg-gradient-to-br from-slate-300 to-slate-500 hover:brightness-110'} ${isOpen && done && sym && winSyms.has(sym) ? 'ring-2 ring-amber-300' : ''}`}
              aria-label={`Kutu ${i + 1}`}
            >
              {isOpen && sym ? <span className="animate-pop"><SymbolIcon id={sym as SymbolId} size={52} /></span> : <span className="text-2xl font-black text-slate-600/70">?</span>}
            </button>
          );
        })}
      </div>
      <ResultBar res={res && done ? res : null} />
      {!res && <p className="text-center text-sm text-slate-500">Bilet al, sonra kutuları kazı. Aynı sembolden en az 3 tane bul.</p>}
    </div>
  );
  return <GameShell game="scratch" controls={controls} board={board} fair={<FairBox fair={fair} />} />;
}
