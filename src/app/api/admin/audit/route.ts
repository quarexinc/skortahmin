import { requireAdmin } from '@/lib/auth';
import { q } from '@/lib/db';
import { route } from '@/lib/http';

export const dynamic = 'force-dynamic';

export const GET = route(async (req) => {
  await requireAdmin();
  const action = (new URL(req.url).searchParams.get('action') ?? '').trim();
  const items = await q(
    `SELECT a.id, a.action, a.target, a.meta, a.created_at, u.name AS actor_name, u.email AS actor_email
     FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_id
     WHERE ($1 = '' OR a.action LIKE $1 || '%') ORDER BY a.id DESC LIMIT 300`,
    [action],
  );
  return { items };
});
