import { HttpError, requireUser } from '@/lib/auth';
import { cq, cq1, tx } from '@/lib/db';
import { nextRoll } from '@/lib/fair';
import { canDouble, canSplit, deal, double, hit, SHOE, split, stand, view, type BjState } from '@/lib/games/blackjack';
import { body, route } from '@/lib/http';
import { lockUser, parseAmount, settle, takeBet } from '@/lib/wallet';

export const dynamic = 'force-dynamic';

interface Sess { id: string; amount: string; state: BjState; server_hash: string; client_seed: string; nonce: number }

const fairOf = (s: { server_hash: string; client_seed: string; nonce: number }) => ({ serverHash: s.server_hash, clientSeed: s.client_seed, nonce: s.nonce });

export const GET = route(async () => {
  const u = await requireUser();
  const s = await tx((c) => cq1<Sess>(c, `SELECT * FROM game_sessions WHERE user_id = $1 AND game = 'blackjack' AND status = 'active'`, [u.id]));
  return { game: s ? { ...view(s.state), fair: fairOf(s) } : null };
});

export const POST = route(async (req) => {
  const u = await requireUser();
  const b = await body(req);
  return tx(async (c) => {
    const lu = await lockUser(c, u.id);
    let s = await cq1<Sess>(c, `SELECT * FROM game_sessions WHERE user_id = $1 AND game = 'blackjack' AND status = 'active' FOR UPDATE`, [u.id]);
    let balance = lu.balance;

    if (b.action === 'deal') {
      if (s) throw new HttpError(400, 'Devam eden bir el var.');
      const amount = parseAmount(b.amount);
      balance = await takeBet(c, lu, 'blackjack', amount);
      const roll = await nextRoll(c, u.id, SHOE);
      const st = deal(roll.values, amount);
      s = await cq1<Sess>(c, `INSERT INTO game_sessions (user_id, game, amount, state, server_hash, client_seed, nonce) VALUES ($1, 'blackjack', $2, $3, $4, $5, $6) RETURNING *`,
        [u.id, amount, JSON.stringify(st), roll.fair.serverHash, roll.fair.clientSeed, roll.fair.nonce],
      );
    } else {
      if (!s) throw new HttpError(400, 'Aktif bir el yok.');
      const st = s.state;
      const h = st.hands[st.active];
      switch (b.action) {
        case 'hit':
          hit(st);
          break;
        case 'stand':
          stand(st);
          break;
        case 'double':
          if (!canDouble(st)) throw new HttpError(400, 'Bu elde double yapılamaz.');
          balance = await takeBet(c, lu, 'blackjack', h.bet, 'blackjack:double');
          double(st);
          break;
        case 'split':
          if (!canSplit(st)) throw new HttpError(400, 'Bu elde split yapılamaz.');
          balance = await takeBet(c, lu, 'blackjack', h.bet, 'blackjack:split');
          split(st);
          break;
        default:
          throw new HttpError(400, 'Geçersiz işlem.');
      }
      await cq(c, 'UPDATE game_sessions SET state = $2 WHERE id = $1', [s.id, JSON.stringify(st)]);
    }

    const st = s!.state;
    if (st.phase === 'done') {
      const total = st.hands.reduce((a, h) => a + h.bet, 0);
      const payout = st.hands.reduce((a, h) => a + (h.payout ?? 0), 0);
      const res = await settle(c, u.id, 'blackjack', total, payout, { dealer: st.dealer, hands: st.hands.map((h) => ({ cards: h.cards, bet: h.bet, result: h.result })) }, fairOf(s!));
      await cq(c, `UPDATE game_sessions SET status = 'done', state = $2, ended_at = NOW() WHERE id = $1`, [s!.id, JSON.stringify(st)]);
      return { game: { ...view(st), fair: fairOf(s!) }, ended: true, payout: res.payout, total, balance: res.balance };
    }
    return { game: { ...view(st), fair: fairOf(s!) }, balance };
  });
});
