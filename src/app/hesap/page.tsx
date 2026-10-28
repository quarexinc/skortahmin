'use client';
import BadgeGrid from '@/components/BadgeGrid';
import type { EarnedBadge } from '@/config/badges';
import { Gem, LayoutDashboard, LifeBuoy, Receipt, Target } from 'lucide-react';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Avatar, Badge, Card, Spinner, STATUS_TR } from '@/components/ui';
import { api, fmtDate } from '@/lib/client';

interface Summary {
  stats: Record<string, number>;
  rank: number | null;
  premiumRequest: { status: string; months: number; created_at: string } | null;
}

function BadgesStrip() {
  const [b, setB] = useState<EarnedBadge[] | null>(null);
  useEffect(() => {
    api<{ badges: EarnedBadge[] }>('/api/badges').then((r) => setB(r.data?.badges ?? []));
  }, []);
  if (!b) return null;
  const earned = b.filter((x) => x.earned);
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <p className="font-bold">Rozetler <span className="text-sm font-normal text-slate-500">{earned.length}/{b.length}</span></p>
        <Link href="/hesap/rozetler" className="text-sm text-accent-soft hover:underline">Tümü</Link>
      </div>
      {earned.length ? <BadgeGrid badges={earned} compact showLocked={false} /> : <p className="text-sm text-slate-400">İlk tahminini yaparak ilk rozetini kazan.</p>}
    </Card>
  );
}

export default function AccountHome() {
  const { user } = useAuth();
  const [d, setD] = useState<Summary | null>(null);
  useEffect(() => {
    api<Summary>('/api/account').then((r) => setD(r.data));
  }, []);
  if (!user) return null;
  if (!d) return <Spinner />;
  const s = d.stats;
  const acc = s.scored > 0 ? Math.round((s.correct / s.scored) * 100) : null;

  const tiles = [
    { label: 'Toplam puan', value: s.points, href: '/hesap/tahminler' },
    { label: 'Sıralama', value: d.rank ? `#${d.rank}` : '—', href: '/liderlik' },
    { label: 'Tahmin', value: s.predictions, href: '/hesap/tahminler' },
    { label: 'İsabet oranı', value: acc == null ? '—' : `%${acc}`, href: '/hesap/tahminler' },
    { label: 'Tam skor', value: s.exact, href: '/hesap/tahminler' },
    { label: 'Kupon', value: s.coupons, href: '/hesap/kuponlar' },
    { label: 'Favori', value: s.favorites, href: '/hesap/favoriler' },
    { label: 'Açık talep', value: s.open_tickets, href: '/destek' },
  ];

  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-center gap-4">
        <Avatar name={user.name} color={user.avatarColor} size={56} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-black">Merhaba, {user.name.split(' ')[0]}!</h1>
          <p className="text-sm text-slate-400">
            Üyelik: {fmtDate(user.createdAt)} · {user.favoriteTeam ? `Takımı: ${user.favoriteTeam}` : 'Takımını profilinden ekleyebilirsin'}
          </p>
        </div>
        {user.isAdmin ? (
          <Link href="/admin" className="inline-flex items-center gap-2 rounded-xl bg-violet-500/15 px-4 py-2 text-sm font-semibold text-violet-300"><LayoutDashboard size={16} /> Yönetim paneli</Link>
        ) : user.isPremium ? (
          <Badge color="amber"><Gem size={12} /> Premium{user.premiumUntil ? ` · ${fmtDate(user.premiumUntil)} tarihine kadar` : ''}</Badge>
        ) : (
          <Link href="/premium" className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-ink-950"><Gem size={16} /> Premium&apos;a geç</Link>
        )}
      </Card>

      {d.premiumRequest && !user.isPremium && (
        <Card className="flex items-center justify-between gap-3 text-sm">
          <span>
            Premium talebin ({d.premiumRequest.months} ay) · {fmtDate(d.premiumRequest.created_at)}
          </span>
          <Badge color={STATUS_TR[d.premiumRequest.status]?.color}>{STATUS_TR[d.premiumRequest.status]?.label}</Badge>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} className="card p-4 transition hover:border-accent/30">
            <p className="text-xs text-slate-500">{t.label}</p>
            <p className="mt-1 text-2xl font-black tabular-nums">{t.value}</p>
          </Link>
        ))}
      </div>

      <BadgesStrip />

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { href: '/maclar', icon: Target, t: 'Tahmin yap', d: 'Bugünün maçlarına skor tahmini gir.' },
          { href: '/kupon', icon: Receipt, t: 'Kupon oluştur', d: 'Model olasılıklarıyla kupon hazırla.' },
          { href: '/destek/yeni', icon: LifeBuoy, t: 'Destek talebi aç', d: 'Sorununu ekibimize ilet.' },
        ].map((x) => (
          <Link key={x.href} href={x.href} className="card p-4 transition hover:border-accent/30">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/15 text-accent-soft"><x.icon size={20} /></span>
            <p className="mt-2 font-semibold">{x.t}</p>
            <p className="text-sm text-slate-400">{x.d}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
