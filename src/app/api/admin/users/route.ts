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
  if (filter === 'admin') where.push(`u.role = 'admin'`);
  if (filter === 'banned') where.push('u.banned');
  if (filter === 'excluded') where.push('u.self_excluded_until > NOW()');
  if (filter === 'unverified') where.push(`u.birth_date IS NULL AND u.role <> 'admin'`);
  if (filter === 'players') where.push('u.wagered > 0');
  const w = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const items = await q(
    `SELECT u.id, u.name, u.email, u.role, u.banned, u.ban_reason, u.created_at, u.last_login_at, u.avatar_color,
       u.balance, u.vault, u.wagered, u.birth_date, u.self_excluded_until
     FROM users u ${w} ORDER BY ${sp.get('sort') === 'balance' ? 'u.balance + u.vault DESC,' : sp.get('sort') === 'wagered' ? 'u.wagered DESC,' : ''} u.id DESC LIMIT 50 OFFSET ${page * 50}`,
    params,
  );
  const [{ n }] = await q<{ n: number }>(`SELECT COUNT(*)::int AS n FROM users u ${w}`, params);
  return { items, total: n };
});
