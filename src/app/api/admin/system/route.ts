// Sistem durumu: veritabanı, ortam değişkenleri, sürüm bilgisi.
import { requireAdmin } from '@/lib/auth';
import { q } from '@/lib/db';
import { route } from '@/lib/http';

export const dynamic = 'force-dynamic';

export const GET = route(async () => {
  await requireAdmin();
  const t0 = Date.now();
  const [{ now, version, size }] = await q<{ now: string; version: string; size: string }>(
    `SELECT NOW()::text AS now, split_part(version(), ' ', 2) AS version, pg_size_pretty(pg_database_size(current_database())) AS size`,
  );
  const dbLatency = Date.now() - t0;
  const tables = await q<{ name: string; rows: number }>(
    `SELECT relname AS name, n_live_tup::int AS rows FROM pg_stat_user_tables ORDER BY n_live_tup DESC`,
  );
  const [game] = await q<{ rounds: number; last: string | null; sessions: number; bets24: number; unsettled: number }>(
    `SELECT (SELECT COUNT(*)::int FROM crash_rounds) AS rounds,
            (SELECT MAX(crashed_at)::text FROM crash_rounds WHERE settled) AS last,
            (SELECT COUNT(*)::int FROM game_sessions WHERE status = 'active') AS sessions,
            (SELECT COUNT(*)::int FROM bets WHERE created_at > NOW() - INTERVAL '24 hours') AS bets24,
            (SELECT COUNT(*)::int FROM crash_rounds WHERE NOT settled AND crashed_at < NOW()) AS unsettled`,
  );
  const env = {
    DATABASE_URL: !!(process.env.DATABASE_URL || process.env.POSTGRES_URL),
    AUTH_SECRET: (process.env.AUTH_SECRET?.length ?? 0) >= 32,
    ADMIN_EMAIL: !!process.env.ADMIN_EMAIL,
  };
  return {
    db: { ok: true, latencyMs: dbLatency, now, version, size, tables },
    game,
    env,
    runtime: {
      node: process.version,
      region: process.env.VERCEL_REGION ?? 'yerel',
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
      commitMessage: process.env.VERCEL_GIT_COMMIT_MESSAGE?.split('\n')[0] ?? null,
      env: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    },
  };
});
