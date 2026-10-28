// Toplu bildirim gönderimi
import { requireAdmin } from '@/lib/auth';
import { audit, q } from '@/lib/db';
import { body, oneOf, route, str } from '@/lib/http';

export const dynamic = 'force-dynamic';

export const POST = route(async (req) => {
  const admin = await requireAdmin();
  const b = await body(req);
  const audience = oneOf(b.audience, ['all', 'players', 'vip', 'inactive'] as const, 'Hedef kitle');
  const title = str(b.title, 'Başlık', { min: 2, max: 120 });
  const text = str(b.body, 'Metin', { max: 400, optional: true }) || null;
  const link = typeof b.link === 'string' && b.link.startsWith('/') ? b.link.slice(0, 200) : null;
  const cond =
    audience === 'players'
      ? `wagered > 0`
      : audience === 'vip'
        ? `wagered >= 4000000`
        : audience === 'inactive'
          ? `(last_login_at IS NULL OR last_login_at < NOW() - INTERVAL '14 days')`
          : 'TRUE';
  const r = await q(
    `INSERT INTO notifications (user_id, title, body, link) SELECT id, $1, $2, $3 FROM users WHERE NOT banned AND ${cond} RETURNING id`,
    [title, text, link],
  );
  await audit(admin.id, 'admin.broadcast', audience, { title, count: r.length });
  return { sent: r.length };
});
