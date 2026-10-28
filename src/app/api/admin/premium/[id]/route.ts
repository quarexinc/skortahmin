import { HttpError, requireAdmin } from '@/lib/auth';
import { audit, notify, q, q1 } from '@/lib/db';
import { body, int, oneOf, route, str } from '@/lib/http';

export const dynamic = 'force-dynamic';

export const PATCH = route<{ params: { id: string } }>(async (req, { params }) => {
  const admin = await requireAdmin();
  const id = int(params.id, 'Talep');
  const b = await body(req);
  const decision = oneOf(b.decision, ['approved', 'rejected'] as const, 'Karar');
  const note = str(b.note, 'Not', { max: 300, optional: true }) || null;
  const r = await q1<{ user_id: number; months: number; status: string }>('SELECT user_id, months, status FROM premium_requests WHERE id = $1', [id]);
  if (!r) throw new HttpError(404, 'Talep bulunamadı.');
  if (r.status !== 'pending') throw new HttpError(400, 'Bu talep zaten sonuçlandırılmış.');
  const months = decision === 'approved' ? int(b.months ?? r.months, 'Süre', { min: 1, max: 120 }) : r.months;
  await q(
    `UPDATE premium_requests SET status = $2, months = $3, admin_note = $4, decided_by = $5, decided_at = NOW() WHERE id = $1`,
    [id, decision, months, note, admin.id],
  );
  if (decision === 'approved') {
    await q(
      `UPDATE users SET plan = 'premium', premium_until = GREATEST(COALESCE(premium_until, NOW()), NOW()) + ($2 || ' months')::interval WHERE id = $1`,
      [r.user_id, String(months)],
    );
    await notify(r.user_id, '💎 Premium üyeliğin aktifleştirildi!', `${months} aylık premium tanımlandı. Keyifli analizler!`, '/hesap');
  } else {
    await notify(r.user_id, 'Premium talebin sonuçlandı', note ?? 'Talebin onaylanmadı. Ayrıntılar için destek ekibimizle iletişime geçebilirsin.', '/premium');
  }
  await audit(admin.id, `admin.premium.${decision}`, `premium_request:${id}`, { months, note });
  return { ok: true };
});
