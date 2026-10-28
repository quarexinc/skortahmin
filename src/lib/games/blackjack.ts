// Blackjack: 6 deste, krupiye tüm 17'lerde durur, blackjack 3:2 öder,
// ilk iki kartta double, aynı değerde kartlarda bir kez split (as split'inde tek kart).
export const DECKS = 6;
export const SHOE = 52 * DECKS;

export interface Hand {
  cards: number[];
  bet: number; // kuruş
  done: boolean;
  doubled: boolean;
  fromSplit: boolean;
  result?: 'win' | 'lose' | 'push' | 'blackjack' | 'bust';
  payout?: number;
}

export interface BjState {
  shoe: number[];
  pos: number;
  dealer: number[];
  hands: Hand[];
  active: number;
  phase: 'player' | 'done';
}

export const rank = (c: number) => c % 13; // 0=A, 1..8 = 2..9, 9=10, 10=J, 11=Q, 12=K
export const suit = (c: number) => Math.floor(c / 13) % 4;
const cardValue = (c: number) => {
  const r = rank(c);
  return r === 0 ? 11 : r >= 9 ? 10 : r + 1;
};

export function handValue(cards: number[]): { total: number; soft: boolean } {
  let total = 0;
  let aces = 0;
  for (const c of cards) {
    total += cardValue(c);
    if (rank(c) === 0) aces++;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return { total, soft: aces > 0 };
}

export const isBlackjack = (cards: number[]) => cards.length === 2 && handValue(cards).total === 21;

export function shuffle(values: number[]): number[] {
  const deck = Array.from({ length: SHOE }, (_, i) => i);
  for (let i = 0; i < SHOE - 1; i++) {
    const j = i + Math.floor(values[i] * (SHOE - i));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function draw(s: BjState): number {
  return s.shoe[s.pos++];
}

export function deal(values: number[], bet: number): BjState {
  const s: BjState = { shoe: shuffle(values), pos: 0, dealer: [], hands: [], active: 0, phase: 'player' };
  const p = [draw(s)];
  s.dealer.push(draw(s));
  p.push(draw(s));
  s.dealer.push(draw(s));
  s.hands.push({ cards: p, bet, done: false, doubled: false, fromSplit: false });
  // Oyuncu veya krupiye blackjack ise el hemen biter
  if (isBlackjack(p) || isBlackjack(s.dealer)) {
    s.hands[0].done = true;
    finish(s);
  }
  return s;
}

export function canSplit(s: BjState): boolean {
  const h = s.hands[s.active];
  if (s.phase !== 'player' || s.hands.length > 1 || !h || h.cards.length !== 2) return false;
  return cardValue(h.cards[0]) === cardValue(h.cards[1]);
}

export const canDouble = (s: BjState) => {
  const h = s.hands[s.active];
  return s.phase === 'player' && !!h && h.cards.length === 2 && !h.done;
};

function advance(s: BjState) {
  while (s.active < s.hands.length && s.hands[s.active].done) s.active++;
  if (s.active >= s.hands.length) finish(s);
}

export function hit(s: BjState) {
  const h = s.hands[s.active];
  h.cards.push(draw(s));
  const v = handValue(h.cards).total;
  if (v >= 21) h.done = true;
  advance(s);
}

export function stand(s: BjState) {
  s.hands[s.active].done = true;
  advance(s);
}

export function double(s: BjState) {
  const h = s.hands[s.active];
  h.bet *= 2;
  h.doubled = true;
  h.cards.push(draw(s));
  h.done = true;
  advance(s);
}

export function split(s: BjState) {
  const h = s.hands[s.active];
  const second: Hand = { cards: [h.cards[1]], bet: h.bet, done: false, doubled: false, fromSplit: true };
  h.cards = [h.cards[0]];
  h.fromSplit = true;
  s.hands.splice(s.active + 1, 0, second);
  const aces = rank(h.cards[0]) === 0;
  for (const x of [h, second]) {
    x.cards.push(draw(s));
    if (aces || handValue(x.cards).total === 21) x.done = true;
  }
  advance(s);
}

function finish(s: BjState) {
  s.phase = 'done';
  const dealerBj = isBlackjack(s.dealer);
  const anyLive = s.hands.some((h) => handValue(h.cards).total <= 21) && !(s.hands.length === 1 && isBlackjack(s.hands[0].cards));
  if (anyLive && !dealerBj) {
    while (handValue(s.dealer).total < 17) s.dealer.push(draw(s));
  }
  const d = handValue(s.dealer).total;
  for (const h of s.hands) {
    const v = handValue(h.cards).total;
    const pbj = isBlackjack(h.cards) && !h.fromSplit;
    if (v > 21) {
      h.result = 'bust';
      h.payout = 0;
    } else if (pbj && !dealerBj) {
      h.result = 'blackjack';
      h.payout = Math.floor(h.bet * 2.5);
    } else if (dealerBj && !pbj) {
      h.result = 'lose';
      h.payout = 0;
    } else if (pbj && dealerBj) {
      h.result = 'push';
      h.payout = h.bet;
    } else if (d > 21 || v > d) {
      h.result = 'win';
      h.payout = h.bet * 2;
    } else if (v === d) {
      h.result = 'push';
      h.payout = h.bet;
    } else {
      h.result = 'lose';
      h.payout = 0;
    }
  }
}

/** İstemciye gönderilecek görünüm: deste ve gizli kart saklanır. */
export function view(s: BjState) {
  const hideHole = s.phase === 'player';
  return {
    phase: s.phase,
    active: s.active,
    dealer: hideHole ? [s.dealer[0], -1] : s.dealer,
    dealerValue: hideHole ? handValue([s.dealer[0]]).total : handValue(s.dealer).total,
    hands: s.hands.map((h) => ({ ...h, value: handValue(h.cards).total, soft: handValue(h.cards).soft })),
    canDouble: canDouble(s),
    canSplit: canSplit(s),
  };
}
