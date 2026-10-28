// Sistem durumu: veritabanı, API-Football kotası, ortam değişkenleri, sürüm bilgisi.
import { requireAdmin } from '@/lib/auth';
import { API_FOOTBALL_BASE_URL, API_FOOTBALL_KEY } from '@/config';
import { q } from '@/lib/db';
import { route } from '@/lib/http';

export const dynamic = 'force-dynamic';

let apiCache: { at: number; data: unknown } | null = null;

async function apiStatus() {
  if (apiCache && Date.now() - apiCache.at < 10 * 60_000) return apiCache.data;
  try {
    const r = await fetch(`${API_FOOTBALL_BASE_URL}/status`, { headers: { 'x-apisports-key': API_FOOTBALL_KEY }, cache: 'no-store', signal: AbortSignal.timeout(8000) });
    const j = await r.json();
    const resp = j?.response ?? {};
    const errs = j?.errors && Object.values(j.errors).length ? Object.values(j.errors).join(' | ') : null;
    const data = {
      ok: !errs,
      error: errs,
      plan: resp?.subscription?.plan ?? null,
      end: resp?.subscription?.end ?? null,
      active: resp?.subscription?.active ?? null,
      requestsToday: resp?.requests?.current ?? null,
      limitDay: resp?.requests?.limit_day ?? null,
    };
    apiCache = { at: Date.now(), data };
    return data;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ulaşılamadı' };
  }
}

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
  const env = {
    API_FOOTBALL_KEY: !!process.env.API_FOOTBALL_KEY,
    DATABASE_URL: !!(process.env.DATABASE_URL || process.env.POSTGRES_URL),
    AUTH_SECRET: (process.env.AUTH_SECRET?.length ?? 0) >= 32,
    ADMIN_EMAIL: !!process.env.ADMIN_EMAIL,
  };
  return {
    db: { ok: true, latencyMs: dbLatency, now, version, size, tables },
    api: await apiStatus(),
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
