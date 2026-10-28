// Kullanıcı yönetimi işlemleri
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { HttpError, requireAdmin } from '@/lib/auth';
import { audit, notify, q, q1 } from '@/lib/db';
import { body, int, oneOf, route, str } from '@/lib/http';

export const dynamic = 'force-dynamic';

type Ctx = { params: { id: string } };

export const GET = route<Ctx>(async (_req, { params }) => {
  await requireAdmin();
  const id = int(params.id, 'Kullanıcı');
  const user = await q1(
    `SELECT id, name, email, role, plan, premium_until, banned, ban_reason, favorite_team, bio, created_at, last_login_at, avatar_color FROM users WHERE id = $1`,
    [id],
  );
  if (!user) throw new HttpError(404, 'Kullanıcı bulunamadı.');
  const stats = await q1(
    `SELECT (SELECT COUNT(*)::int FROM predictions WHERE user_id = $1) AS predictions,
       (SELECT COALESCE(SUM(points),0)::int FROM predictions WHERE user_id = $1) AS points,
       (SELECT COUNT(*)::int FROM comments WHERE user_id = $1) AS comments,
       (SELECT COUNT(*)::int FROM coupons WHERE user_id = $1) AS coupons,
       (SELECT COUNT(*)::int FROM tickets WHERE user_id = $1) AS tickets`,
    [id],
  );
  const logins = await q(`SELECT ip, success, created_at FROM login_attempts WHERE email = $1 ORDER BY id DESC LIMIT 10`, [user.email]);
  return { user, stats, logins };
});

export const PATCH = route<Ctx>(async (req, { params }) => {
  const admin = await requireAdmin();
  const id = int(params.id, 'Kullanıcı');
  const b = await body(req);
  const action = oneOf(
    b.action,
    ['grant_premium', 'revoke_premium', 'set_role', 'ban', 'unban', 'reset_password', 'logout', 'rename'] as const,
    'İşlem',
  );
  const target = await q1<{ id: number; role: string; email: string; premium_until: Date | null; plan: string }>(
    'SELECT id, role, email, premium_until, plan FROM users WHERE id = $1',
    [id],
  );
  if (!target) throw new HttpError(404, 'Kullanıcı bulunamadı.');
  if (id === admin.id && ['ban', 'set_role'].includes(action)) throw new HttpError(400, 'Bu işlemi kendi hesabına uygulayamazsın.');

  let extra: Record<string, unknown> = {};
  switch (action) {
    case 'grant_premium': {
      const months = int(b.months, 'Süre', { min: 0, max: 120 });
      // 0 = süresiz. Aktif premium varsa süre bitiş tarihinin üzerine eklenir.
      if (months === 0) await q(`UPDATE users SET plan = 'premium', premium_until = NULL WHERE id = $1`, [id]);
      else
        await q(
          `UPDATE users SET plan = 'premium',
             premium_until = GREATEST(COALESCE(premium_until, NOW()), NOW()) + ($2 || ' months')::interval WHERE id = $1`,
          [id, String(months)],
        );
      await notify(id, 'Premium üyeliğin aktif!', months ? `${months} aylık premium tanımlandı.` : 'Süresiz premium tanımlandı.', '/hesap');
      break;
    }
    case 'revoke_premium':
      await q(`UPDATE users SET plan = 'free', premium_until = NULL WHERE id = $1`, [id]);
      break;
    case 'set_role': {
      const role = oneOf(b.role, ['user', 'admin'] as const, 'Rol');
      await q('UPDATE users SET role = $2 WHERE id = $1', [id, role]);
      break;
    }
    case 'ban': {
      const reason = str(b.reason, 'Sebep', { max: 200, optional: true }) || null;
      await q('UPDATE users SET banned = TRUE, ban_reason = $2, token_version = token_version + 1 WHERE id = $1', [id, reason]);
      break;
    }
    case 'unban':
      await q('UPDATE users SET banned = FALSE, ban_reason = NULL WHERE id = $1', [id]);
      break;
    case 'reset_password': {
      const temp = randomBytes(6).toString('base64url') + '7';
      await q('UPDATE users SET password_hash = $2, token_version = token_version + 1 WHERE id = $1', [id, await bcrypt.hash(temp, 10)]);
      await q('DELETE FROM login_attempts WHERE email = $1 AND NOT success', [target.email]);
      extra = { tempPassword: temp };
      break;
    }
    case 'logout':
      await q('UPDATE users SET token_version = token_version + 1 WHERE id = $1', [id]);
      break;
    case 'rename': {
      const name = str(b.name, 'Ad', { min: 2, max: 60 });
      await q('UPDATE users SET name = $2 WHERE id = $1', [id, name]);
      break;
    }
  }
  await audit(admin.id, `admin.user.${action}`, `user:${id}`, { ...b, tempPassword: undefined });
  return { ok: true, ...extra };
});

export const DELETE = route<Ctx>(async (_req, { params }) => {
  const admin = await requireAdmin();
  const id = int(params.id, 'Kullanıcı');
  if (id === admin.id) throw new HttpError(400, 'Kendi hesabını buradan silemezsin.');
  const u = await q1<{ email: string }>('SELECT email FROM users WHERE id = $1', [id]);
  if (!u) return { ok: true };
  await q('DELETE FROM users WHERE id = $1', [id]);
  await audit(admin.id, 'admin.user.delete', `user:${id}`, { email: u.email });
  return { ok: true };
});
