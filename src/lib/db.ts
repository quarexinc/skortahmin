// ---------------------------------------------------------------------------
// Postgres bağlantısı (Neon / herhangi bir Postgres). Şema ilk kullanımda
// otomatik oluşturulur (CREATE TABLE IF NOT EXISTS) ve admin hesabı
// ADMIN_EMAIL / ADMIN_PASSWORD ortam değişkenlerinden tohumlanır.
// ---------------------------------------------------------------------------
import 'server-only';
import { Pool, type PoolClient } from 'pg';
import bcrypt from 'bcryptjs';

declare global {
  // eslint-disable-next-line no-var
  var __skorPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __skorSchema: Promise<void> | undefined;
}

export function dbConfigured(): boolean {
  return !!(process.env.DATABASE_URL || process.env.POSTGRES_URL);
}

function pool(): Pool {
  if (!globalThis.__skorPool) {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!connectionString) throw new Error('DATABASE_URL tanımlı değil; veritabanı bağlı değil.');
    const local = /localhost|127\.0\.0\.1/.test(connectionString);
    globalThis.__skorPool = new Pool({
      connectionString,
      max: Number(process.env.DB_POOL_MAX ?? (local ? 1 : 5)),
      ssl: local ? undefined : { rejectUnauthorized: false },
      idleTimeoutMillis: 10_000,
    });
  }
  return globalThis.__skorPool;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  plan TEXT NOT NULL DEFAULT 'free',
  premium_until TIMESTAMPTZ,
  favorite_team TEXT,
  bio TEXT,
  avatar_color TEXT NOT NULL DEFAULT '#22c55e',
  banned BOOLEAN NOT NULL DEFAULT FALSE,
  ban_reason TEXT,
  token_version INT NOT NULL DEFAULT 0,
  email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS login_attempts (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  ip TEXT,
  success BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS login_attempts_email_idx ON login_attempts (email, created_at);
CREATE TABLE IF NOT EXISTS favorites (
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  ref_id INT NOT NULL,
  label TEXT NOT NULL,
  logo TEXT,
  extra JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, kind, ref_id)
);
CREATE TABLE IF NOT EXISTS predictions (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fixture_id INT NOT NULL,
  home_goals INT NOT NULL,
  away_goals INT NOT NULL,
  fixture_date TIMESTAMPTZ NOT NULL,
  home_name TEXT NOT NULL,
  away_name TEXT NOT NULL,
  league_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  actual_home INT,
  actual_away INT,
  points INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, fixture_id)
);
CREATE INDEX IF NOT EXISTS predictions_pending_idx ON predictions (status, fixture_date);
CREATE TABLE IF NOT EXISTS coupons (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  picks JSONB NOT NULL,
  total_prob DOUBLE PRECISION NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  fixture_id INT NOT NULL,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  hidden BOOLEAN NOT NULL DEFAULT FALSE,
  reports INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS comments_fixture_idx ON comments (fixture_id, created_at);
CREATE TABLE IF NOT EXISTS comment_reports (
  comment_id INT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (comment_id, user_id)
);
CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  guest_name TEXT,
  guest_email TEXT,
  subject TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'genel',
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS ticket_messages (
  id SERIAL PRIMARY KEY,
  ticket_id INT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  author_id INT REFERENCES users(id) ON DELETE SET NULL,
  is_staff BOOLEAN NOT NULL DEFAULT FALSE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS chats (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'open',
  user_unread INT NOT NULL DEFAULT 0,
  admin_unread INT NOT NULL DEFAULT 0,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  chat_id INT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS chat_messages_chat_idx ON chat_messages (chat_id, id);
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications (user_id, read, created_at);
CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT,
  level TEXT NOT NULL DEFAULT 'info',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS premium_requests (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  months INT NOT NULL DEFAULT 1,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  decided_by INT REFERENCES users(id) ON DELETE SET NULL,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);
CREATE TABLE IF NOT EXISTS ads (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  placement TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'image',
  image_url TEXT,
  link_url TEXT,
  title TEXT,
  body TEXT,
  cta TEXT,
  html TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  weight INT NOT NULL DEFAULT 1,
  impressions INT NOT NULL DEFAULT 0,
  clicks INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS promo_codes (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  months INT NOT NULL DEFAULT 1,
  max_uses INT NOT NULL DEFAULT 1,
  used_count INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS promo_redemptions (
  code_id INT NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (code_id, user_id)
);
CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  body TEXT NOT NULL,
  cover_url TEXT,
  tags TEXT,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  author_id INT REFERENCES users(id) ON DELETE SET NULL,
  views INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS pages (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  published BOOLEAN NOT NULL DEFAULT TRUE,
  show_in_footer BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS faqs (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL DEFAULT 'Genel',
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS canned_replies (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS page_views (
  day DATE NOT NULL,
  path TEXT NOT NULL,
  views INT NOT NULL DEFAULT 0,
  PRIMARY KEY (day, path)
);
CREATE TABLE IF NOT EXISTS daily_visitors (
  day DATE NOT NULL,
  visitor TEXT NOT NULL,
  PRIMARY KEY (day, visitor)
);
CREATE TABLE IF NOT EXISTS user_notes (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_id INT REFERENCES users(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS newsletter (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  actor_id INT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target TEXT,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== BloxyBet: cüzdan, oyunlar, sorumlu oyun =====
ALTER TABLE users ADD COLUMN IF NOT EXISTS balance BIGINT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS vault BIGINT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS wagered BIGINT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS rakeback BIGINT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS level_claimed INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_daily_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_faucet_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS self_excluded_until TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_wager_limit BIGINT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS session_reminder_min INT;
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS credits BIGINT NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount BIGINT NOT NULL,
  balance_after BIGINT NOT NULL,
  ref TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS transactions_user_idx ON transactions (user_id, id DESC);
CREATE TABLE IF NOT EXISTS bets (
  id BIGSERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game TEXT NOT NULL,
  amount BIGINT NOT NULL,
  payout BIGINT NOT NULL DEFAULT 0,
  multiplier NUMERIC(14,4) NOT NULL DEFAULT 0,
  detail JSONB,
  server_hash TEXT,
  client_seed TEXT,
  nonce INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS bets_user_idx ON bets (user_id, id DESC);
CREATE INDEX IF NOT EXISTS bets_created_idx ON bets (created_at DESC);
CREATE TABLE IF NOT EXISTS fair_seeds (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  server_seed TEXT NOT NULL,
  server_hash TEXT NOT NULL,
  client_seed TEXT NOT NULL,
  nonce INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revealed_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS fair_seeds_active_idx ON fair_seeds (user_id) WHERE active;
CREATE TABLE IF NOT EXISTS game_sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game TEXT NOT NULL,
  amount BIGINT NOT NULL,
  state JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  server_hash TEXT,
  client_seed TEXT,
  nonce INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS game_sessions_active_idx ON game_sessions (user_id, game) WHERE status = 'active';
CREATE TABLE IF NOT EXISTS crash_rounds (
  id BIGSERIAL PRIMARY KEY,
  crash_point NUMERIC(10,2) NOT NULL,
  seed TEXT NOT NULL,
  hash TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  crashed_at TIMESTAMPTZ,
  settled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS crash_bets (
  id BIGSERIAL PRIMARY KEY,
  round_id BIGINT NOT NULL REFERENCES crash_rounds(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL,
  auto_cashout NUMERIC(10,2),
  cashout_mult NUMERIC(10,2),
  payout BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (round_id, user_id)
);
`;

async function ensureSchema(): Promise<void> {
  if (!globalThis.__skorSchema) {
    globalThis.__skorSchema = (async () => {
      const c = await pool().connect();
      try {
        await c.query(SCHEMA);
        await seedAdmin(c);
      } finally {
        c.release();
      }
    })().catch((e) => {
      globalThis.__skorSchema = undefined;
      throw e;
    });
  }
  return globalThis.__skorSchema;
}

async function seedAdmin(c: PoolClient): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;
  const existing = await c.query('SELECT id, role FROM users WHERE email = $1', [email]);
  if (existing.rows.length === 0) {
    const hash = await bcrypt.hash(password, 10);
    await c.query(
      `INSERT INTO users (email, name, password_hash, role, plan, balance) VALUES ($1, 'Yönetici', $2, 'admin', 'premium', 100000)`,
      [email, hash],
    );
  } else if (existing.rows[0].role !== 'admin') {
    await c.query(`UPDATE users SET role = 'admin' WHERE id = $1`, [existing.rows[0].id]);
  }
}

/** Tek bağlantı üzerinde atomik işlem (BEGIN/COMMIT/ROLLBACK). İçeride yalnızca verilen istemciyi kullanın. */
export async function tx<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  await ensureSchema();
  const c = await pool().connect();
  try {
    await c.query('BEGIN');
    const out = await fn(c);
    await c.query('COMMIT');
    return out;
  } catch (e) {
    await c.query('ROLLBACK').catch(() => undefined);
    throw e;
  } finally {
    c.release();
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function cq<T = any>(c: PoolClient, text: string, params: unknown[] = []): Promise<T[]> {
  return (await c.query(text, params as unknown[])).rows as T[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function cq1<T = any>(c: PoolClient, text: string, params: unknown[] = []): Promise<T | null> {
  return ((await c.query(text, params as unknown[])).rows[0] as T) ?? null;
}

export type { PoolClient };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function q<T = any>(text: string, params: unknown[] = []): Promise<T[]> {
  await ensureSchema();
  const res = await pool().query(text, params as unknown[]);
  return res.rows as T[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function q1<T = any>(text: string, params: unknown[] = []): Promise<T | null> {
  const rows = await q<T>(text, params);
  return rows[0] ?? null;
}

export async function audit(actorId: number | null, action: string, target?: string, meta?: unknown) {
  try {
    await q('INSERT INTO audit_logs (actor_id, action, target, meta) VALUES ($1, $2, $3, $4)', [
      actorId,
      action,
      target ?? null,
      meta ? JSON.stringify(meta) : null,
    ]);
  } catch (e) {
    console.error('[audit] yazılamadı', e);
  }
}

export async function notify(userId: number, title: string, body?: string, link?: string) {
  try {
    await q('INSERT INTO notifications (user_id, title, body, link) VALUES ($1, $2, $3, $4)', [
      userId,
      title,
      body ?? null,
      link ?? null,
    ]);
  } catch (e) {
    console.error('[notify] yazılamadı', e);
  }
}
