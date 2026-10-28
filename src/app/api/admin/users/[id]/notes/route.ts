import { requireAdmin } from '@/lib/auth';
import { q } from '@/lib/db';
import { body, int, route, str } from '@/lib/http';

export const dynamic = 'force-dynamic';
type Ctx = { params: { id: string } };

export const GET = route<Ctx>(async (_req, { params }) => {
  await requireAdmin();
  const items = await q(
    `SELECT n.id, n.body, n.created_at, a.name AS author FROM user_notes n LEFT JOIN users a ON a.id = n.author_id WHERE n.user_id = $1 ORDER BY n.id DESC`,
    [int(params.id, 'Kullanıcı')],
  );
  return { items };
});

export const POST = route<Ctx>(async (req, { params }) => {
  const admin = await requireAdmin();
  const text = str((await body(req)).body, 'Not', { max: 1000 });
  await q('INSERT INTO user_notes (user_id, author_id, body) VALUES ($1, $2, $3)', [int(params.id, 'Kullanıcı'), admin.id, text]);
  return { ok: true };
});

export const DELETE = route<Ctx>(async (req) => {
  await requireAdmin();
  await q('DELETE FROM user_notes WHERE id = $1', [int(new URL(req.url).searchParams.get('note'), 'Not')]);
  return { ok: true };
});
