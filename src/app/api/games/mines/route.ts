import { HttpError, requireUser } from '@/lib/auth';
import { cq, cq1, tx } from '@/lib/db';
import { nextRoll } from '@/lib/fair';
import { minePositions, minesMultiplier, TILES, type MinesState } from '@/lib/games/mines';
import { edgeFraction } from '@/lib/games/registry';
import { body, int, route } from '@/lib/http';
import { getSettings } from '@/lib/settings';
import { lockUser, parseAmount, settle, takeBet } from '@/lib/wallet';

export const dynamic = 'force-dynamic';

interface Sess { id: string; amount: string; state: MinesState; server_hash: string; client_seed: string; nonce: number }

const view = (s: Sess, edge: number) => {
  const k = s.state.revealed.length;
  return {
    id: Number(s.id),
    amount: Number(s.amount),
    mines: s.state.mines,
    revealed: s.state.revealed,
    multiplier: k ? minesMultiplier(s.state.mines, k, edge) : 0,
    next: k < TILES - s.state.mines ? minesMultiplier(s.state.mines, k + 1, edge) : null,
    fair: { serverHash: s.server_hash, clientSeed: s.client_seed, nonce: s.nonce },
  };
};

export const GET = route(async () => {
  const u = await requireUser();
  const s = await tx((c) => cq1<Sess>(c, `SELECT * FROM game_sessions WHERE user_id = $1 AND game = 'mines' AND status = 'active'`, [u.id]));
  return { game: s ? view(s, edgeFraction((await getSettings()).edges, 'mines')) : null };
});

export const POST = route(async (req) => {
  const u = await requireUser();
  const b = await body(req);
  return tx(async (c) => {
    const lu = await lockUser(c, u.id);
    const edge = edgeFraction((await getSettings(c)).edges, 'mines');
    const s = await cq1<Sess>(c, `SELECT * FROM game_sessions WHERE user_id = $1 AND game = 'mines' AND status = 'active' FOR UPDATE`, [u.id]);

    if (b.action === 'start') {
      if (s) throw new HttpError(400, 'Devam eden bir Mines oyunun var.');
      const amount = parseAmount(b.amount);
      const mines = int(b.mines, 'Mayın sayısı', { min: 1, max: 24 });
      const balance = await takeBet(c, lu, 'mines', amount);
      const roll = await nextRoll(c, u.id, TILES);
      const state: MinesState = { mines, positions: minePositions(roll.values, mines), revealed: [] };
      const ns = await cq1<Sess>(c, `INSERT INTO game_sessions (user_id, game, amount, state, server_hash, client_seed, nonce) VALUES ($1, 'mines', $2, $3, $4, $5, $6) RETURNING *`,
        [u.id, amount, JSON.stringify(state), roll.fair.serverHash, roll.fair.clientSeed, roll.fair.nonce],
      );
      return { game: view(ns!, edge), balance };
    }

    if (!s) throw new HttpError(400, 'Aktif bir Mines oyunu yok.');
    const st = s.state;
    const fair = { serverHash: s.server_hash, clientSeed: s.client_seed, nonce: s.nonce };
    const amount = Number(s.amount);

    const end = async (status: 'lost' | 'cashed', payout: number, hit?: number) => {
      const res = await settle(c, u.id, 'mines', amount, payout, { edge, mines: st.mines, positions: st.positions, revealed: st.revealed, hit: hit ?? null }, fair);
      await cq(c, `UPDATE game_sessions SET status = $2, state = $3, ended_at = NOW() WHERE id = $1`, [s.id, status, JSON.stringify(st)]);
      return { ended: true, status, positions: st.positions, revealed: st.revealed, hit: hit ?? null, payout: res.payout, multiplier: res.multiplier, balance: res.balance };
    };

    if (b.action === 'reveal') {
      const tile = int(b.tile, 'Kare', { min: 0, max: TILES - 1 });
      if (st.revealed.includes(tile)) throw new HttpError(400, 'Bu kare zaten açık.');
      if (st.positions.includes(tile)) return end('lost', 0, tile);
      st.revealed.push(tile);
      if (st.revealed.length === TILES - st.mines) return end('cashed', amount * minesMultiplier(st.mines, st.revealed.length, edge));
      await cq(c, 'UPDATE game_sessions SET state = $2 WHERE id = $1', [s.id, JSON.stringify(st)]);
      return { game: view({ ...s, state: st }, edge) };
    }

    if (b.action === 'cashout') {
      if (st.revealed.length === 0) throw new HttpError(400, 'Kazancı almak için en az bir kare aç.');
      return end('cashed', amount * minesMultiplier(st.mines, st.revealed.length, edge));
    }
    throw new HttpError(400, 'Geçersiz işlem.');
  });
});
