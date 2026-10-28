// Tek atışlık oyunlar için ortak uç nokta: dice, limbo, plinko, coinflip, keno, roulette, wheel, scratch.
import { HttpError, requireUser } from '@/lib/auth';
import { tx } from '@/lib/db';
import { nextRoll } from '@/lib/fair';
import { GameError } from '@/lib/games/common';
import { FLOATS_NEEDED, INSTANT_GAMES, parseInstant, playInstant, type InstantGame } from '@/lib/games/instant';
import { edgeFraction } from '@/lib/games/registry';
import { body, route } from '@/lib/http';
import { getSettings } from '@/lib/settings';
import { lockUser, parseAmount, settle, takeBet } from '@/lib/wallet';

export const dynamic = 'force-dynamic';

export const POST = route(async (req) => {
  const u = await requireUser();
  const b = await body(req);
  const game = INSTANT_GAMES.find((g) => g === b.game) as InstantGame | undefined;
  if (!game) throw new HttpError(400, 'Geçersiz oyun.');

  let params: Record<string, unknown>;
  try {
    params = parseInstant(game, b);
  } catch (e) {
    if (e instanceof GameError) throw new HttpError(400, e.message);
    throw e;
  }
  // toplam bahis: rulette bahis alanlarının toplamı, diğerlerinde amount
  const amount = game === 'roulette' ? (params.bets as { a: number }[]).reduce((a, x) => a + Math.round(x.a * 100), 0) : parseAmount(b.amount);
  if (!Number.isInteger(amount) || amount <= 0) throw new HttpError(400, 'Geçerli bir bahis tutarı girin.');

  return tx(async (c) => {
    const lu = await lockUser(c, u.id);
    const s = await getSettings(c);
    await takeBet(c, lu, game, amount);
    const edge = edgeFraction(s.edges, game);
    const roll = await nextRoll(c, u.id, FLOATS_NEEDED(game, params));
    const out = playInstant(game, params, edge, roll.values);
    const payout = out.payoutUnits ?? Math.floor(amount * out.multiplier);
    const res = await settle(c, u.id, game, amount, payout, { ...out.detail, edge }, roll.fair);
    return { game, detail: out.detail, edge, multiplier: res.multiplier, payout: res.payout, amount, balance: res.balance, fair: roll.fair, betId: res.betId };
  });
});
