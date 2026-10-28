import type { Metadata } from 'next';
import Link from 'next/link';
import Prose from '@/components/Prose';

export const metadata: Metadata = { title: 'Gizlilik politikası' };

export default function Page() {
  return (
    <Prose title="Gizlilik politikası" updated="28 Ekim 2026">
      <h2>Topladığımız bilgiler</h2>
      <ul>
        <li><strong>Hesap bilgileri:</strong> ad soyad, e-posta, şifrenizin geri döndürülemez özeti (şifrenin kendisi saklanmaz), isteğe bağlı tutulan takım ve biyografi.</li>
        <li><strong>Kullanım verileri:</strong> tahminleriniz, kuponlarınız, favorileriniz, yorumlarınız, destek talepleri ve canlı destek mesajlarınız.</li>
        <li><strong>Güvenlik kayıtları:</strong> giriş denemeleri ve IP adresi (kötüye kullanımı önlemek için).</li>
      </ul>
      <h2>Çerezler ve yerel depolama</h2>
      <p>
        Oturumunuzu açık tutmak için yalnızca zorunlu bir oturum çerezi kullanırız. Kupon taslağınız ve kapattığınız duyurular
        tarayıcınızın yerel depolamasında tutulur. Reklam veya üçüncü taraf takip çerezi kullanmayız.
      </p>
      <h2>Bilgilerinizi nasıl kullanırız?</h2>
      <p>Hizmeti sunmak, hesabınızı korumak, destek taleplerinizi yanıtlamak ve yarışma puanlarını hesaplamak için.</p>
      <h2>Paylaşım</h2>
      <p>Kişisel verilerinizi satmayız. Veriler yalnızca barındırma ve veritabanı hizmet sağlayıcılarımızda saklanır.</p>
      <h2>Haklarınız</h2>
      <p>
        Hesap ayarlarından bilgilerinizi güncelleyebilir veya hesabınızı tüm verileriyle silebilirsiniz. Diğer talepleriniz için{' '}
        <Link href="/iletisim">bize ulaşın</Link>. Ayrıntılar için <Link href="/kvkk">KVKK aydınlatma metni</Link>.
      </p>
    </Prose>
  );
}
