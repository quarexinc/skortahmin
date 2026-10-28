// Herkese açık oyuncu profili
import { HttpError } from '@/lib/auth';
import { q, q1 } from '@/lib/db';
import { int, route } from '@/lib/http';
import { userBadges } from '@/lib/userStats';

export const dynamic = 'force-dynamic';

export const GET = route<{ params: { id: string } }>(async (_req, { params }) => {
  const id = int(params.id, 'Üye');
  const user = await q1(`SELECT id, name, avatar_color, favorite_team AS favorite_game, bio, created_at, role = 'admin' AS admin FROM users WHERE id = $1 AND NOT banned`, [id]);
  if (!user) throw new HttpError(404, 'Üye bulunamadı.');
  const b = await userBadges(id);
  const big = await q(`SELECT id, game, amount, payout, multiplier, created_at FROM bets WHERE user_id = $1 AND payout > amount ORDER BY payout - amount DESC LIMIT 8`, [id]);
  return { user, stats: b?.stats, badges: b?.badges ?? [], big };
});
