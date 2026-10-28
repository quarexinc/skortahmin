// Varsayılan SSS (yönetim panelinden soru eklenmediyse gösterilir)
export interface DefaultFaq {
  category: string;
  q: string;
  a: string;
}

export const DEFAULT_FAQS: DefaultFaq[] = [
  { category: 'Genel', q: 'BloxyBet nedir?', a: 'BloxyBet, Crash, Mines, Slots, Blackjack, Dice, Limbo, Plinko, Coinflip, Keno, Rulet, Çark, Hi-Lo, Kule ve Kazı Kazan oyunlarının yalnızca sanal kredilerle oynandığı bir sosyal casino sitesidir. Gerçek para yatırılmaz, kazanılmaz ve çekilmez.' },
  { category: 'Krediler', q: 'Krediler paraya çevrilebilir mi?', a: 'Hayır. Krediler tamamen sanaldır; para, ürün, oyun içi eşya, kripto ya da başka herhangi bir değerle alınıp satılamaz, takas edilemez ve dışarı çekilemez.' },
  { category: 'Krediler', q: 'Nasıl kredi kazanırım?', a: 'Üye olduğunda hoş geldin kredisi alırsın. Ayrıca günlük bonus, musluk (birkaç dakikada bir küçük kredi), rakeback, VIP seviye ödülleri ve promosyon kodları ile kredi toplayabilirsin.' },
  { category: 'Krediler', q: 'Kasa ne işe yarar?', a: 'Kasa, kredilerinin bir kısmını oyun bakiyenden ayrı tutmanı sağlar. Kasadaki krediler oyunlarda kullanılmaz; istediğin zaman bakiyene geri aktarabilirsin.' },
  { category: 'Üyelik', q: 'Neden 18 yaş sınırı var?', a: 'Para kullanılmasa da casino tarzı oyunlar yalnızca yetişkinlere uygundur. Oynamak ve kredi talep etmek için doğum tarihini doğrulaman gerekir.' },
  { category: 'Adil oyun', q: 'Sonuçların adil olduğunu nasıl bilirim?', a: 'Her oyun sonucu sunucu tohumu, istemci tohumu ve nonce değerinden HMAC-SHA256 ile üretilir. Sunucu tohumunun hash’i oyundan önce gösterilir; tohumu değiştirdiğinde eskisi açıklanır ve sonuçları Adil oyun sayfasında kendin doğrulayabilirsin.' },
  { category: 'Oyunlar', q: 'Crash nasıl oynanır?', a: 'Tur başlamadan bahsini yaparsın. Çarpan yükselirken istediğin anda “Çık” diyerek bahsini o çarpanla alırsın; roket patlamadan çıkamazsan bahsi kaybedersin. Otomatik çıkış çarpanı da belirleyebilirsin.' },
  { category: 'Oyunlar', q: 'Mines nasıl oynanır?', a: '5×5 alanda mayın sayısını seçip kareleri açarsın. Her güvenli kare çarpanı artırır; istediğin an kazancını alabilirsin. Mayına basarsan bahsi kaybedersin.' },
  { category: 'VIP', q: 'VIP seviyeleri nasıl çalışır?', a: 'Oynadığın toplam kredi miktarına göre 13 seviye arasında ilerlersin. Her seviye daha yüksek rakeback, daha büyük günlük bonus ve tek seferlik bir seviye ödülü getirir.' },
  { category: 'Sorumlu oyun', q: 'Mola vermek istiyorum, ne yapmalıyım?', a: 'Hesabım > Sorumlu oyun sayfasından 24 saatten 1 yıla kadar mola verebilir, 24 saatlik oyun limiti koyabilir ve oturum hatırlatıcısı açabilirsin. Mola süresi kısaltılamaz.' },
  { category: 'Üyelik', q: 'Şifremi unuttum, ne yapmalıyım?', a: 'İletişim formundan kayıtlı e-posta adresinle bize yaz; kimliğini doğruladıktan sonra şifreni sıfırlarız.' },
  { category: 'Üyelik', q: 'Hesabımı nasıl silerim?', a: 'Hesabım > Profil & ayarlar > Hesabı sil adımından hesabını ve tüm verilerini kalıcı olarak silebilirsin.' },
  { category: 'Destek', q: 'Size nasıl ulaşırım?', a: 'Sağ alttaki canlı destek balonundan yazabilir, destek talebi açabilir ya da üye değilsen iletişim formunu kullanabilirsin.' },
];
