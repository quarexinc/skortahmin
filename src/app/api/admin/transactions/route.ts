// Kredi işlemleri defteri (yönetici)
import { requireAdmin } from '@/lib/auth';
import { q } from '@/lib/db';
import { route } from '@/lib/http';

export const dynamic = 'force-dynamic';

export const GET = route(async (req) => {
  await requireAdmin();
  const sp = new URL(req.url).searchParams;
  const type = sp.get('type') || null;
  const user = sp.get('user') ? Number(sp.get('user')) : null;
  const page = Math.max(0, Math.min(1000, Number(sp.get('page') ?? 0) || 0));
  const items = await q(
    `SELECT t.id, t.type, t.amount, t.balance_after, t.ref, t.note, t.created_at, u.id AS user_id, u.name
     FROM transactions t JOIN users u ON u.id = t.user_id
     WHERE ($1::text IS NULL OR t.type = $1) AND ($2::int IS NULL OR t.user_id = $2)
     ORDER BY t.id DESC LIMIT 51 OFFSET ${page * 50}`,
    [type, Number.isInteger(user) ? user : null],
  );
  const summary = await q(
    `SELECT type, COUNT(*)::int AS n, SUM(amount)::bigint AS sum,
       SUM(amount) FILTER (WHERE created_at > NOW() - INTERVAL '1 day')::bigint AS sum_day
     FROM transactions GROUP BY type ORDER BY type`,
  );
  return { items: items.slice(0, 50), more: items.length > 50, summary };
});
