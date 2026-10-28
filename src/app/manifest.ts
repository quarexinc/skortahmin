import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BloxyBet — Sanal kredilerle sosyal casino',
    short_name: 'BloxyBet',
    description: 'Mines, Crash, Slots ve Blackjack sanal kredilerle. Gerçek para yok. 18+',
    start_url: '/',
    display: 'standalone',
    background_color: '#05080f',
    theme_color: '#05080f',
    lang: 'tr',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  };
}
