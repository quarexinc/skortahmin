// CSV dışa aktarma (Excel uyumlu, UTF-8 BOM'lu, ; ayırıcılı)
import { requireAdmin } from '@/lib/auth';
import { audit, q } from '@/lib/db';
import { route } from '@/lib/http';
import { HttpError } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const QUERIES: Record<string, { sql: string; file: string }> = {
  users: {
    sql: `SELECT id, name AS ad, email, role AS rol, banned AS askida, birth_date AS dogum_tarihi,
            balance / 100.0 AS bakiye, vault / 100.0 AS kasa, wagered / 100.0 AS toplam_oynanan, self_excluded_until AS mola_bitis,
            created_at AS kayit, last_login_at AS son_giris
          FROM users ORDER BY id`,
    file: 'kullanicilar',
  },
  bets: {
    sql: `SELECT b.id, u.email, b.game AS oyun, b.amount / 100.0 AS bahis, b.payout / 100.0 AS odeme, b.multiplier AS carpan,
            b.server_hash AS sunucu_hash, b.client_seed AS istemci_tohumu, b.nonce, b.created_at AS zaman
          FROM bets b JOIN users u ON u.id = b.user_id ORDER BY b.id DESC LIMIT 50000`,
    file: 'eller',
  },
  transactions: {
    sql: `SELECT t.id, u.email, t.type AS tur, t.amount / 100.0 AS tutar, t.balance_after / 100.0 AS bakiye, t.ref AS referans, t.note AS aciklama, t.created_at AS zaman
          FROM transactions t JOIN users u ON u.id = t.user_id ORDER BY t.id DESC LIMIT 50000`,
    file: 'kredi-islemleri',
  },
  crash: {
    sql: `SELECT id AS tur, crash_point AS patlama, hash, seed AS tohum, starts_at AS baslangic, crashed_at AS bitis FROM crash_rounds WHERE settled ORDER BY id DESC LIMIT 50000`,
    file: 'crash-turlari',
  },
  tickets: {
    sql: `SELECT t.id, t.subject AS konu, t.category AS kategori, t.priority AS oncelik, t.status AS durum, COALESCE(u.email, t.guest_email) AS email, t.created_at AS olusturma, t.updated_at AS guncelleme
          FROM tickets t LEFT JOIN users u ON u.id = t.user_id ORDER BY t.id`,
    file: 'destek-talepleri',
  },
  newsletter: { sql: `SELECT email, active AS aktif, created_at AS kayit FROM newsletter ORDER BY id`, file: 'bulten' },
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
