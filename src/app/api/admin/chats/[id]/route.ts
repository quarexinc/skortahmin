import { HttpError, requireAdmin } from '@/lib/auth';
import { audit, q, q1 } from '@/lib/db';
import { body, int, route, str } from '@/lib/http';

export const dynamic = 'force-dynamic';
type Ctx = { params: { id: string } };

export const GET = route<Ctx>(async (req, { params }) => {
  await requireAdmin();
  const id = int(params.id, 'Görüşme');
  const after = Number(new URL(req.url).searchParams.get('after') ?? 0) || 0;
  const chat = await q1(
    `SELECT c.id, c.status, c.created_at, u.id AS user_id, u.name, u.email, u.plan, u.created_at AS user_created
     FROM chats c JOIN users u ON u.id = c.user_id WHERE c.id = $1`,
    [id],
  );
  if (!chat) throw new HttpError(404, 'Görüşme bulunamadı.');
  const messages = await q('SELECT id, sender, body, created_at FROM chat_messages WHERE chat_id = $1 AND id > $2 ORDER BY id LIMIT 500', [id, after]);
  await q('UPDATE chats SET admin_unread = 0 WHERE id = $1 AND admin_unread > 0', [id]);
  return { chat, messages };
});

export const POST = route<Ctx>(async (req, { params }) => {
  const admin = await requireAdmin();
  const id = int(params.id, 'Görüşme');
  const b = await body(req);
  if (b.action === 'close' || b.action === 'reopen') {
    await q('UPDATE chats SET status = $2 WHERE id = $1', [id, b.action === 'close' ? 'closed' : 'open']);
    await audit(admin.id, `admin.chat.${b.action}`, `chat:${id}`);
    return { ok: true };
  }
  const text = str(b.body, 'Mesaj', { max: 2000 });
  const c = await q1('SELECT id FROM chats WHERE id = $1', [id]);
  if (!c) throw new HttpError(404, 'Görüşme bulunamadı.');
  await q(`INSERT INTO chat_messages (chat_id, sender, body) VALUES ($1, 'admin', $2)`, [id, text]);
  await q(`UPDATE chats SET user_unread = user_unread + 1, last_message_at = NOW(), status = 'open' WHERE id = $1`, [id]);
  return { ok: true };
});
