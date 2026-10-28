import type { Metadata } from 'next';
import Link from 'next/link';
import Prose from '@/components/Prose';

export const metadata: Metadata = { title: 'Hakkımızda' };

export default function Page() {
  return (
    <Prose title="Hakkımızda" intro="Skor Çıkartıcı, futbolu sezgi yerine veriyle okumak isteyenler için kuruldu.">
      <h2>Ne yapıyoruz?</h2>
      <p>
        Her maç için gerçek istatistikleri toplayıp şeffaf bir matematiksel modelden geçiriyoruz. Sonuçta bir “kesin skor”
        değil, olasılıklar sunuyoruz: hangi skorun ne kadar olası olduğunu, modelin bu sonuca hangi verilerle ulaştığını
        açıkça gösteriyoruz.
      </p>
      <h2>İlkelerimiz</h2>
      <ul>
        <li><strong>Gerçek veri:</strong> Tüm sayılar API-Football&apos;dan çalışma anında gelir. Veri yoksa uydurmayız, “mevcut değil” deriz.</li>
        <li><strong>Şeffaflık:</strong> Modelin formülü, ağırlıkları ve girdileri her maç sayfasında açıktır.</li>
        <li><strong>Sorumluluk:</strong> Tahminler garanti değildir; sitemizde bahis oynatılmaz. <Link href="/sorumlu-oyun">Sorumlu oyun</Link> ilkelerimizi okuyun.</li>
        <li><strong>Topluluk:</strong> Tahmin yarışması, yorumlar ve liderlik tablosuyla analizi birlikte yapıyoruz.</li>
      </ul>
      <h2>Bize ulaşın</h2>
      <p>
        Öneri, hata bildirimi veya iş birliği için <Link href="/iletisim">iletişim sayfasını</Link> kullanabilir ya da üyeyseniz
        canlı destekten yazabilirsiniz.
      </p>
    </Prose>
  );
}
