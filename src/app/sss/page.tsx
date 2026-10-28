import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Sıkça sorulan sorular' };

const GROUPS: { title: string; items: { q: string; a: React.ReactNode }[] }[] = [
  {
    title: 'Genel',
    items: [
      { q: 'Skor Çıkartıcı nedir?', a: 'Gerçek maç verileriyle çalışan bir futbol analiz platformudur. Her maç için istatistiksel bir model (Poisson) ile skor olasılıkları hesaplar; form, karşılıklı maçlar ve puan durumunu tek ekranda sunar.' },
      { q: 'Veriler nereden geliyor?', a: 'Tüm fikstür, istatistik, kadro ve sonuç verileri API-Football v3 servisinden çalışma anında çekilir. Veri yoksa uydurma bir değer göstermek yerine "veri şu anda mevcut değil" yazarız.' },
      { q: 'Hangi ligler var?', a: 'Süper Lig, Premier Lig, La Liga, Serie A, Bundesliga, Ligue 1, Şampiyonlar Ligi, Avrupa Ligi, Konferans Ligi, Eredivisie, Primeira Liga, Championship ve Suudi Pro Ligi.' },
      { q: 'Neden bazı günlerde maç görünmüyor?', a: 'Veri sağlayıcımızın planı ileri tarihli fikstürlere erişimi sınırlayabilir. Bu durumda ilgili günde bir uyarı görürsünüz; maçlar tarih yaklaştıkça görünür hale gelir.' },
      { q: 'Neden bazı istatistikler geçen sezona ait?', a: 'Veri planı kısıtı nedeniyle bazı sezon istatistikleri (puan durumu, kadro, sezon ortalamaları) en son erişilebilir sezondan alınır ve arayüzde açıkça etiketlenir. Maç ve H2H verileri her zaman günceldir.' },
    ],
  },
  {
    title: 'Tahminler',
    items: [
      { q: 'Tahminler nasıl hesaplanıyor?', a: <>Sezon ortalamaları (%55), son 10 maç formu (%25) ve karşılıklı maçlar (%20) birleştirilerek her takım için beklenen gol (λ) bulunur; ardından Poisson dağılımıyla her skorun olasılığı hesaplanır. Ayrıntılar için <Link href="/nasil-calisir">hesaplama yöntemi</Link> sayfasına bakın.</> },
      { q: 'Tahminler kesin mi?', a: 'Hayır. Tahminler geçmiş verilere dayalı matematiksel olasılıklardır ve hiçbir sonucu garanti etmez. Sakatlık, kadro değişikliği, motivasyon gibi faktörler modelde yer almaz.' },
      { q: 'Tahmin yarışması nasıl puanlanıyor?', a: 'Maç başlamadan önce skor tahmini yaparsınız. Tam skoru bilirseniz 3 puan, sadece sonucu (ev / beraberlik / deplasman) bilirseniz 1 puan alırsınız. Maç bittikten sonra puanlar otomatik hesaplanır.' },
      { q: 'Tahminimi değiştirebilir miyim?', a: 'Evet, maç başlayana kadar istediğiniz kadar değiştirebilirsiniz. Maç başladıktan sonra tahminler kilitlenir.' },
      { q: 'Kupon oluşturucu bahis mi oynatıyor?', a: 'Hayır. Kupon oluşturucu yalnızca seçtiğiniz tahminlerin modele göre birleşik olasılığını hesaplar. Sitemizde bahis oynanmaz, para yatırılmaz.' },
    ],
  },
  {
    title: 'Üyelik & Premium',
    items: [
      { q: 'Üyelik ücretli mi?', a: 'Hayır, üyelik ücretsizdir. Ücretsiz üyeler tüm maçları, 1X2 olasılıklarını, form/H2H analizini, tahmin yarışmasını ve canlı desteği kullanabilir.' },
      { q: 'Premium neler sunar?', a: 'En olası 5 skor, KG Var/Yok, Alt/Üst 1.5–2.5–3.5 olasılıkları, modelin tüm girdileri, API tahmini karşılaştırması, sınırsız kayıtlı kupon ve öncelikli destek.' },
      { q: 'Premium\'a nasıl geçerim?', a: <><Link href="/premium">Premium sayfasından</Link> talep oluşturun. Ekibimiz ödeme bilgilerini size iletir; ödeme onaylandıktan sonra üyeliğiniz aktifleştirilir ve size bildirim gelir.</> },
      { q: 'Şifremi unuttum, ne yapmalıyım?', a: <><Link href="/iletisim?konu=sifre">İletişim formundan</Link> kayıtlı e-posta adresinizle bize yazın; kimliğinizi doğruladıktan sonra şifrenizi sıfırlarız.</> },
      { q: 'Hesabımı nasıl silerim?', a: 'Hesabım → Profil & ayarlar → Hesabı sil adımından hesabınızı ve tüm verilerinizi kalıcı olarak silebilirsiniz.' },
    ],
  },
  {
    title: 'Destek',
    items: [
      { q: 'Size nasıl ulaşırım?', a: <>Sağ alttaki canlı destek balonundan yazabilir, <Link href="/destek/yeni">destek talebi</Link> açabilir ya da üye değilseniz <Link href="/iletisim">iletişim formunu</Link> kullanabilirsiniz.</> },
      { q: 'Destek talebime ne zaman yanıt gelir?', a: 'Çalışma saatleri içinde genellikle aynı gün yanıt veriyoruz. Yanıt geldiğinde bildirim alırsınız.' },
    ],
  },
];

export default function Page() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-black tracking-tight">Sıkça sorulan sorular</h1>
      <p className="mt-2 text-slate-400">Aradığını bulamadın mı? <Link href="/destek/yeni" className="text-accent-soft underline">Destek talebi aç</Link>.</p>
      {GROUPS.map((g) => (
        <section key={g.title} className="mt-10">
          <h2 className="label-muted mb-3">{g.title}</h2>
          <div className="space-y-2.5">
            {g.items.map((f) => (
              <details key={f.q} className="card group p-5">
                <summary className="cursor-pointer list-none font-semibold">
                  <span className="flex items-center justify-between gap-3">
                    {f.q}
                    <span className="text-slate-500 transition group-open:rotate-45">＋</span>
                  </span>
                </summary>
                <div className="prose-skor mt-3 text-sm leading-relaxed text-slate-400">{f.a}</div>
              </details>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
