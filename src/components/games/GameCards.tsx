'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { GAME_INFO, GAME_KEYS, type GameKey, type GameKind } from '@/lib/games/registry';
import { edgeLabel, GAME_META } from './meta';

const FILTERS: [string, string, (k: GameKey) => boolean][] = [
  ['all', 'Tümü', () => true],
  ['live', 'Canlı', (k) => GAME_INFO[k].kind === 'live'],
  ['table', 'Masa & kart', (k) => ['blackjack', 'hilo', 'roulette', 'coinflip'].includes(k)],
  ['arcade', 'Arcade', (k) => ['mines', 'towers', 'plinko', 'dice', 'limbo', 'crash'].includes(k)],
  ['luck', 'Şans', (k) => ['slots', 'keno', 'wheel', 'scratch'].includes(k)],
];

export default function GameCards({ disabled = [], edges, filters = false }: { disabled?: string[]; edges?: Record<string, number>; filters?: boolean }) {
  const [f, setF] = useState('all');
  const test = FILTERS.find((x) => x[0] === f)![2];
  const keys = GAME_KEYS.filter(test);
  return (
    <div>
      {filters && (
        <div className="mb-5 flex flex-wrap gap-2">
          {FILTERS.map(([k, l]) => (
            <button key={k} onClick={() => setF(k)} className={`chip ${f === k ? 'chip-active' : ''}`}>{l}</button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {keys.map((k) => {
          const g = GAME_META[k];
          const on = !disabled.includes(k);
          return (
            <Link
              key={k}
              href={on ? g.href : '#'}
              aria-disabled={!on}
              className={`card glow-card group relative overflow-hidden p-0 transition duration-300 ${on ? 'hover:-translate-y-1.5' : 'pointer-events-none opacity-50'}`}
            >
              <div className="relative grid h-28 place-items-center sm:h-36" style={{ background: `radial-gradient(ellipse at 50% 30%, ${g.color}38, transparent 70%)` }}>
                <div className="absolute inset-0 grid-bg opacity-50" />
                <span className="relative transition duration-500 group-hover:-rotate-6 group-hover:scale-110"><g.icon size={72} /></span>
                <span className="absolute right-2.5 top-2.5 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-slate-200">{edgeLabel(edges, k)}</span>
                {GAME_INFO[k].kind === 'live' && <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-300"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" /> CANLI</span>}
              </div>
              <div className="p-3 sm:p-4">
                <p className="flex items-center justify-between font-bold">
                  {g.name}
                  <ArrowRight size={16} className="text-slate-500 transition group-hover:translate-x-1 group-hover:text-white" />
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-slate-400 sm:text-sm">{on ? g.desc : 'Şu anda bakımda'}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
export type { GameKind };
