import type { Metadata } from 'next';
import Link from 'next/link';
import Prose from '@/components/Prose';

export const metadata: Metadata = { title: 'Kullanım koşulları' };

export default function Page() {
  return (
    <Prose title="Kullanım koşulları" updated="28 Ekim 2026">
      <p>Skor Çıkartıcı&apos;yı (“Platform”) kullanarak aşağıdaki koşulları kabul etmiş olursunuz.</p>
      <h2>1. Hizmetin niteliği</h2>
      <p>
        Platform, futbol maçlarına ilişkin istatistiksel analiz ve olasılık hesapları sunan bir bilgi ve eğlence hizmetidir.
        Platformda bahis oynatılmaz; sunulan bilgiler yatırım veya bahis tavsiyesi değildir.
      </p>
      <h2>2. Üyelik</h2>
      <ul>
        <li>Üye olmak için 18 yaşını doldurmuş olmanız gerekir.</li>
        <li>Hesap bilgilerinizin doğruluğundan ve şifrenizin gizliliğinden siz sorumlusunuz.</li>
        <li>Bir kişi yalnızca bir hesap açabilir; yarışmada haksız avantaj için çoklu hesap kullanmak yasaktır.</li>
      </ul>
      <h2>3. Kullanıcı içerikleri</h2>
      <p>
        Yorum ve mesajlarınızda hakaret, nefret söylemi, spam, reklam, kişisel veri paylaşımı ve yasa dışı içerik yasaktır.
        Bu kurallara aykırı içerikler kaldırılabilir, hesaplar uyarı yapılmaksızın askıya alınabilir.
      </p>
      <h2>4. Premium üyelik</h2>
      <p>
        Premium özellikler ödeme onayından sonra yönetici tarafından belirtilen süre için aktifleştirilir. İade ve iptal talepleri
        destek kanalları üzerinden değerlendirilir.
      </p>
      <h2>5. Sorumluluğun sınırlandırılması</h2>
      <p>
        Veriler üçüncü taraf bir sağlayıcıdan (API-Football) alınır; gecikme, eksiklik veya hata olabilir. Tahminlere dayanarak
        alınan kararlardan doğan zararlardan Platform sorumlu tutulamaz.
      </p>
      <h2>6. Değişiklikler</h2>
      <p>Bu koşullar güncellenebilir; güncel sürüm her zaman bu sayfada yayımlanır.</p>
      <p>
        Kişisel verilerinizin işlenmesi için <Link href="/kvkk">KVKK aydınlatma metnine</Link> ve{' '}
        <Link href="/gizlilik">gizlilik politikasına</Link> bakın.
      </p>
    </Prose>
  );
}
