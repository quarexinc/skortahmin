'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import BetInput from '@/components/games/BetInput';
import GameShell, { FairBox } from '@/components/games/GameShell';
import { AutoButtons, HistoryChips, PlayButton, ResultBar, Seg, useAuto, useEdge, usePlay } from '@/components/games/kit';
import { plinkoTable, type PlinkoRisk } from '@/lib/games/instant';

interface D { rows: number; risk: PlinkoRisk; path: number[]; bin: number; mult: number }

const W = 640;
const colorFor = (m: number) => (m >= 100 ? '#ef4444' : m >= 10 ? '#f97316' : m >= 2 ? '#f59e0b' : m >= 1 ? '#22c55e' : '#64748b');

export default function Plinko() {
  const edge = useEdge('plinko');
  const [amount, setAmount] = useState('10');
  const [rows, setRows] = useState(12);
  const [risk, setRisk] = useState<PlinkoRisk>('medium');
  const { play, busy, fair, res, history, setBalance } = usePlay<D>('plinko');
  const [ball, setBall] = useState<{ x: number; y: number } | null>(null);
  const [hit, setHit] = useState<number | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const table = useMemo(() => plinkoTable(rows, risk, edge), [rows, risk, edge]);
  const sx = W / (rows + 2);
  const sy = Math.min(34, 380 / (rows + 1));
  const top = 30;
  const H = top + sy * rows + 70;
  const pegX = (r: number, i: number) => W / 2 + (i - (r + 2) / 2) * sx; // r. satırda r+3 çivi

  const drop = async (): Promise<boolean> => {
    setHit(null);
    const r = await play({ amount, rows, risk }, { deferBalance: true });
    if (!r) return false;
    setBall({ x: W / 2, y: top - 22 });
    let x = W / 2;
    await new Promise<void>((done) => {
      r.detail.path.forEach((step, i) => {
        timers.current.push(
          setTimeout(() => {
            x += step ? sx / 2 : -sx / 2;
            setBall({ x, y: top + i * sy + sy * 0.55 });
          }, 120 + i * 130),
        );
      });
      timers.current.push(
        setTimeout(() => {
          setBall({ x, y: top + rows * sy + 28 });
          setHit(r.detail.bin);
          setBalance(r.balance);
          done();
        }, 120 + r.detail.path.length * 130 + 80),
      );
    });
    await new Promise((ok) => setTimeout(ok, 250));
    return true;
  };
  const auto = useAuto(drop, 200);
  const dis = busy || auto.left > 0;

  const controls = (
    <>
      <BetInput value={amount} onChange={setAmount} disabled={dis} />
      <div>
        <p className="mb-1.5 text-xs text-slate-400">Risk</p>
        <Seg value={risk} onChange={setRisk} disabled={dis} options={[{ v: 'low', l: 'Düşük' }, { v: 'medium', l: 'Orta' }, { v: 'high', l: 'Yüksek' }]} />
      </div>
      <div>
        <div className="mb-1.5 flex justify-between text-xs text-slate-400"><span>Satır</span><b className="text-white">{rows}</b></div>
        <input type="range" min={8} max={16} value={rows} onChange={(e) => setRows(Number(e.target.value))} disabled={dis} className="w-full accent-violet-500" aria-label="Satır" />
      </div>
      <PlayButton onClick={drop} busy={busy && auto.left === 0} disabled={auto.left > 0}>Topu bırak</PlayButton>
      <AutoButtons {...auto} disabled={busy} />
      <p className="text-xs text-slate-500">En büyük kutu: {Math.max(...table).toLocaleString('tr-TR')}x · her kutunun olasılığı sabittir (binom dağılımı).</p>
    </>
  );

  const board = (
    <div className="card space-y-3 p-3 sm:p-5">
      <HistoryChips items={history} />
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Plinko tahtası">
        {Array.from({ length: rows }, (_, r) => Array.from({ length: r + 3 }, (_, i) => <circle key={`${r}-${i}`} cx={pegX(r, i)} cy={top + r * sy + sy * 0.3} r={3.2} fill="#94a3b8" opacity=".85" />))}
        {table.map((m, k) => {
          const cx = W / 2 + (k - rows / 2) * sx;
          const w = sx - 4;
          return (
            <g key={k} style={{ transform: hit === k ? 'translateY(4px)' : undefined, transition: 'transform .2s' }}>
              <rect x={cx - w / 2} y={top + rows * sy + 36} width={w} height={26} rx={6} fill={colorFor(m)} opacity={hit === k ? 1 : 0.8} />
              <text x={cx} y={top + rows * sy + 53} textAnchor="middle" fontSize={rows > 13 ? 8.5 : 10.5} fontWeight={800} fill="#0b1220">{m >= 100 ? Math.round(m) : m.toFixed(m >= 10 ? 1 : 2).replace('.', ',')}</text>
            </g>
          );
        })}
        {ball && (
          <g style={{ transform: `translate(${ball.x}px, ${ball.y}px)`, transition: 'transform .13s linear' }}>
            <circle r={8} fill="#fde047" /><circle r={8} fill="none" stroke="#f59e0b" strokeWidth={2} /><ellipse cx={-2.5} cy={-3} rx={2.5} ry={1.6} fill="#fff" opacity=".7" />
          </g>
        )}
      </svg>
      <ResultBar res={res} />
    </div>
  );
  return <GameShell game="plinko" controls={controls} board={board} fair={<FairBox fair={fair} />} />;
}
