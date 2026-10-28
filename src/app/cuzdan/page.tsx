import type { Metadata } from 'next';
import AdSlot from '@/components/AdSlot';
import { pageUser } from '@/lib/auth';
import Wallet from './Wallet';

export const metadata: Metadata = { title: 'Cüzdan' };
export const dynamic = 'force-dynamic';

export default async function Page() {
  await pageUser('/cuzdan');
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Wallet />
      <AdSlot placement="matches_inline" className="mt-8" />
    </main>
  );
}
