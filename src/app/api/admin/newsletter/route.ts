import { requireAdmin } from '@/lib/auth';
import { audit, q } from '@/lib/db';
import { int, route } from '@/lib/http';

export const dynamic = 'force-dynamic';

export const GET = route(async () => {
  await requireAdmin();
  return { items: await q('SELECT id, email, active, created_at FROM newsletter ORDER BY id DESC LIMIT 1000') };
});

export const DELETE = route(async (req) => {
  const admin = await requireAdmin();
  const id = int(new URL(req.url).searchParams.get('id'), 'Kayıt');
  await q('DELETE FROM newsletter WHERE id = $1', [id]);
  await audit(admin.id, 'admin.newsletter.delete', `newsletter:${id}`);
  return { ok: true };
});
