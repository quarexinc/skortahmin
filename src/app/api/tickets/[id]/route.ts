// Tek destek talebi: sahibi veya yönetici erişebilir. Yönetici yanıtları "destek ekibi" olarak işaretlenir.
import { HttpError, requireUser, type SessionUser } from '@/lib/auth';
import { audit, notify, q, q1 } from '@/lib/db';
import { body, oneOf, route, str } from '@/lib/http';

export const dynamic = 'force-dynamic';

interface Ticket {
  id: number;
  user_id: number | null;
  status: string;
}

async function load(id: number, u: SessionUser): Promise<Ticket> {
  const t = await q1<Ticket>('SELECT id, user_id, status FROM tickets WHERE id = $1', [id]);
  if (!t || (!u.isAdmin && t.user_id !== u.id)) throw new HttpError(404, 'Talep bulunamadı.');
  return t;
}

type Ctx = { params: { id: string } };

export const GET = route<Ctx>(async (_req, { params }) => {
  const u = await requireUser();
  const t = await load(Number(params.id), u);
  const ticket = await q1(
    `SELECT t.*, u.name AS user_name, u.email AS user_email, u.plan AS user_plan
     FROM tickets t LEFT JOIN users u ON u.id = t.user_id WHERE t.id = $1`,
    [t.id],
  );
  const messages = await q(
    `SELECT m.id, m.body, m.is_staff, m.created_at, u.name AS author_name, u.avatar_color
     FROM ticket_messages m LEFT JOIN users u ON u.id = m.author_id WHERE m.ticket_id = $1 ORDER BY m.id`,
    [t.id],
  );
  return { ticket, messages };
});

export const POST = route<Ctx>(async (req, { params }) => {
  const u = await requireUser();
  const t = await load(Number(params.id), u);
  const b = await body(req);
  const text = str(b.body, 'Mesaj', { min: 2, max: 4000 });
  const staff = u.isAdmin && t.user_id !== u.id;
  await q('INSERT INTO ticket_messages (ticket_id, author_id, is_staff, body) VALUES ($1, $2, $3, $4)', [t.id, u.id, staff, text]);
  await q('UPDATE tickets SET status = $2, updated_at = NOW() WHERE id = $1', [t.id, staff ? 'answered' : 'open']);
  if (staff && t.user_id) {
    await notify(t.user_id, `Destek talebine yanıt geldi (#${t.id})`, text.slice(0, 140), `/destek/${t.id}`);
    await audit(u.id, 'ticket.reply', `ticket:${t.id}`);
  }
  return { ok: true };
});

export const PATCH = route<Ctx>(async (req, { params }) => {
  const u = await requireUser();
  const t = await load(Number(params.id), u);
  const b = await body(req);
  if (b.status !== undefined) {
    const status = oneOf(b.status, u.isAdmin ? (['open', 'answered', 'waiting', 'closed'] as const) : (['open', 'closed'] as const), 'Durum');
    await q('UPDATE tickets SET status = $2, updated_at = NOW() WHERE id = $1', [t.id, status]);
    if (u.isAdmin && t.user_id && t.user_id !== u.id && status === 'closed')
      await notify(t.user_id, `Destek talebin kapatıldı (#${t.id})`, undefined, `/destek/${t.id}`);
  }
  if (u.isAdmin && b.priority !== undefined) {
    const p = oneOf(b.priority, ['low', 'normal', 'high', 'urgent'] as const, 'Öncelik');
    await q('UPDATE tickets SET priority = $2 WHERE id = $1', [t.id, p]);
  }
  if (u.isAdmin) await audit(u.id, 'ticket.update', `ticket:${t.id}`, b);
  return { ok: true };
});
