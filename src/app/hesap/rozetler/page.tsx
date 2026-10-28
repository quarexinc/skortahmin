'use client';

import { useEffect, useState } from 'react';
import BadgeGrid from '@/components/BadgeGrid';
import { PageHeader, Spinner } from '@/components/ui';
import type { EarnedBadge } from '@/config/badges';
import { api } from '@/lib/client';

export default function BadgesPage() {
  const [b, setB] = useState<EarnedBadge[] | null>(null);
  useEffect(() => {
    api<{ badges: EarnedBadge[] }>('/api/badges').then((r) => setB(r.data?.badges ?? []));
  }, []);
  const earned = b?.filter((x) => x.earned).length ?? 0;
  return (
    <div>
      <PageHeader title="Rozetlerim" subtitle={b ? `${b.length} rozetten ${earned} tanesini kazandın. Kazandığın rozetler herkese açık profilinde görünür.` : undefined} />
      {b ? (
        <>
          <div className="mb-6 h-2 overflow-hidden rounded-full bg-white/5">
            <div className="h-full rounded-full bg-gradient-to-r from-accent to-cyan-400 transition-all duration-700" style={{ width: `${(earned / Math.max(1, b.length)) * 100}%` }} />
          </div>
          <BadgeGrid badges={b} />
        </>
      ) : (
        <Spinner />
      )}
    </div>
  );
}
