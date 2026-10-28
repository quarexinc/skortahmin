'use client';

import { useMemo, useState } from 'react';
import BetInput from '@/components/games/BetInput';
import GameShell, { FairBox } from '@/components/games/GameShell';
import { AutoButtons, HistoryChips, PlayButton, ResultBar, Seg, useAuto, useEdge, usePlay } from '@/components/games/kit';
import { WHEEL_SEGMENTS, wheelSegments, type WheelRisk } from '@/lib/games/instant';
import { fmtMult } from '@/lib/money';

interface D { risk: WheelRisk; segment: number; mult: number }

const colorFor = (m: number) => (m === 0 ? '#334155' : m < 1.5 ? '#0ea5e9' : m < 3 ? '#22c55e' : m < 10 ? '#f59e0b' : m < 50 ? '#f97316' : '#e11d48');

export default function Wheel() {
  const edge = useEdge('wheel');
  const [amount, setAmount] = useState('10');
  const [risk, setRisk] = useState<WheelRisk>('medium');
  const { play, busy, fair, res, history, setBalance } = usePlay<D>('wheel');
  const [rot, setRot] = useState(0);
  const [spinning, setSpinning] = useState(false);

  const segs = useMemo(() => wheelSegments(risk, edge), [risk, edge]);
  const step = 360 / WHEEL_SEGMENTS;

  const spin = async () => {
    const r = await play({ amount, risk }, { deferBalance: true });
    if (!r) return false;
    setSpinning(true);
    // imleç tepede; kazanan dilim ortası imlece gelecek şekilde döndür
    const target = 360 * 5 - (r.detail.segment + 0.5) * step;
    setRot((cur) => cur + ((target - (cur % 360) + 360) % 360) + 360 * 4);
    await new Promise((ok) => setTimeout(ok, 4200));
    setSpinning(false);
    setBalance(r.balance);
    return true;
  };
  const auto = useAuto(spin, 500);
  const dis = busy || spinning || auto.left > 0;

  const uniq = Array.from(new Set(segs)).sort((a, b) => a - b);
  const controls = (
    <>
      <BetInput value={amount} onChange={setAmount} disabled={dis} />
      <div>
        <p className="mb-1.5 text-xs text-slate-400">Risk</p>
        <Seg value={risk} onChange={setRisk} disabled={dis} options={[{ v: 'low', l: 'Düşük' }, { v: 'medium', l: 'Orta' }, { v: 'high', l: 'Yüksek' }]} />
      </div>
      <PlayButton onClick={spin} busy={(busy || spinning) && auto.left === 0} disabled={auto.left > 0}>Çarkı çevir</PlayButton>
      <AutoButtons {...auto} disabled={busy || spinning} />
      <div className="space-y-1 text-xs">
        {uniq.map((m) => (
          <p key={m} className="flex items-center justify-between rounded-lg bg-ink-900 px-2.5 py-1.5">
            <span className="flex items-center gap-2"><i className="inline-block h-3 w-3 rounded" style={{ background: colorFor(m) }} /> {fmtMult(m)}</span>
            <span className="text-slate-500">{segs.filter((x) => x === m).length}/{WHEEL_SEGMENTS}</span>
          </p>
        ))}
      </div>
    </>
  );

  const R = 150;
  const board = (
    <div className="card space-y-4 p-4 sm:p-6">
      <HistoryChips items={history} />
      <div className="relative mx-auto w-full max-w-[380px]">
        <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1">
          <svg width="30" height="34" viewBox="0 0 30 34"><path d="M15 34L2 6a14 14 0 0126 0z" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" /></svg>
        </div>
        <svg viewBox="-160 -160 320 320" className="w-full" style={{ transform: `rotate(${rot}deg)`, transition: spinning ? 'transform 4.2s cubic-bezier(.12,.7,.1,1)' : 'none' }}>
          {segs.map((m, i) => {
            const a1 = (i * step * Math.PI) / 180;
            const a2 = ((i + 1) * step * Math.PI) / 180;
            const am = (a1 + a2) / 2;
            return (
              <g key={i}>
                <path d={`M0 0L${R * Math.sin(a1)} ${-R * Math.cos(a1)}A${R} ${R} 0 0 1 ${R * Math.sin(a2)} ${-R * Math.cos(a2)}Z`} fill={colorFor(m)} stroke="#0b1220" strokeWidth={1.5} />
                <text x={R * 0.8 * Math.sin(am)} y={-R * 0.8 * Math.cos(am)} fontSize={9.5} fontWeight={800} fill="#fff" textAnchor="middle" dominantBaseline="middle" transform={`rotate(${(am * 180) / Math.PI} ${R * 0.8 * Math.sin(am)} ${-R * 0.8 * Math.cos(am)})`}>
                  {m === 0 ? '0' : m >= 10 ? Math.round(m) : m.toFixed(1).replace('.', ',')}
                </text>
              </g>
            );
          })}
          <circle r={26} fill="#0b1220" stroke="#fbbf24" strokeWidth={4} />
          <circle r={9} fill="#fbbf24" />
        </svg>
      </div>
      <ResultBar res={res && !spinning ? res : null} />
    </div>
  );
  return <GameShell game="wheel" controls={controls} board={board} fair={<FairBox fair={fair} />} />;
}
