// Crash turları (yönetici)
import { requireAdmin } from '@/lib/auth';
import { q, q1 } from '@/lib/db';
import { route } from '@/lib/http';

export const dynamic = 'force-dynamic';

export const GET = route(async (req) => {
  await requireAdmin();
  const page = Math.max(0, Math.min(1000, Number(new URL(req.url).searchParams.get('page') ?? 0) || 0));
  const rounds = await q(
    `SELECT r.id, CASE WHEN r.settled THEN r.crash_point END AS crash_point, r.hash, CASE WHEN r.settled THEN r.seed END AS seed, r.starts_at, r.crashed_at, r.settled,
       COUNT(b.id)::int AS players, COALESCE(SUM(b.amount),0)::bigint AS wagered, COALESCE(SUM(b.payout),0)::bigint AS paid
     FROM crash_rounds r LEFT JOIN crash_bets b ON b.round_id = r.id
     WHERE r.starts_at < NOW()
     GROUP BY r.id ORDER BY r.id DESC LIMIT 51 OFFSET ${page * 50}`,
  );
  const dist = await q1(
    `SELECT COUNT(*)::int AS n, AVG(crash_point)::float AS avg,
       PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY crash_point)::float AS median,
       COUNT(*) FILTER (WHERE crash_point < 1.01)::int AS instant,
       COUNT(*) FILTER (WHERE crash_point >= 2)::int AS x2,
       COUNT(*) FILTER (WHERE crash_point >= 10)::int AS x10,
       COUNT(*) FILTER (WHERE crash_point >= 100)::int AS x100,
       MAX(crash_point)::float AS max
     FROM crash_rounds WHERE settled`,
  );
  return { rounds: rounds.slice(0, 50), more: rounds.length > 50, dist };
});
