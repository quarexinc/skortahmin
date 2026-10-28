// Rozet tanımları (sunucu hesaplar, istemci ikonlarla gösterir)
import { Award, Bookmark, Crown, Crosshair, Eye, Flame, Footprints, Gem, Heart, Medal, MessageSquare, Mic, Receipt, Rocket, Shield, Sparkles, Star, Target, Trophy, Zap, type LucideIcon } from 'lucide-react';

export interface BadgeStats {
  predictions: number;
  exact: number;
  correct: number;
  points: number;
  comments: number;
  coupons: number;
  favorites: number;
  premium: boolean;
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

const p = (v: number, t: number): [number, number] => [Math.min(v, t), t];

export const BADGES: BadgeDef[] = [
  { key: 'first', name: 'İlk adım', desc: 'İlk skor tahminini yap', icon: Footprints, color: '#4ade80', progress: (s) => p(s.predictions, 1) },
  { key: 'pred10', name: 'Isınma turu', desc: '10 tahmin yap', icon: Zap, color: '#38bdf8', progress: (s) => p(s.predictions, 10) },
  { key: 'pred50', name: 'Düzenli tahminci', desc: '50 tahmin yap', icon: Flame, color: '#f97316', progress: (s) => p(s.predictions, 50) },
  { key: 'pred100', name: 'Tahmin makinesi', desc: '100 tahmin yap', icon: Rocket, color: '#a78bfa', progress: (s) => p(s.predictions, 100) },
  { key: 'correct10', name: 'Doğru yolda', desc: '10 maçın sonucunu bil', icon: Target, color: '#22c55e', progress: (s) => p(s.correct, 10) },
  { key: 'exact1', name: 'Nokta atışı', desc: 'İlk tam skorunu bil', icon: Crosshair, color: '#facc15', progress: (s) => p(s.exact, 1) },
  { key: 'exact5', name: 'Keskin nişancı', desc: '5 tam skor bil', icon: Eye, color: '#fb923c', progress: (s) => p(s.exact, 5) },
  { key: 'exact20', name: 'Kahin', desc: '20 tam skor bil', icon: Sparkles, color: '#e879f9', progress: (s) => p(s.exact, 20) },
  { key: 'pts10', name: 'Puan avcısı', desc: '10 puana ulaş', icon: Star, color: '#fde047', progress: (s) => p(s.points, 10) },
  { key: 'pts50', name: 'Yükselen yıldız', desc: '50 puana ulaş', icon: Medal, color: '#fbbf24', progress: (s) => p(s.points, 50) },
  { key: 'pts200', name: 'Efsane', desc: '200 puana ulaş', icon: Trophy, color: '#f59e0b', progress: (s) => p(s.points, 200) },
  { key: 'top10', name: 'Zirvede', desc: 'Genel sıralamada ilk 10’a gir', icon: Crown, color: '#fcd34d', progress: (s) => [s.rank != null && s.rank <= 10 && s.points > 0 ? 1 : 0, 1] },
  { key: 'comment1', name: 'Söz sende', desc: 'İlk yorumunu yaz', icon: MessageSquare, color: '#60a5fa', progress: (s) => p(s.comments, 1) },
  { key: 'comment25', name: 'Tribün sesi', desc: '25 yorum yaz', icon: Mic, color: '#818cf8', progress: (s) => p(s.comments, 25) },
  { key: 'coupon1', name: 'Kupon ustası', desc: 'İlk kuponunu kaydet', icon: Receipt, color: '#2dd4bf', progress: (s) => p(s.coupons, 1) },
  { key: 'fav5', name: 'Sadık taraftar', desc: '5 favori ekle', icon: Heart, color: '#f472b6', progress: (s) => p(s.favorites, 5) },
  { key: 'veteran', name: 'Kıdemli üye', desc: '30 gündür üyesin', icon: Shield, color: '#94a3b8', progress: (s) => p(s.days, 30) },
  { key: 'premium', name: 'Premium', desc: 'Premium üye ol', icon: Gem, color: '#fbbf24', progress: (s) => [s.premium ? 1 : 0, 1] },
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
