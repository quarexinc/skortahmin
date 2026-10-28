import { HttpError, requireUser } from '@/lib/auth';
import { cq, cq1, tx } from '@/lib/db';
import { nextRoll } from '@/lib/fair';
import { edgeFraction } from '@/lib/games/registry';
import { bombRows, DIFFICULTY, isDifficulty, ROWS, towersMult, type Difficulty, type TowersState } from '@/lib/games/towers';
import { body, int, route } from '@/lib/http';
import { getSettings } from '@/lib/settings';
import { lockUser, parseAmount, settle, takeBet } from '@/lib/wallet';

export const dynamic = 'force-dynamic';

interface Sess { id: string; amount: string; state: TowersState; server_hash: string; client_seed: string; nonce: number }

const view = (s: Sess, edge: number) => {
  const st = s.state;
  const k = st.picks.length;
  return {
    amount: Number(s.amount),
    difficulty: st.d,
    cols: DIFFICULTY[st.d].cols,
    bombsPerRow: DIFFICULTY[st.d].bombs,
    rows: ROWS,
    picks: st.picks,
    multiplier: towersMult(st.d, k, edge),
    next: k < ROWS ? towersMult(st.d, k + 1, edge) : null,
    fair: { serverHash: s.server_hash, clientSeed: s.client_seed, nonce: s.nonce },
  };
};

const active = (c: Parameters<Parameters<typeof tx>[0]>[0], id: number, lock = false) =>
  cq1<Sess>(c, `SELECT * FROM game_sessions WHERE user_id = $1 AND game = 'towers' AND status = 'active'${lock ? ' FOR UPDATE' : ''}`, [id]);

export const GET = route(async () => {
  const u = await requireUser();
  return tx(async (c) => {
    const s = await active(c, u.id);
    const edge = edgeFraction((await getSettings(c)).edges, 'towers');
    return { game: s ? view(s, edge) : null };
  });
});

export const POST = route(async (req) => {
  const u = await requireUser();
  const b = await body(req);
  return tx(async (c) => {
    const lu = await lockUser(c, u.id);
    const edge = edgeFraction((await getSettings(c)).edges, 'towers');
    const s = await active(c, u.id, true);

    if (b.action === 'start') {
      if (s) throw new HttpError(400, 'Devam eden bir Kule oyunun var.');
      if (!isDifficulty(b.difficulty)) throw new HttpError(400, 'Zorluk geçersiz.');
      const d: Difficulty = b.difficulty;
      const amount = parseAmount(b.amount);
      const balance = await takeBet(c, lu, 'towers', amount);
      const roll = await nextRoll(c, u.id, ROWS * 4);
      const st: TowersState = { d, bombs: bombRows(roll.values, DIFFICULTY[d].cols, DIFFICULTY[d].bombs), picks: [] };
      const ns = await cq1<Sess>(c, `INSERT INTO game_sessions (user_id, game, amount, state, server_hash, client_seed, nonce) VALUES ($1, 'towers', $2, $3, $4, $5, $6) RETURNING *`,
        [u.id, amount, JSON.stringify(st), roll.fair.serverHash, roll.fair.clientSeed, roll.fair.nonce],
      );
      return { game: view(ns!, edge), balance };
    }

    if (!s) throw new HttpError(400, 'Aktif bir Kule oyunu yok.');
    const st = s.state;
    const amount = Number(s.amount);
    const fair = { serverHash: s.server_hash, clientSeed: s.client_seed, nonce: s.nonce };
    const end = async (status: 'lost' | 'cashed', payout: number, hit?: number) => {
      const res = await settle(c, u.id, 'towers', amount, payout, { edge, d: st.d, picks: st.picks, bombs: st.bombs, hit: hit ?? null }, fair);
      await cq(c, `UPDATE game_sessions SET status = $2, state = $3, ended_at = NOW() WHERE id = $1`, [s.id, status, JSON.stringify(st)]);
      return { ended: true, status, bombs: st.bombs, picks: st.picks, hit: hit ?? null, payout: res.payout, multiplier: res.multiplier, balance: res.balance };
    };

    if (b.action === 'pick') {
      const col = int(b.col, 'Kare', { min: 0, max: DIFFICULTY[st.d].cols - 1 });
      const row = st.picks.length;
      if (st.bombs[row].includes(col)) {
        st.picks.push(col);
        return end('lost', 0, col);
      }
      st.picks.push(col);
      if (st.picks.length === ROWS) return end('cashed', Math.floor(amount * towersMult(st.d, ROWS, edge)));
      await cq(c, 'UPDATE game_sessions SET state = $2 WHERE id = $1', [s.id, JSON.stringify(st)]);
      return { game: view({ ...s, state: st }, edge) };
    }

    if (b.action === 'cashout') {
      if (!st.picks.length) throw new HttpError(400, 'Kazancı almak için en az bir kat tırman.');
      return end('cashed', Math.floor(amount * towersMult(st.d, st.picks.length, edge)));
    }
    throw new HttpError(400, 'Geçersiz işlem.');
  });
});
