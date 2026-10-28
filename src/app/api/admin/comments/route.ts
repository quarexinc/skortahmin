import { requireAdmin } from '@/lib/auth';
import { audit, q } from '@/lib/db';
import { body, int, route } from '@/lib/http';

export const dynamic = 'force-dynamic';

export const GET = route(async (req) => {
  await requireAdmin();
  const filter = new URL(req.url).searchParams.get('filter') ?? 'all';
  const items = await q(
    `SELECT c.id, c.fixture_id, c.body, c.hidden, c.reports, c.created_at, u.id AS user_id, u.name, u.email
     FROM comments c JOIN users u ON u.id = c.user_id
     WHERE ($1 = 'all' OR ($1 = 'flagged' AND (c.reports > 0 OR c.hidden)))
     ORDER BY c.id DESC LIMIT 200`,
    [filter],
  );
  return { items };
});

export const PATCH = route(async (req) => {
  const admin = await requireAdmin();
  const b = await body(req);
  const id = int(b.id, 'Yorum');
  await q('UPDATE comments SET hidden = $2, reports = CASE WHEN $2 THEN reports ELSE 0 END WHERE id = $1', [id, b.hidden === true]);
  if (b.hidden !== true) await q('DELETE FROM comment_reports WHERE comment_id = $1', [id]);
  await audit(admin.id, b.hidden ? 'admin.comment.hide' : 'admin.comment.unhide', `comment:${id}`);
  return { ok: true };
});
