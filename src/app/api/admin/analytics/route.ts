import { requireAdmin } from '@/lib/auth';
import { q } from '@/lib/db';
import { route } from '@/lib/http';

export const dynamic = 'force-dynamic';

export const GET = route(async (req) => {
  await requireAdmin();
  const days = Math.min(90, Math.max(7, Number(new URL(req.url).searchParams.get('days') ?? 30) || 30));
  const series = await q<{ day: string; views: number; visitors: number; signups: number; predictions: number }>(
    `SELECT to_char(d, 'YYYY-MM-DD') AS day,
       COALESCE((SELECT SUM(views) FROM page_views WHERE day = d::date), 0)::int AS views,
       COALESCE((SELECT COUNT(*) FROM daily_visitors WHERE day = d::date), 0)::int AS visitors,
       COALESCE((SELECT COUNT(*) FROM users WHERE (created_at AT TIME ZONE 'Europe/Istanbul')::date = d::date), 0)::int AS signups,
       COALESCE((SELECT COUNT(*) FROM predictions WHERE (created_at AT TIME ZONE 'Europe/Istanbul')::date = d::date), 0)::int AS predictions
     FROM generate_series((NOW() AT TIME ZONE 'Europe/Istanbul')::date - ($1::int - 1), (NOW() AT TIME ZONE 'Europe/Istanbul')::date, '1 day') d
     ORDER BY d`,
    [days],
  );
  const topPages = await q(
    `SELECT path, SUM(views)::int AS views FROM page_views WHERE day > (NOW() AT TIME ZONE 'Europe/Istanbul')::date - $1::int
     GROUP BY path ORDER BY views DESC LIMIT 15`,
    [days],
  );
  const totals = series.reduce(
    (a, s) => ({ views: a.views + s.views, visitors: a.visitors + s.visitors, signups: a.signups + s.signups, predictions: a.predictions + s.predictions }),
    { views: 0, visitors: 0, signups: 0, predictions: 0 },
  );
  return { series, topPages, totals, days };
});
