import { Download, FileSpreadsheet } from 'lucide-react';
import { PageHeader } from '@/components/ui';

const ITEMS = [
  { type: 'users', title: 'Kullanıcılar', text: 'Ad, e-posta, rol, yaş doğrulaması, bakiye, kasa, toplam oynanan, mola, kayıt ve son giriş.' },
  { type: 'bets', title: 'Oynanan eller', text: 'Son 50.000 el: oyun, bahis, ödeme, çarpan ve adil oyun bilgileri.' },
  { type: 'transactions', title: 'Kredi işlemleri', text: 'Son 50.000 bakiye hareketi: tür, tutar, işlem sonrası bakiye.' },
  { type: 'crash', title: 'Crash turları', text: 'Tamamlanan turlar: patlama noktası, hash ve açıklanan tohum.' },
  { type: 'tickets', title: 'Destek talepleri', text: 'Konu, kategori, öncelik, durum, e-posta ve tarihler.' },
  { type: 'newsletter', title: 'Bülten aboneleri', text: 'E-posta ve kayıt tarihi.' },
];

export default function ExportPage() {
  return (
    <div>
      <PageHeader title="Dışa aktar" subtitle="Verileri Excel'de açılabilen CSV dosyası olarak indir. Her indirme işlem kayıtlarına yazılır." />
      <div className="grid gap-4 md:grid-cols-2">
        {ITEMS.map((i) => (
          <div key={i.type} className="card flex items-start gap-4 p-5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-300"><FileSpreadsheet size={22} /></span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{i.title}</p>
              <p className="mt-1 text-sm text-slate-400">{i.text}</p>
              <a href={`/api/admin/export?type=${i.type}`} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-accent px-3.5 py-2 text-sm font-semibold text-ink-950 hover:bg-accent-soft">
                <Download size={15} /> CSV indir
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
