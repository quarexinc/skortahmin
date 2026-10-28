import bcrypt from 'bcryptjs';
import { createSession, HttpError, requireUser } from '@/lib/auth';
import { audit, q1 } from '@/lib/db';
import { body, route } from '@/lib/http';

export const dynamic = 'force-dynamic';

export const POST = route(async (req) => {
  const u = await requireUser();
  const b = await body(req);
  const current = String(b.current ?? '');
  const next = String(b.next ?? '');
  if (next.length < 8 || !/\d/.test(next) || !/[A-Za-zÇĞİÖŞÜçğıöşü]/.test(next))
    throw new HttpError(400, 'Yeni şifre en az 8 karakter olmalı ve harf ile rakam içermeli.');
  const row = await q1<{ password_hash: string }>('SELECT password_hash FROM users WHERE id = $1', [u.id]);
  if (!row || !(await bcrypt.compare(current, row.password_hash))) throw new HttpError(401, 'Mevcut şifre hatalı.');
  const hash = await bcrypt.hash(next, 10);
  const upd = await q1<{ token_version: number }>(
    'UPDATE users SET password_hash = $2, token_version = token_version + 1 WHERE id = $1 RETURNING token_version',
    [u.id, hash],
  );
  await createSession(u.id, upd!.token_version);
  await audit(u.id, 'user.password_change', `user:${u.id}`);
  return { ok: true };
});
