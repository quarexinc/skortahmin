import { requireAdmin } from '@/lib/auth';
import { q } from '@/lib/db';
import { route } from '@/lib/http';

export const dynamic = 'force-dynamic';

export const GET = route(async (req) => {
  await requireAdmin();
  const sp = new URL(req.url).searchParams;
  const status = sp.get('status') ?? 'active';
  const search = (sp.get('q') ?? '').trim().toLowerCase();
  const items = await q(
    `SELECT t.id, t.subject, t.category, t.priority, t.status, t.created_at, t.updated_at,
       COALESCE(u.name, t.guest_name) AS who, COALESCE(u.email, t.guest_email) AS email, t.user_id IS NULL AS guest,
       (u.plan = 'premium') AS premium,
       (SELECT COUNT(*)::int FROM ticket_messages m WHERE m.ticket_id = t.id) AS messages
     FROM tickets t LEFT JOIN users u ON u.id = t.user_id
     WHERE ($1 = 'all' OR ($1 = 'active' AND t.status <> 'closed') OR t.status = $1)
       AND ($2 = '' OR LOWER(t.subject) LIKE '%' || $2 || '%' OR LOWER(COALESCE(u.email, t.guest_email)) LIKE '%' || $2 || '%' OR t.id::text = $2)
     ORDER BY CASE t.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,
       CASE t.status WHEN 'open' THEN 0 WHEN 'waiting' THEN 1 WHEN 'answered' THEN 2 ELSE 3 END, t.updated_at DESC
     LIMIT 200`,
    [status, search],
  );
  return { items };
});
