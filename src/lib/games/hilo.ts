// Hi-Lo: sıradaki kart büyük/eşit mi, küçük/eşit mi? Kartlar yerine koymalı çekilir (52 kartlık deste).
import { floor4 } from './common';

export const MAX_STEPS = 40;
export const DECK_DRAW = 80; // başlangıç + atlamalar + tahminler için önceden üretilen kart sayısı

/** 0–51 → { rank: 1–13 (A=1, K=13), suit: 0–3 } */
export const cardOf = (f: number) => {
  const i = Math.min(51, Math.floor(f * 52));
  return { rank: (i % 13) + 1, suit: Math.floor(i / 13) };
};
export const RANK_LABEL = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
export const SUIT_LABEL = ['♠', '♥', '♦', '♣'];

export type Guess = 'hi' | 'lo';
/** Tahminin tutma olasılığı: büyük-veya-eşit (hi) ya da küçük-veya-eşit (lo) */
export const guessChance = (rank: number, g: Guess) => (g === 'hi' ? (14 - rank) / 13 : rank / 13);

/** k doğru tahminden sonraki toplam çarpan: (1 − edge) / Π p */
export function hiloMult(chances: number[], edge: number): number {
  if (!chances.length) return 0;
  return floor4((1 - edge) / chances.reduce((a, b) => a * b, 1));
}

export interface HiloState {
  /** önceden üretilmiş ham float'lar (sunucuda tutulur, istemciye gönderilmez) */
  f: number[];
  /** şu anki kartın f indeksi */
  cur: number;
  /** doğru tahminlerin olasılıkları */
  chances: number[];
  history: { rank: number; suit: number; guess: Guess | 'skip' | null }[];
}
