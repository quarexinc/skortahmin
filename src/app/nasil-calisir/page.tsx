import type { Metadata } from 'next';
import Link from 'next/link';
import Prose from '@/components/Prose';

export const metadata: Metadata = { title: 'Tahminler nasıl hesaplanır?' };

export default function Page() {
  return (
    <Prose title="Tahminler nasıl hesaplanır?" intro="Modelimiz, her takımın maçta atması beklenen gol sayısını (λ) üç kaynaktan hesaplar ve Poisson dağılımıyla her skorun olasılığını bulur.">
      <h2>1. Sezon gücü (ağırlık %55)</h2>
      <p>
        Ev sahibinin iç sahadaki gol ortalaması ile deplasman takımının dış sahada yediği gol ortalaması, ligin ortalamasına
        oranlanır: <code>λ_ev = (Ev atak × Deplasman savunma) / Lig ev ortalaması</code>. Deplasman için aynı hesap tersinden yapılır.
      </p>
      <h2>2. Form (ağırlık %25)</h2>
      <p>Her iki takımın son 10 bitmiş maçında attığı ve yediği gollerin maç başı ortalaması kullanılır.</p>
      <h2>3. Karşılıklı maçlar (ağırlık %20)</h2>
      <p>
        İki takımın son 10 karşılaşmasındaki gol ortalamaları. Hiç karşılaşma yoksa bu bileşenin ağırlığı sıfırlanır ve kalan
        ağırlıklar yeniden dağıtılır.
      </p>
      <h2>4. Skor matrisi</h2>
      <p>
        Her skor için <code>P(i, j) = Poisson(i; λ_ev) × Poisson(j; λ_dep)</code> hesaplanır (0–6 gol, yüksek λ&apos;da 0–8).
        1X2, KG Var/Yok ve Alt/Üst olasılıkları bu matristen toplanarak bulunur. Modelin önerdiği skor, matristeki en yüksek
        olasılıklı hücredir.
      </p>
      <h2>Modelin sınırları</h2>
      <ul>
        <li>Sakatlık, ceza, rotasyon, hava durumu ve motivasyon modele dahil değildir.</li>
        <li>Poisson modeli beraberlikleri ve çok düşük skorlu maçları sistematik olarak biraz az tahmin edebilir.</li>
        <li>Veri planı kısıtı nedeniyle bazı sezon verileri bir önceki sezona ait olabilir; bu durum arayüzde etiketlenir.</li>
      </ul>
      <p>
        Bu nedenle tahminleri kesin sonuç olarak değil, karar verirken bakılacak bir bilgi olarak kullanın.{' '}
        <Link href="/maclar">Bir maç seçip</Link> “Bu tahmin nasıl hesaplandı?” bölümünde tüm girdileri görebilirsiniz.
      </p>
    </Prose>
  );
}
