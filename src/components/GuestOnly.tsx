'use client';

import type { ReactNode } from 'react';
import { useAuth } from '@/components/AuthProvider';

/** Yalnızca oturumu olmayan ziyaretçilere gösterilir (sayfalar statik üretildiği için oturum istemcide okunur). */
export default function GuestOnly({ children }: { children: ReactNode }) {
  const { user, ready, enabled } = useAuth();
  if (!enabled || !ready || user) return null;
  return <>{children}</>;
}
