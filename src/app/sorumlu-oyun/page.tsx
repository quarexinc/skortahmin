import type { Metadata } from 'next';
import Link from 'next/link';
import Prose from '@/components/Prose';

export const metadata: Metadata = { title: 'Sorumlu oyun' };

export default function Page() {
  return (
    <Prose title="Sorumlu oyun" intro="BloxyBet’te gerçek para kullanılmaz; yine de casino tarzı oyunlar alışkanlık yapabilir. Oyunun eğlence olarak kalması için buradayız.">
      <h2>Yalnızca 18 yaş ve üzeri</h2>
      <p>
        Site ve tüm oyunlar 18 yaşını doldurmuş kişiler içindir. Oynamak ve kredi talep etmek için doğum tarihini doğrulaman gerekir.
        Ebeveynsen, çocukların cihazlarında içerik filtreleme araçlarını kullanmanı öneririz.
      </p>
      <h2>Elindeki araçlar</h2>
      <ul>
        <li><strong>Mola (kendini dışlama):</strong> 24 saatten 1 yıla kadar oyunlara erişimini kapat. Mola kısaltılamaz.</li>
        <li><strong>24 saatlik oyun limiti:</strong> Son 24 saatte oynayabileceğin toplam krediyi sınırla. Limiti artırmak için 24 saat beklemen gerekir.</li>
        <li><strong>Oturum hatırlatıcısı:</strong> Seçtiğin aralıklarla ne kadar süredir oynadığını hatırlatan uyarı.</li>
        <li><strong>Kasa:</strong> Kredilerinin bir kısmını oyun bakiyenden ayırarak kendine sınır koy.</li>
        <li><strong>Şeffaf geçmiş:</strong> Oynadığın her el ve her kredi hareketi hesabında kayıtlı.</li>
      </ul>
      <p>Tüm bu ayarlara <Link href="/hesap/sorumlu-oyun">Hesabım &gt; Sorumlu oyun</Link> sayfasından ulaşabilirsin.</p>
      <h2>Uyarı işaretleri</h2>
      <ul>
        <li>Planladığından çok daha uzun süre oynamak</li>
        <li>Kaybettiğin kredileri geri kazanmak için oynamaya devam etmek</li>
        <li>Oyunun uyku, okul, iş veya ilişkilerini etkilemesi</li>
        <li>Oynayamadığında huzursuz veya gergin hissetmek</li>
      </ul>
      <p>
        Bu işaretlerden birini fark edersen ara ver ve güvendiğin biriyle konuş. Sanal kredilerle başlayan alışkanlıkların gerçek parayla
        oynanan oyunlara taşınabileceğini unutma. Destek almak istersen bir sağlık profesyoneline başvurabilir veya <Link href="/destek">destek ekibimize</Link> yazabilirsin.
      </p>
      <h2>Gerçek para yok</h2>
      <p>
        BloxyBet&apos;te para, kripto veya herhangi bir değerli şey yatırılamaz ve çekilemez. Kredilerini satın almayı veya satmayı teklif eden
        biriyle karşılaşırsan bu bir dolandırıcılık girişimidir; lütfen bize bildir.
      </p>
    </Prose>
  );
}
