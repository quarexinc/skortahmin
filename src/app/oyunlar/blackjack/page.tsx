'use client';

import { Club, Copy, Diamond, Hand, Heart, Play, Plus, Spade, Split } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import BetInput from '@/components/games/BetInput';
import GameShell, { FairBox } from '@/components/games/GameShell';
import { Button } from '@/components/ui';
import { api } from '@/lib/client';
import { fmtCredits } from '@/lib/money';

interface H { cards: number[]; bet: number; done: boolean; doubled: boolean; result?: string; payout?: number; value: number; soft: boolean }
interface G { phase: 'player' | 'done'; active: number; dealer: number[]; dealerValue: number; hands: H[]; canDouble: boolean; canSplit: boolean; fair: { serverHash: string; clientSeed: string; nonce: number } }

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUITS = [
  { I: Spade, red: false },
  { I: Heart, red: true },
  { I: Diamond, red: true },
  { I: Club, red: false },
];

function PlayingCard({ c, i }: { c: number; i: number }) {
  if (c < 0)
    return (
      <div className="h-28 w-20 animate-pop rounded-xl border border-violet-300/30 bg-[repeating-linear-gradient(45deg,#4c1d95,#4c1d95_6px,#6d28d9_6px,#6d28d9_12px)] shadow-xl sm:h-32 sm:w-24" style={{ animationDelay: `${i * 90}ms`, animationFillMode: 'both' }} />
    );
  const r = RANKS[c % 13];
  const s = SUITS[Math.floor(c / 13) % 4];
  return (
    <div
      className={`relative h-28 w-20 animate-pop rounded-xl bg-white shadow-xl sm:h-32 sm:w-24 ${s.red ? 'text-rose-600' : 'text-slate-900'}`}
      style={{ animationDelay: `${i * 90}ms`, animationFillMode: 'both' }}
    >
      <span className="absolute left-2 top-1.5 text-lg font-black leading-none">{r}</span>
      <s.I size={14} className="absolute left-2 top-7" fill="currentColor" />
      <s.I size={34} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" fill="currentColor" />
      <span className="absolute bottom-1.5 right-2 rotate-180 text-lg font-black leading-none">{r}</span>
    </div>
  );
}

const RESULT: Record<string, { t: string; c: string }> = {
  blackjack: { t: 'Blackjack!', c: 'bg-amber-400 text-ink-950' },
  win: { t: 'Kazandın', c: 'bg-accent text-ink-950' },
  push: { t: 'Berabere', c: 'bg-slate-500 text-white' },
  lose: { t: 'Kaybettin', c: 'bg-red-500 text-white' },
  bust: { t: 'Battın', c: 'bg-red-500 text-white' },
};

export default function Blackjack() {
  const { user, setBalance, toast } = useAuth();
  const [amount, setAmount] = useState('10');
  const [g, setG] = useState<G | null>(null);
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<{ payout: number; total: number } | null>(null);

  useEffect(() => {
    if (user?.ageVerified) api<{ game: G | null }>('/api/games/blackjack').then((r) => r.data?.game && setG(r.data.game));
  }, [user?.ageVerified]);

  const act = async (action: string) => {
    setBusy(true);
    if (action === 'deal') setLast(null);
    const r = await api<{ game: G; ended?: boolean; payout?: number; total?: number; balance: number }>('/api/games/blackjack', { body: { action, amount } });
    setBusy(false);
    if (r.error || !r.data) return toast(r.error ?? 'Hata', 'error');
    setG(r.data.game);
    setBalance(r.data.balance);
    if (r.data.ended) setLast({ payout: r.data.payout!, total: r.data.total! });
  };

  const playing = g?.phase === 'player';
  const controls = (
    <>
      <BetInput value={amount} onChange={setAmount} disabled={playing} />
      {playing ? (
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => act('hit')} disabled={busy}><Plus size={16} /> Kart çek</Button>
          <Button variant="secondary" onClick={() => act('stand')} disabled={busy}><Hand size={16} /> Dur</Button>
          <Button variant="secondary" onClick={() => act('double')} disabled={busy || !g?.canDouble}><Copy size={16} /> Double</Button>
          <Button variant="secondary" onClick={() => act('split')} disabled={busy || !g?.canSplit}><Split size={16} /> Split</Button>
        </div>
      ) : (
        <Button className="w-full" size="lg" onClick={() => act('deal')} loading={busy}><Play size={18} /> Dağıt</Button>
      )}
      <ul className="space-y-1 text-xs text-slate-500">
        <li>Blackjack 3:2 öder · krupiye tüm 17&apos;lerde durur</li>
        <li>İlk iki kartta double · aynı değerde bir kez split</li>
        <li>6 deste, her el yeni karılmış ve doğrulanabilir</li>
      </ul>
    </>
  );

  const board = (
    <div className="card relative overflow-hidden bg-[radial-gradient(ellipse_at_center,#14532d_0%,#0b2a1a_55%,#070d1a_100%)] p-5 sm:p-8">
      <div className="text-center">
        <p className="label-muted text-emerald-200/70">Krupiye {g && <span className="ml-1 rounded-md bg-black/30 px-2 py-0.5 text-white">{g.dealerValue}</span>}</p>
        <div className="mt-3 flex min-h-[8rem] justify-center gap-2">{g?.dealer.map((c, i) => <PlayingCard key={`${i}-${c}`} c={c} i={i} />)}</div>
      </div>
      <div className="my-6 text-center text-[11px] uppercase tracking-[0.3em] text-emerald-200/40">Blackjack 3:2 öder</div>
      <div className="flex flex-wrap justify-center gap-6">
        {g ? (
          g.hands.map((h, hi) => (
            <div key={hi} className={`rounded-2xl p-3 text-center transition ${playing && g.active === hi && g.hands.length > 1 ? 'bg-white/10 ring-2 ring-amber-300' : ''}`}>
              <div className="flex min-h-[8rem] justify-center gap-2">{h.cards.map((c, i) => <PlayingCard key={`${i}-${c}`} c={c} i={i} />)}</div>
              <p className="mt-3 text-sm">
                <span className="rounded-md bg-black/30 px-2 py-0.5 font-bold text-white">{h.soft && h.value <= 21 && h.value !== 21 ? `${h.value - 10}/${h.value}` : h.value}</span>
                <span className="ml-2 text-emerald-100/70">{fmtCredits(h.bet)}{h.doubled && ' (double)'}</span>
              </p>
              {h.result && <p className={`mt-2 inline-block animate-pop rounded-full px-3 py-1 text-sm font-black ${RESULT[h.result].c}`}>{RESULT[h.result].t}</p>}
            </div>
          ))
        ) : (
          <p className="py-10 text-emerald-100/60">Bahsini gir ve “Dağıt”a bas.</p>
        )}
      </div>
      {last && (
        <p className={`mt-6 animate-pop text-center text-xl font-black ${last.payout > last.total ? 'text-amber-300' : last.payout === last.total ? 'text-slate-200' : 'text-red-300'}`}>
          {last.payout > last.total ? `+${fmtCredits(last.payout - last.total)} kredi` : last.payout === last.total ? 'Bahsin iade edildi' : `-${fmtCredits(last.total - last.payout)} kredi`}
        </p>
      )}
    </div>
  );

  return <GameShell game="blackjack" controls={controls} board={board} fair={<FairBox fair={g?.fair ?? null} />} />;
}
