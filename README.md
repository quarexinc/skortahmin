# ⚽ Skor Çıkartıcı

Gerçek verilerle çalışan futbol maç tahmin ve analiz platformu. **Tek veri kaynağı: API-Football v3** —
uygulamadaki her sayı (fikstür, form, H2H, istatistik, gol krallığı) çalışma anında API'den çekilir.
Mock/placeholder veri **yoktur**; veri yoksa "Veri şu anda mevcut değil" gösterilir.

## Çalıştırma

```bash
npm install
npm run dev
# → http://localhost:3000
```

API anahtarı `.env.local` içindedir (`API_FOOTBALL_KEY`). İsteğe bağlı olarak kendi anahtarınızı
oraya yazabilirsiniz.

## Teknoloji

- Next.js 14 (App Router) + TypeScript, Tailwind CSS (koyu tema, mobil öncelikli)
- Backend: Next.js API Route Handler'ları (`src/app/api/...`). Frontend asla dış API'ye doğrudan gitmez.
- Tüm tarih/saat `Europe/Istanbul` (TSİ) ve `tr-TR` biçimindedir.

## Sayfalar

| Yol | Açıklama |
| --- | --- |
| `/` | Bugünden itibaren **10 günün** maçları: tarih şeridi, lig filtresi (13 lig), takım araması, maç kartları |
| `/mac/[fixtureId]` | Maç analizi: **Genel Özet & Tahmin**, **Form & Kariyer**, **Karşılıklı Maçlar (H2H)**, **Oyuncular** |

## API (backend)

| Endpoint | Görev |
| --- | --- |
| `GET /api/fixtures?date=YYYY-MM-DD` | Günün maçları (yalnızca config'deki 13 lig, cache'li) |
| `GET /api/match/[fixtureId]/analysis` | Tek yanıtta: maç, takım istatistikleri, son maçlar, H2H, puan durumu, oyuncular, API tahmini **+ Poisson model çıktısı** |
| `GET /api/teams/[teamId]?league=&season=` | Takım künyesi + sezon istatistiği |

## Tahmin motoru (`src/lib/prediction.ts`)

Poisson tabanlı; girdilerin tamamı API'den gelen gerçek istatistiklerdir:

1. **Sezon (ağırlık %55):** `λ_home = (AFH × DAA) / μ_home`, `λ_away = (AFA × DAH) / μ_away`
   - AFH/DAH = ev sahibinin ev ortalamaları, AFA/DAA = deplasmanın deplasman ortalamaları
     (`/teams/statistics` → `goals.for.average.home` vb.)
   - μ_home/μ_away = lig ortalamaları (`/standings` içindeki ev/depl gol verilerinden)
2. **Form (ağırlık %25):** son 10 bitmiş maçtan maç başı atılan/yenilen gollerle simetrik saldırı/savunma λ'ları
3. **H2H (ağırlık %20):** son 10 bitmiş H2H maçından aynı simetrik formül; **veri yoksa ağırlık 0'a çekilir**
   ve kalan ağırlıklar normalize edilir.
4. Skor matrisi: `P(i,j) = Poisson(i; λ_home) × Poisson(j; λ_away)`, i,j = 0…6 (λ > 4 ise 0…8);
   matris toplamı 1'e normalize edilir. 1X2, KG Var/Yok, Alt/Üst 1.5–2.5–3.5 ve en olası 5 skor
   bu matristen türetilir. Modelin önerdiği skor = matristeki en yüksek olasılıklı (i,j).

Model hesabı **yalnızca sunucu tarafında** (`/api/match/.../analysis`) yapılır; frontend sadece gösterir.
"Bu tahmin nasıl hesaplandı?" açılır bölümü tüm girdileri, ağırlıkları ve formülü şeffaf biçimde listeler.
API'nin kendi `/predictions` çıktısı var ise yan yana karşılaştırma tablosu olarak gösterilir
(ücretsiz planda sınırlı/bozuk gelirse "API tahmini bu planda mevcut değil" kutusu görünür).

## Cache & kotalar (`src/lib/cache.ts`, `src/lib/apiFootball.ts`)

| Veri | TTL |
| --- | --- |
| Fikstür (tarih), maç detayı, API tahmini | 60 dk |
| Takım istatistikleri, H2H, takım künyesi, oyuncular | 24 saat |
| Son maçlar (form), puan durumu | 6 saat |
| Kupalar | 7 gün |

- İstek kuyruğu: iki API isteği arası ≥ 250 ms (dakikada ~10 limitine karşı).
- Günlük istek sayacı `console.log` ile izlenir; 95'e yaklaşınca yeni upstream isteği açılmaz,
  yalnızca cache'ten servis edilir.
- İlk açılışta ana sayfa ~10 istek (10 gün × 1) harcar; ikinci ziyarette 0.

## Ücretsiz plan notları (canlı doğrulanmıştır)

- Canlı fikstür, maç detayı, H2H (tam geçmiş), `/predictions` ve `/teams?id=` **çalışır**.
- `last` parametresi ücretsiz planda kapalıdır → form/H2H, sezon fikstür listelerinden ve tam H2H
  geçmişinden **sunucu tarafında** son 10 bitmiş maçla üretilir.
- Fikstür erişimi de sınırlıdır (canlı doğrulandı: `2026-08-26 → 2026-08-28` aralığı). Erişilemeyen
  tarihler için ilgili gün kartında Türkçe plan kısıtı uyarısı ("Bu tarih aralığına ücretsiz plandan
  erişilemiyor…") gösterilir; uydurma veri asla gösterilmez.
- Dakikada ~10 istek limiti, **kayan 1-dakika penceresi** (≤9 istek/dk) + 429'da 30 sn backoff ile
  korunur. Bu yüzden soğuk cache'te bir maç analizi ~1 dakika sürebilir; sonraki ziyaretlerde
  (TTL'ler dolana kadar) yanıt ~50 ms'te, 0 API isteğiyle gelir.
- Sezon bazlı veriler (istatistik, puan durumu, kadro, gol krallığı) ücretsiz planda **yalnızca
  2022–2024** sezonları için erişilebilir. Mevcut sezon (örn. 2026) için bu bölümler en yakın
  erişilebilir sezonun son gerçek verileriyle doldurulur ve arayüzde **açıkça etiketlenir**;
  H2H ve maç verisi her zaman günceldir.
- `/trophies` takım parametresi kabul etmediği için kupa vitrini, takımdan öncelikli oyuncunun
  `?player=` vitrininden gösterilir; veri yoksa ilgili boş durum mesajı görünür.

## Uyarı

Tahminler gerçek istatistiklerden hesaplanan matematiksel olasılıklardır; **garanti sonuç değildir**.
