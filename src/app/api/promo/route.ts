// Promosyon kodu kullanma
import { HttpError, requireUser } from '@/lib/auth';
import { audit, notify, q, q1 } from '@/lib/db';
import { body, route, str } from '@/lib/http';

export const dynamic = 'force-dynamic';

export const POST = route(async (req) => {
  const u = await requireUser();
  const code = str((await body(req)).code, 'Kod', { max: 40 }).toUpperCase().replace(/\s+/g, '');
  const [{ n }] = await q<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM audit_logs WHERE actor_id = $1 AND action = 'promo.fail' AND created_at > NOW() - INTERVAL '10 minutes'`,
    [u.id],
  );
  if (n >= 5) throw new HttpError(429, 'Çok fazla hatalı deneme. Lütfen 10 dakika sonra tekrar deneyin.');
  const c = await q1<{ id: number; months: number; max_uses: number; used_count: number; expires_at: Date | null; active: boolean }>(
    'SELECT * FROM promo_codes WHERE code = $1',
    [code],
  );
  const fail = async (msg: string) => {
    await audit(u.id, 'promo.fail', code);
    throw new HttpError(400, msg);
  };
  if (!c || !c.active) return fail('Kod geçersiz.');
  if (c.expires_at && new Date(c.expires_at).getTime() < Date.now()) return fail('Bu kodun süresi dolmuş.');
  if (c.used_count >= c.max_uses) return fail('Bu kodun kullanım limiti dolmuş.');
  const used = await q1('SELECT 1 FROM promo_redemptions WHERE code_id = $1 AND user_id = $2', [c.id, u.id]);
  if (used) return fail('Bu kodu zaten kullandın.');
  const upd = await q1(`UPDATE promo_codes SET used_count = used_count + 1 WHERE id = $1 AND used_count < max_uses RETURNING id`, [c.id]);
  if (!upd) return fail('Bu kodun kullanım limiti dolmuş.');
  await q('INSERT INTO promo_redemptions (code_id, user_id) VALUES ($1, $2)', [c.id, u.id]);
  await q(
    `UPDATE users SET plan = 'premium', premium_until = GREATEST(COALESCE(premium_until, NOW()), NOW()) + ($2 || ' months')::interval
     WHERE id = $1 AND NOT (role = 'admin')`,
    [u.id, String(c.months)],
  );
  await notify(u.id, 'Promosyon kodu kullanıldı', `${c.months} aylık Premium hesabına tanımlandı.`, '/hesap');
  await audit(u.id, 'promo.redeem', code, { months: c.months });
  return { months: c.months };
});
