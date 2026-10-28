import { requireUser } from '@/lib/auth';
import { q } from '@/lib/db';
import { route } from '@/lib/http';

export const dynamic = 'force-dynamic';

const PAGE = 40;

export const GET = route(async (req) => {
  const u = await requireUser();
  const sp = new URL(req.url).searchParams;
  const type = sp.get('type');
  const page = Math.max(0, Math.min(500, Number(sp.get('page') ?? 0) || 0));
  const items = await q(
    `SELECT id, type, amount, balance_after, ref, note, created_at FROM transactions
     WHERE user_id = $1 AND ($2::text IS NULL OR type = $2) ORDER BY id DESC LIMIT ${PAGE + 1} OFFSET ${page * PAGE}`,
    [u.id, type || null],
  );
  const totals = await q<{ type: string; n: number; sum: string }>(
    `SELECT type, COUNT(*)::int AS n, SUM(amount)::text AS sum FROM transactions WHERE user_id = $1 GROUP BY type ORDER BY type`,
    [u.id],
  );
  return { items: items.slice(0, PAGE), more: items.length > PAGE, totals };
});
