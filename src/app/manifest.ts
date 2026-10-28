import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Skor Çıkartıcı — Futbol Maç Tahmin ve Analiz',
    short_name: 'Skor Çıkartıcı',
    description: 'Gerçek verilerle futbol maç analizi, skor olasılıkları ve tahmin yarışması.',
    start_url: '/',
    display: 'standalone',
    background_color: '#05080f',
    theme_color: '#05080f',
    lang: 'tr',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  };
}
