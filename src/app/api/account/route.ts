import bcrypt from 'bcryptjs';
import { clearSession, HttpError, requireUser, toSessionUser } from '@/lib/auth';
import { audit, q, q1 } from '@/lib/db';
import { body, route, str } from '@/lib/http';
import { userBadges } from '@/lib/userStats';
import { isGame } from '@/lib/games/registry';

export const dynamic = 'force-dynamic';

const COLORS = ['#22c55e', '#38bdf8', '#f59e0b', '#a78bfa', '#f472b6', '#2dd4bf', '#fb7185', '#facc15', '#60a5fa'];

export const GET = route(async () => {
  const u = await requireUser();
  const [badges, games, recent, misc] = await Promise.all([
    userBadges(u.id),
    q<{ game: string; bets: number; wagered: string; payout: string; best: string | null }>(
      `SELECT game, COUNT(*)::int AS bets, SUM(amount)::text AS wagered, SUM(payout)::text AS payout, MAX(multiplier)::text AS best
       FROM bets WHERE user_id = $1 GROUP BY game ORDER BY SUM(amount) DESC`,
      [u.id],
    ),
    q(`SELECT id, game, amount, payout, multiplier, created_at FROM bets WHERE user_id = $1 ORDER BY id DESC LIMIT 8`, [u.id]),
    q1<{ open_tickets: number; unread: number; rakeback: string }>(
      `SELECT (SELECT COUNT(*)::int FROM tickets WHERE user_id = $1 AND status <> 'closed') AS open_tickets,
              (SELECT COUNT(*)::int FROM notifications WHERE user_id = $1 AND NOT read) AS unread,
              (SELECT rakeback::text FROM users WHERE id = $1) AS rakeback`,
      [u.id],
    ),
  ]);
  return {
    user: u,
    stats: badges?.stats ?? null,
    badges: badges?.badges ?? [],
    games: games.map((g) => ({ game: g.game, bets: g.bets, wagered: Number(g.wagered), payout: Number(g.payout), best: Number(g.best ?? 0) })),
    recent,
    openTickets: misc?.open_tickets ?? 0,
    unread: misc?.unread ?? 0,
    rakeback: Number(misc?.rakeback ?? 0),
  };
});

export const PATCH = route(async (req) => {
  const u = await requireUser();
  const b = await body(req);
  const name = str(b.name, 'Ad soyad', { min: 2, max: 60 });
  const favoriteGame = isGame(b.favoriteGame) ? b.favoriteGame : null;
  const bio = str(b.bio, 'Hakkımda', { max: 280, optional: true }) || null;
  const color = COLORS.includes(b.avatarColor) ? b.avatarColor : u.avatarColor;
  const row = await q1(
    `UPDATE users SET name = $2, favorite_team = $3, bio = $4, avatar_color = $5 WHERE id = $1 RETURNING *`,
    [u.id, name, favoriteGame, bio, color],
  );
  return { user: toSessionUser(row) };
});

export const DELETE = route(async (req) => {
  const u = await requireUser();
  const b = await body(req);
  if (u.isAdmin) {
    const [{ n }] = await q<{ n: number }>(`SELECT COUNT(*)::int AS n FROM users WHERE role = 'admin'`);
    if (n <= 1) throw new HttpError(400, 'Son yönetici hesabı silinemez.');
  }
  const row = await q1<{ password_hash: string }>('SELECT password_hash FROM users WHERE id = $1', [u.id]);
  if (!row || !(await bcrypt.compare(String(b.password ?? ''), row.password_hash)))
    throw new HttpError(401, 'Şifre hatalı.');
  await audit(null, 'user.delete_self', `user:${u.id}`, { email: u.email });
  await q('DELETE FROM users WHERE id = $1', [u.id]);
  clearSession();
  return { ok: true };
});
