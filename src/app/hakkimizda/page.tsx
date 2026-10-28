import type { Metadata } from 'next';
import Link from 'next/link';
import Prose from '@/components/Prose';

export const metadata: Metadata = { title: 'Hakkımızda' };

export default function Page() {
  return (
    <Prose title="Hakkımızda" intro="BloxyBet, casino tarzı oyunları gerçek para riski olmadan, sanal kredilerle oynamak isteyen yetişkinler için kuruldu.">
      <h2>Ne yapıyoruz?</h2>
      <p>
        14 oyunu (Crash, Mines, Slots, Blackjack, Plinko, Rulet, Dice ve daha fazlası) tek bir sanal kredi cüzdanıyla sunuyoruz. Krediler üyelikte, günlük bonuslarla,
        rakeback ve VIP ödülleriyle kazanılır; hiçbir zaman satın alınmaz, satılmaz ya da paraya çevrilmez.
      </p>
      <h2>İlkelerimiz</h2>
      <ul>
        <li><strong>Gerçek para yok:</strong> Para, kripto, oyun içi eşya veya herhangi bir değerli şey yatırılamaz, kazanılamaz, çekilemez.</li>
        <li><strong>Doğrulanabilir adalet:</strong> Her sonuç önceden taahhüt edilen tohumlarla üretilir ve <Link href="/adil-oyun">Adil oyun</Link> sayfasında kendin doğrulayabilirsin.</li>
        <li><strong>Şeffaf oranlar:</strong> Her oyunun ev avantajı ve teorik geri dönüş oranı açıkça yazılıdır.</li>
        <li><strong>Yetişkinler için:</strong> Site 18 yaş ve üzeri içindir; yaş doğrulaması olmadan oyun oynanamaz.</li>
        <li><strong>Sorumlu oyun:</strong> Mola, 24 saatlik limit ve oturum hatırlatıcısı her üyenin elinde. <Link href="/sorumlu-oyun">Ayrıntılar</Link>.</li>
      </ul>
      <h2>Bize ulaşın</h2>
      <p>
        Öneri, hata bildirimi veya iş birliği için <Link href="/iletisim">iletişim sayfasını</Link> kullanabilir ya da üyeysen
        canlı destekten yazabilirsin.
      </p>
    </Prose>
  );
}
