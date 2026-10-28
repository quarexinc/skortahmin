import { Gamepad2 } from 'lucide-react';
import type { Metadata } from 'next';
import AdSlot from '@/components/AdSlot';
import GameCards from '@/components/games/GameCards';
import LiveFeed from '@/components/games/LiveFeed';
import { getSettings } from '@/lib/settings';

export const metadata: Metadata = { title: 'Oyunlar' };
export const dynamic = 'force-dynamic';

export default async function Lobby() {
  const s = await getSettings();
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="flex items-center gap-2 text-3xl font-black tracking-tight"><Gamepad2 className="text-violet-300" /> Oyunlar</h1>
      <p className="mt-1 text-slate-400">Tüm oyunlar sunucu tarafında, doğrulanabilir adil sonuçlarla oynanır. Krediler sanaldır.</p>
      <AdSlot placement="matches_top" className="mt-6" />
      <div className="mt-6">
        <GameCards enabled={{ mines: s.minesEnabled, crash: s.crashEnabled, slots: s.slotsEnabled, blackjack: s.blackjackEnabled }} />
      </div>
      <div className="mt-8">
        <LiveFeed />
      </div>
    </main>
  );
}
