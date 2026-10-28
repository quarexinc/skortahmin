// Bir üyenin herkese açık istatistikleri + rozetleri
import 'server-only';
import { computeBadges, type BadgeStats } from '@/config/badges';
import { q1 } from '@/lib/db';

export async function userBadgeStats(id: number): Promise<BadgeStats | null> {
  const r = await q1<{
    predictions: number; exact: number; correct: number; points: number; comments: number; coupons: number; favorites: number;
    premium: boolean; days: number; rank: number | null;
  }>(
    `SELECT
       (SELECT COUNT(*)::int FROM predictions WHERE user_id = u.id) AS predictions,
       (SELECT COUNT(*)::int FROM predictions WHERE user_id = u.id AND points = 3) AS exact,
       (SELECT COUNT(*)::int FROM predictions WHERE user_id = u.id AND points >= 1) AS correct,
       (SELECT COALESCE(SUM(points),0)::int FROM predictions WHERE user_id = u.id) AS points,
       (SELECT COUNT(*)::int FROM comments WHERE user_id = u.id) AS comments,
       (SELECT COUNT(*)::int FROM coupons WHERE user_id = u.id) AS coupons,
       (SELECT COUNT(*)::int FROM favorites WHERE user_id = u.id) AS favorites,
       ((u.plan = 'premium' AND (u.premium_until IS NULL OR u.premium_until > NOW())) OR u.role = 'admin') AS premium,
       EXTRACT(DAY FROM NOW() - u.created_at)::int AS days,
       (SELECT rank::int FROM (SELECT user_id, RANK() OVER (ORDER BY SUM(points) DESC) AS rank FROM predictions WHERE status = 'scored' GROUP BY user_id) r WHERE r.user_id = u.id) AS rank
     FROM users u WHERE u.id = $1 AND NOT u.banned`,
    [id],
  );
  return r;
}

export async function userBadges(id: number) {
  const s = await userBadgeStats(id);
  return s ? { stats: s, badges: computeBadges(s) } : null;
}
