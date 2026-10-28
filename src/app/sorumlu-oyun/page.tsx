import type { Metadata } from 'next';
import Prose from '@/components/Prose';

export const metadata: Metadata = { title: 'Sorumlu oyun' };

export default function Page() {
  return (
    <Prose title="Sorumlu oyun" updated="28 Ekim 2026" intro="Skor Çıkartıcı bir analiz ve eğlence platformudur. Sitemizde bahis oynatılmaz, para yatırılmaz veya ödül dağıtılmaz.">
      <h2>Tahminler garanti değildir</h2>
      <p>
        Sunduğumuz tüm olasılıklar geçmiş verilere dayalı matematiksel hesaplardır. Futbolda sürpriz her zaman mümkündür; hiçbir
        model sonucu garanti edemez. Tahminlerimizi kazanç beklentisiyle para riske atmak için kullanmayın.
      </p>
      <h2>18 yaş sınırı</h2>
      <p>Üyelik ve tahmin yarışması yalnızca 18 yaşını doldurmuş kişilere açıktır.</p>
      <h2>Kendinizi kontrol edin</h2>
      <ul>
        <li>Kaybettiğiniz parayı geri kazanmak için daha fazla oynuyor musunuz?</li>
        <li>Bahis yüzünden işinizi, okulunuzu veya ilişkilerinizi ihmal ediyor musunuz?</li>
        <li>Bahis oynamadığınızda huzursuz veya gergin hissediyor musunuz?</li>
        <li>Bahis için borç aldınız ya da bir şey sattınız mı?</li>
      </ul>
      <p>Bu sorulardan birine “evet” cevabı veriyorsanız profesyonel destek almanızı öneririz.</p>
      <h2>Yardım alabileceğiniz yerler</h2>
      <ul>
        <li>Yeşilay Danışmanlık Merkezi (YEDAM) – <strong>115</strong> numaralı Yeşilay Danışmanlık Hattı (ücretsiz)</li>
        <li>Aile hekiminiz veya en yakın sağlık kuruluşunun psikiyatri birimi</li>
      </ul>
    </Prose>
  );
}
