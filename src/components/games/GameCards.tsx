import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { GAME_META } from './meta';

const ART: Record<string, string> = {
  crash: 'from-pink-500/30 via-fuchsia-500/10 to-transparent',
  mines: 'from-emerald-500/30 via-emerald-500/10 to-transparent',
  slots: 'from-amber-500/30 via-orange-500/10 to-transparent',
  blackjack: 'from-sky-500/30 via-cyan-500/10 to-transparent',
};

export default function GameCards({ enabled }: { enabled: Record<string, boolean> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {(Object.keys(GAME_META) as (keyof typeof GAME_META)[]).map((k) => {
        const g = GAME_META[k];
        const on = enabled[k] !== false;
        return (
          <Link
            key={k}
            href={on ? g.href : '#'}
            aria-disabled={!on}
            className={`card glow-card group relative overflow-hidden p-0 transition duration-300 ${on ? 'hover:-translate-y-1.5' : 'pointer-events-none opacity-50'}`}
          >
            <div className={`relative grid h-40 place-items-center bg-gradient-to-br ${ART[k]}`}>
              <div className="absolute inset-0 grid-bg opacity-60" />
              <g.icon size={64} strokeWidth={1.5} className="relative transition duration-500 group-hover:rotate-6 group-hover:scale-110" style={{ color: g.color }} />
              <span className="absolute right-3 top-3 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-slate-200">{g.edge}</span>
            </div>
            <div className="p-4">
              <p className="flex items-center justify-between font-bold">
                {g.name}
                <ArrowRight size={16} className="text-slate-500 transition group-hover:translate-x-1 group-hover:text-white" />
              </p>
              <p className="mt-1 text-sm text-slate-400">{on ? g.desc : 'Şu anda bakımda'}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
