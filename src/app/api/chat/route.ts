// Üye tarafı canlı destek: kendi açık görüşmesi.
import { HttpError, requireUser } from '@/lib/auth';
import { q, q1 } from '@/lib/db';
import { body, route, str } from '@/lib/http';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export const GET = route(async (req) => {
  const u = await requireUser();
  const after = Number(new URL(req.url).searchParams.get('after') ?? 0) || 0;
  const chat = await q1<{ id: number; status: string }>(
    'SELECT id, status FROM chats WHERE user_id = $1 ORDER BY id DESC LIMIT 1',
    [u.id],
  );
  if (!chat) return { messages: [], status: null };
  const messages = await q(
    'SELECT id, sender, body, created_at FROM chat_messages WHERE chat_id = $1 AND id > $2 ORDER BY id LIMIT 200',
    [chat.id, after],
  );
  await q('UPDATE chats SET user_unread = 0 WHERE id = $1 AND user_unread > 0', [chat.id]);
  return { messages, status: chat.status };
});

export const POST = route(async (req) => {
  const u = await requireUser();
  if (!(await getSettings()).liveChatEnabled) throw new HttpError(403, 'Canlı destek şu anda kapalı.');
  const b = await body(req);
  const text = str(b.body, 'Mesaj', { max: 1000 });
  const [{ n }] = await q<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM chat_messages m JOIN chats c ON c.id = m.chat_id
     WHERE c.user_id = $1 AND m.sender = 'user' AND m.created_at > NOW() - INTERVAL '1 minute'`,
    [u.id],
  );
  if (n >= 10) throw new HttpError(429, 'Çok hızlı mesaj gönderiyorsunuz; lütfen biraz bekleyin.');
  let chat = await q1<{ id: number }>(`SELECT id FROM chats WHERE user_id = $1 AND status = 'open' ORDER BY id DESC LIMIT 1`, [u.id]);
  if (!chat) chat = await q1<{ id: number }>('INSERT INTO chats (user_id) VALUES ($1) RETURNING id', [u.id]);
  await q(`INSERT INTO chat_messages (chat_id, sender, body) VALUES ($1, 'user', $2)`, [chat!.id, text]);
  await q('UPDATE chats SET admin_unread = admin_unread + 1, last_message_at = NOW() WHERE id = $1', [chat!.id]);
  return { ok: true };
});
