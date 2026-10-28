import { requireUser } from '@/lib/auth';
import { q } from '@/lib/db';
import { route } from '@/lib/http';

export const dynamic = 'force-dynamic';

export const GET = route(async (req) => {
  const u = await requireUser();
  const sp = new URL(req.url).searchParams;
  const game = sp.get('game');
  const page = Math.max(0, Number(sp.get('page') ?? 0) || 0);
  const items = await q(
    `SELECT id, game, amount, payout, multiplier, detail, server_hash, client_seed, nonce, created_at FROM bets
     WHERE user_id = $1 AND ($2::text IS NULL OR game = $2) ORDER BY id DESC LIMIT 30 OFFSET ${page * 30}`,
    [u.id, game || null],
  );
  const perGame = await q(
    `SELECT game, COUNT(*)::int AS bets, SUM(amount)::bigint AS wagered, SUM(payout)::bigint AS paid, MAX(multiplier)::float AS best
     FROM bets WHERE user_id = $1 GROUP BY game`,
    [u.id],
  );
  return { items, perGame };
});
