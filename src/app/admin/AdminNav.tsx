'use client';

import { BellRing, Coins, Download, FileText, Gamepad2, HelpCircle, Image, LayoutDashboard, LifeBuoy, LineChart, Mail, Megaphone, MessagesSquare, Newspaper, Rocket, ScrollText, Server, Settings, ShieldAlert, ShieldCheck, TicketPercent, Users, Zap, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/client';

type Counts = Record<string, number>;

const GROUPS: { title: string; items: { href: string; label: string; icon: LucideIcon; badge?: string }[] }[] = [
  {
    title: 'Genel',
    items: [
      { href: '/admin', label: 'Gösterge paneli', icon: LayoutDashboard },
      { href: '/admin/analitik', label: 'Ziyaret analitiği', icon: LineChart },
      { href: '/admin/sistem', label: 'Sistem durumu', icon: Server },
    ],
  },
  {
    title: 'Casino',
    items: [
      { href: '/admin/oyunlar', label: 'Oyunlar & şanslar', icon: Gamepad2 },
      { href: '/admin/crash', label: 'Crash turları', icon: Rocket },
      { href: '/admin/islemler', label: 'Kredi işlemleri', icon: Coins },
    ],
  },
  {
    title: 'Üyeler',
    items: [
      { href: '/admin/kullanicilar', label: 'Kullanıcılar', icon: Users },
      { href: '/admin/promosyon', label: 'Promosyon kodları', icon: TicketPercent },
      { href: '/admin/bulten', label: 'Bülten aboneleri', icon: Mail },
      { href: '/admin/guvenlik', label: 'Güvenlik', icon: ShieldAlert },
    ],
  },
  {
    title: 'Destek',
    items: [
      { href: '/admin/destek', label: 'Destek talepleri', icon: LifeBuoy, badge: 'tickets_open' },
      { href: '/admin/canli-destek', label: 'Canlı destek', icon: MessagesSquare, badge: 'chat_unread' },
      { href: '/admin/hazir-yanitlar', label: 'Hazır yanıtlar', icon: Zap },
    ],
  },
  {
    title: 'İçerik',
    items: [
      { href: '/admin/reklamlar', label: 'Reklam bannerları', icon: Image },
      { href: '/admin/blog', label: 'Blog yazıları', icon: Newspaper },
      { href: '/admin/sayfalar', label: 'Özel sayfalar', icon: FileText },
      { href: '/admin/sss', label: 'SSS yönetimi', icon: HelpCircle },
      { href: '/admin/duyurular', label: 'Duyurular', icon: Megaphone },
      { href: '/admin/bildirim', label: 'Toplu bildirim', icon: BellRing },
    ],
  },
  {
    title: 'Sistem',
    items: [
      { href: '/admin/ayarlar', label: 'Site ayarları', icon: Settings },
      { href: '/admin/disa-aktar', label: 'Dışa aktar (CSV)', icon: Download },
      { href: '/admin/kayitlar', label: 'İşlem kayıtları', icon: ScrollText },
    ],
  },
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
    <aside className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1">
      <p className="mb-3 hidden items-center gap-1.5 px-3 text-xs font-bold uppercase tracking-wider text-violet-300 lg:flex"><ShieldCheck size={14} /> Yönetim</p>
      <nav className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
        {GROUPS.map((g) => (
          <div key={g.title} className="contents lg:mb-3 lg:block">
            <p className="hidden px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-slate-600 lg:block">{g.title}</p>
            {g.items.map((i) => {
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
                  <i.icon size={16} aria-hidden />
                  <span className="flex-1">{i.label}</span>
                  {n > 0 && <span className="rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">{n}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
