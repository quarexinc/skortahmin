import { requireAdmin } from '@/lib/auth';
import { q } from '@/lib/db';
import { route } from '@/lib/http';

export const dynamic = 'force-dynamic';

export const GET = route(async (req) => {
  await requireAdmin();
  const status = new URL(req.url).searchParams.get('status') ?? 'pending';
  const items = await q(
    `SELECT r.*, u.name, u.email, u.plan, u.premium_until, d.name AS decided_by_name
     FROM premium_requests r JOIN users u ON u.id = r.user_id LEFT JOIN users d ON d.id = r.decided_by
     WHERE ($1 = 'all' OR r.status = $1) ORDER BY r.id DESC LIMIT 100`,
    [status],
  );
  return { items };
});
