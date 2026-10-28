import bcrypt from 'bcryptjs';
import { clearSession, HttpError, requireUser, toSessionUser } from '@/lib/auth';
import { audit, q, q1 } from '@/lib/db';
import { body, route, str } from '@/lib/http';

export const dynamic = 'force-dynamic';

const COLORS = ['#22c55e', '#38bdf8', '#f59e0b', '#a78bfa', '#f472b6', '#2dd4bf', '#fb7185', '#facc15', '#60a5fa'];

export const GET = route(async () => {
  const u = await requireUser();
  const s = await q1(
    `SELECT
      (SELECT COUNT(*)::int FROM predictions WHERE user_id = $1) AS predictions,
      (SELECT COUNT(*)::int FROM predictions WHERE user_id = $1 AND status = 'scored') AS scored,
      (SELECT COALESCE(SUM(points),0)::int FROM predictions WHERE user_id = $1) AS points,
      (SELECT COUNT(*)::int FROM predictions WHERE user_id = $1 AND points = 3) AS exact,
      (SELECT COUNT(*)::int FROM predictions WHERE user_id = $1 AND points >= 1) AS correct,
      (SELECT COUNT(*)::int FROM coupons WHERE user_id = $1) AS coupons,
      (SELECT COUNT(*)::int FROM favorites WHERE user_id = $1) AS favorites,
      (SELECT COUNT(*)::int FROM tickets WHERE user_id = $1 AND status <> 'closed') AS open_tickets,
      (SELECT COUNT(*)::int FROM comments WHERE user_id = $1) AS comments`,
    [u.id],
  );
  const rank = await q1<{ rank: number }>(
    `SELECT rank FROM (
       SELECT user_id, RANK() OVER (ORDER BY SUM(points) DESC) AS rank
       FROM predictions WHERE status = 'scored' GROUP BY user_id
     ) r WHERE user_id = $1`,
    [u.id],
  );
  const premiumRequest = await q1(
    `SELECT id, status, months, created_at FROM premium_requests WHERE user_id = $1 ORDER BY id DESC LIMIT 1`,
    [u.id],
  );
  return { user: u, stats: s, rank: rank ? Number(rank.rank) : null, premiumRequest };
});

export const PATCH = route(async (req) => {
  const u = await requireUser();
  const b = await body(req);
  const name = str(b.name, 'Ad soyad', { min: 2, max: 60 });
  const favoriteTeam = str(b.favoriteTeam, 'Tuttuğun takım', { max: 60, optional: true }) || null;
  const bio = str(b.bio, 'Hakkımda', { max: 280, optional: true }) || null;
  const color = COLORS.includes(b.avatarColor) ? b.avatarColor : u.avatarColor;
  const row = await q1(
    `UPDATE users SET name = $2, favorite_team = $3, bio = $4, avatar_color = $5 WHERE id = $1 RETURNING *`,
    [u.id, name, favoriteTeam, bio, color],
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
