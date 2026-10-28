// Toplu bildirim gönderimi
import { requireAdmin } from '@/lib/auth';
import { audit, q } from '@/lib/db';
import { body, oneOf, route, str } from '@/lib/http';

export const dynamic = 'force-dynamic';

export const POST = route(async (req) => {
  const admin = await requireAdmin();
  const b = await body(req);
  const audience = oneOf(b.audience, ['all', 'premium', 'free'] as const, 'Hedef kitle');
  const title = str(b.title, 'Başlık', { min: 2, max: 120 });
  const text = str(b.body, 'Metin', { max: 400, optional: true }) || null;
  const link = typeof b.link === 'string' && b.link.startsWith('/') ? b.link.slice(0, 200) : null;
  const cond =
    audience === 'premium'
      ? `plan = 'premium' AND (premium_until IS NULL OR premium_until > NOW())`
      : audience === 'free'
        ? `NOT (plan = 'premium' AND (premium_until IS NULL OR premium_until > NOW()))`
        : 'TRUE';
  const r = await q(
    `INSERT INTO notifications (user_id, title, body, link) SELECT id, $1, $2, $3 FROM users WHERE NOT banned AND ${cond} RETURNING id`,
    [title, text, link],
  );
  await audit(admin.id, 'admin.broadcast', audience, { title, count: r.length });
  return { sent: r.length };
});
