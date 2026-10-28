import { HttpError, requireUser } from '@/lib/auth';
import { q, q1 } from '@/lib/db';
import { body, int, route, str } from '@/lib/http';

export const dynamic = 'force-dynamic';

export const GET = route(async () => {
  const u = await requireUser();
  const items = await q(
    `SELECT id, months, note, status, admin_note, created_at, decided_at FROM premium_requests WHERE user_id = $1 ORDER BY id DESC LIMIT 10`,
    [u.id],
  );
  return { items };
});

export const POST = route(async (req) => {
  const u = await requireUser();
  if (u.isAdmin) throw new HttpError(400, 'Yöneticiler zaten tüm premium özelliklere sahip.');
  const b = await body(req);
  const months = int(b.months, 'Süre', { min: 1, max: 12 });
  const note = str(b.note, 'Not', { max: 500, optional: true }) || null;
  const pending = await q1(`SELECT id FROM premium_requests WHERE user_id = $1 AND status = 'pending'`, [u.id]);
  if (pending) throw new HttpError(409, 'Zaten bekleyen bir premium talebin var.');
  await q('INSERT INTO premium_requests (user_id, months, note) VALUES ($1, $2, $3)', [u.id, months, note]);
  return { ok: true };
});
