'use client';

// Etkileşimli Poisson demosu: beklenen golleri değiştir, skor matrisi ve 1X2 anında yeniden hesaplanır.
// Gerçek modelle aynı formül (P(i,j) = Poisson(i; λ1) × Poisson(j; λ2)); örnek veri değil, saf hesap.
import { Sigma } from 'lucide-react';
import { useMemo, useState } from 'react';

const N = 6;
const fact = (k: number): number => (k <= 1 ? 1 : k * fact(k - 1));
const pmf = (k: number, l: number) => (Math.exp(-l) * Math.pow(l, k)) / fact(k);

export default function PoissonDemo() {
  const [lh, setLh] = useState(1.6);
  const [la, setLa] = useState(1.1);

  const { m, max, best, home, draw, away, over25, btts } = useMemo(() => {
    const m: number[][] = [];
    let sum = 0;
    for (let i = 0; i <= N; i++) {
      m.push([]);
      for (let j = 0; j <= N; j++) {
        const p = pmf(i, lh) * pmf(j, la);
        m[i].push(p);
        sum += p;
      }
    }
    let max = 0;
    let best = [0, 0];
    let home = 0, draw = 0, away = 0, over25 = 0, btts = 0;
    for (let i = 0; i <= N; i++)
      for (let j = 0; j <= N; j++) {
        const p = (m[i][j] /= sum);
        if (p > max) {
          max = p;
          best = [i, j];
        }
        if (i > j) home += p;
        else if (i === j) draw += p;
        else away += p;
        if (i + j > 2) over25 += p;
        if (i > 0 && j > 0) btts += p;
      }
    return { m, max, best, home, draw, away, over25, btts };
  }, [lh, la]);

  const pc = (x: number) => `%${(x * 100).toFixed(1).replace('.', ',')}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <div className="space-y-6">
        {[
          { label: 'Ev sahibi beklenen gol (λ)', v: lh, set: setLh, color: 'accent-[#22c55e]', text: 'text-accent-soft' },
          { label: 'Deplasman beklenen gol (λ)', v: la, set: setLa, color: 'accent-[#38bdf8]', text: 'text-sky-400' },
        ].map((s) => (
          <label key={s.label} className="block">
            <span className="flex items-center justify-between text-sm text-slate-300">
              {s.label}
              <b className={`text-lg tabular-nums ${s.text}`}>{s.v.toFixed(2).replace('.', ',')}</b>
            </span>
            <input type="range" min={0.2} max={3.5} step={0.05} value={s.v} onChange={(e) => s.set(Number(e.target.value))} className={`mt-2 w-full ${s.color}`} />
          </label>
        ))}
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            ['1', home, 'bg-accent'],
            ['X', draw, 'bg-slate-400'],
            ['2', away, 'bg-sky-500'],
          ].map(([k, v, c]) => (
            <div key={k as string} className="rounded-2xl bg-ink-900/80 p-3">
              <p className="text-xs text-slate-500">{k as string}</p>
              <p className="text-xl font-black tabular-nums">{pc(v as number)}</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
                <div className={`h-full ${c} transition-all duration-500`} style={{ width: `${(v as number) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-ink-900/80 px-3 py-1.5 text-slate-300">En olası skor: <b className="text-white">{best[0]}–{best[1]}</b> ({pc(max)})</span>
          <span className="rounded-full bg-ink-900/80 px-3 py-1.5 text-slate-300">2,5 Üst: <b className="text-white">{pc(over25)}</b></span>
          <span className="rounded-full bg-ink-900/80 px-3 py-1.5 text-slate-300">KG Var: <b className="text-white">{pc(btts)}</b></span>
        </div>
        <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-500">
          <Sigma size={14} className="mt-0.5 shrink-0" />
          Gerçek maç sayfalarında λ değerleri sezon, form ve karşılıklı maç verilerinden hesaplanır; burada kendin değiştirip modelin nasıl tepki verdiğini görebilirsin.
        </p>
      </div>

      <div>
        <div className="mb-2 flex justify-between text-[11px] text-slate-500">
          <span>Satır: ev sahibi golü · Sütun: deplasman golü</span>
          <span>Skor matrisi</span>
        </div>
        <div className="grid grid-cols-[auto_repeat(7,minmax(0,1fr))] gap-1 text-center text-[11px]">
          <span />
          {Array.from({ length: N + 1 }, (_, j) => (
            <span key={j} className="py-1 font-semibold text-sky-400">{j}</span>
          ))}
          {m.map((row, i) => (
            <div key={i} className="contents">
              <span className="px-1.5 py-2 font-semibold text-accent-soft">{i}</span>
              {row.map((p, j) => {
                const a = Math.min(1, p / max);
                const isBest = best[0] === i && best[1] === j;
                return (
                  <span
                    key={j}
                    title={`${i}–${j}: ${pc(p)}`}
                    className={`grid aspect-square place-items-center rounded-md font-semibold tabular-nums transition-all duration-500 ${isBest ? 'ring-2 ring-white' : ''}`}
                    style={{
                      background: i > j ? `rgba(34,197,94,${0.08 + a * 0.75})` : i === j ? `rgba(148,163,184,${0.08 + a * 0.6})` : `rgba(56,189,248,${0.08 + a * 0.75})`,
                      color: a > 0.45 ? '#05080f' : '#94a3b8',
                    }}
                  >
                    {p >= 0.01 ? Math.round(p * 100) : ''}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
