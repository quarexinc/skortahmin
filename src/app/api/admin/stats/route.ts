import { requireAdmin } from '@/lib/auth';
import { q, q1 } from '@/lib/db';
import { route } from '@/lib/http';

export const dynamic = 'force-dynamic';

export const GET = route(async () => {
  await requireAdmin();
  const counts = await q1(
    `SELECT
      (SELECT COUNT(*)::int FROM users) AS users,
      (SELECT COUNT(*)::int FROM users WHERE created_at > NOW() - INTERVAL '1 day') AS users_today,
      (SELECT COUNT(*)::int FROM users WHERE created_at > NOW() - INTERVAL '7 days') AS users_week,
      (SELECT COUNT(*)::int FROM users WHERE plan = 'premium' AND (premium_until IS NULL OR premium_until > NOW()) AND role <> 'admin') AS premium,
      (SELECT COUNT(*)::int FROM users WHERE banned) AS banned,
      (SELECT COUNT(*)::int FROM users WHERE last_login_at > NOW() - INTERVAL '1 day') AS active_today,
      (SELECT COUNT(*)::int FROM tickets WHERE status = 'open') AS tickets_open,
      (SELECT COUNT(*)::int FROM tickets WHERE status <> 'closed') AS tickets_active,
      (SELECT COALESCE(SUM(admin_unread),0)::int FROM chats WHERE status = 'open') AS chat_unread,
      (SELECT COUNT(*)::int FROM chats WHERE status = 'open') AS chats_open,
      (SELECT COUNT(*)::int FROM premium_requests WHERE status = 'pending') AS premium_pending,
      (SELECT COUNT(*)::int FROM predictions) AS predictions,
      (SELECT COUNT(*)::int FROM predictions WHERE created_at > NOW() - INTERVAL '1 day') AS predictions_today,
      (SELECT COUNT(*)::int FROM predictions WHERE status = 'pending' AND fixture_date < NOW() - INTERVAL '115 minutes') AS predictions_unscored,
      (SELECT COUNT(*)::int FROM comments WHERE created_at > NOW() - INTERVAL '1 day') AS comments_today,
      (SELECT COUNT(*)::int FROM comments WHERE reports > 0 OR hidden) AS comments_flagged,
      (SELECT COUNT(*)::int FROM coupons) AS coupons`,
  );
  const signups = await q<{ day: string; n: number }>(
    `SELECT to_char(d, 'YYYY-MM-DD') AS day, COALESCE(c.n, 0)::int AS n
     FROM generate_series((NOW() AT TIME ZONE 'Europe/Istanbul')::date - 13, (NOW() AT TIME ZONE 'Europe/Istanbul')::date, '1 day') d
     LEFT JOIN (SELECT (created_at AT TIME ZONE 'Europe/Istanbul')::date AS day, COUNT(*) AS n FROM users GROUP BY 1) c ON c.day = d::date
     ORDER BY d`,
  );
  const latestUsers = await q(`SELECT id, name, email, created_at, plan FROM users ORDER BY id DESC LIMIT 6`);
  const latestTickets = await q(
    `SELECT t.id, t.subject, t.status, t.priority, t.updated_at, COALESCE(u.name, t.guest_name) AS who
     FROM tickets t LEFT JOIN users u ON u.id = t.user_id WHERE t.status <> 'closed' ORDER BY t.updated_at DESC LIMIT 6`,
  );
  return { counts, signups, latestUsers, latestTickets };
});
