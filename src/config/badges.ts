// Rozet tanımları (sunucu hesaplar, istemci ikonlarla gösterir)
import { Award, Bomb, Bookmark, Cherry, Coins, Crown, Flame, Footprints, Gem, HandCoins, MessageSquare, Rocket, Shield, Spade, Sparkles, Star, Target, Trophy, Vault, Zap, type LucideIcon } from 'lucide-react';

export interface BadgeStats {
  bets: number;
  wins: number;
  /** kredi */
  wagered: number;
  bestMult: number;
  biggestWin: number;
  games: number;
  mines: number;
  crash: number;
  slots: number;
  blackjack: number;
  bj21: number;
  vip: number;
  dailyClaims: number;
  tickets: number;
  days: number;
  rank: number | null;
}

export interface BadgeDef {
  key: string;
  name: string;
  desc: string;
  icon: LucideIcon;
  color: string;
  /** ilerleme: [mevcut, hedef] */
  progress: (s: BadgeStats) => [number, number];
}

const p = (v: number, t: number): [number, number] => [Math.min(Math.floor(v), t), t];

export const BADGES: BadgeDef[] = [
  { key: 'first', name: 'İlk adım', desc: 'İlk elini oyna', icon: Footprints, color: '#4ade80', progress: (s) => p(s.bets, 1) },
  { key: 'bets100', name: 'Isınma turu', desc: '100 el oyna', icon: Zap, color: '#38bdf8', progress: (s) => p(s.bets, 100) },
  { key: 'bets1000', name: 'Masanın demirbaşı', desc: '1.000 el oyna', icon: Flame, color: '#f97316', progress: (s) => p(s.bets, 1000) },
  { key: 'wins50', name: 'Kazanma alışkanlığı', desc: '50 el kazan', icon: Target, color: '#22c55e', progress: (s) => p(s.wins, 50) },
  { key: 'allgames', name: 'Kaşif', desc: 'Dört oyunun hepsini dene', icon: Sparkles, color: '#e879f9', progress: (s) => p(s.games, 4) },
  { key: 'mines', name: 'İstihkamcı', desc: "Mines'ta 50 el oyna", icon: Bomb, color: '#f43f5e', progress: (s) => p(s.mines, 50) },
  { key: 'crash', name: 'Pilot', desc: "Crash'te 50 tur oyna", icon: Rocket, color: '#f472b6', progress: (s) => p(s.crash, 50) },
  { key: 'slots', name: 'Makara ustası', desc: "Slots'ta 100 çevirme yap", icon: Cherry, color: '#fb7185', progress: (s) => p(s.slots, 100) },
  { key: 'blackjack', name: 'Kart sayıcı', desc: "Blackjack'te 50 el oyna", icon: Spade, color: '#94a3b8', progress: (s) => p(s.blackjack, 50) },
  { key: 'bj', name: 'Doğal 21', desc: 'Bir blackjack yakala', icon: Star, color: '#fde047', progress: (s) => p(s.bj21, 1) },
  { key: 'x10', name: 'On kat', desc: '10x veya üzeri çarpan yakala', icon: Gem, color: '#22d3ee', progress: (s) => [s.bestMult >= 10 ? 1 : 0, 1] },
  { key: 'x100', name: 'Yüz kat', desc: '100x veya üzeri çarpan yakala', icon: Trophy, color: '#f59e0b', progress: (s) => [s.bestMult >= 100 ? 1 : 0, 1] },
  { key: 'bigwin', name: 'Büyük vurgun', desc: 'Tek elde 10.000 kredi kazan', icon: HandCoins, color: '#fbbf24', progress: (s) => p(s.biggestWin, 10_000) },
  { key: 'wager100k', name: 'Yüksek hacim', desc: 'Toplam 100.000 kredi oyna', icon: Coins, color: '#a78bfa', progress: (s) => p(s.wagered, 100_000) },
  { key: 'vip4', name: 'Gümüş kulüp', desc: 'Gümüş I VIP seviyesine ulaş', icon: Crown, color: '#cbd5e1', progress: (s) => p(s.vip, 4) },
  { key: 'vip7', name: 'Altın kulüp', desc: 'Altın I VIP seviyesine ulaş', icon: Crown, color: '#fbbf24', progress: (s) => p(s.vip, 7) },
  { key: 'daily7', name: 'Sadık oyuncu', desc: '7 kez günlük bonus al', icon: Vault, color: '#2dd4bf', progress: (s) => p(s.dailyClaims, 7) },
  { key: 'top10', name: 'Zirvede', desc: 'Liderlikte ilk 10’a gir (toplam oynanan)', icon: Trophy, color: '#fcd34d', progress: (s) => [s.rank != null && s.rank <= 10 && s.wagered > 0 ? 1 : 0, 1] },
  { key: 'ticket', name: 'Geri bildirimci', desc: 'İlk destek talebini aç', icon: MessageSquare, color: '#60a5fa', progress: (s) => p(s.tickets, 1) },
  { key: 'veteran', name: 'Kıdemli üye', desc: '30 gündür üyesin', icon: Shield, color: '#94a3b8', progress: (s) => p(s.days, 30) },
  { key: 'collector', name: 'Koleksiyoncu', desc: '10 rozet kazan', icon: Bookmark, color: '#4ade80', progress: () => [0, 1] },
  { key: 'all', name: 'Şampiyon', desc: 'Diğer tüm rozetleri kazan', icon: Award, color: '#fef08a', progress: () => [0, 1] },
];

export interface EarnedBadge {
  key: string;
  earned: boolean;
  current: number;
  target: number;
}

export function computeBadges(s: BadgeStats): EarnedBadge[] {
  const base = BADGES.filter((b) => b.key !== 'collector' && b.key !== 'all').map((b) => {
    const [c, t] = b.progress(s);
    return { key: b.key, earned: c >= t, current: c, target: t };
  });
  const n = base.filter((b) => b.earned).length;
  base.push({ key: 'collector', earned: n >= 10, current: Math.min(n, 10), target: 10 });
  const others = base.filter((b) => b.earned).length;
  base.push({ key: 'all', earned: others === base.length, current: others, target: base.length });
  return base;
}

export const badgeDef = (key: string) => BADGES.find((b) => b.key === key);
