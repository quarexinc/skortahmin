import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import AuthForm from '@/components/AuthForm';
import { getUser } from '@/lib/auth';

export const metadata: Metadata = { title: 'Giriş yap' };
export const dynamic = 'force-dynamic';

export default async function Page() {
  if (await getUser()) redirect('/hesap');
  return (
    <main className="mx-auto max-w-md px-4 py-14">
      <div className="mb-8 text-center">
        <span className="text-4xl">⚽</span>
        <h1 className="mt-3 text-2xl font-black">Hesabına giriş yap</h1>
      </div>
      <div className="card p-6">
        <Suspense>
          <AuthForm mode="login" />
        </Suspense>
      </div>
      <p className="mt-6 text-center text-sm text-slate-400">
        Hesabın yok mu? <Link href="/kayit" className="font-semibold text-accent-soft hover:underline">Ücretsiz üye ol</Link>
      </p>
    </main>
  );
}
