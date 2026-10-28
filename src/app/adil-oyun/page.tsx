import { Binary, Eye, Hash, KeyRound, RefreshCw } from 'lucide-react';
import type { Metadata } from 'next';
import AdSlot from '@/components/AdSlot';
import { getUser } from '@/lib/auth';
import FairTools from './FairTools';

export const metadata: Metadata = { title: 'Adil oyun', description: 'BloxyBet sonuçlarının nasıl üretildiğini ve kendin nasıl doğrulayacağını öğren.' };
export const dynamic = 'force-dynamic';

const STEPS = [
  { i: KeyRound, t: 'Sunucu tohumu', d: 'Her oyuncu için gizli, rastgele 64 karakterlik bir sunucu tohumu üretilir. Oynamadan önce yalnızca SHA-256 hash’i gösterilir.' },
  { i: Binary, t: 'İstemci tohumu', d: 'Sonuca senin de katkın olur: istemci tohumunu istediğin zaman kendin belirleyebilirsin.' },
  { i: Hash, t: 'Nonce', d: 'Her oyunda 1 artan sayaç. Aynı tohum çiftiyle her el farklı ama önceden belirlenmiş bir sonuç verir.' },
  { i: RefreshCw, t: 'Tohum değişimi', d: 'Tohumu değiştirdiğinde eski sunucu tohumu açıklanır. Hash’ini ve geçmiş ellerini aşağıdaki araçla doğrulayabilirsin.' },
];

export default async function FairPage() {
  const user = await getUser();
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <p className="label-muted">Adil oyun</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Her sonucu kendin doğrula</h1>
      <p className="mt-3 max-w-2xl text-slate-400">
        Mines, Slots, Blackjack, Dice, Limbo, Plinko, Coinflip, Keno, Rulet, Çark, Hi-Lo, Kule ve Kazı Kazan sonuçları <code>HMAC_SHA256(sunucuTohumu, istemciTohumu:nonce:imleç)</code> çıktısından üretilen sayılarla belirlenir.
        Crash’te her tur kendi tohumuna sahiptir; turun hash’i bahisler açılmadan önce gösterilir ve tur bitince tohum açıklanır.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s) => (
          <div key={s.t} className="card p-5">
            <s.i size={22} className="text-violet-300" />
            <p className="mt-3 font-bold">{s.t}</p>
            <p className="mt-1 text-sm text-slate-400">{s.d}</p>
          </div>
        ))}
      </div>

      <FairTools loggedIn={!!user} />

      <section className="card mt-8 p-6 text-sm leading-relaxed text-slate-300">
        <h2 className="flex items-center gap-2 text-lg font-black text-white"><Eye size={18} className="text-violet-300" /> Sayılar nasıl kullanılır?</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>HMAC çıktısının her 4 baytı 0 ile 1 arasında bir sayıya çevrilir: <code>b0/256 + b1/256² + b2/256³ + b3/256⁴</code>. 32 baytlık çıktı 8 sayı verir; daha fazlası gerekiyorsa imleç 1 artırılır.</li>
          <li><b>Mines:</b> 25 sayı ile 0–24 arası kareler Fisher–Yates yöntemiyle karılır; ilk N kare mayındır. Çarpan: <code>0,99 × Π (25−i)/(25−N−i)</code>.</li>
          <li><b>Slots:</b> 15 sayı, 5 makara × 3 satır için ağırlıklı sembol seçer. Teorik geri dönüş oranı yaklaşık %96.</li>
          <li><b>Blackjack:</b> 312 kartlık (6 deste) ayakkabı 312 sayı ile karılır; kartlar sırayla dağıtılır.</li>
          <li><b>Crash:</b> <code>r = HMAC_SHA256(turTohumu, &quot;crash&quot;)</code> çıktısının ilk 52 biti / 2⁵²; patlama noktası <code>⌊99 / (1 − r)⌋ / 100</code> (en az 1,00x).</li>
        </ul>
      </section>
      <AdSlot placement="match_bottom" className="mt-8" />
    </main>
  );
}
