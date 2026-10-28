'use client';

import { HandCoins, Rocket, Timer, Users, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import BetInput from '@/components/games/BetInput';
import GameShell from '@/components/games/GameShell';
import { Avatar, Button, Input } from '@/components/ui';
import { api } from '@/lib/client';
import { fmtCredits, fmtMult } from '@/lib/money';

const GROWTH = 0.00006;
const multAt = (ms: number) => Math.max(1, Math.floor(Math.exp(GROWTH * Math.max(0, ms)) * 100) / 100);

interface Bet { user_id: number; name: string; avatar_color: string; amount: string; auto_cashout: string | null; cashout_mult: string | null; payout: string; status: string; mine: boolean }
interface State {
  now: number;
  round: { id: number; hash: string; startsAt: number; phase: 'betting' | 'flying' | 'crashed'; crashPoint: number | null; seed: string | null; crashedAt: number | null };
  bets: Bet[];
  myBet: Bet | null;
  history: { id: number; crashPoint: number }[];
}

const chip = (m: number) => (m >= 10 ? 'bg-amber-400/20 text-amber-300' : m >= 2 ? 'bg-accent/15 text-accent-soft' : 'bg-red-500/15 text-red-300');

export default function Crash() {
  const { user, setBalance, toast } = useAuth();
  const [amount, setAmount] = useState('10');
  const [auto, setAuto] = useState('');
  const [st, setSt] = useState<State | null>(null);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const offset = useRef(0);

  const load = useCallback(async () => {
    const t0 = Date.now();
    const r = await api<State>('/api/games/crash');
    if (!r.data) return;
    const rtt = Date.now() - t0;
    offset.current = r.data.now + rtt / 2 - Date.now();
    setSt(r.data);
  }, []);

  useEffect(() => {
    load();
    let alive = true;
    const loop = async () => {
      while (alive) {
        await new Promise((ok) => setTimeout(ok, 800));
        if (document.visibilityState === 'visible') await load();
      }
    };
    loop();
    let raf = 0;
    const frame = () => {
      setNow(Date.now() + offset.current);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, [load]);

  const r = st?.round;
  const flying = r && now >= r.startsAt && r.phase !== 'crashed';
  const crashed = r?.phase === 'crashed';
  const betting = r && now < r.startsAt;
  const m = r ? (crashed ? r.crashPoint ?? 1 : flying ? multAt(now - r.startsAt) : 1) : 1;
  const my = st?.myBet;

  const post = async (b: Record<string, unknown>) => {
    setBusy(true);
    const res = await api<{ balance: number; multiplier?: number; payout?: number }>('/api/games/crash', { body: b });
    setBusy(false);
    if (res.error) return toast(res.error, 'error');
    setBalance(res.data!.balance);
    if (res.data!.payout) toast(`${fmtMult(res.data!.multiplier!)} ile çıktın: +${fmtCredits(res.data!.payout)}`);
    load();
  };

  // eğri
  const W = 600;
  const H = 300;
  const elapsed = r ? Math.max(0, (crashed ? (r.crashedAt ?? now) : now) - r.startsAt) : 0;
  const maxT = Math.max(8000, elapsed * 1.15);
  const maxM = Math.max(2, m * 1.25);
  const pts: string[] = [];
  for (let i = 0; i <= 60; i++) {
    const t = (elapsed * i) / 60;
    const mm = Math.exp(GROWTH * t);
    pts.push(`${(t / maxT) * W},${H - ((mm - 1) / (maxM - 1)) * H}`);
  }
  const last = pts[pts.length - 1]?.split(',').map(Number) ?? [0, H];

  let action: React.ReactNode;
  if (!r) action = <Button className="w-full" size="lg" disabled>Yükleniyor…</Button>;
  else if (my && my.status === 'active' && betting)
    action = <Button variant="danger" className="w-full" size="lg" onClick={() => post({ action: 'cancel' })} disabled={busy}><X size={18} /> Bahsi iptal et</Button>;
  else if (my && my.status === 'active' && flying)
    action = (
      <Button className="w-full animate-glow" size="lg" onClick={() => post({ action: 'cashout' })} disabled={busy}>
        <HandCoins size={18} /> Çık · {fmtCredits(Math.floor(Number(my.amount) * m))}
      </Button>
    );
  else if (betting && !my)
    action = <Button className="w-full" size="lg" onClick={() => post({ action: 'bet', amount, autoCashout: auto })} loading={busy}><Rocket size={18} /> Bahis yap</Button>;
  else action = <Button className="w-full" size="lg" variant="secondary" disabled><Timer size={18} /> Sonraki turu bekle</Button>;

  const controls = (
    <>
      <BetInput value={amount} onChange={setAmount} disabled={!!my && my.status === 'active'} />
      <label className="block">
        <span className="mb-1.5 block text-xs text-slate-400">Otomatik çıkış (isteğe bağlı)</span>
        <Input value={auto} onChange={(e) => setAuto(e.target.value.replace(/[^0-9.,]/g, ''))} placeholder="ör. 2,00" inputMode="decimal" />
      </label>
      {action}
      {my && my.status !== 'active' && (
        <p className={`rounded-xl p-3 text-center text-sm font-semibold ${my.status === 'won' ? 'bg-accent/15 text-accent-soft' : 'bg-red-500/10 text-red-300'}`}>
          {my.status === 'won' ? `${fmtMult(my.cashout_mult ?? 0)} ile çıktın · +${fmtCredits(my.payout)}` : 'Bu turu kaybettin'}
        </p>
      )}
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-xs text-slate-400"><Users size={14} /> Bu turdaki oyuncular ({st?.bets.length ?? 0})</p>
        <div className="max-h-56 space-y-1 overflow-y-auto">
          {st?.bets.map((b) => (
            <div key={b.user_id} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs ${b.mine ? 'bg-violet-500/10' : ''}`}>
              <Avatar name={b.name} color={b.avatar_color} size={20} />
              <span className="min-w-0 flex-1 truncate">{b.name}</span>
              <span className="tabular-nums text-slate-400">{fmtCredits(b.amount)}</span>
              <span className={`w-14 text-right font-bold tabular-nums ${b.status === 'won' ? 'text-accent-soft' : b.status === 'lost' ? 'text-red-400' : 'text-slate-500'}`}>
                {b.status === 'won' ? fmtMult(b.cashout_mult ?? 0) : b.status === 'lost' ? '—' : '…'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const board = (
    <div className="card overflow-hidden p-0">
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto border-b border-white/5 p-3">
        {st?.history.map((h) => (
          <span key={h.id} className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold tabular-nums ${chip(h.crashPoint)}`}>{fmtMult(h.crashPoint)}</span>
        ))}
      </div>
      <div className="relative aspect-[2/1] w-full bg-[radial-gradient(ellipse_at_bottom_left,rgba(244,114,182,.12),transparent_60%)]">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          {[0.25, 0.5, 0.75].map((f) => <line key={f} x1={0} x2={W} y1={H * f} y2={H * f} stroke="rgba(255,255,255,.05)" />)}
          {(flying || crashed) && (
            <>
              <polygon points={`0,${H} ${pts.join(' ')} ${last[0]},${H}`} fill={crashed ? 'rgba(239,68,68,.12)' : 'rgba(244,114,182,.15)'} />
              <polyline points={pts.join(' ')} fill="none" stroke={crashed ? '#ef4444' : '#f472b6'} strokeWidth={4} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            </>
          )}
        </svg>
        {(flying || crashed) && (
          <Rocket
            size={34}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rotate-45 transition-transform ${crashed ? 'text-red-400' : 'text-pink-300'}`}
            style={{ left: `${(last[0] / W) * 100}%`, top: `${(last[1] / H) * 100}%` }}
          />
        )}
        <div className="absolute inset-0 grid place-items-center">
          {betting ? (
            <div className="text-center">
              <p className="text-sm text-slate-400">Bahisler açık</p>
              <p className="text-5xl font-black tabular-nums">{Math.max(0, (r!.startsAt - now) / 1000).toFixed(1)}s</p>
            </div>
          ) : (
            <div className="text-center">
              <p className={`text-6xl font-black tabular-nums sm:text-7xl ${crashed ? 'text-red-400' : 'text-white'}`}>{fmtMult(m)}</p>
              {crashed && <p className="mt-1 animate-pop text-lg font-bold text-red-300">PATLADI</p>}
            </div>
          )}
        </div>
      </div>
      {r && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-white/5 px-4 py-3 text-[11px] text-slate-500">
          <span>Tur #{r.id}</span>
          <span className="min-w-0 truncate">Hash: <code>{r.hash.slice(0, 20)}…</code></span>
          {r.seed && <span className="min-w-0 truncate">Tohum: <code>{r.seed.slice(0, 20)}…</code></span>}
        </div>
      )}
    </div>
  );

  void user;
  return <GameShell game="crash" controls={controls} board={board} />;
}
