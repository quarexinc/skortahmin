// Slots: 5 makara x 3 satır, 10 ödeme çizgisi, joker (wild) ve dağınık (scatter).
// Ödeme tablosu ve ağırlıklar simülasyonla ~%96 RTP'ye ayarlanmıştır (scripts/slots-sim).
export const SYMBOLS = ['cherry', 'lemon', 'grape', 'bell', 'clover', 'star', 'gem', 'crown', 'wild', 'scatter'] as const;
export type Sym = (typeof SYMBOLS)[number];

// Hücre başına ağırlıklar
export const WEIGHTS: Record<Sym, number> = {
  cherry: 22,
  lemon: 20,
  grape: 17,
  bell: 13,
  clover: 10,
  star: 8,
  gem: 5,
  crown: 3,
  wild: 2,
  scatter: 2.5,
};

// Çizgi bahsinin katı: 3 / 4 / 5 aynı sembol (soldan)
export const PAYTABLE: Record<Exclude<Sym, 'scatter'>, [number, number, number]> = {
  cherry: [12, 30, 90],
  lemon: [12, 36, 110],
  grape: [18, 48, 150],
  bell: [24, 72, 240],
  clover: [30, 110, 360],
  star: [48, 180, 600],
  gem: [90, 360, 1500],
  crown: [150, 720, 3600],
  wild: [240, 1200, 6000],
};
// Toplam bahsin katı: 3 / 4 / 5 scatter (her yerde)
export const SCATTER_PAY: [number, number, number] = [6, 30, 120];

// Satır indeksleri (0 üst, 1 orta, 2 alt) — her makara için
export const PAYLINES: number[][] = [
  [1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0],
  [2, 2, 2, 2, 2],
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2],
  [0, 0, 1, 2, 2],
  [2, 2, 1, 0, 0],
  [1, 0, 0, 0, 1],
  [1, 2, 2, 2, 1],
  [0, 1, 1, 1, 0],
];

const TOTAL_W = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);

export function pick(v: number): Sym {
  let r = v * TOTAL_W;
  for (const s of SYMBOLS) {
    r -= WEIGHTS[s];
    if (r < 0) return s;
  }
  return 'cherry';
}

/** grid[reel][row] */
export function spinGrid(values: number[]): Sym[][] {
  return Array.from({ length: 5 }, (_, r) => Array.from({ length: 3 }, (_, row) => pick(values[r * 3 + row])));
}

export interface LineWin {
  line: number;
  symbol: Sym;
  count: number;
  mult: number; // çizgi bahsinin katı
}

export function evaluate(grid: Sym[][]): { lines: LineWin[]; scatter: number; scatterMult: number; totalMult: number } {
  const lines: LineWin[] = [];
  PAYLINES.forEach((pl, li) => {
    const cells = pl.map((row, reel) => grid[reel][row]);
    // en iyi eşleşmeyi bul: her sembol için soldan sayım (joker yerine geçer)
    let best: LineWin | null = null;
    const candidates = new Set<Sym>(cells.filter((c) => c !== 'scatter'));
    for (const target of candidates) {
      let count = 0;
      for (const c of cells) {
        if (c === target || (c === 'wild' && target !== 'scatter')) count++;
        else break;
      }
      if (count >= 3) {
        const mult = PAYTABLE[target as Exclude<Sym, 'scatter'>][count - 3];
        if (!best || mult > best.mult) best = { line: li, symbol: target, count, mult };
      }
    }
    if (best) lines.push(best);
  });
  const scatter = grid.flat().filter((c) => c === 'scatter').length;
  const scatterMult = scatter >= 3 ? SCATTER_PAY[Math.min(scatter, 5) - 3] : 0;
  // toplam çarpan (toplam bahse göre): çizgiler /10 + scatter
  const totalMult = lines.reduce((a, l) => a + l.mult, 0) / PAYLINES.length + scatterMult;
  return { lines, scatter, scatterMult, totalMult };
}

/** Ödeme tablosunun ölçeği: tablo ~%96,1 RTP için ayarlıdır; kasa payına göre orantılı ölçeklenir. */
export const BASE_RTP = 0.961;
export const slotScale = (edge: number) => (1 - edge) / BASE_RTP;
