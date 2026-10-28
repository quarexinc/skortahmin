import { Bomb, Cherry, Rocket, Spade, type LucideIcon } from 'lucide-react';

export const GAME_META: Record<'mines' | 'crash' | 'slots' | 'blackjack', { name: string; icon: LucideIcon; color: string; href: string; desc: string; edge: string }> = {
  crash: { name: 'Crash', icon: Rocket, color: '#f472b6', href: '/oyunlar/crash', desc: 'Çarpan yükselirken patlamadan önce çık. Herkes aynı turda oynar.', edge: 'RTP %99' },
  mines: { name: 'Mines', icon: Bomb, color: '#22c55e', href: '/oyunlar/mines', desc: '5×5 alanda mayınlardan kaçın; her güvenli karede çarpan büyür.', edge: 'RTP %99' },
  slots: { name: 'Slots', icon: Cherry, color: '#f59e0b', href: '/oyunlar/slots', desc: '5 makara, 10 ödeme çizgisi, joker ve dağınık semboller.', edge: 'RTP ~%96' },
  blackjack: { name: 'Blackjack', icon: Spade, color: '#38bdf8', href: '/oyunlar/blackjack', desc: 'Krupiyeye karşı 21. Double, split ve 3:2 blackjack.', edge: 'RTP ~%99,5' },
};
