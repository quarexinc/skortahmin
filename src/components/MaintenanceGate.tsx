'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

// Bakım modunda yöneticiler dışında herkes bakım ekranını görür; giriş sayfası açık kalır.
export default function MaintenanceGate({ active, message, children }: { active: boolean; message: string; children: ReactNode }) {
  const pathname = usePathname();
  if (!active || pathname.startsWith('/giris')) return <>{children}</>;
  return (
    <main className="mx-auto flex max-w-xl flex-1 flex-col items-center px-4 py-24 text-center">
      <span className="text-5xl">🛠️</span>
      <h1 className="mt-4 text-2xl font-black">Bakım çalışması</h1>
      <p className="mt-2 text-slate-400">{message}</p>
    </main>
  );
}
