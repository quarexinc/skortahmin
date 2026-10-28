import { requireAdmin } from '@/lib/auth';
import { q } from '@/lib/db';
import { route } from '@/lib/http';

export const dynamic = 'force-dynamic';

export const GET = route(async (req) => {
  await requireAdmin();
  const sp = new URL(req.url).searchParams;
  const search = (sp.get('q') ?? '').trim();
  const filter = sp.get('filter') ?? 'all';
  const page = Math.max(0, Number(sp.get('page') ?? 0) || 0);
  const where: string[] = [];
  const params: unknown[] = [];
  if (search) {
    params.push(`%${search.toLowerCase()}%`);
    where.push(`(LOWER(u.email) LIKE $${params.length} OR LOWER(u.name) LIKE $${params.length} OR u.id::text = $${params.length + 1})`);
    params.push(search);
  }
  if (filter === 'premium') where.push(`u.plan = 'premium' AND (u.premium_until IS NULL OR u.premium_until > NOW())`);
  if (filter === 'admin') where.push(`u.role = 'admin'`);
  if (filter === 'banned') where.push('u.banned');
  if (filter === 'free') where.push(`NOT (u.plan = 'premium' AND (u.premium_until IS NULL OR u.premium_until > NOW())) AND u.role <> 'admin'`);
  const w = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const items = await q(
    `SELECT u.id, u.name, u.email, u.role, u.plan, u.premium_until, u.banned, u.ban_reason, u.created_at, u.last_login_at, u.avatar_color,
       (SELECT COUNT(*)::int FROM predictions p WHERE p.user_id = u.id) AS predictions,
       (SELECT COALESCE(SUM(points),0)::int FROM predictions p WHERE p.user_id = u.id) AS points
     FROM users u ${w} ORDER BY u.id DESC LIMIT 50 OFFSET ${page * 50}`,
    params,
  );
  const [{ n }] = await q<{ n: number }>(`SELECT COUNT(*)::int AS n FROM users u ${w}`, params);
  return { items, total: n };
});
