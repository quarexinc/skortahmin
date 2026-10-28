import { getUser, HttpError, requireUser } from '@/lib/auth';
import { audit, q, q1 } from '@/lib/db';
import { body, int, route, str } from '@/lib/http';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export const GET = route(async (req) => {
  const fixtureId = int(new URL(req.url).searchParams.get('fixture'), 'Maç');
  const me = await getUser();
  const items = await q(
    `SELECT c.id, c.body, c.created_at, c.user_id, u.name, u.avatar_color,
       (u.plan = 'premium' AND (u.premium_until IS NULL OR u.premium_until > NOW())) AS premium, u.role = 'admin' AS admin
     FROM comments c JOIN users u ON u.id = c.user_id
     WHERE c.fixture_id = $1 AND NOT c.hidden AND NOT u.banned ORDER BY c.created_at DESC LIMIT 100`,
    [fixtureId],
  );
  return { items, meId: me?.id ?? null, isAdmin: !!me?.isAdmin, enabled: (await getSettings()).commentsEnabled };
});

export const POST = route(async (req) => {
  const u = await requireUser();
  if (!(await getSettings()).commentsEnabled) throw new HttpError(403, 'Yorumlar şu anda kapalı.');
  const b = await body(req);
  const fixtureId = int(b.fixtureId, 'Maç', { min: 1 });
  const text = str(b.body, 'Yorum', { min: 2, max: 600 });
  if (/(https?:\/\/|www\.)/i.test(text) && !u.isAdmin) throw new HttpError(400, 'Yorumlarda bağlantı paylaşılamaz.');
  const [{ n }] = await q<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM comments WHERE user_id = $1 AND created_at > NOW() - INTERVAL '1 minute'`,
    [u.id],
  );
  if (n >= 3) throw new HttpError(429, 'Çok hızlı yorum yapıyorsun; biraz bekle.');
  await q('INSERT INTO comments (fixture_id, user_id, body) VALUES ($1, $2, $3)', [fixtureId, u.id, text]);
  return { ok: true };
});

export const DELETE = route(async (req) => {
  const u = await requireUser();
  const id = int(new URL(req.url).searchParams.get('id'), 'Yorum');
  const c = await q1<{ user_id: number }>('SELECT user_id FROM comments WHERE id = $1', [id]);
  if (!c) return { ok: true };
  if (c.user_id !== u.id && !u.isAdmin) throw new HttpError(403, 'Bu yorumu silemezsin.');
  await q('DELETE FROM comments WHERE id = $1', [id]);
  if (u.isAdmin && c.user_id !== u.id) await audit(u.id, 'comment.delete', `comment:${id}`);
  return { ok: true };
});
