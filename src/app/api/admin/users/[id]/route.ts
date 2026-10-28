// Kullanıcı yönetimi işlemleri
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { HttpError, requireAdmin } from '@/lib/auth';
import { audit, notify, q, q1, tx } from '@/lib/db';
import { fmtCredits, toUnits } from '@/lib/money';
import { ledger, lockUser } from '@/lib/wallet';
import { body, int, oneOf, route, str } from '@/lib/http';

export const dynamic = 'force-dynamic';

type Ctx = { params: { id: string } };

export const GET = route<Ctx>(async (_req, { params }) => {
  await requireAdmin();
  const id = int(params.id, 'Kullanıcı');
  const user = await q1(
    `SELECT id, name, email, role, banned, ban_reason, favorite_team, bio, created_at, last_login_at, avatar_color,
       balance, vault, wagered, rakeback, level_claimed, birth_date, self_excluded_until, daily_wager_limit, session_reminder_min, last_daily_at
     FROM users WHERE id = $1`,
    [id],
  );
  if (!user) throw new HttpError(404, 'Kullanıcı bulunamadı.');
  const stats = await q1(
    `SELECT (SELECT COUNT(*)::int FROM bets WHERE user_id = $1) AS bets,
       (SELECT COALESCE(SUM(amount),0)::bigint FROM bets WHERE user_id = $1) AS bet_sum,
       (SELECT COALESCE(SUM(payout),0)::bigint FROM bets WHERE user_id = $1) AS paid_sum,
       (SELECT COALESCE(MAX(multiplier),0)::float FROM bets WHERE user_id = $1) AS best,
       (SELECT COALESCE(SUM(amount),0)::bigint FROM transactions WHERE user_id = $1 AND type NOT IN ('bet','win','refund','vault_in','vault_out')) AS bonuses,
       (SELECT COUNT(*)::int FROM tickets WHERE user_id = $1) AS tickets`,
    [id],
  );
  const transactions = await q(`SELECT id, type, amount, balance_after, ref, note, created_at FROM transactions WHERE user_id = $1 ORDER BY id DESC LIMIT 15`, [id]);
  const logins = await q(`SELECT ip, success, created_at FROM login_attempts WHERE email = $1 ORDER BY id DESC LIMIT 10`, [user.email]);
  return { user, stats, transactions, logins };
});

export const PATCH = route<Ctx>(async (req, { params }) => {
  const admin = await requireAdmin();
  const id = int(params.id, 'Kullanıcı');
  const b = await body(req);
  const action = oneOf(
    b.action,
    ['adjust_balance', 'reset_age', 'set_role', 'ban', 'unban', 'reset_password', 'logout', 'rename'] as const,
    'İşlem',
  );
  const target = await q1<{ id: number; role: string; email: string }>(
    'SELECT id, role, email FROM users WHERE id = $1',
    [id],
  );
  if (!target) throw new HttpError(404, 'Kullanıcı bulunamadı.');
  if (id === admin.id && ['ban', 'set_role'].includes(action)) throw new HttpError(400, 'Bu işlemi kendi hesabına uygulayamazsın.');

  let extra: Record<string, unknown> = {};
  switch (action) {
    case 'adjust_balance': {
      // Yalnızca sanal kredi düzeltmesi: + ekler, - düşer. Her işlem deftere ve işlem kayıtlarına yazılır.
      const credits = Number(String(b.amount ?? '').replace(',', '.'));
      if (!Number.isFinite(credits) || credits === 0 || Math.abs(credits) > 10_000_000) throw new HttpError(400, 'Geçerli bir tutar gir (ör. 500 veya -250).');
      const reason = str(b.reason, 'Açıklama', { min: 3, max: 200 });
      const units = toUnits(credits);
      const balance = await tx(async (c) => {
        await lockUser(c, id);
        return ledger(c, id, units > 0 ? 'admin_credit' : 'admin_debit', units, { note: reason });
      });
      if (units > 0) await notify(id, 'Hesabına kredi eklendi', `${fmtCredits(units)} kredi eklendi: ${reason}`, '/cuzdan');
      extra = { balance };
      break;
    }
    case 'reset_age':
      await q('UPDATE users SET birth_date = NULL WHERE id = $1', [id]);
      await notify(id, 'Yaş doğrulaması gerekli', 'Oynamaya devam etmek için doğum tarihini yeniden doğrulaman gerekiyor.', '/hesap');
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
