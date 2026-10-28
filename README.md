# BloxyBet

Sanal kredilerle oynanan sosyal casino: **14 oyun: Crash, Mines, Slots, Blackjack, Dice, Limbo, Plinko, Coinflip, Keno, Rulet, Çark, Hi-Lo, Kule, Kazı Kazan**.
Gerçek para, kripto veya herhangi bir değerli şey yatırılmaz, kazanılmaz, çekilmez. Krediler satın alınamaz ve paraya çevrilemez. **18+**

## Çalıştırma

```bash
npm install
npm run dev   # http://localhost:3000
```

`.env.example` dosyasını `.env.local` olarak kopyalayıp doldurun. Veritabanı şeması ilk istekte otomatik oluşturulur ve yönetici hesabı `ADMIN_EMAIL` / `ADMIN_PASSWORD` ile açılır.

## Teknoloji

- Next.js 14 (App Router) + TypeScript, Tailwind CSS, lucide-react ikonları
- Postgres (`pg`), Vercel üzerinde Neon
- Oturum: imzalı JWT (HS256), httpOnly çerez; bcrypt şifre özeti

## Oyunlar

| Oyun | Kural | Ev avantajı / RTP |
| --- | --- | --- |
| Crash | Tur başlamadan bahis, çarpan `e^(0.00006·ms)` ile büyür, patlamadan önce çık. Otomatik çıkış desteklenir. | %1 (RTP %99) |
| Mines | 5×5 alan, 1–24 mayın. Çarpan `0,99 × Π (25−i)/(25−m−i)` | %1 |
| Slots | 5 makara × 3 satır, 10 çizgi, joker ve dağınık | RTP ≈ %96,1 (3M çevirme simülasyonu) |
| Blackjack | 6 deste, krupiye S17, blackjack 3:2, double, bir split | ≈ %0,5 |

Crash sunucusuzdur: turlar istekler geldikçe `pg_advisory_xact_lock` altında ilerler, otomatik çıkışlar tembel olarak hesaplanır.

### Adil oyun

`HMAC_SHA256(sunucuTohumu, "istemciTohumu:nonce:imleç")` çıktısının her 4 baytı bir [0,1) sayısına çevrilir. Sunucu tohumunun SHA-256 hash'i önceden gösterilir; tohum değiştirildiğinde eski tohum açıklanır. `/adil-oyun` sayfası tarayıcıda (Web Crypto) doğrulama yapar. Crash'te her turun kendi tohumu vardır.

## Sanal kredi ekonomisi

- Krediler veritabanında 1/100 birim (BIGINT) olarak tutulur.
- Her bakiye değişikliği `transactions` defterine işlem sonrası bakiyeyle yazılır; bakiye `SELECT … FOR UPDATE` kilidi ve negatif bakiye korumasıyla güncellenir.
- Kaynaklar: hoş geldin kredisi, günlük bonus (VIP'e göre), musluk (bakiye 1 kredinin altındayken), rakeback, 13 VIP seviyesi ödülü, promosyon kodları, yönetici düzeltmesi.
- Kasa: krediler oyun bakiyesinden ayrılıp kilitlenebilir.

## Sorumlu oyun

Kayıtta ve oyundan önce doğum tarihiyle 18+ doğrulaması, ilk ziyarette 18+ kapısı, mola (kısaltılamaz), 24 saatlik oyun limiti (artırmak için 24 saat bekleme), oturum hatırlatıcısı.

## Sayfalar

`/` açılış · `/oyunlar` lobi · `/oyunlar/{crash,mines,slots,blackjack}` · `/cuzdan` · `/vip` · `/adil-oyun` · `/liderlik` · `/hesap` (genel bakış, oyun geçmişi, kredi işlemleri, rozetler, bildirimler, sorumlu oyun, profil) · `/uye/[id]` · `/destek` · `/blog` · `/sss` · yasal sayfalar.

## Yönetim paneli (`/admin`)

Gösterge paneli (hacim, kasa sonucu, dağıtılan bonus, dolaşımdaki kredi), oyun istatistikleri ve gerçekleşen RTP, tüm eller, Crash turları ve dağılımı, kredi işlem defteri, kullanıcılar (kredi düzeltmesi, yaş doğrulaması sıfırlama, askı, rol), promosyon kodları, oyun ve ekonomi ayarları, destek talepleri, canlı destek, reklamlar, blog, sayfalar, SSS, duyurular, toplu bildirim, bülten, güvenlik, CSV dışa aktarma, işlem kayıtları, sistem durumu.
