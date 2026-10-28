import bcrypt from 'bcryptjs';
import { ageFrom, createSession, HttpError, toSessionUser } from '@/lib/auth';
import { toUnits } from '@/lib/money';
import { ledger } from '@/lib/wallet';
import { audit, notify, q1, tx } from '@/lib/db';
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
  const birth = String(b.birthDate ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birth) || Number.isNaN(new Date(birth).getTime())) throw new HttpError(400, 'Doğum tarihini girmelisin.');
  const age = ageFrom(birth)!;
  if (age < 18) throw new HttpError(403, 'BloxyBet yalnızca 18 yaş ve üzerindekilere açıktır.');
  if (age > 120) throw new HttpError(400, 'Geçerli bir doğum tarihi gir.');

  const exists = await q1('SELECT id FROM users WHERE email = $1', [email]);
  if (exists) throw new HttpError(409, 'Bu e-posta adresiyle zaten bir hesap var.');

  const colors = ['#22c55e', '#38bdf8', '#f59e0b', '#a78bfa', '#f472b6', '#2dd4bf', '#fb7185'];
  const hash = await bcrypt.hash(password, 10);
  const row = await q1(
    `INSERT INTO users (email, name, password_hash, avatar_color, last_login_at, birth_date)
     VALUES ($1, $2, $3, $4, NOW(), $5) RETURNING *`,
    [email, name, hash, colors[Math.floor(Math.random() * colors.length)], birth],
  );
  if (settings.signupBonus > 0) {
    const bal = await tx((c) => ledger(c, row.id, 'signup_bonus', toUnits(settings.signupBonus)));
    row.balance = bal;
  }
  await createSession(row.id, row.token_version);
  await notify(row.id, 'BloxyBet\'e hoş geldin!', `Hesabına ${settings.signupBonus.toLocaleString('tr-TR')} kredi hoş geldin bonusu eklendi. Krediler sanaldır, gerçek değeri yoktur.`, '/oyunlar');
  await audit(row.id, 'user.register', `user:${row.id}`, { ip: clientIp(req) });
  return { user: toSessionUser(row) };
});
