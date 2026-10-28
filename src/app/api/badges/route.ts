import { requireUser } from '@/lib/auth';
import { route } from '@/lib/http';
import { userBadges } from '@/lib/userStats';

export const dynamic = 'force-dynamic';

export const GET = route(async () => {
  const u = await requireUser();
  return (await userBadges(u.id)) ?? { stats: null, badges: [] };
});
