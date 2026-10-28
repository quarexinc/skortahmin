'use client';
import { ArrowRight, Bell, Coins, Crown, Gamepad2, HeartHandshake, History, Home, LayoutDashboard, LifeBuoy, LogOut, Menu, Newspaper, Settings, ShieldCheck, Trophy, UserRound, Wallet, X } from 'lucide-react';
import { Logo } from './Logo';
import SearchTrigger from './CommandPalette';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { api, timeAgo } from '@/lib/client';
import { fmtCredits } from '@/lib/money';
import { useAuth } from './AuthProvider';
import { Avatar } from './ui';

const LINKS = [
  { href: '/oyunlar', label: 'Oyunlar', icon: Gamepad2 },
  { href: '/liderlik', label: 'Liderlik', icon: Trophy },
  { href: '/vip', label: 'VIP', icon: Crown },
  { href: '/adil-oyun', label: 'Adil oyun', icon: ShieldCheck },
  { href: '/blog', label: 'Blog', icon: Newspaper },
  { href: '/destek', label: 'Destek', icon: LifeBuoy },
];

interface Notif {
  id: number;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

function useOutside(ref: React.RefObject<HTMLElement>, cb: () => void) {
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [ref, cb]);
}

function NotificationBell() {
  const { unread, refresh } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[] | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useOutside(ref, () => setOpen(false));

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      const { data } = await api<{ items: Notif[] }>('/api/notifications');
      setItems(data?.items ?? []);
    }
  };
  const markAll = async () => {
    await api('/api/notifications', { method: 'PATCH', body: { all: true } });
    setItems((x) => x?.map((n) => ({ ...n, read: true })) ?? null);
    refresh();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        aria-label="Bildirimler"
        className="relative grid h-9 w-9 place-items-center rounded-xl text-slate-300 transition hover:bg-white/5 hover:text-white"
      >
        <Bell size={18} />
        {unread.notifications > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread.notifications > 9 ? '9+' : unread.notifications}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] animate-fade-in overflow-hidden rounded-2xl border border-white/10 bg-ink-800 shadow-2xl shadow-black/50">
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
            <span className="text-sm font-semibold">Bildirimler</span>
            <button onClick={markAll} className="text-xs text-accent-soft hover:underline">
              Tümünü okundu say
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items == null ? (
              <p className="px-4 py-6 text-center text-sm text-slate-500">Yükleniyor…</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-500">Henüz bildirimin yok.</p>
            ) : (
              items.map((n) => (
                <Link
                  key={n.id}
                  href={n.link ?? '/hesap/bildirimler'}
                  onClick={() => {
                    setOpen(false);
                    if (!n.read) api('/api/notifications', { method: 'PATCH', body: { id: n.id } }).then(refresh);
                  }}
                  className={`block border-b border-white/5 px-4 py-3 transition hover:bg-white/5 ${n.read ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-100">{n.title}</p>
                      {n.body && <p className="mt-0.5 line-clamp-2 text-xs text-slate-400">{n.body}</p>}
                      <p className="mt-1 text-[11px] text-slate-500">{timeAgo(n.created_at)}</p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
          <Link href="/hesap/bildirimler" onClick={() => setOpen(false)} className="block px-4 py-2.5 text-center text-xs text-slate-400 hover:text-white">
            Tüm bildirimler <ArrowRight size={12} className="inline" />
          </Link>
        </div>
      )}
    </div>
  );
}

function BalancePill() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <Link
      href="/cuzdan"
      className="flex h-9 min-w-0 items-center gap-2 rounded-xl border border-violet-400/30 bg-violet-500/10 pl-2.5 pr-1 text-sm font-bold tabular-nums text-white transition hover:border-violet-400/60 max-sm:gap-1.5 max-sm:pr-2.5"
      title="Cüzdan"
    >
      <Coins size={16} className="text-amber-300" />
      <span className="max-w-[7rem] truncate max-sm:max-w-[4.6rem] max-sm:text-xs">{fmtCredits(user.balance)}</span>
      <span className="grid h-7 w-7 max-sm:hidden place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 text-white">
        <Wallet size={14} />
      </span>
    </Link>
  );
}

function UserMenu() {
  const { user, setUser, toast } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutside(ref, () => setOpen(false));
  if (!user) return null;

  const logout = async () => {
    await api('/api/auth/logout', { method: 'POST', body: {} });
    setUser(null);
    setOpen(false);
    toast('Çıkış yapıldı.', 'info');
    router.push('/');
    router.refresh();
  };

  const items = [
    { href: '/hesap', label: 'Hesabım', icon: Home },
    { href: `/uye/${user.id}`, label: 'Profilim', icon: UserRound },
    { href: '/cuzdan', label: 'Cüzdan', icon: Wallet },
    { href: '/hesap/oyun-gecmisi', label: 'Oyun geçmişi', icon: History },
    { href: '/hesap/sorumlu-oyun', label: 'Sorumlu oyun', icon: HeartHandshake },
    { href: '/destek', label: 'Destek talepleri', icon: LifeBuoy },
    { href: '/hesap/profil', label: 'Profil & ayarlar', icon: Settings },
  ];

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-xl py-1 pl-1 pr-2 transition hover:bg-white/5 max-sm:pr-1" aria-label="Kullanıcı menüsü">
        <Avatar name={user.name} color={user.avatarColor} size={30} />
        <span className="hidden max-w-[8rem] truncate text-sm font-medium text-slate-200 lg:block">{user.name}</span>

      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-60 animate-fade-in overflow-hidden rounded-2xl border border-white/10 bg-ink-800 py-1 shadow-2xl shadow-black/50">
          <div className="border-b border-white/5 px-4 py-3">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
            <p className="mt-1 text-xs">
              {user.isAdmin ? (
                <span className="inline-flex items-center gap-1 text-violet-300"><ShieldCheck size={13} /> Yönetici</span>
              ) : (
                <Link href="/vip" onClick={() => setOpen(false)} className="inline-flex items-center gap-1 text-amber-300 hover:underline">
                  <Crown size={13} /> VIP seviyeni gör
                </Link>
              )}
            </p>
          </div>
          {user.isAdmin && (
            <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm font-semibold text-violet-300 hover:bg-white/5">
              <LayoutDashboard size={16} /> Yönetim paneli
            </Link>
          )}
          {items.map((i) => (
            <Link key={i.href} href={i.href} onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
              <i.icon size={16} className="text-slate-500" /> {i.label}
            </Link>
          ))}
          <button onClick={logout} className="flex w-full items-center gap-2.5 border-t border-white/5 px-4 py-2 text-left text-sm text-red-300 hover:bg-white/5">
            <LogOut size={16} /> Çıkış yap
          </button>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { user, enabled, ready } = useAuth();
  const pathname = usePathname();
  const [mobile, setMobile] = useState(false);
  useEffect(() => setMobile(false), [pathname]);

  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-ink-950/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 max-sm:gap-2 max-sm:px-3">
        <Link href="/" className="shrink-0" aria-label="BloxyBet ana sayfa">
          <Logo size={30} />
        </Link>

        <nav className="ml-4 hidden items-center gap-0.5 lg:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`relative rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                active(l.href) ? 'bg-white/5 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex min-w-0 items-center gap-1.5 max-sm:gap-1">
          <SearchTrigger />
          {user ? (
            <>
              <BalancePill />
              <NotificationBell />
              <UserMenu />
            </>
          ) : enabled && ready ? (
            <>
              <Link href="/giris" className="hidden rounded-xl px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white sm:block">
                Giriş yap
              </Link>
              <Link href="/kayit" className="rounded-xl bg-accent px-3.5 py-1.5 text-sm font-semibold text-ink-950 transition hover:bg-accent-soft">
                Üye ol
              </Link>
            </>
          ) : null}
          <button
            onClick={() => setMobile((m) => !m)}
            aria-label="Menü"
            className="grid h-9 w-9 place-items-center rounded-xl text-slate-300 hover:bg-white/5 lg:hidden"
          >
            {mobile ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobile && (
        <nav className="animate-fade-in border-t border-white/5 px-4 py-3 lg:hidden">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${active(l.href) ? 'bg-white/5 text-white' : 'text-slate-300'}`}>
              <l.icon size={17} className="text-slate-500" /> {l.label}
            </Link>
          ))}
          {!user && enabled && ready && (
            <Link href="/giris" className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300">
              Giriş yap
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
