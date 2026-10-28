import { requireUser } from '@/lib/auth';
import { q, q1 } from '@/lib/db';
import { route } from '@/lib/http';
import { scorePending } from '@/lib/scoring';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export const GET = route(async () => {
  const u = await requireUser();
  await scorePending().catch(() => 0);
  const items = await q(
    `SELECT fixture_id, home_goals, away_goals, fixture_date, home_name, away_name, league_name, status, actual_home, actual_away, points
     FROM predictions WHERE user_id = $1 ORDER BY fixture_date DESC LIMIT 300`,
    [u.id],
  );
  const stats = await q1(
    `SELECT COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE status = 'scored')::int AS scored,
       COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
       COALESCE(SUM(points), 0)::int AS points,
       COUNT(*) FILTER (WHERE points = 3)::int AS exact,
       COUNT(*) FILTER (WHERE points >= 1)::int AS correct
     FROM predictions WHERE user_id = $1`,
    [u.id],
  );
  return { items, stats };
});
