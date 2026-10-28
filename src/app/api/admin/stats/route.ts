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
      (SELECT COUNT(*)::int FROM users WHERE banned) AS banned,
      (SELECT COUNT(*)::int FROM users WHERE last_login_at > NOW() - INTERVAL '1 day') AS active_today,
      (SELECT COUNT(*)::int FROM users WHERE self_excluded_until > NOW()) AS excluded,
      (SELECT COUNT(*)::int FROM users WHERE birth_date IS NULL AND role <> 'admin') AS unverified,
      (SELECT COUNT(*)::int FROM tickets WHERE status = 'open') AS tickets_open,
      (SELECT COUNT(*)::int FROM tickets WHERE status <> 'closed') AS tickets_active,
      (SELECT COALESCE(SUM(admin_unread),0)::int FROM chats WHERE status = 'open') AS chat_unread,
      (SELECT COUNT(*)::int FROM chats WHERE status = 'open') AS chats_open,
      (SELECT COUNT(*)::int FROM bets) AS bets,
      (SELECT COUNT(*)::int FROM bets WHERE created_at > NOW() - INTERVAL '1 day') AS bets_today,
      (SELECT COUNT(DISTINCT user_id)::int FROM bets WHERE created_at > NOW() - INTERVAL '1 day') AS players_today,
      (SELECT COALESCE(SUM(amount),0)::bigint FROM bets WHERE created_at > NOW() - INTERVAL '1 day') AS wagered_today,
      (SELECT COALESCE(SUM(amount) - SUM(payout),0)::bigint FROM bets WHERE created_at > NOW() - INTERVAL '1 day') AS house_today,
      (SELECT COALESCE(SUM(amount),0)::bigint FROM bets) AS wagered_all,
      (SELECT COALESCE(SUM(amount) - SUM(payout),0)::bigint FROM bets) AS house_all,
      (SELECT COALESCE(SUM(balance + vault),0)::bigint FROM users) AS circulating,
      (SELECT COALESCE(SUM(amount),0)::bigint FROM transactions WHERE type NOT IN ('bet','win','refund','vault_in','vault_out') AND created_at > NOW() - INTERVAL '1 day') AS issued_today,
      (SELECT COUNT(*)::int FROM game_sessions WHERE status = 'active') AS sessions_active`,
  );
  const daily = await q<{ day: string; signups: number; wagered: string; house: string; bets: number }>(
    `SELECT to_char(d, 'YYYY-MM-DD') AS day,
       COALESCE(s.n, 0)::int AS signups, COALESCE(b.w, 0)::text AS wagered, COALESCE(b.h, 0)::text AS house, COALESCE(b.n, 0)::int AS bets
     FROM generate_series((NOW() AT TIME ZONE 'Europe/Istanbul')::date - 13, (NOW() AT TIME ZONE 'Europe/Istanbul')::date, '1 day') d
     LEFT JOIN (SELECT (created_at AT TIME ZONE 'Europe/Istanbul')::date AS day, COUNT(*) AS n FROM users GROUP BY 1) s ON s.day = d::date
     LEFT JOIN (SELECT (created_at AT TIME ZONE 'Europe/Istanbul')::date AS day, SUM(amount) AS w, SUM(amount) - SUM(payout) AS h, COUNT(*) AS n FROM bets
                WHERE created_at > NOW() - INTERVAL '15 days' GROUP BY 1) b ON b.day = d::date
     ORDER BY d`,
  );
  const games = await q(
    `SELECT game, COUNT(*)::int AS bets, SUM(amount)::bigint AS wagered, SUM(payout)::bigint AS paid FROM bets GROUP BY game ORDER BY game`,
  );
  const latestUsers = await q(`SELECT id, name, email, created_at, balance FROM users ORDER BY id DESC LIMIT 6`);
  const latestTickets = await q(
    `SELECT t.id, t.subject, t.status, t.priority, t.updated_at, COALESCE(u.name, t.guest_name) AS who
     FROM tickets t LEFT JOIN users u ON u.id = t.user_id WHERE t.status <> 'closed' ORDER BY t.updated_at DESC LIMIT 6`,
  );
  const bigWins = await q(
    `SELECT b.id, b.game, b.amount, b.payout, b.multiplier, b.created_at, u.id AS user_id, u.name FROM bets b JOIN users u ON u.id = b.user_id
     WHERE b.created_at > NOW() - INTERVAL '7 days' AND b.payout > b.amount ORDER BY b.payout - b.amount DESC LIMIT 6`,
  );
  return { counts, daily, games, latestUsers, latestTickets, bigWins };
});
