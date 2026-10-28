// Canlı bahis akışı ve büyük kazançlar (herkese açık)
import { NextResponse } from 'next/server';
import { dbConfigured, q } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!dbConfigured()) return NextResponse.json({ recent: [], big: [] });
  const [recent, big] = await Promise.all([
    q(
      `SELECT b.id, b.game, b.amount, b.payout, b.multiplier, b.created_at, u.id AS user_id, u.name, u.avatar_color
       FROM bets b JOIN users u ON u.id = b.user_id WHERE NOT u.banned ORDER BY b.id DESC LIMIT 25`,
    ).catch(() => []),
    q(
      `SELECT b.id, b.game, b.amount, b.payout, b.multiplier, b.created_at, u.id AS user_id, u.name, u.avatar_color
       FROM bets b JOIN users u ON u.id = b.user_id WHERE NOT u.banned AND b.payout > b.amount AND b.created_at > NOW() - INTERVAL '7 days'
       ORDER BY b.payout - b.amount DESC LIMIT 10`,
    ).catch(() => []),
  ]);
  return NextResponse.json({ recent, big });
}
