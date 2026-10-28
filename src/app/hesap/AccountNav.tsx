'use client';

import { Award, Bell, Gem, Home, LifeBuoy, Receipt, Settings, Star, Target } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/hesap', label: 'Genel bakış', icon: Home },
  { href: '/hesap/tahminler', label: 'Tahminlerim', icon: Target },
  { href: '/hesap/rozetler', label: 'Rozetlerim', icon: Award },
  { href: '/hesap/kuponlar', label: 'Kuponlarım', icon: Receipt },
  { href: '/hesap/favoriler', label: 'Favorilerim', icon: Star },
  { href: '/hesap/bildirimler', label: 'Bildirimler', icon: Bell },
  { href: '/destek', label: 'Destek talepleri', icon: LifeBuoy },
  { href: '/premium', label: 'Premium', icon: Gem },
  { href: '/hesap/profil', label: 'Profil & ayarlar', icon: Settings },
];

export default function AccountNav() {
  const path = usePathname();
  return (
    <nav className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
      {ITEMS.map((i) => {
        const active = i.href === '/hesap' ? path === '/hesap' : path.startsWith(i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
              active ? 'bg-accent/15 text-accent-soft' : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <i.icon size={17} aria-hidden />
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
