import TicketThread from '@/components/TicketThread';

export default function Page({ params }: { params: { id: string } }) {
  return <div className="max-w-3xl"><TicketThread id={Number(params.id)} staff /></div>;
}
