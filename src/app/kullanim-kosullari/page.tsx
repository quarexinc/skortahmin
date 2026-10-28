import type { Metadata } from 'next';
import Link from 'next/link';
import Prose from '@/components/Prose';

export const metadata: Metadata = { title: 'Kullanım koşulları' };

export default function Page() {
  return (
    <Prose title="Kullanım koşulları" updated="28 Ekim 2026">
      <p>BloxyBet&apos;i (“Platform”) kullanarak aşağıdaki koşulları kabul etmiş olursun.</p>
      <h2>1. Hizmetin niteliği</h2>
      <p>
        Platform, casino tarzı oyunların yalnızca <strong>sanal kredilerle</strong> oynandığı bir sosyal eğlence hizmetidir.
        Platformda gerçek parayla bahis oynanmaz; para, kripto para, oyun içi eşya veya başka herhangi bir değer yatırılamaz, kazanılamaz ve çekilemez.
      </p>
      <h2>2. Sanal krediler</h2>
      <ul>
        <li>Krediler yalnızca Platform içinde, eğlence amacıyla kullanılan sanal birimlerdir ve hiçbir parasal değeri yoktur.</li>
        <li>Krediler satın alınamaz, satılamaz, başka bir hesaba aktarılamaz, takas edilemez ve paraya veya herhangi bir ürüne, hizmete ya da değere dönüştürülemez.</li>
        <li>Kredilerin Platform dışında alınıp satılması veya ödül karşılığı devredilmesi yasaktır; tespit edilmesi hâlinde ilgili hesaplar kapatılır.</li>
        <li>Platform, oyun dengesi veya kötüye kullanım nedeniyle kredi bakiyelerini düzeltme hakkını saklı tutar. Hesap kapandığında krediler herhangi bir karşılık olmaksızın silinir.</li>
      </ul>
      <h2>3. Yaş sınırı ve üyelik</h2>
      <ul>
        <li>Platform yalnızca <strong>18 yaşını doldurmuş</strong> kişiler içindir. Kayıt sırasında doğum tarihini doğru beyan etmekle yükümlüsün.</li>
        <li>Hesap bilgilerinin doğruluğundan ve şifrenin gizliliğinden sen sorumlusun.</li>
        <li>Bir kişi yalnızca bir hesap açabilir. Bonusları çoğaltmak için çoklu hesap kullanmak yasaktır.</li>
      </ul>
      <h2>4. Oyunlar ve adil oyun</h2>
      <p>
        Oyun sonuçları <Link href="/adil-oyun">Adil oyun</Link> sayfasında açıklanan doğrulanabilir yöntemle üretilir. Teknik bir arıza veya
        açık hata durumunda ilgili el iptal edilerek bahis iade edilebilir. Otomatik araçlarla (bot, betik) oynamak yasaktır.
      </p>
      <h2>5. Davranış kuralları</h2>
      <ul>
        <li>Canlı destek, destek talepleri ve profil alanlarında hakaret, taciz ve yasa dışı içerik paylaşmak yasaktır.</li>
        <li>Platformun güvenliğini veya işleyişini bozmaya yönelik girişimler hesap kapatma ve yasal işlem sebebidir.</li>
      </ul>
      <h2>6. Sorumluluğun sınırlandırılması</h2>
      <p>Platform “olduğu gibi” sunulur. Kesintisiz veya hatasız çalışacağı garanti edilmez. Sanal kredilerin kaybından doğan herhangi bir talep kabul edilmez.</p>
      <h2>7. Değişiklikler</h2>
      <p>Bu koşullar güncellenebilir. Önemli değişiklikler site içinde duyurulur. Sorular için <Link href="/iletisim">iletişim</Link> sayfasını kullanabilirsin.</p>
    </Prose>
  );
}
