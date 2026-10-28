'use client';

import { HandCoins } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { SymbolIcon } from '@/components/icons/GameIcons';
import BetInput from '@/components/games/BetInput';
import GameShell, { FairBox } from '@/components/games/GameShell';
import { Seg, Stat } from '@/components/games/kit';
import { Button } from '@/components/ui';
import { api } from '@/lib/client';
import { DIFFICULTY, ROWS, towersMult, type Difficulty } from '@/lib/games/towers';
import { fmtCredits, fmtMult } from '@/lib/money';

interface G {
  amount: number;
  difficulty: Difficulty;
  cols: number;
  bombsPerRow: number;
  picks: number[];
  multiplier: number;
  next: number | null;
  fair: { serverHash: string; clientSeed: string; nonce: number };
}
interface End { status: 'lost' | 'cashed'; bombs: number[][]; picks: number[]; hit: number | null; payout: number; multiplier: number }

export default function Towers() {
  const { user, setBalance, toast, site } = useAuth();
  const edge = (site.edges.towers ?? 1) / 100;
  const [amount, setAmount] = useState('10');
  const [diff, setDiff] = useState<Difficulty>('medium');
  const [game, setGame] = useState<G | null>(null);
  const [end, setEnd] = useState<End | null>(null);
  const [busy, setBusy] = useState(false);
  const [fair, setFair] = useState<G['fair'] | null>(null);
  const [lastDiff, setLastDiff] = useState<Difficulty | null>(null);

  useEffect(() => {
    if (user?.ageVerified) api<{ game: G | null }>('/api/games/towers').then((r) => r.data?.game && (setGame(r.data.game), setLastDiff(r.data.game.difficulty), setFair(r.data.game.fair)));
  }, [user?.ageVerified]);

  const call = async (b: Record<string, unknown>) => {
    setBusy(true);
    const r = await api<{ game?: G; ended?: boolean; balance?: number } & Partial<End>>('/api/games/towers', { body: b });
    setBusy(false);
    if (r.error) return toast(r.error, 'error');
    const d = r.data!;
    if (typeof d.balance === 'number') setBalance(d.balance);
    if (d.ended) {
      setEnd(d as End);
      setGame(null);
      if (d.status === 'cashed') toast(`Kazandın: +${fmtCredits(d.payout!)} (${fmtMult(d.multiplier!)})`);
    } else if (d.game) {
      setGame(d.game);
      setFair(d.game.fair);
    }
  };

  const shownDiff: Difficulty = game?.difficulty ?? (end ? lastDiff : null) ?? diff;
  const cols = DIFFICULTY[shownDiff].cols;
  const picks = game?.picks ?? end?.picks ?? [];
  const row = picks.length;

  const controls = (
    <>
      <BetInput value={amount} onChange={setAmount} disabled={!!game} />
      <div>
        <p className="mb-1.5 text-xs text-slate-400">Zorluk</p>
        <Seg value={diff} onChange={setDiff} disabled={!!game} cols={3} options={(Object.keys(DIFFICULTY) as Difficulty[]).map((d) => ({ v: d, l: DIFFICULTY[d].label }))} />
      </div>
      {!game ? (
        <Button size="lg" className="w-full" onClick={() => { setEnd(null); setLastDiff(diff); call({ action: 'start', amount, difficulty: diff }); }} loading={busy}>Tırmanışa başla</Button>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Çarpan" value={fmtMult(game.multiplier || 0)} />
            <Stat label="Sonraki kat" value={game.next ? fmtMult(game.next) : '—'} tone="win" />
          </div>
          <Button size="lg" className="w-full" onClick={() => call({ action: 'cashout' })} disabled={busy || picks.length === 0}><HandCoins size={17} /> Çek ({fmtCredits(Math.floor(game.amount * game.multiplier))})</Button>
        </>
      )}
      <p className="text-xs text-slate-500">Her katta {DIFFICULTY[diff].cols} kareden {DIFFICULTY[diff].bombs} tanesi bomba. Tüm {ROWS} katı çıkarsan {fmtMult(towersMult(diff, ROWS, edge))} kazanırsın.</p>
    </>
  );

  const board = (
    <div className="card p-4 sm:p-6">
      <div className="mx-auto flex max-w-md flex-col-reverse gap-2">
        {Array.from({ length: ROWS }, (_, r) => {
          const active = !!game && r === row;
          const mult = towersMult(shownDiff, r + 1, edge);
          return (
            <div key={r} className={`flex items-center gap-2 rounded-2xl p-1.5 ${active ? 'bg-violet-500/15 ring-1 ring-violet-400/40' : ''}`}>
              <span className="w-14 text-right text-[11px] font-bold tabular-nums text-slate-500">{fmtMult(mult)}</span>
              <div className="grid flex-1 gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                {Array.from({ length: cols }, (_, c) => {
                  const chosen = picks[r] === c;
                  const bombs = end?.bombs[r] ?? [];
                  const isBomb = !!end && bombs.includes(c);
                  const safeChosen = chosen && !(end && r === row - 1 && end.hit === c && end.status === 'lost');
                  const boom = chosen && !!end && end.hit === c && r === picks.length - 1 && end.status === 'lost';
                  return (
                    <button
                      key={c}
                      disabled={!active || busy}
                      onClick={() => call({ action: 'pick', col: c })}
                      className={`grid h-11 place-items-center rounded-xl text-sm font-bold transition ${
                        boom ? 'bg-rose-600 text-white animate-pop' : safeChosen ? 'bg-emerald-500/80 text-white animate-pop' : isBomb ? 'bg-rose-500/20 text-rose-300' : active ? 'bg-ink-700 hover:bg-violet-500/40' : 'bg-ink-800/80'
                      }`}
                      aria-label={`Kat ${r + 1}, kare ${c + 1}`}
                    >
                      {safeChosen && <SymbolIcon id="gem" size={26} />}
                      {(boom || isBomb) && !safeChosen && <Bomb />}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 h-10 text-center">
        {end && (end.payout > 0 ? <p className="animate-pop text-2xl font-black text-amber-300">+{fmtCredits(end.payout)} <span className="text-base text-slate-300">({fmtMult(end.multiplier)})</span></p> : <p className="text-sm text-slate-500">Bomba! Bu tırmanış bitti.</p>)}
      </div>
    </div>
  );
  return <GameShell game="towers" controls={controls} board={board} fair={<FairBox fair={fair} />} />;
}

function Bomb() {
  return (
    <svg width="26" height="26" viewBox="0 0 64 64" aria-hidden="true"><circle cx="29" cy="37" r="19" fill="#1e293b" /><path d="M40 15c3-5 7-6 11-5" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" /><ellipse cx="22" cy="29" rx="5" ry="3" fill="#fff" opacity=".3" /></svg>
  );
}
