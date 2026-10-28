// Ortak matematik yardımcıları (saf).
export class GameError extends Error {}

export const floor4 = (x: number) => Math.floor(x * 10000 + 1e-9) / 10000;
export const floor2 = (x: number) => Math.floor(x * 100 + 1e-9) / 100;

/** n! / (k!(n-k)!) */
export function choose(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 1; i <= Math.min(k, n - k); i++) r = (r * (n - i + 1)) / i;
  return Math.round(r);
}

/**
 * Olasılıklar probs, göreli şekil shape verildiğinde, beklenen dönüşü (RTP) hedefe eşitleyen çarpan tablosu.
 * Çarpanlar üst sınıra (cap) kadar kırpılır; kırpılan yer diğer dilimlere dağıtılır (ikili arama).
 */
export function fitTable(probs: number[], shape: number[], rtp: number, cap: number): number[] {
  const f = (x: number) => probs.reduce((a, p, i) => a + p * Math.min(cap, x * shape[i]), 0);
  let lo = 0;
  let hi = 1;
  while (f(hi) < rtp && hi < 1e12) hi *= 2;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) < rtp) lo = mid;
    else hi = mid;
  }
  return shape.map((s) => floor4(Math.min(cap, lo * s)));
}

export const tableRtp = (probs: number[], mult: number[]) => probs.reduce((a, p, i) => a + p * mult[i], 0);
