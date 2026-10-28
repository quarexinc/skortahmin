'use client';

// Basit, bağımlılıksız SVG alan/çizgi grafiği (iki seri) + ipucu.
import { useState } from 'react';

export default function MiniChart({
  labels,
  series,
  height = 200,
}: {
  labels: string[];
  series: { name: string; color: string; values: number[] }[];
  height?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 800;
  const H = height;
  const pad = { l: 36, r: 12, t: 12, b: 24 };
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const n = labels.length;
  const x = (i: number) => pad.l + (n <= 1 ? 0 : (i / (n - 1)) * (W - pad.l - pad.r));
  const y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const ticks = [0, 0.5, 1].map((f) => Math.round(max * f));

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" onMouseLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="rgba(255,255,255,.06)" />
            <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#64748b">{t}</text>
          </g>
        ))}
        {series.map((s) => {
          const pts = s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ');
          return (
            <g key={s.name}>
              <polygon points={`${x(0)},${y(0)} ${pts} ${x(n - 1)},${y(0)}`} fill={s.color} opacity={0.12} />
              <polyline points={pts} fill="none" stroke={s.color} strokeWidth={2.2} strokeLinejoin="round" />
            </g>
          );
        })}
        {labels.map((l, i) =>
          i % Math.ceil(n / 8) === 0 || i === n - 1 ? (
            <text key={l} x={x(i)} y={H - 6} textAnchor="middle" fontSize="11" fill="#64748b">{l.slice(5).replace('-', '.')}</text>
          ) : null,
        )}
        {labels.map((l, i) => (
          <rect key={`h${l}`} x={x(i) - (W / n) / 2} y={0} width={W / n} height={H} fill="transparent" onMouseEnter={() => setHover(i)} />
        ))}
        {hover != null && <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} stroke="rgba(255,255,255,.25)" strokeDasharray="3 3" />}
        {hover != null && series.map((s) => <circle key={s.name} cx={x(hover)} cy={y(s.values[hover])} r={4} fill={s.color} />)}
      </svg>
      {hover != null && (
        <div className="pointer-events-none absolute top-2 rounded-xl border border-white/10 bg-ink-800 px-3 py-2 text-xs shadow-xl" style={{ left: `min(calc(${(x(hover) / W) * 100}% + 8px), calc(100% - 150px))` }}>
          <p className="mb-1 font-semibold">{labels[hover]}</p>
          {series.map((s) => (
            <p key={s.name} className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: s.color }} /> {s.name}: <b>{s.values[hover]}</b></p>
          ))}
        </div>
      )}
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-400">
        {series.map((s) => (
          <span key={s.name} className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: s.color }} /> {s.name}</span>
        ))}
      </div>
    </div>
  );
}
