'use client';
import { Check, Plus } from 'lucide-react';

import { useEffect, useState } from 'react';
import { onCouponChange, readCoupon, togglePick, type CouponPick } from '@/lib/client';
import type { LightFixture } from '@/lib/types';
import { useAuth } from './AuthProvider';

// Model olasılığını kupon taslağına ekler/çıkarır.
export default function PickButton({ fixture, market, selection, prob }: { fixture: LightFixture; market: string; selection: string; prob: number }) {
  const { toast } = useAuth();
  const [on, setOn] = useState(false);
  useEffect(() => {
    const upd = () =>
      setOn(readCoupon().some((p) => p.fixtureId === fixture.id && p.market === market && p.selection === selection));
    upd();
    return onCouponChange(upd);
  }, [fixture.id, market, selection]);

  const click = () => {
    const pick: CouponPick = {
      fixtureId: fixture.id,
      home: fixture.home?.name ?? '',
      away: fixture.away?.name ?? '',
      league: fixture.league?.name ?? null,
      date: fixture.date,
      market,
      selection,
      prob,
    };
    const added = togglePick(pick);
    toast(added ? `Kupona eklendi: ${selection}` : 'Kupondan çıkarıldı', added ? 'success' : 'info');
  };

  return (
    <button
      onClick={click}
      title={on ? 'Kupondan çıkar' : 'Kupona ekle'}
      className={`mt-1.5 inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-semibold transition ${
        on ? 'bg-accent text-ink-950' : 'border border-white/10 text-slate-400 hover:border-accent/50 hover:text-accent-soft'
      }`}
    >
      {on ? <><Check size={12} /> Kuponda</> : <><Plus size={12} /> Kupon</>}
    </button>
  );
}
