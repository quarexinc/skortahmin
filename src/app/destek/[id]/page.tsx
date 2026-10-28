import TicketThread from '@/components/TicketThread';
import { pageUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: { id: string } }) {
  await pageUser(`/destek/${params.id}`);
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <TicketThread id={Number(params.id)} />
    </main>
  );
}
