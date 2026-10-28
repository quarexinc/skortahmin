// Herkese açık üye profili
import { HttpError } from '@/lib/auth';
import { q, q1 } from '@/lib/db';
import { int, route } from '@/lib/http';
import { userBadges } from '@/lib/userStats';

export const dynamic = 'force-dynamic';

export const GET = route<{ params: { id: string } }>(async (_req, { params }) => {
  const id = int(params.id, 'Üye');
  const user = await q1(
    `SELECT id, name, avatar_color, favorite_team, bio, created_at, role = 'admin' AS admin,
       (plan = 'premium' AND (premium_until IS NULL OR premium_until > NOW())) AS premium
     FROM users WHERE id = $1 AND NOT banned`,
    [id],
  );
  if (!user) throw new HttpError(404, 'Üye bulunamadı.');
  const b = await userBadges(id);
  const recent = await q(
    `SELECT fixture_id, home_name, away_name, home_goals, away_goals, actual_home, actual_away, points, fixture_date
     FROM predictions WHERE user_id = $1 AND status = 'scored' ORDER BY fixture_date DESC LIMIT 10`,
    [id],
  );
  return { user, stats: b?.stats, badges: b?.badges ?? [], recent };
});
