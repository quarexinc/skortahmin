import { HttpError, requireUser } from '@/lib/auth';
import { cq, cq1, tx } from '@/lib/db';
import { nextRoll } from '@/lib/fair';
import { cardOf, DECK_DRAW, guessChance, hiloMult, MAX_STEPS, type Guess, type HiloState } from '@/lib/games/hilo';
import { edgeFraction } from '@/lib/games/registry';
import { body, route } from '@/lib/http';
import { getSettings } from '@/lib/settings';
import { lockUser, parseAmount, settle, takeBet } from '@/lib/wallet';

export const dynamic = 'force-dynamic';

interface Sess { id: string; amount: string; state: HiloState; server_hash: string; client_seed: string; nonce: number }

const view = (s: Sess, edge: number) => {
  const st = s.state;
  const card = cardOf(st.f[st.cur]);
  return {
    amount: Number(s.amount),
    card,
    history: st.history,
    steps: st.chances.length,
    multiplier: hiloMult(st.chances, edge),
    hiChance: guessChance(card.rank, 'hi'),
    loChance: guessChance(card.rank, 'lo'),
    nextHi: hiloMult([...st.chances, guessChance(card.rank, 'hi')], edge),
    nextLo: hiloMult([...st.chances, guessChance(card.rank, 'lo')], edge),
    fair: { serverHash: s.server_hash, clientSeed: s.client_seed, nonce: s.nonce },
  };
};

const active = (c: Parameters<Parameters<typeof tx>[0]>[0], id: number, lock = false) =>
  cq1<Sess>(c, `SELECT * FROM game_sessions WHERE user_id = $1 AND game = 'hilo' AND status = 'active'${lock ? ' FOR UPDATE' : ''}`, [id]);

export const GET = route(async () => {
  const u = await requireUser();
  return tx(async (c) => {
    const s = await active(c, u.id);
    const edge = edgeFraction((await getSettings(c)).edges, 'hilo');
    return { game: s ? view(s, edge) : null };
  });
});

export const POST = route(async (req) => {
  const u = await requireUser();
  const b = await body(req);
  return tx(async (c) => {
    const lu = await lockUser(c, u.id);
    const settings = await getSettings(c);
    const edge = edgeFraction(settings.edges, 'hilo');
    const s = await active(c, u.id, true);

    if (b.action === 'start') {
      if (s) throw new HttpError(400, 'Devam eden bir Hi-Lo oyunun var.');
      const amount = parseAmount(b.amount);
      const balance = await takeBet(c, lu, 'hilo', amount);
      const roll = await nextRoll(c, u.id, DECK_DRAW);
      const st: HiloState = { f: roll.values, cur: 0, chances: [], history: [] };
      const ns = await cq1<Sess>(c, `INSERT INTO game_sessions (user_id, game, amount, state, server_hash, client_seed, nonce) VALUES ($1, 'hilo', $2, $3, $4, $5, $6) RETURNING *`,
        [u.id, amount, JSON.stringify(st), roll.fair.serverHash, roll.fair.clientSeed, roll.fair.nonce],
      );
      return { game: view(ns!, edge), balance };
    }

    if (!s) throw new HttpError(400, 'Aktif bir Hi-Lo oyunu yok.');
    const st = s.state;
    const amount = Number(s.amount);
    const fair = { serverHash: s.server_hash, clientSeed: s.client_seed, nonce: s.nonce };
    const finish = async (status: 'lost' | 'cashed', payout: number) => {
      const res = await settle(c, u.id, 'hilo', amount, payout, { edge, steps: st.chances.length, history: st.history, cards: st.f.slice(0, st.cur + 1).map((f) => cardOf(f)) }, fair);
      await cq(c, `UPDATE game_sessions SET status = $2, state = $3, ended_at = NOW() WHERE id = $1`, [s.id, status, JSON.stringify(st)]);
      return { ended: true, status, payout: res.payout, multiplier: res.multiplier, balance: res.balance, card: cardOf(st.f[st.cur]), history: st.history, fair };
    };

    if (b.action === 'guess') {
      const g: Guess | null = b.guess === 'hi' ? 'hi' : b.guess === 'lo' ? 'lo' : null;
      if (!g) throw new HttpError(400, 'Tahmin yüksek ya da düşük olmalı.');
      if (st.cur + 1 >= DECK_DRAW) throw new HttpError(400, 'Deste bitti; kazancı al.');
      const cur = cardOf(st.f[st.cur]);
      const next = cardOf(st.f[st.cur + 1]);
      const p = guessChance(cur.rank, g);
      const ok = g === 'hi' ? next.rank >= cur.rank : next.rank <= cur.rank;
      st.history.push({ rank: cur.rank, suit: cur.suit, guess: g });
      st.cur += 1;
      if (!ok) return finish('lost', 0);
      st.chances.push(p);
      if (st.chances.length >= MAX_STEPS) return finish('cashed', Math.floor(amount * hiloMult(st.chances, edge)));
      await cq(c, 'UPDATE game_sessions SET state = $2 WHERE id = $1', [s.id, JSON.stringify(st)]);
      return { game: view({ ...s, state: st }, edge), correct: true };
    }

    if (b.action === 'skip') {
      if (st.cur + 1 >= DECK_DRAW) throw new HttpError(400, 'Deste bitti; kazancı al.');
      const cur = cardOf(st.f[st.cur]);
      st.history.push({ rank: cur.rank, suit: cur.suit, guess: 'skip' });
      st.cur += 1;
      await cq(c, 'UPDATE game_sessions SET state = $2 WHERE id = $1', [s.id, JSON.stringify(st)]);
      return { game: view({ ...s, state: st }, edge) };
    }

    if (b.action === 'cashout') {
      if (!st.chances.length) throw new HttpError(400, 'Kazancı almak için en az bir doğru tahmin yap.');
      return finish('cashed', Math.floor(amount * hiloMult(st.chances, edge)));
    }
    throw new HttpError(400, 'Geçersiz işlem.');
  });
});
