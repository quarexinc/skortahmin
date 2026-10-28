'use client';

import { Bomb, Dices, Gem, HandCoins, Play } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import BetInput from '@/components/games/BetInput';
import GameShell, { FairBox } from '@/components/games/GameShell';
import { Button, Select } from '@/components/ui';
import { api } from '@/lib/client';
import { fmtCredits, fmtMult } from '@/lib/money';

interface G {
  id: number;
  amount: number;
  mines: number;
  revealed: number[];
  multiplier: number;
  next: number | null;
  fair: { serverHash: string; clientSeed: string; nonce: number };
}
interface End { status: 'lost' | 'cashed'; positions: number[]; revealed: number[]; hit: number | null; payout: number; multiplier: number }

export default function Mines() {
  const { user, setBalance, toast } = useAuth();
  const [amount, setAmount] = useState('10');
  const [mines, setMines] = useState('3');
  const [game, setGame] = useState<G | null>(null);
  const [end, setEnd] = useState<End | null>(null);
  const [busy, setBusy] = useState(false);
  const [pop, setPop] = useState<number | null>(null);
  const [fair, setFair] = useState<G['fair'] | null>(null);

  useEffect(() => {
    if (user?.ageVerified) api<{ game: G | null }>('/api/games/mines').then((r) => r.data?.game && (setGame(r.data.game), setFair(r.data.game.fair)));
  }, [user?.ageVerified]);

  const call = async (b: Record<string, unknown>) => {
    setBusy(true);
    const r = await api<{ game?: G; ended?: boolean; balance?: number } & Partial<End>>('/api/games/mines', { body: b });
    setBusy(false);
    if (r.error) {
      toast(r.error, 'error');
      return null;
    }
    const d = r.data!;
    if (typeof d.balance === 'number') setBalance(d.balance);
    if (d.ended) {
      setEnd(d as End);
      setGame(null);
      if (d.status === 'cashed') toast(`Kazandın: +${fmtCredits(d.payout! )} (${fmtMult(d.multiplier!)})`);
    } else if (d.game) {
      setGame(d.game);
      setFair(d.game.fair);
    }
    return d;
  };

  const start = () => {
    setEnd(null);
    call({ action: 'start', amount, mines: Number(mines) });
  };
  const reveal = async (t: number) => {
    if (!game || busy || game.revealed.includes(t)) return;
    setPop(t);
    await call({ action: 'reveal', tile: t });
    setTimeout(() => setPop(null), 300);
  };
  const random = () => {
    if (!game) return;
    const free = Array.from({ length: 25 }, (_, i) => i).filter((i) => !game.revealed.includes(i));
    reveal(free[Math.floor(Math.random() * free.length)]);
  };

  const controls = (
    <>
      <BetInput value={amount} onChange={setAmount} disabled={!!game} />
      <label className="block">
        <span className="mb-1.5 block text-xs text-slate-400">Mayın sayısı</span>
        <Select value={mines} onChange={(e) => setMines(e.target.value)} disabled={!!game}>
          {Array.from({ length: 24 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
        </Select>
      </label>
      {game ? (
        <>
          <div className="grid grid-cols-2 gap-2 text-center text-sm">
            <div className="rounded-xl bg-ink-900 p-3"><p className="text-[11px] text-slate-500">Şu anki çarpan</p><p className="text-lg font-black">{fmtMult(game.multiplier || 1)}</p></div>
            <div className="rounded-xl bg-ink-900 p-3"><p className="text-[11px] text-slate-500">Sonraki kare</p><p className="text-lg font-black text-accent-soft">{game.next ? fmtMult(game.next) : '—'}</p></div>
          </div>
          <Button className="w-full" size="lg" onClick={() => call({ action: 'cashout' })} disabled={busy || game.revealed.length === 0}>
            <HandCoins size={18} /> Kazancı al {game.revealed.length > 0 && `(${fmtCredits(Math.floor(game.amount * game.multiplier))})`}
          </Button>
          <Button variant="secondary" className="w-full" onClick={random} disabled={busy}><Dices size={16} /> Rastgele kare</Button>
        </>
      ) : (
        <Button className="w-full" size="lg" onClick={start} loading={busy}><Play size={18} /> Oyna</Button>
      )}
    </>
  );

  const shown = end ?? null;
  const board = (
    <div className="card relative p-4 sm:p-6">
      <div className="mx-auto grid max-w-[520px] grid-cols-5 gap-2 sm:gap-3">
        {Array.from({ length: 25 }, (_, i) => {
          const open = game?.revealed.includes(i) || shown?.revealed.includes(i);
          const isMine = shown?.positions.includes(i);
          const hit = shown?.hit === i;
          const after = shown && !open;
          return (
            <button
              key={i}
              onClick={() => reveal(i)}
              disabled={!game || busy || !!open}
              className={`relative grid aspect-square place-items-center rounded-xl text-white transition duration-200 ${
                hit
                  ? 'animate-pop bg-red-500/80'
                  : open
                    ? 'animate-pop bg-accent/25 ring-1 ring-accent/50'
                    : after
                      ? 'bg-ink-700/60 opacity-60'
                      : game
                        ? 'bg-ink-600 shadow-[inset_0_-4px_0_rgba(0,0,0,.35)] hover:-translate-y-0.5 hover:bg-ink-500'
                        : 'bg-ink-700'
              } ${pop === i ? 'scale-95' : ''}`}
              aria-label={`Kare ${i + 1}`}
            >
              {(open || after) && (isMine ? <Bomb size={26} className={hit ? 'text-white' : 'text-red-400'} /> : (open || after) && shown ? <Gem size={24} className={open ? 'text-accent-soft' : 'text-slate-500'} /> : open ? <Gem size={24} className="text-accent-soft" /> : null)}
            </button>
          );
        })}
      </div>
      {shown && (
        <div className={`mx-auto mt-5 max-w-[520px] animate-pop rounded-2xl p-4 text-center ${shown.status === 'cashed' ? 'bg-accent/15 text-accent-soft' : 'bg-red-500/10 text-red-300'}`}>
          {shown.status === 'cashed' ? (
            <p className="text-lg font-black">{fmtMult(shown.multiplier)} · +{fmtCredits(shown.payout)} kredi</p>
          ) : (
            <p className="text-lg font-black">Mayına bastın!</p>
          )}
        </div>
      )}
    </div>
  );

  return <GameShell game="mines" controls={controls} board={board} fair={<FairBox fair={fair} />} />;
}
