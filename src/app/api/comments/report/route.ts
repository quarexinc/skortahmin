import { requireUser } from '@/lib/auth';
import { q } from '@/lib/db';
import { body, int, route } from '@/lib/http';

export const dynamic = 'force-dynamic';

// 3 farklı şikâyet alan yorum otomatik gizlenir; yönetici panelden inceleyebilir.
export const POST = route(async (req) => {
  const u = await requireUser();
  const id = int((await body(req)).id, 'Yorum');
  const r = await q('INSERT INTO comment_reports (comment_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING 1', [id, u.id]);
  if (r.length) await q('UPDATE comments SET reports = reports + 1, hidden = (reports + 1 >= 3) WHERE id = $1', [id]);
  return { ok: true };
});
