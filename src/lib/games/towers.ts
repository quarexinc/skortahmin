// Kule: her katta bir kare seçilir; bombalar tohumdan önceden belirlenir.
import { floor4 } from './common';

export const ROWS = 8;
export const DIFFICULTY = {
  easy: { cols: 4, bombs: 1, label: 'Kolay' },
  medium: { cols: 3, bombs: 1, label: 'Orta' },
  hard: { cols: 2, bombs: 1, label: 'Zor' },
  expert: { cols: 3, bombs: 2, label: 'Uzman' },
  master: { cols: 4, bombs: 3, label: 'Usta' },
} as const;
export type Difficulty = keyof typeof DIFFICULTY;
export const isDifficulty = (v: unknown): v is Difficulty => typeof v === 'string' && v in DIFFICULTY;

/** Her kat için bomba sütunları */
export function bombRows(f: number[], cols: number, bombs: number): number[][] {
  return Array.from({ length: ROWS }, (_, r) => {
    const deck = Array.from({ length: cols }, (_, i) => i);
    for (let i = 0; i < cols - 1; i++) {
      const j = i + Math.floor(f[r * 4 + i] * (cols - i));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck.slice(0, bombs).sort((a, b) => a - b);
  });
}

export const towersMult = (d: Difficulty, k: number, edge: number) => {
  const { cols, bombs } = DIFFICULTY[d];
  return k === 0 ? 0 : floor4((1 - edge) * Math.pow(cols / (cols - bombs), k));
};

export interface TowersState {
  d: Difficulty;
  bombs: number[][];
  picks: number[];
}
