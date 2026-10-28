// Oyun kayıt defteri: istemci ve sunucu ortak kullanır (saf TypeScript, sunucuya özel içe aktarma yok).
export const GAME_KEYS = [
  'crash', 'mines', 'slots', 'blackjack',
  'dice', 'limbo', 'plinko', 'coinflip', 'keno', 'roulette', 'wheel', 'hilo', 'towers', 'scratch',
] as const;
export type GameKey = (typeof GAME_KEYS)[number];

export type GameKind = 'live' | 'session' | 'instant';

export interface GameInfo {
  name: string;
  desc: string;
  color: string;
  kind: GameKind;
  /** varsayılan kasa payı (%) */
  edge: number;
  /** admin kasa payı ayarı uygulanabilir mi */
  tunable: boolean;
}

export const GAME_INFO: Record<GameKey, GameInfo> = {
  crash: { name: 'Crash', desc: 'Çarpan yükselirken patlamadan önce çık. Herkes aynı turda oynar.', color: '#f472b6', kind: 'live', edge: 1, tunable: true },
  mines: { name: 'Mines', desc: '5×5 alanda mayınlardan kaçın; her güvenli karede çarpan büyür.', color: '#22c55e', kind: 'session', edge: 1, tunable: true },
  slots: { name: 'Slots', desc: '5 makara, 10 ödeme çizgisi, joker ve dağınık semboller.', color: '#f59e0b', kind: 'instant', edge: 3.9, tunable: true },
  blackjack: { name: 'Blackjack', desc: 'Krupiyeye karşı 21. Double, split ve blackjack ödemesi.', color: '#38bdf8', kind: 'session', edge: 0.5, tunable: false },
  dice: { name: 'Dice', desc: 'Hedefi seç, üstü ya da altı de. Şansı sen belirlersin.', color: '#a78bfa', kind: 'instant', edge: 1, tunable: true },
  limbo: { name: 'Limbo', desc: 'Hedef çarpanı yaz; sonuç hedefi geçerse kazanırsın.', color: '#fb7185', kind: 'instant', edge: 1, tunable: true },
  plinko: { name: 'Plinko', desc: 'Topu bırak, çivilerden sekip çarpan kutusuna düşsün.', color: '#2dd4bf', kind: 'instant', edge: 1, tunable: true },
  coinflip: { name: 'Coinflip', desc: 'Yazı mı tura mı? Üst üste seri atarak çarpanı katla.', color: '#fbbf24', kind: 'instant', edge: 1, tunable: true },
  keno: { name: 'Keno', desc: '40 sayıdan 1–10 tanesini seç, 10 sayı çekilir.', color: '#60a5fa', kind: 'instant', edge: 5, tunable: true },
  roulette: { name: 'Rulet', desc: 'Avrupa ruleti: sayı, renk, düzine ve daha fazlası.', color: '#ef4444', kind: 'instant', edge: 2.7, tunable: true },
  wheel: { name: 'Çark', desc: 'Çarkı çevir, düştüğü dilimin çarpanını kazan.', color: '#e879f9', kind: 'instant', edge: 2, tunable: true },
  hilo: { name: 'Hi-Lo', desc: 'Sıradaki kart büyük mü küçük mü? Seriyi büyüt, istediğinde çık.', color: '#34d399', kind: 'session', edge: 1, tunable: true },
  towers: { name: 'Kule', desc: 'Kuleyi kat kat tırman, her katta güvenli kareyi bul.', color: '#f97316', kind: 'session', edge: 1, tunable: true },
  scratch: { name: 'Kazı Kazan', desc: '9 kutuyu kazı, aynı sembolden 3 tane bulursan kazanırsın.', color: '#c084fc', kind: 'instant', edge: 4, tunable: true },
};

export const isGame = (v: unknown): v is GameKey => typeof v === 'string' && (GAME_KEYS as readonly string[]).includes(v);

export const href = (g: GameKey) => `/oyunlar/${g}`;

/** Kasa payı sınırları (yüzde) */
export const EDGE_MIN = 0;
export const EDGE_MAX = 25;

export const DEFAULT_EDGES: Record<string, number> = Object.fromEntries(GAME_KEYS.map((k) => [k, GAME_INFO[k].edge]));

/** Ayarlardan kasa payı (kesir, ör. 0,01) */
export function edgeFraction(edges: Record<string, number> | undefined, g: GameKey): number {
  const v = edges?.[g];
  const pct = typeof v === 'number' && Number.isFinite(v) ? v : GAME_INFO[g].edge;
  return Math.max(EDGE_MIN, Math.min(EDGE_MAX, pct)) / 100;
}

export const rtpLabel = (edgePct: number) => `RTP %${(100 - edgePct).toFixed(1).replace(/\.0$/, '').replace('.', ',')}`;
