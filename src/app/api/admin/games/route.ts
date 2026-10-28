// Oyun istatistikleri ve el listesi (yönetici)
import { requireAdmin } from '@/lib/auth';
import { q } from '@/lib/db';
import { route } from '@/lib/http';

export const dynamic = 'force-dynamic';

const PERIOD: Record<string, string> = { day: "NOW() - INTERVAL '1 day'", week: "NOW() - INTERVAL '7 days'", month: "NOW() - INTERVAL '30 days'", all: "'epoch'::timestamptz" };

export const GET = route(async (req) => {
  await requireAdmin();
  const sp = new URL(req.url).searchParams;
  const since = PERIOD[sp.get('period') ?? 'week'] ?? PERIOD.week;
  const game = sp.get('game') || null;
  const user = sp.get('user') ? Number(sp.get('user')) : null;
  const minPayout = sp.get('big') === '1';
  const page = Math.max(0, Math.min(1000, Number(sp.get('page') ?? 0) || 0));
  const stats = await q(
    `SELECT game, COUNT(*)::int AS bets, COUNT(DISTINCT user_id)::int AS players, SUM(amount)::bigint AS wagered, SUM(payout)::bigint AS paid,
       COUNT(*) FILTER (WHERE payout > amount)::int AS wins, MAX(multiplier)::float AS best, AVG(amount)::bigint AS avg_bet
     FROM bets WHERE created_at >= ${since} GROUP BY game ORDER BY game`,
  );
  const items = await q(
    `SELECT b.id, b.game, b.amount, b.payout, b.multiplier, b.created_at, b.server_hash, b.client_seed, b.nonce, u.id AS user_id, u.name
     FROM bets b JOIN users u ON u.id = b.user_id
     WHERE b.created_at >= ${since} AND ($1::text IS NULL OR b.game = $1) AND ($2::int IS NULL OR b.user_id = $2) ${minPayout ? 'AND b.payout - b.amount >= 1000 * 100' : ''}
     ORDER BY b.id DESC LIMIT 51 OFFSET ${page * 50}`,
    [game, Number.isInteger(user) ? user : null],
  );
  const top = await q(
    `SELECT u.id, u.name, COUNT(*)::int AS bets, SUM(b.amount)::bigint AS wagered, (SUM(b.payout) - SUM(b.amount))::bigint AS profit
     FROM bets b JOIN users u ON u.id = b.user_id WHERE b.created_at >= ${since} AND ($1::text IS NULL OR b.game = $1)
     GROUP BY u.id ORDER BY SUM(b.payout) - SUM(b.amount) DESC LIMIT 10`,
    [game],
  );
  const sessions = await q(
    `SELECT s.id, s.game, s.amount, s.created_at, u.id AS user_id, u.name FROM game_sessions s JOIN users u ON u.id = s.user_id WHERE s.status = 'active' ORDER BY s.id DESC LIMIT 20`,
  );
  return { stats, items: items.slice(0, 50), more: items.length > 50, top, sessions };
});
