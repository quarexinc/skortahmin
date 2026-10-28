import { requireAdmin } from '@/lib/auth';
import { audit, q } from '@/lib/db';
import { route } from '@/lib/http';
import { scorePending } from '@/lib/scoring';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export const GET = route(async () => {
  await requireAdmin();
  const fixtures = await q(
    `SELECT fixture_id, MIN(home_name) AS home_name, MIN(away_name) AS away_name, MIN(league_name) AS league_name, MIN(fixture_date) AS fixture_date,
       COUNT(*)::int AS n, COUNT(*) FILTER (WHERE status = 'pending')::int AS pending, MIN(actual_home) AS actual_home, MIN(actual_away) AS actual_away
     FROM predictions GROUP BY fixture_id ORDER BY MIN(fixture_date) DESC LIMIT 100`,
  );
  return { fixtures };
});

export const POST = route(async () => {
  const admin = await requireAdmin();
  const n = await scorePending({ force: true, limit: 12 });
  await audit(admin.id, 'admin.predictions.score', undefined, { scored: n });
  return { scored: n };
});
