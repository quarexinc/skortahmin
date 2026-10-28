import { requireAdmin } from '@/lib/auth';
import { q } from '@/lib/db';
import { route } from '@/lib/http';

export const dynamic = 'force-dynamic';

export const GET = route(async (req) => {
  await requireAdmin();
  const status = new URL(req.url).searchParams.get('status') ?? 'open';
  const items = await q(
    `SELECT c.id, c.status, c.admin_unread, c.last_message_at, u.id AS user_id, u.name, u.email, u.avatar_color,
       (u.plan = 'premium') AS premium,
       (SELECT body FROM chat_messages m WHERE m.chat_id = c.id ORDER BY id DESC LIMIT 1) AS last_body,
       (SELECT sender FROM chat_messages m WHERE m.chat_id = c.id ORDER BY id DESC LIMIT 1) AS last_sender
     FROM chats c JOIN users u ON u.id = c.user_id
     WHERE ($1 = 'all' OR c.status = $1) ORDER BY c.admin_unread > 0 DESC, c.last_message_at DESC LIMIT 100`,
    [status],
  );
  return { items };
});
