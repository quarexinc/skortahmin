// Yaş doğrulama (doğum tarihi beyanı). Bir kez girilir; değişiklik için destek gerekir.
import { ageFrom, HttpError, requireUser } from '@/lib/auth';
import { audit, q } from '@/lib/db';
import { body, route } from '@/lib/http';

export const dynamic = 'force-dynamic';

export const POST = route(async (req) => {
  const u = await requireUser();
  if (u.birthDate) throw new HttpError(400, 'Doğum tarihin zaten kayıtlı. Değiştirmek için destek talebi aç.');
  const d = String((await body(req)).birthDate ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || Number.isNaN(new Date(d).getTime())) throw new HttpError(400, 'Geçerli bir doğum tarihi gir.');
  const age = ageFrom(d)!;
  if (age > 120) throw new HttpError(400, 'Geçerli bir doğum tarihi gir.');
  await q('UPDATE users SET birth_date = $2 WHERE id = $1', [u.id, d]);
  await audit(u.id, 'user.age_declared', `user:${u.id}`, { adult: age >= 18 });
  if (age < 18) throw new HttpError(403, 'Üzgünüz, BloxyBet oyunları yalnızca 18 yaş ve üzerindekilere açıktır.');
  return { ok: true };
});
