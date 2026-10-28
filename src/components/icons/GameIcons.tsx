// Özel, tutarlı oyun ikonları (64×64, degrade dolgulu). lucide yerine oyun kartlarında ve slot sembollerinde kullanılır.
import type { ReactNode } from 'react';
import type { GameKey } from '@/lib/games/registry';

type P = { size?: number; className?: string };

// Gradyan kimlikleri ikon adına göre sabittir (kancasız; sunucu bileşenlerinde de çalışır). Aynı ikonun kopyaları aynı gradyanı paylaşır.
function Svg({ size = 48, className, k, children }: P & { k: string; children: (id: (n: string) => string) => ReactNode }) {
  const id = (n: string) => `gi-${k}-${n}`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      {children(id)}
    </svg>
  );
}

const Grad = ({ id, from, to, vertical = true }: { id: string; from: string; to: string; vertical?: boolean }) => (
  <linearGradient id={id} x1="0" y1="0" x2={vertical ? '0' : '1'} y2={vertical ? '1' : '1'}>
    <stop offset="0" stopColor={from} />
    <stop offset="1" stopColor={to} />
  </linearGradient>
);

const Crash = (p: P) => (
  <Svg {...p} k="crash">
    {(id) => (
      <>
        <defs>
          <Grad id={id('b')} from="#fdf2f8" to="#f9a8d4" />
          <Grad id={id('f')} from="#fde047" to="#f97316" />
          <Grad id={id('w')} from="#f472b6" to="#be185d" />
        </defs>
        <path d="M32 6c9 7 13 18 11 32H21C19 24 23 13 32 6z" fill={`url(#${id('b')})`} />
        <circle cx="32" cy="24" r="6" fill="#0f172a" /><circle cx="32" cy="24" r="4" fill="#38bdf8" /><circle cx="30.5" cy="22.5" r="1.4" fill="#e0f2fe" />
        <path d="M21 32l-9 11 4 3 6-3zM43 32l9 11-4 3-6-3z" fill={`url(#${id('w')})`} />
        <path d="M25 38h14l-3 6h-8z" fill="#9d174d" />
        <path d="M32 58c-5-5-6-9-4-14h8c2 5 1 9-4 14z" fill={`url(#${id('f')})`} />
        <path d="M32 54c-2-2.5-2.600-4.500-1.800-7h3.600c.8 2.500.2 4.500-1.800 7z" fill="#fef9c3" />
      </>
    )}
  </Svg>
);

const Mines = (p: P) => (
  <Svg {...p} k="mines">
    {(id) => (
      <>
        <defs>
          <radialGradient id={id('g')} cx="0.35" cy="0.3" r="0.9"><stop offset="0" stopColor="#64748b" /><stop offset="0.55" stopColor="#1e293b" /><stop offset="1" stopColor="#020617" /></radialGradient>
          <Grad id={id('s')} from="#fde047" to="#f97316" />
        </defs>
        <path d="M40 15c3-5 7-6 11-5" stroke="#a16207" strokeWidth="3.500" strokeLinecap="round" />
        <rect x="35" y="14" width="8" height="8" rx="2" transform="rotate(35 39 18)" fill="#475569" />
        <circle cx="29" cy="37" r="19" fill={`url(#${id('g')})`} />
        <ellipse cx="22" cy="29" rx="5" ry="3" transform="rotate(-35 22 29)" fill="#fff" opacity=".28" />
        <path d="M52 9l1.500 4 4 1.500-4 1.500L52 20l-1.500-4-4-1.500 4-1.500z" fill={`url(#${id('s')})`} />
        <path d="M58 20l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" fill="#fde047" />
      </>
    )}
  </Svg>
);

const Slots = (p: P) => (
  <Svg {...p} k="slots">
    {(id) => (
      <>
        <defs><Grad id={id('c')} from="#fb7185" to="#be123c" /><Grad id={id('l')} from="#86efac" to="#15803d" /></defs>
        <path d="M24 30c0-12 6-18 17-22" stroke="#15803d" strokeWidth="3.500" strokeLinecap="round" />
        <path d="M42 33c0-10 0-16-1-25" stroke="#15803d" strokeWidth="3.500" strokeLinecap="round" />
        <path d="M41 8c8-3 14 0 17 5-8 2-14 0-17-5z" fill={`url(#${id('l')})`} />
        <circle cx="21" cy="43" r="14" fill={`url(#${id('c')})`} />
        <circle cx="45" cy="45" r="13" fill={`url(#${id('c')})`} />
        <ellipse cx="16" cy="38" rx="3.500" ry="2.200" transform="rotate(-35 16 38)" fill="#fff" opacity=".45" />
        <ellipse cx="40" cy="40" rx="3" ry="2" transform="rotate(-35 40 40)" fill="#fff" opacity=".45" />
      </>
    )}
  </Svg>
);

const Blackjack = (p: P) => (
  <Svg {...p} k="blackjack">
    {(id) => (
      <>
        <defs><Grad id={id('k')} from="#ffffff" to="#cbd5e1" /><Grad id={id('s')} from="#38bdf8" to="#1d4ed8" /></defs>
        <rect x="9" y="11" width="32" height="44" rx="5" transform="rotate(-12 25 33)" fill="#1e293b" stroke="#475569" strokeWidth="2" />
        <rect x="22" y="8" width="33" height="46" rx="5" transform="rotate(8 38 31)" fill={`url(#${id('k')})`} stroke="#94a3b8" strokeWidth="1.500" />
        <g transform="rotate(8 38 31)">
          <path d="M38.500 19c-5 6-10 8-10 13 0 3 2.500 5 5 5 1.800 0 3-.8 3.800-2-.2 3-1 5-3 7h8c-2-2-2.800-4-3-7 .8 1.200 2 2 3.800 2 2.500 0 5-2 5-5 0-5-5-7-10.600-13z" fill={`url(#${id('s')})`} transform="translate(-1 -3) scale(.95)" />
          <text x="26" y="24" fontSize="9" fontWeight="800" fill="#1d4ed8" fontFamily="system-ui">A</text>
        </g>
      </>
    )}
  </Svg>
);

const Dice = (p: P) => (
  <Svg {...p} k="dice">
    {(id) => (
      <>
        <defs><Grad id={id('d')} from="#c4b5fd" to="#6d28d9" /></defs>
        <rect x="10" y="10" width="44" height="44" rx="11" fill={`url(#${id('d')})`} />
        <rect x="10" y="10" width="44" height="22" rx="11" fill="#fff" opacity=".12" />
        {[[22, 22], [42, 22], [32, 32], [22, 42], [42, 42]].map(([x, y]) => (
          <g key={`${x}${y}`}><circle cx={x} cy={y + 1} r="4.500" fill="#2e1065" opacity=".45" /><circle cx={x} cy={y} r="4.500" fill="#fff" /></g>
        ))}
      </>
    )}
  </Svg>
);

const Limbo = (p: P) => (
  <Svg {...p} k="limbo">
    {(id) => (
      <>
        <defs><Grad id={id('a')} from="#fda4af" to="#e11d48" vertical={false} /></defs>
        <path d="M8 46a24 24 0 0148 0" stroke="#1e293b" strokeWidth="9" strokeLinecap="round" />
        <path d="M8 46a24 24 0 0138-19" stroke={`url(#${id('a')})`} strokeWidth="9" strokeLinecap="round" />
        <path d="M32 46l14-17" stroke="#f8fafc" strokeWidth="4" strokeLinecap="round" />
        <circle cx="32" cy="46" r="6" fill="#f8fafc" /><circle cx="32" cy="46" r="2.500" fill="#e11d48" />
        <path d="M10 56h44" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
      </>
    )}
  </Svg>
);

const Plinko = (p: P) => (
  <Svg {...p} k="plinko">
    {(id) => (
      <>
        <defs><Grad id={id('b')} from="#5eead4" to="#0d9488" /><Grad id={id('p')} from="#fde047" to="#f59e0b" /></defs>
        {[[32, 24], [24, 34], [40, 34], [16, 44], [32, 44], [48, 44]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="3.200" fill="#94a3b8" />)}
        <circle cx="32" cy="10" r="6.500" fill={`url(#${id('p')})`} /><ellipse cx="30" cy="8" rx="2" ry="1.300" fill="#fff" opacity=".6" />
        <rect x="8" y="52" width="14" height="7" rx="3" fill={`url(#${id('b')})`} /><rect x="25" y="52" width="14" height="7" rx="3" fill="#f59e0b" /><rect x="42" y="52" width="14" height="7" rx="3" fill={`url(#${id('b')})`} />
      </>
    )}
  </Svg>
);

const Coinflip = (p: P) => (
  <Svg {...p} k="coinflip">
    {(id) => (
      <>
        <defs><Grad id={id('c')} from="#fde68a" to="#d97706" /></defs>
        <ellipse cx="32" cy="35" rx="21" ry="19" fill="#92400e" />
        <ellipse cx="32" cy="31" rx="21" ry="19" fill={`url(#${id('c')})`} />
        <ellipse cx="32" cy="31" rx="15" ry="13" fill="none" stroke="#b45309" strokeWidth="2" opacity=".7" />
        <path d="M32 21l3 6.500 7 .8-5.200 4.700 1.500 7L32 36.500 25.700 40l1.500-7-5.200-4.700 7-.8z" fill="#b45309" opacity=".85" />
        <path d="M14 22c3-6 9-10 18-10" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".5" />
      </>
    )}
  </Svg>
);

const Keno = (p: P) => (
  <Svg {...p} k="keno">
    {(id) => (
      <>
        <defs><Grad id={id('h')} from="#93c5fd" to="#2563eb" /></defs>
        {[0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => {
          const hot = (r + c) % 2 === 0 && !(r === 1 && c === 1) ? false : r === c;
          return <circle key={`${r}${c}`} cx={15 + c * 17} cy={15 + r * 17} r="7" fill={hot ? `url(#${id('h')})` : '#1e293b'} stroke={hot ? '#bfdbfe' : '#475569'} strokeWidth="1.500" />;
        }))}
        <text x="15" y="18.500" textAnchor="middle" fontSize="9" fontWeight="800" fill="#fff" fontFamily="system-ui">7</text>
        <text x="32" y="35.500" textAnchor="middle" fontSize="9" fontWeight="800" fill="#fff" fontFamily="system-ui">21</text>
        <text x="49" y="52.500" textAnchor="middle" fontSize="9" fontWeight="800" fill="#fff" fontFamily="system-ui">40</text>
      </>
    )}
  </Svg>
);

const Roulette = (p: P) => (
  <Svg {...p} k="roulette">
    {(id) => (
      <>
        <defs><Grad id={id('r')} from="#fca5a5" to="#b91c1c" /><Grad id={id('w')} from="#a16207" to="#78350f" /></defs>
        <circle cx="32" cy="32" r="26" fill={`url(#${id('w')})`} />
        {Array.from({ length: 12 }, (_, i) => {
          const a1 = (i * 30 * Math.PI) / 180;
          const a2 = ((i + 1) * 30 * Math.PI) / 180;
          const R = 22;
          const d = `M32 32L${32 + R * Math.sin(a1)} ${32 - R * Math.cos(a1)}A${R} ${R} 0 0 1 ${32 + R * Math.sin(a2)} ${32 - R * Math.cos(a2)}Z`;
          return <path key={i} d={d} fill={i === 0 ? '#16a34a' : i % 2 ? `url(#${id('r')})` : '#0f172a'} />;
        })}
        <circle cx="32" cy="32" r="11" fill="#f1f5f9" /><circle cx="32" cy="32" r="7" fill="#fbbf24" /><circle cx="32" cy="32" r="2.500" fill="#78350f" />
        <circle cx="47" cy="14" r="3.500" fill="#fff" /><circle cx="46.200" cy="13.200" r="1.200" fill="#cbd5e1" />
      </>
    )}
  </Svg>
);

const Wheel = (p: P) => (
  <Svg {...p} k="wheel">
    {(id) => (
      <>
        <defs><Grad id={id('p')} from="#fef08a" to="#f59e0b" /></defs>
        {['#e879f9', '#38bdf8', '#34d399', '#fbbf24', '#fb7185', '#a78bfa', '#2dd4bf', '#f472b6'].map((c, i) => {
          const a1 = (i * 45 * Math.PI) / 180;
          const a2 = ((i + 1) * 45 * Math.PI) / 180;
          const R = 26;
          return <path key={i} d={`M32 36L${32 + R * Math.sin(a1)} ${36 - R * Math.cos(a1)}A${R} ${R} 0 0 1 ${32 + R * Math.sin(a2)} ${36 - R * Math.cos(a2)}Z`} fill={c} stroke="#0f172a" strokeWidth="1.500" />;
        })}
        <circle cx="32" cy="36" r="7" fill="#0f172a" /><circle cx="32" cy="36" r="4" fill={`url(#${id('p')})`} />
        <path d="M32 3l5 9h-10z" fill="#f8fafc" stroke="#0f172a" strokeWidth="1.500" strokeLinejoin="round" />
      </>
    )}
  </Svg>
);

const Hilo = (p: P) => (
  <Svg {...p} k="hilo">
    {(id) => (
      <>
        <defs><Grad id={id('g')} from="#6ee7b7" to="#059669" /><Grad id={id('r')} from="#fda4af" to="#e11d48" /></defs>
        <rect x="14" y="14" width="36" height="36" rx="8" fill="#f1f5f9" />
        <path d="M32 18l9 11H23z" fill={`url(#${id('g')})`} />
        <path d="M32 46l-9-11h18z" fill={`url(#${id('r')})`} />
        <rect x="14" y="30.500" width="36" height="3" fill="#cbd5e1" />
        <path d="M54 22v20M54 22l-3 4M54 22l3 4" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </>
    )}
  </Svg>
);

const Towers = (p: P) => (
  <Svg {...p} k="towers">
    {(id) => (
      <>
        <defs><Grad id={id('t')} from="#fdba74" to="#c2410c" /></defs>
        {[[18, 50, 28], [20, 36, 24], [22, 22, 20]].map(([x, y, w], i) => (
          <g key={i}>
            <rect x={x} y={y} width={w} height="12" rx="3" fill={`url(#${id('t')})`} />
            <path d={`M${x + 7} ${y}v12M${x + w - 7} ${y}v12`} stroke="#7c2d12" strokeWidth="1.500" opacity=".6" />
          </g>
        ))}
        <path d="M32 22V6" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
        <path d="M32 6l14 5-14 5z" fill="#fbbf24" />
        <path d="M10 58h44" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
      </>
    )}
  </Svg>
);

const Scratch = (p: P) => (
  <Svg {...p} k="scratch">
    {(id) => (
      <>
        <defs><Grad id={id('s')} from="#d8b4fe" to="#7e22ce" /><Grad id={id('g')} from="#fef9c3" to="#fbbf24" /></defs>
        <rect x="8" y="12" width="48" height="40" rx="8" fill={`url(#${id('s')})`} />
        <rect x="14" y="20" width="36" height="24" rx="5" fill="#a1a1aa" opacity=".55" />
        <path d="M20 40c6-6 12-16 18-18" stroke="#f5f5f4" strokeWidth="7" strokeLinecap="round" opacity=".9" />
        <circle cx="42" cy="32" r="7" fill={`url(#${id('g')})`} /><text x="42" y="35.500" textAnchor="middle" fontSize="10" fontWeight="900" fill="#b45309" fontFamily="system-ui">x</text>
        <path d="M50 8l1.500 4 4 1.500-4 1.500L50 19l-1.500-4-4-1.500 4-1.500z" fill="#fde047" />
      </>
    )}
  </Svg>
);

const ICONS: Record<GameKey, (p: P) => ReactNode> = {
  crash: Crash, mines: Mines, slots: Slots, blackjack: Blackjack, dice: Dice, limbo: Limbo, plinko: Plinko,
  coinflip: Coinflip, keno: Keno, roulette: Roulette, wheel: Wheel, hilo: Hilo, towers: Towers, scratch: Scratch,
};

export function GameIcon({ game, size = 48, className }: { game: GameKey } & P) {
  const I = ICONS[game];
  return <>{I({ size, className })}</>;
}

/* -------------------- Slot / kazı kazan sembolleri -------------------- */
export type SymbolId = 'cherry' | 'lemon' | 'grape' | 'bell' | 'clover' | 'star' | 'gem' | 'crown' | 'wild' | 'scatter' | 'coin' | 'seven' | 'blank';

const star5 = 'M32 6l7.500 16 17 2-12.500 11.500 3.500 17L32 44.500 16.500 52.500l3.500-17L7.500 24l17-2z';

export function SymbolIcon({ id: sym, size = 48, className }: { id: SymbolId } & P) {
  return (
    <Svg size={size} className={className} k={`s-${sym}`}>
      {(id) => {
        switch (sym) {
          case 'cherry': return <><defs><Grad id={id('a')} from="#fb7185" to="#be123c" /></defs><path d="M22 36c0-14 8-22 20-26M42 38c0-10 0-18-2-28" stroke="#15803d" strokeWidth="3.500" strokeLinecap="round" /><path d="M40 10c7-3 14 0 16 6-8 2-13 0-16-6z" fill="#22c55e" /><circle cx="22" cy="44" r="13" fill={`url(#${id('a')})`} /><circle cx="44" cy="46" r="12" fill={`url(#${id('a')})`} /><ellipse cx="17" cy="39" rx="3.500" ry="2.200" transform="rotate(-35 17 39)" fill="#fff" opacity=".5" /></>;
          case 'lemon': return <><defs><Grad id={id('a')} from="#fef08a" to="#eab308" /></defs><path d="M8 34c0-12 10-20 24-20 10 0 14 4 18 4 3 0 6 3 6 6s-3 6-6 6c-4 0-8 4-18 4-14 0-24-8-24-20z" transform="translate(0 6)" fill={`url(#${id('a')})`} /><path d="M22 28c6-4 14-4 22 0" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".5" /><path d="M50 22c3-4 6-6 8-6" stroke="#16a34a" strokeWidth="3.500" strokeLinecap="round" /></>;
          case 'grape': return <><defs><Grad id={id('a')} from="#c4b5fd" to="#7c3aed" /></defs><path d="M32 12c0-4 4-6 8-5" stroke="#15803d" strokeWidth="3.500" strokeLinecap="round" />{[[20, 24], [32, 24], [44, 24], [26, 35], [38, 35], [32, 46], [20, 24]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="7.500" fill={`url(#${id('a')})`} stroke="#5b21b6" strokeWidth="1" />)}<circle cx="18" cy="21" r="2" fill="#fff" opacity=".6" /></>;
          case 'bell': return <><defs><Grad id={id('a')} from="#fde68a" to="#d97706" /></defs><path d="M32 8c-9 0-14 7-14 17 0 9-4 12-7 16h42c-3-4-7-7-7-16 0-10-5-17-14-17z" fill={`url(#${id('a')})`} /><circle cx="32" cy="8" r="3" fill="#b45309" /><path d="M26 47a6 6 0 0012 0z" fill="#92400e" /><path d="M23 20c1.500-4 5-7 9-7" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".55" /></>;
          case 'clover': return <><defs><Grad id={id('a')} from="#86efac" to="#15803d" /></defs>{[[32, 20], [20, 32], [44, 32], [32, 44]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="11" fill={`url(#${id('a')})`} />)}<path d="M32 38c0 8-2 14-8 18" stroke="#166534" strokeWidth="4" strokeLinecap="round" /><path d="M32 14v36M14 32h36" stroke="#14532d" strokeWidth="1.500" opacity=".4" /></>;
          case 'star': return <><defs><Grad id={id('a')} from="#fef08a" to="#f59e0b" /></defs><path d={star5} fill={`url(#${id('a')})`} stroke="#b45309" strokeWidth="2" strokeLinejoin="round" /><path d="M24 22l-3 8" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".6" /></>;
          case 'gem': return <><defs><Grad id={id('a')} from="#a5f3fc" to="#0891b2" /></defs><path d="M18 12h28l12 14-26 30L6 26z" fill={`url(#${id('a')})`} stroke="#155e75" strokeWidth="2" strokeLinejoin="round" /><path d="M6 26h52M18 12l6 14 8 30 8-30 6-14M24 26l8-14 8 14" stroke="#ecfeff" strokeWidth="1.800" strokeLinejoin="round" opacity=".7" /></>;
          case 'crown': return <><defs><Grad id={id('a')} from="#fde68a" to="#d97706" /></defs><path d="M8 46L6 18l14 12 12-18 12 18 14-12-2 28z" fill={`url(#${id('a')})`} stroke="#92400e" strokeWidth="2" strokeLinejoin="round" /><rect x="8" y="46" width="48" height="8" rx="3" fill="#b45309" /><circle cx="6" cy="18" r="3.500" fill="#fb7185" /><circle cx="32" cy="12" r="3.500" fill="#38bdf8" /><circle cx="58" cy="18" r="3.500" fill="#fb7185" /></>;
          case 'wild': return <><defs><Grad id={id('a')} from="#f9a8d4" to="#a21caf" /></defs><path d="M32 4l6 20 20 6-20 6-6 20-6-20-20-6 20-6z" fill={`url(#${id('a')})`} stroke="#701a75" strokeWidth="2" strokeLinejoin="round" /><text x="32" y="36" textAnchor="middle" fontSize="12" fontWeight="900" fill="#fff" fontFamily="system-ui">W</text></>;
          case 'scatter': return <><defs><Grad id={id('a')} from="#bae6fd" to="#2563eb" /></defs><path d="M32 4l24 28-24 28L8 32z" fill={`url(#${id('a')})`} stroke="#1e3a8a" strokeWidth="2" strokeLinejoin="round" /><path d="M32 4v56M8 32h48" stroke="#eff6ff" strokeWidth="1.500" opacity=".6" /><circle cx="32" cy="32" r="7" fill="#fff" /><circle cx="32" cy="32" r="3.500" fill="#2563eb" /></>;
          case 'coin': return <><defs><Grad id={id('a')} from="#fde68a" to="#d97706" /></defs><circle cx="32" cy="32" r="24" fill={`url(#${id('a')})`} stroke="#92400e" strokeWidth="2" /><circle cx="32" cy="32" r="17" stroke="#b45309" strokeWidth="2" opacity=".7" /><text x="32" y="39" textAnchor="middle" fontSize="20" fontWeight="900" fill="#92400e" fontFamily="system-ui">$</text></>;
          case 'seven': return <><defs><Grad id={id('a')} from="#fca5a5" to="#b91c1c" /></defs><rect x="6" y="6" width="52" height="52" rx="12" fill="#1e1b4b" stroke="#6366f1" strokeWidth="2" /><path d="M18 18h28L30 50" stroke={`url(#${id('a')})`} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" /></>;
          default: return <><rect x="12" y="12" width="40" height="40" rx="10" fill="#1e293b" stroke="#334155" strokeWidth="2" /><path d="M24 24l16 16M40 24L24 40" stroke="#475569" strokeWidth="3" strokeLinecap="round" /></>;
        }
      }}
    </Svg>
  );
}
