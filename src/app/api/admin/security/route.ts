import { requireAdmin } from '@/lib/auth';
import { q } from '@/lib/db';
import { body, route, str } from '@/lib/http';
import { audit } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const GET = route(async () => {
  await requireAdmin();
  const failed = await q(`SELECT email, ip, created_at FROM login_attempts WHERE NOT success ORDER BY id DESC LIMIT 100`);
  const topIps = await q(
    `SELECT ip, COUNT(*)::int AS n, MAX(created_at) AS last FROM login_attempts WHERE NOT success AND created_at > NOW() - INTERVAL '7 days'
     GROUP BY ip ORDER BY n DESC LIMIT 10`,
  );
  const locked = await q(
    `SELECT email, COUNT(*)::int AS n, MAX(created_at) AS last FROM login_attempts WHERE NOT success AND created_at > NOW() - INTERVAL '15 minutes'
     GROUP BY email HAVING COUNT(*) >= 5`,
  );
  const [stats] = await q(
    `SELECT COUNT(*) FILTER (WHERE success)::int AS ok24, COUNT(*) FILTER (WHERE NOT success)::int AS fail24
     FROM login_attempts WHERE created_at > NOW() - INTERVAL '1 day'`,
  );
  return { failed, topIps, locked, stats };
});

// Kilitli e-postanın kilidini aç (hatalı denemeleri sil)
export const POST = route(async (req) => {
  const admin = await requireAdmin();
  const email = str((await body(req)).email, 'E-posta', { max: 120 }).toLowerCase();
  await q('DELETE FROM login_attempts WHERE email = $1 AND NOT success', [email]);
  await audit(admin.id, 'admin.security.unlock', email);
  return { ok: true };
});
