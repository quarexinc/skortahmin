'use client';

import { ArrowDown, ArrowUp, HandCoins, SkipForward } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import BetInput from '@/components/games/BetInput';
import GameShell, { FairBox } from '@/components/games/GameShell';
import { Stat } from '@/components/games/kit';
import { Button } from '@/components/ui';
import { api } from '@/lib/client';
import { RANK_LABEL, SUIT_LABEL } from '@/lib/games/hilo';
import { fmtCredits, fmtMult } from '@/lib/money';

interface Card { rank: number; suit: number }
interface Hist extends Card { guess: 'hi' | 'lo' | 'skip' | null }
interface G {
  amount: number;
  card: Card;
  history: Hist[];
  steps: number;
  multiplier: number;
  hiChance: number;
  loChance: number;
  nextHi: number;
  nextLo: number;
  fair: { serverHash: string; clientSeed: string; nonce: number };
}
interface End { status: 'lost' | 'cashed'; payout: number; multiplier: number; card: Card; history: Hist[] }

const PlayCard = ({ c, small, back }: { c?: Card; small?: boolean; back?: boolean }) => {
  const red = c && (c.suit === 1 || c.suit === 2);
  return (
    <div className={`relative grid place-items-center rounded-2xl border border-slate-300 bg-white shadow-lg ${small ? 'h-20 w-14' : 'h-48 w-32 sm:h-56 sm:w-40'} ${back || !c ? 'bg-gradient-to-br from-violet-600 to-fuchsia-700 border-violet-300' : ''} ${red ? 'text-rose-600' : 'text-slate-900'}`}>
      {c && !back ? (
        <>
          <span className={`absolute left-2 top-1.5 font-black leading-none ${small ? 'text-sm' : 'text-2xl'}`}>{RANK_LABEL[c.rank]}<br /><span className="text-[0.8em]">{SUIT_LABEL[c.suit]}</span></span>
          <span className={small ? 'text-2xl' : 'text-6xl sm:text-7xl'}>{SUIT_LABEL[c.suit]}</span>
        </>
      ) : <span className="text-3xl font-black text-white/70">?</span>}
    </div>
  );
};

export default function HiLo() {
  const { user, setBalance, toast } = useAuth();
  const [amount, setAmount] = useState('10');
  const [game, setGame] = useState<G | null>(null);
  const [end, setEnd] = useState<End | null>(null);
  const [busy, setBusy] = useState(false);
  const [fair, setFair] = useState<G['fair'] | null>(null);

  useEffect(() => {
    if (user?.ageVerified) api<{ game: G | null }>('/api/games/hilo').then((r) => r.data?.game && (setGame(r.data.game), setFair(r.data.game.fair)));
  }, [user?.ageVerified]);

  const call = async (b: Record<string, unknown>) => {
    setBusy(true);
    const r = await api<{ game?: G; ended?: boolean; balance?: number; fair?: G['fair'] } & Partial<End>>('/api/games/hilo', { body: b });
    setBusy(false);
    if (r.error) return toast(r.error, 'error');
    const d = r.data!;
    if (typeof d.balance === 'number') setBalance(d.balance);
    if (d.ended) {
      setEnd(d as End);
      setGame(null);
      if (d.fair) setFair(d.fair);
      if (d.status === 'cashed') toast(`Kazandın: +${fmtCredits(d.payout!)} (${fmtMult(d.multiplier!)})`);
    } else if (d.game) {
      setGame(d.game);
      setFair(d.game.fair);
    }
  };

  const controls = (
    <>
      <BetInput value={amount} onChange={setAmount} disabled={!!game} />
      {!game ? (
        <Button size="lg" className="w-full" onClick={() => { setEnd(null); call({ action: 'start', amount }); }} loading={busy}>Oyunu başlat</Button>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Çarpan" value={fmtMult(game.multiplier || 0)} />
            <Stat label="Kazanç" value={fmtCredits(Math.floor(game.amount * game.multiplier))} tone="win" />
          </div>
          <Button variant="secondary" className="w-full" onClick={() => call({ action: 'skip' })} disabled={busy}><SkipForward size={15} /> Kartı atla</Button>
          <Button size="lg" className="w-full" onClick={() => call({ action: 'cashout' })} disabled={busy || game.steps === 0}><HandCoins size={17} /> Çek ({fmtCredits(Math.floor(game.amount * game.multiplier))})</Button>
        </>
      )}
      <p className="text-xs text-slate-500">Eşit kartlar tahmini kazandırır. As en düşük, papaz en yüksek karttır. Kartlar her seferinde yeniden çekilir.</p>
    </>
  );

  const shown = game?.card ?? end?.card;
  const hist = game?.history ?? end?.history ?? [];
  const board = (
    <div className="card space-y-5 p-4 sm:p-6">
      <div className="no-scrollbar flex min-h-[5.5rem] gap-2 overflow-x-auto">
        {hist.slice(-12).map((h, i) => <PlayCard key={i} c={h} small />)}
      </div>
      <div className="grid place-items-center gap-5 py-2 sm:grid-cols-[1fr_auto_1fr]">
        <Button variant="secondary" size="lg" className="w-full max-w-[14rem] !flex-col !gap-0.5 !py-3 sm:justify-self-end" disabled={!game || busy || game.hiChance === 0} onClick={() => call({ action: 'guess', guess: 'hi' })}>
          <span className="flex items-center gap-1.5"><ArrowUp size={18} className="text-emerald-400" /> Yüksek / eşit</span>
          {game && <span className="text-xs font-normal text-slate-400">%{(game.hiChance * 100).toFixed(0)} · {fmtMult(game.nextHi)}</span>}
        </Button>
        <div className={end ? (end.status === 'lost' ? 'opacity-70 grayscale' : '') : ''}>
          <PlayCard c={shown} />
        </div>
        <Button variant="secondary" size="lg" className="w-full max-w-[14rem] !flex-col !gap-0.5 !py-3 sm:justify-self-start" disabled={!game || busy || game.loChance === 0} onClick={() => call({ action: 'guess', guess: 'lo' })}>
          <span className="flex items-center gap-1.5"><ArrowDown size={18} className="text-rose-400" /> Düşük / eşit</span>
          {game && <span className="text-xs font-normal text-slate-400">%{(game.loChance * 100).toFixed(0)} · {fmtMult(game.nextLo)}</span>}
        </Button>
      </div>
      <div className="h-10 text-center">
        {end && (end.payout > 0 ? <p className="animate-pop text-2xl font-black text-amber-300">+{fmtCredits(end.payout)} <span className="text-base text-slate-300">({fmtMult(end.multiplier)})</span></p> : <p className="text-sm text-slate-500">Yanlış tahmin — bu el bitti.</p>)}
        {game && <p className="text-sm text-slate-400">{game.steps} doğru tahmin</p>}
      </div>
    </div>
  );
  return <GameShell game="hilo" controls={controls} board={board} fair={<FairBox fair={fair} />} />;
}
