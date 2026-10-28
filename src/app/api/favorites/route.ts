import { HttpError, requireUser } from '@/lib/auth';
import { q, q1 } from '@/lib/db';
import { body, int, oneOf, route, str } from '@/lib/http';

export const dynamic = 'force-dynamic';

export const GET = route(async () => {
  const u = await requireUser();
  const items = await q(
    'SELECT kind, ref_id, label, logo, extra, created_at FROM favorites WHERE user_id = $1 ORDER BY created_at DESC',
    [u.id],
  );
  return { items };
});

// Aç/kapa: varsa siler, yoksa ekler.
export const POST = route(async (req) => {
  const u = await requireUser();
  const b = await body(req);
  const kind = oneOf(b.kind, ['team', 'fixture'] as const, 'Tür');
  const refId = int(b.refId, 'Kayıt', { min: 1 });
  const exists = await q1('SELECT 1 FROM favorites WHERE user_id = $1 AND kind = $2 AND ref_id = $3', [u.id, kind, refId]);
  if (exists) {
    await q('DELETE FROM favorites WHERE user_id = $1 AND kind = $2 AND ref_id = $3', [u.id, kind, refId]);
    return { on: false };
  }
  const [{ n }] = await q<{ n: number }>('SELECT COUNT(*)::int AS n FROM favorites WHERE user_id = $1', [u.id]);
  if (n >= 200) throw new HttpError(400, 'En fazla 200 favori ekleyebilirsin.');
  const label = str(b.label, 'Ad', { max: 160 });
  const logo = typeof b.logo === 'string' && b.logo.startsWith('https://') ? b.logo.slice(0, 300) : null;
  const extra = b.extra && typeof b.extra === 'object' ? JSON.stringify(b.extra).slice(0, 2000) : null;
  await q('INSERT INTO favorites (user_id, kind, ref_id, label, logo, extra) VALUES ($1, $2, $3, $4, $5, $6)', [u.id, kind, refId, label, logo, extra]);
  return { on: true };
});
