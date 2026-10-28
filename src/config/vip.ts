// VIP seviyeleri: toplam oynanan (wager) krediye göre. Değerler kredi cinsindendir.
export interface VipLevel {
  level: number;
  name: string;
  tier: 'Bronz' | 'Gümüş' | 'Altın' | 'Platin' | 'Elmas' | 'Efsane';
  minWager: number;
  reward: number; // seviye atlayınca alınan ödül (kredi)
  rakeback: number; // oynanan miktarın yüzdesi (0.5 = %0,5)
  dailyBonus: number; // günlük bonus (kredi)
  color: string;
}

const T = {
  Bronz: '#d97706',
  Gümüş: '#94a3b8',
  Altın: '#facc15',
  Platin: '#22d3ee',
  Elmas: '#a78bfa',
  Efsane: '#f472b6',
} as const;

export const VIP_LEVELS: VipLevel[] = [
  { level: 0, name: 'Yeni', tier: 'Bronz', minWager: 0, reward: 0, rakeback: 0.25, dailyBonus: 50, color: '#64748b' },
  { level: 1, name: 'Bronz I', tier: 'Bronz', minWager: 1_000, reward: 100, rakeback: 0.5, dailyBonus: 75, color: T.Bronz },
  { level: 2, name: 'Bronz II', tier: 'Bronz', minWager: 5_000, reward: 250, rakeback: 0.5, dailyBonus: 100, color: T.Bronz },
  { level: 3, name: 'Bronz III', tier: 'Bronz', minWager: 15_000, reward: 500, rakeback: 0.6, dailyBonus: 150, color: T.Bronz },
  { level: 4, name: 'Gümüş I', tier: 'Gümüş', minWager: 40_000, reward: 1_000, rakeback: 0.75, dailyBonus: 200, color: T.Gümüş },
  { level: 5, name: 'Gümüş II', tier: 'Gümüş', minWager: 100_000, reward: 2_000, rakeback: 0.8, dailyBonus: 300, color: T.Gümüş },
  { level: 6, name: 'Gümüş III', tier: 'Gümüş', minWager: 250_000, reward: 4_000, rakeback: 0.9, dailyBonus: 400, color: T.Gümüş },
  { level: 7, name: 'Altın I', tier: 'Altın', minWager: 500_000, reward: 7_500, rakeback: 1, dailyBonus: 600, color: T.Altın },
  { level: 8, name: 'Altın II', tier: 'Altın', minWager: 1_000_000, reward: 12_500, rakeback: 1.1, dailyBonus: 800, color: T.Altın },
  { level: 9, name: 'Altın III', tier: 'Altın', minWager: 2_500_000, reward: 25_000, rakeback: 1.2, dailyBonus: 1_000, color: T.Altın },
  { level: 10, name: 'Platin', tier: 'Platin', minWager: 5_000_000, reward: 50_000, rakeback: 1.4, dailyBonus: 1_500, color: T.Platin },
  { level: 11, name: 'Elmas', tier: 'Elmas', minWager: 12_500_000, reward: 100_000, rakeback: 1.6, dailyBonus: 2_500, color: T.Elmas },
  { level: 12, name: 'Efsane', tier: 'Efsane', minWager: 30_000_000, reward: 250_000, rakeback: 2, dailyBonus: 5_000, color: T.Efsane },
];

/** wagered: kredi cinsinden */
export function vipFor(wagered: number): { current: VipLevel; next: VipLevel | null; progress: number } {
  let current = VIP_LEVELS[0];
  for (const l of VIP_LEVELS) if (wagered >= l.minWager) current = l;
  const next = VIP_LEVELS[current.level + 1] ?? null;
  const progress = next ? (wagered - current.minWager) / (next.minWager - current.minWager) : 1;
  return { current, next, progress: Math.max(0, Math.min(1, progress)) };
}
