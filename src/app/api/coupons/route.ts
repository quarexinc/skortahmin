import { HttpError, requireUser } from '@/lib/auth';
import { q, q1 } from '@/lib/db';
import { body, int, route, str } from '@/lib/http';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export const GET = route(async (req) => {
  const scope = new URL(req.url).searchParams.get('scope');
  if (scope === 'public') {
    const items = await q(
      `SELECT c.id, c.title, c.picks, c.total_prob, c.created_at, u.name AS user_name, u.avatar_color
       FROM coupons c JOIN users u ON u.id = c.user_id
       WHERE c.is_public AND NOT u.banned ORDER BY c.created_at DESC LIMIT 12`,
    );
    return { items };
  }
  const u = await requireUser();
  const items = await q('SELECT id, title, picks, total_prob, is_public, created_at FROM coupons WHERE user_id = $1 ORDER BY created_at DESC', [u.id]);
  return { items };
});

interface Pick { fixtureId: number; home: string; away: string; league: string | null; date: string; market: string; selection: string; prob: number }

export const POST = route(async (req) => {
  const u = await requireUser();
  const b = await body(req);
  const title = str(b.title, 'Kupon adı', { min: 2, max: 60 });
  if (!Array.isArray(b.picks) || b.picks.length < 1 || b.picks.length > 20) throw new HttpError(400, 'Kuponda 1–20 seçim olmalı.');
  const picks: Pick[] = b.picks.map((p: Pick) => ({
    fixtureId: int(p.fixtureId, 'Maç'),
    home: String(p.home).slice(0, 80),
    away: String(p.away).slice(0, 80),
    league: p.league ? String(p.league).slice(0, 80) : null,
    date: String(p.date).slice(0, 40),
    market: String(p.market).slice(0, 30),
    selection: String(p.selection).slice(0, 30),
    prob: Math.min(1, Math.max(0, Number(p.prob) || 0)),
  }));
  if (!u.isPremium) {
    const limit = (await getSettings()).freeCouponLimit;
    const [{ n }] = await q<{ n: number }>('SELECT COUNT(*)::int AS n FROM coupons WHERE user_id = $1', [u.id]);
    if (n >= limit) throw new HttpError(403, `Ücretsiz üyeler en fazla ${limit} kupon kaydedebilir. Eski bir kuponu sil ya da Premium'a geç.`);
  }
  const total = picks.reduce((a, p) => a * p.prob, 1);
  const c = await q1<{ id: number }>(
    'INSERT INTO coupons (user_id, title, picks, total_prob, is_public) VALUES ($1, $2, $3, $4, $5) RETURNING id',
    [u.id, title, JSON.stringify(picks), total, b.isPublic === true],
  );
  return { id: c!.id };
});

export const DELETE = route(async (req) => {
  const u = await requireUser();
  const id = int(new URL(req.url).searchParams.get('id'), 'Kupon');
  await q('DELETE FROM coupons WHERE id = $1 AND (user_id = $2 OR $3)', [id, u.id, u.isAdmin]);
  return { ok: true };
});
