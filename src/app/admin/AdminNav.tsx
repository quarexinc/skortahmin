'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/client';

type Counts = Record<string, number>;

const ITEMS: { href: string; label: string; icon: string; badge?: string }[] = [
  { href: '/admin', label: 'Gösterge paneli', icon: '📊' },
  { href: '/admin/kullanicilar', label: 'Kullanıcılar', icon: '👥' },
  { href: '/admin/premium', label: 'Premium talepleri', icon: '💎', badge: 'premium_pending' },
  { href: '/admin/destek', label: 'Destek talepleri', icon: '🎫', badge: 'tickets_open' },
  { href: '/admin/canli-destek', label: 'Canlı destek', icon: '💬', badge: 'chat_unread' },
  { href: '/admin/yorumlar', label: 'Yorumlar', icon: '🗨️', badge: 'comments_flagged' },
  { href: '/admin/tahminler', label: 'Tahminler', icon: '🎯', badge: 'predictions_unscored' },
  { href: '/admin/duyurular', label: 'Duyurular', icon: '📢' },
  { href: '/admin/bildirim', label: 'Toplu bildirim', icon: '🔔' },
  { href: '/admin/ayarlar', label: 'Site ayarları', icon: '⚙️' },
  { href: '/admin/kayitlar', label: 'İşlem kayıtları', icon: '📜' },
];

export default function AdminNav() {
  const path = usePathname();
  const [c, setC] = useState<Counts>({});
  useEffect(() => {
    const load = () => api<{ counts: Counts }>('/api/admin/stats').then((r) => r.data && setC(r.data.counts));
    load();
    const t = setInterval(() => document.visibilityState === 'visible' && load(), 30_000);
    return () => clearInterval(t);
  }, []);
  return (
    <aside>
      <p className="mb-3 hidden px-3 text-xs font-bold uppercase tracking-wider text-violet-300 lg:block">🛡️ Yönetim</p>
      <nav className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
        {ITEMS.map((i) => {
          const active = i.href === '/admin' ? path === '/admin' : path.startsWith(i.href);
          const n = i.badge ? c[i.badge] ?? 0 : 0;
          return (
            <Link
              key={i.href}
              href={i.href}
              className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                active ? 'bg-violet-500/15 text-violet-200' : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span aria-hidden>{i.icon}</span>
              <span className="flex-1">{i.label}</span>
              {n > 0 && <span className="rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{n}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
