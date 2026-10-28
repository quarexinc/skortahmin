import bcrypt from 'bcryptjs';
import { createSession, HttpError, toSessionUser } from '@/lib/auth';
import { audit, notify, q1 } from '@/lib/db';
import { body, clientIp, EMAIL_RE, route, str } from '@/lib/http';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export const POST = route(async (req) => {
  const settings = await getSettings();
  if (!settings.registrationsOpen) throw new HttpError(403, 'Yeni üye kayıtları şu anda kapalı.');
  const b = await body(req);
  const name = str(b.name, 'Ad soyad', { min: 2, max: 60 });
  const email = str(b.email, 'E-posta', { max: 120 }).toLowerCase();
  if (!EMAIL_RE.test(email)) throw new HttpError(400, 'Geçerli bir e-posta adresi girin.');
  const password = typeof b.password === 'string' ? b.password : '';
  if (password.length < 8) throw new HttpError(400, 'Şifre en az 8 karakter olmalı.');
  if (!/[A-Za-zÇĞİÖŞÜçğıöşü]/.test(password) || !/\d/.test(password))
    throw new HttpError(400, 'Şifre en az bir harf ve bir rakam içermeli.');
  if (b.acceptTerms !== true) throw new HttpError(400, 'Devam etmek için kullanım koşullarını kabul etmelisiniz.');

  const exists = await q1('SELECT id FROM users WHERE email = $1', [email]);
  if (exists) throw new HttpError(409, 'Bu e-posta adresiyle zaten bir hesap var.');

  const colors = ['#22c55e', '#38bdf8', '#f59e0b', '#a78bfa', '#f472b6', '#2dd4bf', '#fb7185'];
  const hash = await bcrypt.hash(password, 10);
  const row = await q1(
    `INSERT INTO users (email, name, password_hash, avatar_color, last_login_at)
     VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
    [email, name, hash, colors[Math.floor(Math.random() * colors.length)]],
  );
  await createSession(row.id, row.token_version);
  await notify(row.id, 'Skor Çıkartıcı\'ya hoş geldin!', 'Maçlara göz at, skor tahmini yap ve liderlik tablosunda yerini al.', '/maclar');
  await audit(row.id, 'user.register', `user:${row.id}`, { ip: clientIp(req) });
  return { user: toSessionUser(row) };
});
