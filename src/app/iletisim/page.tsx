import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { getSettings } from '@/lib/settings';
import ContactForm from './ContactForm';

export const metadata: Metadata = { title: 'İletişim' };
export const dynamic = 'force-dynamic';

export default async function Page() {
  const s = await getSettings();
  return (
    <main className="mx-auto grid max-w-5xl gap-8 px-4 py-12 lg:grid-cols-[1fr_300px]">
      <div>
        <h1 className="text-3xl font-black tracking-tight">İletişim</h1>
        <p className="mt-2 text-slate-400">Soru, öneri veya hata bildirimi için formu doldur; ekibimiz en kısa sürede dönüş yapsın.</p>
        <div className="card mt-6 p-6">
          <Suspense>
            <ContactForm />
          </Suspense>
        </div>
      </div>
      <aside className="space-y-4">
        <div className="card p-5">
          <p className="font-semibold">💬 Canlı destek</p>
          <p className="mt-1 text-sm text-slate-400">Üyeysen sağ alttaki balondan anında yazabilirsin.</p>
          <p className="mt-2 text-xs text-slate-500">{s.supportHours}</p>
        </div>
        <div className="card p-5">
          <p className="font-semibold">🎫 Destek talepleri</p>
          <p className="mt-1 text-sm text-slate-400">Taleplerini ve yanıtları tek yerden takip et.</p>
          <Link href="/destek" className="mt-2 inline-block text-sm text-accent-soft hover:underline">Taleplerim →</Link>
        </div>
        <div className="card p-5">
          <p className="font-semibold">❓ SSS</p>
          <p className="mt-1 text-sm text-slate-400">Sık sorulan soruların yanıtları.</p>
          <Link href="/sss" className="mt-2 inline-block text-sm text-accent-soft hover:underline">SSS&apos;ye git →</Link>
        </div>
      </aside>
    </main>
  );
}
