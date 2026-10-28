import { getUser } from '@/lib/auth';
import { q } from '@/lib/db';
import { route } from '@/lib/http';

export const dynamic = 'force-dynamic';

export const GET = route(async (req) => {
  const sp = new URL(req.url).searchParams;
  const period = sp.get('period') ?? 'week';
  const metric = sp.get('metric') ?? 'wagered';
  const since = period === 'day' ? "NOW() - INTERVAL '1 day'" : period === 'week' ? "NOW() - INTERVAL '7 days'" : period === 'month' ? "NOW() - INTERVAL '30 days'" : "'epoch'::timestamptz";
  const order = metric === 'profit' ? 'SUM(b.payout) - SUM(b.amount)' : metric === 'multiplier' ? 'MAX(b.multiplier)' : 'SUM(b.amount)';
  const rows = await q(
    `SELECT u.id, u.name, u.avatar_color, u.wagered AS total_wagered,
       COUNT(*)::int AS bets, SUM(b.amount)::bigint AS wagered, (SUM(b.payout) - SUM(b.amount))::bigint AS profit, MAX(b.multiplier)::float AS best
     FROM bets b JOIN users u ON u.id = b.user_id
     WHERE NOT u.banned AND b.created_at >= ${since}
     GROUP BY u.id ORDER BY ${order} DESC LIMIT 50`,
  );
  const me = await getUser();
  return { rows, meId: me?.id ?? null };
});
