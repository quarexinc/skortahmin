import { HttpError } from '@/lib/auth';
import { q } from '@/lib/db';
import { body, EMAIL_RE, route, str } from '@/lib/http';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export const POST = route(async (req) => {
  if (!(await getSettings()).newsletterEnabled) throw new HttpError(403, 'Bülten aboneliği şu anda kapalı.');
  const b = await body(req);
  if (b.website) return { ok: true };
  const email = str(b.email, 'E-posta', { max: 120 }).toLowerCase();
  if (!EMAIL_RE.test(email)) throw new HttpError(400, 'Geçerli bir e-posta adresi girin.');
  await q('INSERT INTO newsletter (email) VALUES ($1) ON CONFLICT (email) DO UPDATE SET active = TRUE', [email]);
  return { ok: true };
});
