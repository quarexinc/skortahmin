import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { pageUser } from '@/lib/auth';
import AdminNav from './AdminNav';

export const metadata: Metadata = { title: 'Yönetim paneli', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const u = await pageUser('/admin');
  if (!u.isAdmin) notFound();
  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[220px_1fr]">
      <AdminNav />
      <div className="min-w-0">{children}</div>
    </main>
  );
}
