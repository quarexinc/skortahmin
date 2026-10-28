import { requireUser } from '@/lib/auth';
import { q } from '@/lib/db';
import { body, route } from '@/lib/http';

export const dynamic = 'force-dynamic';

export const GET = route(async (req) => {
  const u = await requireUser();
  const all = new URL(req.url).searchParams.get('all') === '1';
  const items = await q(
    `SELECT id, title, body, link, read, created_at FROM notifications WHERE user_id = $1
     ORDER BY created_at DESC LIMIT ${all ? 200 : 15}`,
    [u.id],
  );
  return { items };
});

export const PATCH = route(async (req) => {
  const u = await requireUser();
  const b = await body(req);
  if (b.all) await q('UPDATE notifications SET read = TRUE WHERE user_id = $1', [u.id]);
  else if (Number.isInteger(b.id)) await q('UPDATE notifications SET read = TRUE WHERE user_id = $1 AND id = $2', [u.id, b.id]);
  return { ok: true };
});

export const DELETE = route(async () => {
  const u = await requireUser();
  await q('DELETE FROM notifications WHERE user_id = $1 AND read', [u.id]);
  return { ok: true };
});
