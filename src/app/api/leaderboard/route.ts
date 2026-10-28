import { getUser } from '@/lib/auth';
import { q } from '@/lib/db';
import { route } from '@/lib/http';
import { scorePending } from '@/lib/scoring';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export const GET = route(async (req) => {
  const period = new URL(req.url).searchParams.get('period') ?? 'all';
  const since = period === 'week' ? "NOW() - INTERVAL '7 days'" : period === 'month' ? "NOW() - INTERVAL '30 days'" : "'epoch'::timestamptz";
  await scorePending().catch(() => 0);
  const rows = await q(
    `SELECT u.id, u.name, u.avatar_color, u.favorite_team,
       (u.plan = 'premium' AND (u.premium_until IS NULL OR u.premium_until > NOW())) AS premium,
       COALESCE(SUM(p.points), 0)::int AS points,
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE p.points = 3)::int AS exact,
       COUNT(*) FILTER (WHERE p.points >= 1)::int AS correct
     FROM predictions p JOIN users u ON u.id = p.user_id
     WHERE p.status = 'scored' AND NOT u.banned AND p.fixture_date >= ${since}
     GROUP BY u.id ORDER BY points DESC, exact DESC, total ASC LIMIT 100`,
  );
  const me = await getUser();
  return { rows, meId: me?.id ?? null };
});
