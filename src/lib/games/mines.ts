// Mines: 5x5 alan, oyuncu mayın sayısını seçer. Ev avantajı %1.
export const TILES = 25;
export const HOUSE = 0.99;

export function minePositions(values: number[], mines: number): number[] {
  const deck = Array.from({ length: TILES }, (_, i) => i);
  for (let i = 0; i < TILES - 1; i++) {
    const j = i + Math.floor(values[i] * (TILES - i));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck.slice(0, mines).sort((a, b) => a - b);
}

/** k güvenli kare açıldıktan sonraki çarpan */
export function minesMultiplier(mines: number, k: number): number {
  let m = HOUSE;
  for (let i = 0; i < k; i++) m *= (TILES - i) / (TILES - mines - i);
  return Math.floor(m * 10000) / 10000;
}

export interface MinesState {
  mines: number;
  positions: number[];
  revealed: number[];
}
