// İletişim formu: üye/ziyaretçi fark etmeksizin bir destek talebi oluşturur.
import { getUser, HttpError } from '@/lib/auth';
import { q, q1 } from '@/lib/db';
import { body, EMAIL_RE, route, str } from '@/lib/http';

export const dynamic = 'force-dynamic';

export const POST = route(async (req) => {
  const b = await body(req);
  if (b.website) return { ok: true }; // bal küpü (bot)
  const user = await getUser();
  const name = user ? user.name : str(b.name, 'Ad soyad', { min: 2, max: 60 });
  const email = user ? user.email : str(b.email, 'E-posta', { max: 120 }).toLowerCase();
  if (!EMAIL_RE.test(email)) throw new HttpError(400, 'Geçerli bir e-posta adresi girin.');
  const subject = str(b.subject, 'Konu', { min: 3, max: 120 });
  const message = str(b.message, 'Mesaj', { min: 10, max: 4000 });
  const category = ['genel', 'hesap', 'premium', 'tahmin', 'hata', 'oneri'].includes(b.category) ? b.category : 'iletisim';

  const [{ n }] = await q<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM tickets WHERE (guest_email = $1 OR user_id = $2) AND created_at > NOW() - INTERVAL '1 hour'`,
    [email, user?.id ?? -1],
  );
  if (n >= 3) throw new HttpError(429, 'Kısa sürede çok fazla mesaj gönderdiniz. Lütfen daha sonra tekrar deneyin.');

  const t = await q1<{ id: number }>(
    `INSERT INTO tickets (user_id, guest_name, guest_email, subject, category) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [user?.id ?? null, user ? null : name, user ? null : email, subject, category],
  );
  await q('INSERT INTO ticket_messages (ticket_id, author_id, body) VALUES ($1, $2, $3)', [t!.id, user?.id ?? null, message]);
  return { ok: true, ticketId: t!.id, member: !!user };
});
