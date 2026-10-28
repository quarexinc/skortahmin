import bcrypt from 'bcryptjs';
import { createSession, HttpError, toSessionUser } from '@/lib/auth';
import { audit, q, q1 } from '@/lib/db';
import { body, clientIp, route, str } from '@/lib/http';

export const dynamic = 'force-dynamic';

const MAX_FAILS = 5;
const WINDOW_MIN = 15;

export const POST = route(async (req) => {
  const b = await body(req);
  const email = str(b.email, 'E-posta', { max: 120 }).toLowerCase();
  const password = typeof b.password === 'string' ? b.password : '';
  const ip = clientIp(req);

  const [{ fails }] = await q<{ fails: number }>(
    `SELECT COUNT(*)::int AS fails FROM login_attempts
     WHERE email = $1 AND NOT success AND created_at > NOW() - INTERVAL '${WINDOW_MIN} minutes'`,
    [email],
  );
  if (fails >= MAX_FAILS)
    throw new HttpError(429, `Çok fazla hatalı deneme. Lütfen ${WINDOW_MIN} dakika sonra tekrar deneyin.`);

  const row = await q1('SELECT * FROM users WHERE email = $1', [email]);
  const ok = !!row && (await bcrypt.compare(password, row.password_hash));
  await q('INSERT INTO login_attempts (email, ip, success) VALUES ($1, $2, $3)', [email, ip, ok]);
  if (!ok) throw new HttpError(401, 'E-posta veya şifre hatalı.');
  if (row.banned)
    throw new HttpError(403, `Hesabınız askıya alınmış.${row.ban_reason ? ` Sebep: ${row.ban_reason}` : ''}`);

  await q('UPDATE users SET last_login_at = NOW() WHERE id = $1', [row.id]);
  await createSession(row.id, row.token_version);
  await audit(row.id, 'user.login', `user:${row.id}`, { ip });
  return { user: toSessionUser(row) };
});
