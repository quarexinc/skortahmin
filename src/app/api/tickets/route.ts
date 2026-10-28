import { HttpError, requireUser } from '@/lib/auth';
import { q, q1 } from '@/lib/db';
import { body, oneOf, route, str } from '@/lib/http';

export const dynamic = 'force-dynamic';

export const GET = route(async () => {
  const u = await requireUser();
  const items = await q(
    `SELECT t.id, t.subject, t.category, t.priority, t.status, t.created_at, t.updated_at,
       (SELECT COUNT(*)::int FROM ticket_messages m WHERE m.ticket_id = t.id) AS messages,
       (SELECT is_staff FROM ticket_messages m WHERE m.ticket_id = t.id ORDER BY id DESC LIMIT 1) AS last_by_staff
     FROM tickets t WHERE t.user_id = $1 ORDER BY t.updated_at DESC`,
    [u.id],
  );
  return { items };
});

export const POST = route(async (req) => {
  const u = await requireUser();
  const b = await body(req);
  const subject = str(b.subject, 'Konu', { min: 3, max: 120 });
  const message = str(b.message, 'Mesaj', { min: 10, max: 4000 });
  const category = oneOf(b.category, ['genel', 'hesap', 'oyun', 'adil', 'sorumlu', 'hata', 'oneri'] as const, 'Kategori');
  let priority = oneOf(b.priority ?? 'normal', ['low', 'normal', 'high', 'urgent'] as const, 'Öncelik');
  const vip = u.vipLevel >= 4 || u.isAdmin;
  if (priority === 'urgent' && !vip) priority = 'high';
  const [{ n }] = await q<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM tickets WHERE user_id = $1 AND status <> 'closed'`,
    [u.id],
  );
  if (n >= 5) throw new HttpError(429, 'Aynı anda en fazla 5 açık talebin olabilir. Lütfen önce mevcut taleplerini kapat.');
  const t = await q1<{ id: number }>(
    `INSERT INTO tickets (user_id, subject, category, priority) VALUES ($1, $2, $3, $4) RETURNING id`,
    [u.id, subject, category, vip && priority === 'normal' ? 'high' : priority],
  );
  await q('INSERT INTO ticket_messages (ticket_id, author_id, body) VALUES ($1, $2, $3)', [t!.id, u.id, message]);
  return { id: t!.id };
});
