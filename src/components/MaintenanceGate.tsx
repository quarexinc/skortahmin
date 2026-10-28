'use client';
import { Wrench } from 'lucide-react';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

// Bakım modunda yöneticiler dışında herkes bakım ekranını görür; giriş sayfası açık kalır.
export default function MaintenanceGate({ active, message, children }: { active: boolean; message: string; children: ReactNode }) {
  const pathname = usePathname();
  if (!active || pathname.startsWith('/giris')) return <>{children}</>;
  return (
    <main className="mx-auto flex max-w-xl flex-1 flex-col items-center px-4 py-24 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-amber-400/15 text-amber-300"><Wrench size={30} /></span>
      <h1 className="mt-4 text-2xl font-black">Bakım çalışması</h1>
      <p className="mt-2 text-slate-400">{message}</p>
    </main>
  );
}
