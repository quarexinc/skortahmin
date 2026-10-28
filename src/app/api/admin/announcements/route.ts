import { requireAdmin } from '@/lib/auth';
import { audit, q } from '@/lib/db';
import { body, int, oneOf, route, str } from '@/lib/http';
import { invalidateSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export const GET = route(async () => {
  await requireAdmin();
  return { items: await q('SELECT * FROM announcements ORDER BY id DESC LIMIT 100') };
});

export const POST = route(async (req) => {
  const admin = await requireAdmin();
  const b = await body(req);
  const title = str(b.title, 'Başlık', { min: 2, max: 120 });
  const text = str(b.body, 'Metin', { max: 400, optional: true }) || null;
  const level = oneOf(b.level ?? 'info', ['info', 'success', 'warning'] as const, 'Tür');
  await q('INSERT INTO announcements (title, body, level, created_by) VALUES ($1, $2, $3, $4)', [title, text, level, admin.id]);
  invalidateSettings();
  await audit(admin.id, 'admin.announcement.create', title);
  return { ok: true };
});

export const PATCH = route(async (req) => {
  const admin = await requireAdmin();
  const b = await body(req);
  const id = int(b.id, 'Duyuru');
  await q('UPDATE announcements SET active = $2 WHERE id = $1', [id, b.active === true]);
  invalidateSettings();
  await audit(admin.id, 'admin.announcement.toggle', `announcement:${id}`, { active: b.active });
  return { ok: true };
});

export const DELETE = route(async (req) => {
  const admin = await requireAdmin();
  const id = int(new URL(req.url).searchParams.get('id'), 'Duyuru');
  await q('DELETE FROM announcements WHERE id = $1', [id]);
  invalidateSettings();
  await audit(admin.id, 'admin.announcement.delete', `announcement:${id}`);
  return { ok: true };
});
