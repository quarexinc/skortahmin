'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '@/lib/client';

export interface ClientUser {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'admin';
  isAdmin: boolean;
  vipLevel: number;
  favoriteGame: string | null;
  bio: string | null;
  avatarColor: string;
  createdAt: string;
  balance: number;
  vault: number;
  wagered: number;
  birthDate: string | null;
  ageVerified: boolean;
  selfExcludedUntil: string | null;
}

/** Herkese açık oyun ayarları (kasa payları dahil) — sunucu bileşeni olan layout'tan gelir. */
export interface SiteInfo {
  edges: Record<string, number>;
  disabledGames: string[];
  blackjackPayout: number;
}

interface Ctx {
  user: ClientUser | null;
  /** ilk oturum sorgusu tamamlandı mı (statik sayfalarda kullanıcı istemcide yüklenir) */
  ready: boolean;
  site: SiteInfo;
  enabled: boolean;
  unread: { notifications: number; chat: number };
  refresh: () => Promise<void>;
  setUser: (u: ClientUser | null) => void;
  /** oyun yanıtlarından gelen yeni bakiyeyi anında yansıt (kuruş) */
  setBalance: (units: number) => void;
  toast: (msg: string, kind?: 'success' | 'error' | 'info') => void;
}

const AuthCtx = createContext<Ctx | null>(null);

export function useAuth(): Ctx {
  const c = useContext(AuthCtx);
  if (!c) throw new Error('AuthProvider eksik');
  return c;
}

interface Toast {
  id: number;
  msg: string;
  kind: 'success' | 'error' | 'info';
}

export default function AuthProvider({
  enabled,
  site,
  children,
}: {
  enabled: boolean;
  site: SiteInfo;
  children: ReactNode;
}) {
  const [user, setUser] = useState<ClientUser | null>(null);
  const [ready, setReady] = useState(!enabled);
  const [unread, setUnread] = useState({ notifications: 0, chat: 0 });
  const [toasts, setToasts] = useState<Toast[]>([]);

  const refresh = useCallback(async () => {
    const { data } = await api<{ user: ClientUser | null; unread?: { notifications: number; chat: number } }>(
      '/api/auth/me',
    );
    setReady(true);
    if (!data) return;
    setUser(data.user);
    setUnread(data.unread ?? { notifications: 0, chat: 0 });
  }, []);

  useEffect(() => {
    if (!enabled) return;
    refresh();
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, 30_000);
    return () => clearInterval(t);
  }, [enabled, refresh]);

  const setBalance = useCallback((units: number) => setUser((u) => (u ? { ...u, balance: units } : u)), []);

  const toast = useCallback((msg: string, kind: Toast['kind'] = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  return (
    <AuthCtx.Provider value={{ user, ready, site, enabled, unread, refresh, setUser, toast, setBalance }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-16 z-[60] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto animate-fade-in rounded-xl border px-4 py-2.5 text-sm font-medium shadow-xl shadow-black/40 ${
              t.kind === 'error'
                ? 'border-red-500/40 bg-red-950 text-red-100'
                : t.kind === 'info'
                  ? 'border-sky-500/40 bg-sky-950 text-sky-100'
                  : 'border-accent/40 bg-ink-800 text-accent-soft'
            }`}
          >
            {t.msg}
          </div>
        ))}
      </div>
    </AuthCtx.Provider>
  );
}
