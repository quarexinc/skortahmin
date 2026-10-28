import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { dbConfigured, q1 } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ user: null, enabled: dbConfigured() });
  const counts = await q1<{ notifications: number; chat: number }>(
    `SELECT
       (SELECT COUNT(*)::int FROM notifications WHERE user_id = $1 AND NOT read) AS notifications,
       (SELECT COALESCE(SUM(user_unread), 0)::int FROM chats WHERE user_id = $1) AS chat`,
    [user.id],
  );
  return NextResponse.json({ user, enabled: true, unread: counts });
}
