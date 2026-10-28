import { requireUser } from '@/lib/auth';
import { tx } from '@/lib/db';
import { rotateSeed, seedInfo } from '@/lib/fair';
import { body, route } from '@/lib/http';

export const dynamic = 'force-dynamic';

export const GET = route(async () => {
  const u = await requireUser();
  return tx((c) => seedInfo(c, u.id));
});

export const POST = route(async (req) => {
  const u = await requireUser();
  const b = await body(req);
  return tx(async (c) => {
    await rotateSeed(c, u.id, typeof b.clientSeed === 'string' ? b.clientSeed : undefined);
    return seedInfo(c, u.id);
  });
});
