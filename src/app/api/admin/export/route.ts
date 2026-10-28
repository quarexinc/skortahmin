// CSV dışa aktarma (Excel uyumlu, UTF-8 BOM'lu, ; ayırıcılı)
import { requireAdmin } from '@/lib/auth';
import { audit, q } from '@/lib/db';
import { route } from '@/lib/http';
import { HttpError } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const QUERIES: Record<string, { sql: string; file: string }> = {
  users: {
    sql: `SELECT id, name AS ad, email, role AS rol, plan, premium_until AS premium_bitis, banned AS askida, created_at AS kayit, last_login_at AS son_giris,
            (SELECT COUNT(*) FROM predictions p WHERE p.user_id = users.id) AS tahmin,
            (SELECT COALESCE(SUM(points),0) FROM predictions p WHERE p.user_id = users.id) AS puan
          FROM users ORDER BY id`,
    file: 'kullanicilar',
  },
  tickets: {
    sql: `SELECT t.id, t.subject AS konu, t.category AS kategori, t.priority AS oncelik, t.status AS durum, COALESCE(u.email, t.guest_email) AS email, t.created_at AS olusturma, t.updated_at AS guncelleme
          FROM tickets t LEFT JOIN users u ON u.id = t.user_id ORDER BY t.id`,
    file: 'destek-talepleri',
  },
  newsletter: { sql: `SELECT email, active AS aktif, created_at AS kayit FROM newsletter ORDER BY id`, file: 'bulten' },
  predictions: {
    sql: `SELECT p.id, u.email, p.home_name AS ev, p.away_name AS deplasman, p.home_goals AS tahmin_ev, p.away_goals AS tahmin_dep, p.actual_home AS sonuc_ev, p.actual_away AS sonuc_dep, p.points AS puan, p.fixture_date AS mac_tarihi
          FROM predictions p JOIN users u ON u.id = p.user_id ORDER BY p.id`,
    file: 'tahminler',
  },
  premium: {
    sql: `SELECT r.id, u.email, r.months AS ay, r.status AS durum, r.note AS not_, r.created_at AS talep, r.decided_at AS karar FROM premium_requests r JOIN users u ON u.id = r.user_id ORDER BY r.id`,
    file: 'premium-talepleri',
  },
};

const cell = (v: unknown) => {
  if (v == null) return '';
  const s = v instanceof Date ? v.toISOString() : String(v);
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const GET = route(async (req) => {
  const admin = await requireAdmin();
  const type = new URL(req.url).searchParams.get('type') ?? '';
  const def = QUERIES[type];
  if (!def) throw new HttpError(400, 'Geçersiz dışa aktarma türü.');
  const rows = await q<Record<string, unknown>>(def.sql);
  const cols = rows[0] ? Object.keys(rows[0]) : [];
  const csv = '﻿' + [cols.join(';'), ...rows.map((r) => cols.map((c) => cell(r[c])).join(';'))].join('\r\n');
  await audit(admin.id, 'admin.export', type, { rows: rows.length });
  return new Response(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${def.file}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
});
