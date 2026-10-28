// Varsayılan SSS (yönetim panelinden soru eklenmediyse gösterilir)
export interface DefaultFaq {
  category: string;
  q: string;
  a: string;
}

export const DEFAULT_FAQS: DefaultFaq[] = [
  { category: 'Genel', q: 'Veriler nereden geliyor?', a: 'Tüm fikstür, istatistik, kadro ve sonuç verileri API-Football v3 servisinden çalışma anında çekilir. Veri yoksa uydurma bir değer göstermek yerine "veri şu anda mevcut değil" yazarız.' },
  { category: 'Genel', q: 'Tahminler kesin mi?', a: 'Hayır. Tahminler geçmiş verilere dayalı matematiksel olasılıklardır ve hiçbir sonucu garanti etmez. Sakatlık, kadro değişikliği ve motivasyon gibi faktörler modelde yer almaz.' },
  { category: 'Üyelik', q: 'Üyelik ücretli mi?', a: 'Hayır, üyelik ücretsizdir. Ayrıntılı olasılıklar, sınırsız kupon ve reklamsız deneyim için isteğe bağlı Premium üyelik vardır.' },
  { category: 'Tahminler', q: 'Tahmin yarışması nasıl puanlanıyor?', a: 'Maç başlamadan skor tahmini yaparsınız. Tam skoru bilirseniz 3 puan, sadece sonucu (ev / beraberlik / deplasman) bilirseniz 1 puan alırsınız. Maç bittikten sonra puanlar otomatik hesaplanır.' },
  { category: 'Genel', q: 'Hangi ligler var?', a: 'Süper Lig, Premier Lig, La Liga, Serie A, Bundesliga, Ligue 1, Şampiyonlar Ligi, Avrupa Ligi, Konferans Ligi, Eredivisie, Primeira Liga, Championship ve Suudi Pro Ligi.' },
  { category: 'Genel', q: 'Neden bazı günlerde maç görünmüyor?', a: 'Veri sağlayıcımızın planı ileri tarihli fikstürlere erişimi sınırlayabilir. Bu durumda ilgili günde bir uyarı görürsünüz; maçlar tarih yaklaştıkça görünür hale gelir.' },
  { category: 'Genel', q: 'Neden bazı istatistikler geçen sezona ait?', a: 'Veri planı kısıtı nedeniyle bazı sezon istatistikleri en son erişilebilir sezondan alınır ve arayüzde açıkça etiketlenir. Maç ve karşılıklı maç verileri her zaman günceldir.' },
  { category: 'Tahminler', q: 'Tahminler nasıl hesaplanıyor?', a: 'Sezon ortalamaları (%55), son 10 maç formu (%25) ve karşılıklı maçlar (%20) birleştirilerek her takım için beklenen gol bulunur; ardından Poisson dağılımıyla her skorun olasılığı hesaplanır. Ayrıntılar "Tahminler nasıl hesaplanır?" sayfasında.' },
  { category: 'Tahminler', q: 'Tahminimi değiştirebilir miyim?', a: 'Evet, maç başlayana kadar istediğiniz kadar değiştirebilirsiniz. Maç başladıktan sonra tahminler kilitlenir.' },
  { category: 'Tahminler', q: 'Kupon oluşturucu bahis mi oynatıyor?', a: 'Hayır. Kupon oluşturucu yalnızca seçtiğiniz tahminlerin modele göre birleşik olasılığını hesaplar. Sitemizde bahis oynanmaz, para yatırılmaz.' },
  { category: 'Tahminler', q: 'Rozetler nasıl kazanılır?', a: 'İlk tahmin, 10/50/100 tahmin, ilk tam skor, puan barajları, yorum ve kupon gibi başarılarla rozetler otomatik açılır. Hesabım > Rozetlerim sayfasından ilerlemeni görebilirsin.' },
  { category: 'Üyelik', q: "Premium'a nasıl geçerim?", a: 'Premium sayfasından talep oluşturun ya da elinizde bir promosyon kodu varsa aynı sayfadan kullanın. Ödeme onaylandıktan sonra üyeliğiniz aktifleştirilir ve size bildirim gelir.' },
  { category: 'Üyelik', q: 'Şifremi unuttum, ne yapmalıyım?', a: 'İletişim formundan kayıtlı e-posta adresinizle bize yazın; kimliğinizi doğruladıktan sonra şifrenizi sıfırlarız.' },
  { category: 'Üyelik', q: 'Hesabımı nasıl silerim?', a: 'Hesabım > Profil & ayarlar > Hesabı sil adımından hesabınızı ve tüm verilerinizi kalıcı olarak silebilirsiniz.' },
  { category: 'Destek', q: 'Size nasıl ulaşırım?', a: 'Sağ alttaki canlı destek balonundan yazabilir, destek talebi açabilir ya da üye değilseniz iletişim formunu kullanabilirsiniz.' },
  { category: 'Destek', q: 'Destek talebime ne zaman yanıt gelir?', a: 'Çalışma saatleri içinde genellikle aynı gün yanıt veriyoruz. Yanıt geldiğinde bildirim alırsınız.' },
];
