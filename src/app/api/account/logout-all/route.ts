import { createSession, requireUser } from '@/lib/auth';
import { q1 } from '@/lib/db';
import { route } from '@/lib/http';

export const dynamic = 'force-dynamic';

// Diğer tüm cihazlardaki oturumları kapatır, bu cihazda oturum açık kalır.
export const POST = route(async () => {
  const u = await requireUser();
  const r = await q1<{ token_version: number }>(
    'UPDATE users SET token_version = token_version + 1 WHERE id = $1 RETURNING token_version',
    [u.id],
  );
  await createSession(u.id, r!.token_version);
  return { ok: true };
});
