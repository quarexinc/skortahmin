// Sorumlu oyun: mola (kendini dışlama), 24 saatlik oyun limiti, oturum hatırlatıcısı.
import { HttpError, requireUser } from '@/lib/auth';
import { audit, q, q1 } from '@/lib/db';
import { body, int, route } from '@/lib/http';
import { toUnits } from '@/lib/money';

export const dynamic = 'force-dynamic';

export const GET = route(async () => {
  const u = await requireUser();
  const r = await q1(
    `SELECT self_excluded_until, daily_wager_limit, session_reminder_min,
       (SELECT COALESCE(-SUM(amount),0) FROM transactions WHERE user_id = $1 AND type = 'bet' AND created_at > NOW() - INTERVAL '24 hours')::bigint AS wagered24
     FROM users WHERE id = $1`,
    [u.id],
  );
  const last = await q1(`SELECT created_at FROM audit_logs WHERE actor_id = $1 AND action = 'responsible.limit' ORDER BY id DESC LIMIT 1`, [u.id]);
  return { ...r, wagered24: Number(r.wagered24), limitChangedAt: last?.created_at ?? null };
});

export const POST = route(async (req) => {
  const u = await requireUser();
  const b = await body(req);
  if (b.action === 'exclude') {
    const days = int(b.days, 'Süre', { min: 1, max: 365 });
    const until = new Date(Date.now() + days * 86_400_000);
    await q('UPDATE users SET self_excluded_until = GREATEST(COALESCE(self_excluded_until, NOW()), $2) WHERE id = $1', [u.id, until]);
    await audit(u.id, 'responsible.exclude', `user:${u.id}`, { days });
    return { ok: true, until };
  }
  if (b.action === 'limit') {
    const cur = await q1<{ daily_wager_limit: string | null }>('SELECT daily_wager_limit FROM users WHERE id = $1', [u.id]);
    const next = b.amount == null || b.amount === '' ? null : toUnits(Number(String(b.amount).replace(',', '.')));
    if (next != null && (!Number.isFinite(next) || next < 100)) throw new HttpError(400, 'Limit en az 1 kredi olmalı.');
    const current = cur?.daily_wager_limit == null ? null : Number(cur.daily_wager_limit);
    const loosening = current != null && (next == null || next > current);
    if (loosening) {
      const last = await q1(`SELECT created_at FROM audit_logs WHERE actor_id = $1 AND action = 'responsible.limit' ORDER BY id DESC LIMIT 1`, [u.id]);
      if (last && Date.now() - new Date(last.created_at).getTime() < 86_400_000)
        throw new HttpError(400, 'Limiti artırmak veya kaldırmak için son değişiklikten itibaren 24 saat beklemelisin. Düşürmek her zaman mümkündür.');
    }
    await q('UPDATE users SET daily_wager_limit = $2 WHERE id = $1', [u.id, next]);
    await audit(u.id, 'responsible.limit', `user:${u.id}`, { limit: next });
    return { ok: true };
  }
  if (b.action === 'reminder') {
    const m = b.minutes == null || b.minutes === '' ? null : int(b.minutes, 'Süre', { min: 10, max: 600 });
    await q('UPDATE users SET session_reminder_min = $2 WHERE id = $1', [u.id, m]);
    return { ok: true };
  }
  throw new HttpError(400, 'Geçersiz işlem.');
});
