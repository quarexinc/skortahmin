import AccountNav from './AccountNav';
import { pageUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function Layout({ children }: { children: React.ReactNode }) {
  await pageUser('/hesap');
  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[220px_1fr]">
      <AccountNav />
      <div className="min-w-0">{children}</div>
    </main>
  );
}
