// Tek atışlık oyunlar: dice, limbo, plinko, coinflip, keno, roulette, wheel, scratch.
// Tüm sonuçlar sunucu tohumundan türetilen [0,1) sayılarla üretilir; bu dosya istemcide doğrulayıcıyla paylaşılır.
import { choose, fitTable, floor2, floor4, GameError, tableRtp } from './common';

export const INSTANT_GAMES = ['dice', 'limbo', 'plinko', 'coinflip', 'keno', 'roulette', 'wheel', 'scratch'] as const;
export type InstantGame = (typeof INSTANT_GAMES)[number];

/* ------------------------------ Dice ------------------------------ */
export interface DiceP { target: number; dir: 'under' | 'over' }
export function diceChance(p: DiceP): number {
  const t = Math.round(p.target * 100);
  return p.dir === 'under' ? t / 10000 : (9999 - t) / 10000;
}
export function diceMult(p: DiceP, edge: number): number {
  return floor4((1 - edge) / diceChance(p));
}
function parseDice(raw: Record<string, unknown>): DiceP {
  const target = Number(raw.target);
  const dir = raw.dir === 'over' ? 'over' : raw.dir === 'under' ? 'under' : null;
  if (!dir || !Number.isFinite(target) || target < 1 || target > 98) throw new GameError('Hedef 1 ile 98 arasında olmalı.');
  return { target: Math.round(target * 100) / 100, dir };
}

/* ------------------------------ Limbo ------------------------------ */
export const LIMBO_MAX = 1000;
export function limboPoint(f: number, edge: number): number {
  return Math.min(LIMBO_MAX, Math.max(1, Math.floor((100 * (1 - edge)) / (1 - f)) / 100));
}
function parseLimbo(raw: Record<string, unknown>) {
  const target = Number(raw.target);
  if (!Number.isFinite(target) || target < 1.01 || target > LIMBO_MAX) throw new GameError(`Hedef çarpan 1,01 ile ${LIMBO_MAX} arasında olmalı.`);
  return { target: Math.round(target * 100) / 100 };
}

/* ------------------------------ Plinko ------------------------------ */
export const PLINKO_RISKS = ['low', 'medium', 'high'] as const;
export type PlinkoRisk = (typeof PLINKO_RISKS)[number];
const PLINKO_SHAPE: Record<PlinkoRisk, { base: number; pow: number; cap: number }> = {
  low: { base: 0.9, pow: 3, cap: 30 },
  medium: { base: 0.04, pow: 5, cap: 300 },
  high: { base: 0.0004, pow: 12, cap: 1000 },
};
const cache = new Map<string, number[]>();
export function plinkoProbs(rows: number): number[] {
  const t = 2 ** rows;
  return Array.from({ length: rows + 1 }, (_, k) => choose(rows, k) / t);
}
export function plinkoTable(rows: number, risk: PlinkoRisk, edge: number): number[] {
  const key = `p${rows}${risk}${edge}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const { base, pow, cap } = PLINKO_SHAPE[risk];
  const shape = Array.from({ length: rows + 1 }, (_, k) => base + Math.pow(Math.abs(k - rows / 2) / (rows / 2), pow));
  const out = fitTable(plinkoProbs(rows), shape, 1 - edge, cap);
  cache.set(key, out);
  return out;
}
function parsePlinko(raw: Record<string, unknown>) {
  const rows = Number(raw.rows);
  const risk = PLINKO_RISKS.find((r) => r === raw.risk);
  if (!Number.isInteger(rows) || rows < 8 || rows > 16 || !risk) throw new GameError('Satır sayısı 8–16, risk düşük/orta/yüksek olmalı.');
  return { rows, risk };
}

/* ------------------------------ Coinflip ------------------------------ */
export function coinflipMult(flips: number, edge: number) {
  return floor4((1 - edge) * 2 ** flips);
}
function parseCoin(raw: Record<string, unknown>) {
  const flips = Number(raw.flips);
  const side = raw.side === 'heads' ? 'heads' : raw.side === 'tails' ? 'tails' : null;
  if (!side || !Number.isInteger(flips) || flips < 1 || flips > 8) throw new GameError('Yazı/tura ve 1–8 arası seri seç.');
  return { side, flips };
}

/* ------------------------------ Keno ------------------------------ */
export const KENO_N = 40;
export const KENO_DRAW = 10;
export function kenoProbs(k: number): number[] {
  const tot = choose(KENO_N, KENO_DRAW);
  return Array.from({ length: k + 1 }, (_, h) => (choose(k, h) * choose(KENO_N - k, KENO_DRAW - h)) / tot);
}
export function kenoTable(k: number, edge: number): number[] {
  const key = `k${k}${edge}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const probs = kenoProbs(k);
  const min = Math.max(1, Math.ceil(k * 0.4));
  const shape = probs.map((p, h) => (h >= min && p > 0 ? 1 / p : 0));
  const out = fitTable(probs, shape, 1 - edge, 1000);
  cache.set(key, out);
  return out;
}
export function kenoDraw(f: number[]): number[] {
  const deck = Array.from({ length: KENO_N }, (_, i) => i + 1);
  for (let i = 0; i < KENO_DRAW; i++) {
    const j = i + Math.floor(f[i] * (KENO_N - i));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck.slice(0, KENO_DRAW).sort((a, b) => a - b);
}
function parseKeno(raw: Record<string, unknown>) {
  const picks = Array.isArray(raw.picks) ? raw.picks.map(Number) : [];
  const uniq = Array.from(new Set(picks));
  if (uniq.length < 1 || uniq.length > 10 || uniq.length !== picks.length || uniq.some((n) => !Number.isInteger(n) || n < 1 || n > KENO_N))
    throw new GameError('1–10 farklı sayı seçmelisin (1–40).');
  return { picks: uniq.sort((a, b) => a - b) };
}

/* ------------------------------ Roulette ------------------------------ */
export const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
export type RouletteType = 'straight' | 'red' | 'black' | 'odd' | 'even' | 'low' | 'high' | 'dozen' | 'column';
export interface RouletteBet { t: RouletteType; v?: number; a: number }
export const rouletteCovers = (t: RouletteType, v: number | undefined, n: number): boolean => {
  if (t === 'straight') return n === v;
  if (n === 0) return false;
  switch (t) {
    case 'red': return RED.has(n);
    case 'black': return !RED.has(n);
    case 'odd': return n % 2 === 1;
    case 'even': return n % 2 === 0;
    case 'low': return n <= 18;
    case 'high': return n >= 19;
    case 'dozen': return Math.floor((n - 1) / 12) === v;
    case 'column': return (n - 1) % 3 === v;
  }
};
export const rouletteCount = (t: RouletteType) => (t === 'straight' ? 1 : t === 'dozen' || t === 'column' ? 12 : 18);
export const rouletteMult = (t: RouletteType, edge: number) => floor4(((1 - edge) * 37) / rouletteCount(t));
function parseRoulette(raw: Record<string, unknown>) {
  const list = Array.isArray(raw.bets) ? (raw.bets as Record<string, unknown>[]) : [];
  if (!list.length || list.length > 40) throw new GameError('En az bir, en fazla 40 bahis alanı seç.');
  const types: RouletteType[] = ['straight', 'red', 'black', 'odd', 'even', 'low', 'high', 'dozen', 'column'];
  const bets = list.map((b) => {
    const t = types.find((x) => x === b.t);
    const a = Number(b.a);
    const v = b.v == null ? undefined : Number(b.v);
    if (!t || !Number.isFinite(a) || a <= 0) throw new GameError('Geçersiz rulet bahsi.');
    if (t === 'straight' && !(Number.isInteger(v) && v! >= 0 && v! <= 36)) throw new GameError('Sayı 0–36 olmalı.');
    if ((t === 'dozen' || t === 'column') && !(Number.isInteger(v) && v! >= 0 && v! <= 2)) throw new GameError('Düzine/sütun 1–3 olmalı.');
    return { t, v, a } as RouletteBet;
  });
  return { bets };
}

/* ------------------------------ Wheel ------------------------------ */
export const WHEEL_SEGMENTS = 30;
export const WHEEL_RISKS = ['low', 'medium', 'high'] as const;
export type WheelRisk = (typeof WHEEL_RISKS)[number];
const WHEEL_RAW: Record<WheelRisk, [number, number][]> = {
  low: [[0, 9], [1.2, 12], [1.5, 6], [2, 2], [3, 1]],
  medium: [[0, 19], [1.5, 4], [2, 3], [3, 2], [5, 1], [9, 1]],
  high: [[0, 27], [3, 1], [8, 1], [20, 1]],
};
export function wheelSegments(risk: WheelRisk, edge: number): number[] {
  const raw: number[] = [];
  for (const [v, n] of WHEEL_RAW[risk]) for (let i = 0; i < n; i++) raw.push(v);
  // değerleri çarka eşit aralıklarla dağıt (7, 30 ile aralarında asal)
  const spread = Array.from({ length: WHEEL_SEGMENTS }, (_, i) => raw[(i * 7) % WHEEL_SEGMENTS]);
  const mean = spread.reduce((a, b) => a + b, 0) / WHEEL_SEGMENTS;
  return spread.map((v) => floor4((v * (1 - edge)) / mean));
}
function parseWheel(raw: Record<string, unknown>) {
  const risk = WHEEL_RISKS.find((r) => r === raw.risk);
  if (!risk) throw new GameError('Risk düşük/orta/yüksek olmalı.');
  return { risk };
}

/* ------------------------------ Scratch ------------------------------ */
export const SCRATCH_SYMBOLS = [
  { id: 'blank', w: 58, base: 0 },
  { id: 'coin', w: 15, base: 2 },
  { id: 'clover', w: 12, base: 4 },
  { id: 'star', w: 8, base: 8 },
  { id: 'gem', w: 4, base: 20 },
  { id: 'crown', w: 2.5, base: 80 },
  { id: 'seven', w: 0.5, base: 500 },
] as const;
export type ScratchSym = (typeof SCRATCH_SYMBOLS)[number]['id'];
const SW = SCRATCH_SYMBOLS.reduce((a, s) => a + s.w, 0);
export const scratchPick = (f: number): ScratchSym => {
  let r = f * SW;
  for (const s of SCRATCH_SYMBOLS) {
    r -= s.w;
    if (r < 0) return s.id;
  }
  return 'blank';
};
/** Çarpan: her sembol için 3+ eşleşmede base × (adet − 2). Ölçek, tam olasılık hesabıyla RTP'ye eşitlenir. */
function scratchBaseRtp(): number {
  const n = SCRATCH_SYMBOLS.length;
  const fact = (x: number): number => (x <= 1 ? 1 : x * fact(x - 1));
  let rtp = 0;
  const counts = new Array(n).fill(0);
  const rec = (i: number, left: number) => {
    if (i === n - 1) {
      counts[i] = left;
      let p = fact(9);
      let pay = 0;
      counts.forEach((c, j) => {
        p = (p / fact(c)) * Math.pow(SCRATCH_SYMBOLS[j].w / SW, c);
        if (c >= 3 && SCRATCH_SYMBOLS[j].base > 0) pay += SCRATCH_SYMBOLS[j].base * (c - 2);
      });
      rtp += p * pay;
      return;
    }
    for (let c = 0; c <= left; c++) {
      counts[i] = c;
      rec(i + 1, left - c);
    }
  };
  rec(0, 9);
  return rtp;
}
let BASE_SCRATCH = 0;
export function scratchScale(edge: number): number {
  if (!BASE_SCRATCH) BASE_SCRATCH = scratchBaseRtp();
  return (1 - edge) / BASE_SCRATCH;
}
export function scratchPay(cells: ScratchSym[], edge: number): { mult: number; wins: { sym: ScratchSym; count: number; mult: number }[] } {
  const k = scratchScale(edge);
  const wins: { sym: ScratchSym; count: number; mult: number }[] = [];
  for (const s of SCRATCH_SYMBOLS) {
    const count = cells.filter((c) => c === s.id).length;
    if (s.base > 0 && count >= 3) wins.push({ sym: s.id, count, mult: floor4(s.base * (count - 2) * k) });
  }
  return { mult: wins.reduce((a, w) => a + w.mult, 0), wins };
}
export const scratchPaytable = (edge: number) => SCRATCH_SYMBOLS.map((s) => ({ sym: s.id, base: floor4(s.base * scratchScale(edge)) }));

/* ------------------------------ Ortak arayüz ------------------------------ */
export const FLOATS_NEEDED = (g: InstantGame, p: Record<string, unknown>): number => {
  switch (g) {
    case 'plinko': return Number(p.rows) || 16;
    case 'coinflip': return Number(p.flips) || 1;
    case 'keno': return KENO_DRAW;
    case 'scratch': return 9;
    default: return 1;
  }
};

export interface InstantResult {
  /** bahis tutarına göre kazanç çarpanı */
  multiplier: number;
  /** yalnızca rulet gibi çok bahisli oyunlarda doğrudan kuruş cinsinden ödeme */
  payoutUnits?: number;
  detail: Record<string, unknown>;
}

/** Parametreleri doğrular (GameError fırlatır). */
export function parseInstant(g: InstantGame, raw: Record<string, unknown>): Record<string, unknown> {
  switch (g) {
    case 'dice': return { ...parseDice(raw) };
    case 'limbo': return { ...parseLimbo(raw) };
    case 'plinko': return { ...parsePlinko(raw) };
    case 'coinflip': return { ...parseCoin(raw) };
    case 'keno': return { ...parseKeno(raw) };
    case 'roulette': return { ...parseRoulette(raw) };
    case 'wheel': return { ...parseWheel(raw) };
    case 'scratch': return {};
    default: throw new GameError('Bilinmeyen oyun.');
  }
}

/** Doğrulanmış parametreler + float'larla sonucu hesaplar. `unit` rulet için kuruş çarpanı. */
export function playInstant(g: InstantGame, p: Record<string, unknown>, edge: number, f: number[]): InstantResult {
  switch (g) {
    case 'dice': {
      const d = p as unknown as DiceP;
      const roll = Math.floor(f[0] * 10000) / 100;
      const win = d.dir === 'under' ? roll < d.target : roll > d.target;
      const mult = diceMult(d, edge);
      return { multiplier: win ? mult : 0, detail: { ...d, roll, win, chance: diceChance(d), mult } };
    }
    case 'limbo': {
      const target = p.target as number;
      const point = limboPoint(f[0], edge);
      const win = point >= target;
      return { multiplier: win ? target : 0, detail: { target, point, win } };
    }
    case 'plinko': {
      const rows = p.rows as number;
      const risk = p.risk as PlinkoRisk;
      const path = f.slice(0, rows).map((x) => (x >= 0.5 ? 1 : 0));
      const bin = path.reduce((a: number, b) => a + b, 0);
      const mult = plinkoTable(rows, risk, edge)[bin];
      return { multiplier: mult, detail: { rows, risk, path, bin, mult } };
    }
    case 'coinflip': {
      const { side, flips } = p as { side: 'heads' | 'tails'; flips: number };
      const results = f.slice(0, flips).map((x) => (x < 0.5 ? 'heads' : 'tails'));
      const win = results.every((r) => r === side);
      return { multiplier: win ? coinflipMult(flips, edge) : 0, detail: { side, flips, results, win } };
    }
    case 'keno': {
      const picks = p.picks as number[];
      const drawn = kenoDraw(f);
      const hits = picks.filter((n) => drawn.includes(n));
      const mult = kenoTable(picks.length, edge)[hits.length];
      return { multiplier: mult, detail: { picks, drawn, hits, mult } };
    }
    case 'roulette': {
      const bets = p.bets as RouletteBet[];
      const n = Math.floor(f[0] * 37);
      let payout = 0;
      let total = 0;
      const lines = bets.map((b) => {
        const units = Math.round(b.a * 100);
        total += units;
        const win = rouletteCovers(b.t, b.v, n);
        const pay = win ? Math.floor(units * rouletteMult(b.t, edge)) : 0;
        payout += pay;
        return { t: b.t, v: b.v ?? null, a: units, win, pay };
      });
      return { multiplier: total ? payout / total : 0, payoutUnits: payout, detail: { number: n, color: n === 0 ? 'green' : RED.has(n) ? 'red' : 'black', lines } };
    }
    case 'wheel': {
      const risk = p.risk as WheelRisk;
      const seg = Math.floor(f[0] * WHEEL_SEGMENTS);
      const mult = wheelSegments(risk, edge)[seg];
      return { multiplier: mult, detail: { risk, segment: seg, mult } };
    }
    case 'scratch': {
      const cells = f.slice(0, 9).map(scratchPick);
      const r = scratchPay(cells, edge);
      return { multiplier: r.mult, detail: { cells, wins: r.wins } };
    }
  }
}

export { tableRtp };
