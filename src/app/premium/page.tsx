import PromoRedeem from './PromoRedeem';
import { Check, Gem, Minus } from 'lucide-react';
import type { Metadata } from 'next';
import { getUser } from '@/lib/auth';
import { getSettings } from '@/lib/settings';
import PremiumRequest from './PremiumRequest';

export const metadata: Metadata = { title: 'Premium üyelik' };
export const dynamic = 'force-dynamic';

const ROWS: [string, boolean | string, boolean | string][] = [
  ['Tüm maçlar, form, H2H, puan durumu', true, true],
  ['1X2 olasılıkları ve modelin önerdiği skor', true, true],
  ['Tahmin yarışması & liderlik tablosu', true, true],
  ['Yorumlar, favoriler, bildirimler', true, true],
  ['En olası 5 skor', false, true],
  ['KG Var/Yok olasılıkları', false, true],
  ['Alt/Üst 1.5 · 2.5 · 3.5 olasılıkları', false, true],
  ['Model girdileri ve hesap detayları', false, true],
  ['API tahmini ile karşılaştırma', false, true],
  ['Kayıtlı kupon', 'limitli', 'sınırsız'],
  ['Destek önceliği', 'normal', 'öncelikli'],
];

export default async function Page() {
  const [user, s] = await Promise.all([getUser(), getSettings()]);
  const cell = (v: boolean | string) =>
    v === true ? <Check size={18} className="mx-auto text-accent-soft" /> : v === false ? <Minus size={16} className="mx-auto text-slate-600" /> : <span className="text-slate-300">{v === 'limitli' ? `${s.freeCouponLimit} adet` : v}</span>;
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <div className="text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-400/15 text-amber-300"><Gem size={28} /></span>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Premium ile analizin tamamı</h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-400">
          Skor matrisi, KG ve Alt/Üst olasılıkları, modelin tüm girdileri ve sınırsız kupon. {s.premiumPriceText}.
        </p>
      </div>

      <div className="card mt-10 overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3 font-semibold">Özellik</th>
              <th className="w-28 px-3 py-3 text-center font-semibold">Ücretsiz</th>
              <th className="w-28 px-3 py-3 text-center font-semibold text-accent-soft">Premium</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {ROWS.map(([f, a, b]) => (
              <tr key={f}>
                <td className="px-5 py-3 text-slate-200">{f}</td>
                <td className="px-3 py-3 text-center">{cell(a)}</td>
                <td className="px-3 py-3 text-center">{cell(b)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-10 space-y-6">
        <PromoRedeem />
        <PremiumRequest priceText={s.premiumPriceText} paymentInfo={s.premiumPaymentInfo} loggedIn={!!user} isPremium={!!user?.isPremium} premiumUntil={user?.premiumUntil ?? null} />
      </div>
    </main>
  );
}
