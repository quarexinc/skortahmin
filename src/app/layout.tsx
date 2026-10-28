import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Skor Çıkartıcı — Futbol Maç Tahmin ve Analiz',
    template: '%s | Skor Çıkartıcı',
  },
  description:
    'API-Football v3 gerçek verileriyle çalışan futbol maç analizi ve Poisson tabanlı skor tahmini platformu. Form, H2H, 1X2, KG ve Alt/Üst olasılıkları.',
};

export const viewport: Viewport = {
  themeColor: '#05080f',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className="dark">
      <body className="min-h-screen bg-ink-950 font-sans text-slate-100">{children}</body>
    </html>
  );
}
