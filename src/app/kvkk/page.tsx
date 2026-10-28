import type { Metadata } from 'next';
import Link from 'next/link';
import Prose from '@/components/Prose';

export const metadata: Metadata = { title: 'KVKK aydınlatma metni' };

export default function Page() {
  return (
    <Prose title="KVKK aydınlatma metni" updated="28 Ekim 2026">
      <p>
        6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca, Skor Çıkartıcı olarak veri sorumlusu sıfatıyla kişisel
        verilerinizi aşağıda açıklanan kapsamda işliyoruz.
      </p>
      <h2>İşlenen veriler</h2>
      <p>Kimlik (ad soyad), iletişim (e-posta), müşteri işlem (tahmin, kupon, destek kayıtları) ve işlem güvenliği (IP, giriş kayıtları) verileri.</p>
      <h2>İşleme amaçları</h2>
      <ul>
        <li>Üyelik işlemlerinin yürütülmesi ve hizmetin sunulması,</li>
        <li>Destek taleplerinin ve iletişim başvurularının yanıtlanması,</li>
        <li>Bilgi güvenliğinin sağlanması ve kötüye kullanımın önlenmesi,</li>
        <li>Hukuki yükümlülüklerin yerine getirilmesi.</li>
      </ul>
      <h2>Hukuki sebep ve toplama yöntemi</h2>
      <p>
        Verileriniz, üyelik formu ve platform kullanımı sırasında elektronik ortamda; KVKK m.5/2-c (sözleşmenin ifası), m.5/2-ç
        (hukuki yükümlülük) ve m.5/2-f (meşru menfaat) hukuki sebeplerine dayanılarak toplanır.
      </p>
      <h2>Aktarım</h2>
      <p>Verileriniz yalnızca barındırma ve veritabanı hizmeti aldığımız tedarikçilere, hizmetin gerektirdiği ölçüde aktarılır.</p>
      <h2>Haklarınız (KVKK m.11)</h2>
      <p>
        Verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, düzeltilmesini veya silinmesini isteme, itiraz etme ve
        zararın giderilmesini talep etme haklarına sahipsiniz. Başvurularınızı <Link href="/iletisim">iletişim formu</Link> üzerinden
        iletebilirsiniz.
      </p>
    </Prose>
  );
}
