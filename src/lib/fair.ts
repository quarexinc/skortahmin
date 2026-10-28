// Doğrulanabilir adil oyun (provably fair).
// Sonuç = HMAC_SHA256(serverSeed, `${clientSeed}:${nonce}:${cursor}`) baytlarından üretilen [0,1) sayılar.
// Sunucu tohumunun hash'i oyundan önce gösterilir; tohum değiştirilince eski tohum açıklanır ve
// oyuncu tüm geçmiş sonuçları kendisi yeniden hesaplayabilir.
import 'server-only';
import { createHash, createHmac, randomBytes } from 'crypto';
import { HttpError } from '@/lib/auth';
import { cq, cq1, type PoolClient } from '@/lib/db';

export const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');
export const newServerSeed = () => randomBytes(32).toString('hex');
export const newClientSeed = () => randomBytes(8).toString('hex');

/** count adet [0,1) sayı üretir (her biri 4 bayttan). */
export function floats(serverSeed: string, clientSeed: string, nonce: number, count: number): number[] {
  const out: number[] = [];
  let cursor = 0;
  while (out.length < count) {
    const buf = createHmac('sha256', serverSeed).update(`${clientSeed}:${nonce}:${cursor}`).digest();
    for (let i = 0; i + 4 <= buf.length && out.length < count; i += 4) {
      out.push(buf[i] / 256 + buf[i + 1] / 256 ** 2 + buf[i + 2] / 256 ** 3 + buf[i + 3] / 256 ** 4);
    }
    cursor++;
  }
  return out;
}

interface SeedRow {
  id: number;
  server_seed: string;
  server_hash: string;
  client_seed: string;
  nonce: number;
}

async function activeSeed(c: PoolClient, userId: number): Promise<SeedRow> {
  let s = await cq1<SeedRow>(c, 'SELECT * FROM fair_seeds WHERE user_id = $1 AND active FOR UPDATE', [userId]);
  if (!s) {
    const seed = newServerSeed();
    s = await cq1<SeedRow>(c, 'INSERT INTO fair_seeds (user_id, server_seed, server_hash, client_seed) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, seed, sha256(seed), newClientSeed()],
    );
  }
  return s!;
}

/** Bir sonraki tur için tohum + nonce verir ve nonce'u artırır. */
export async function nextRoll(c: PoolClient, userId: number, count: number) {
  const s = await activeSeed(c, userId);
  await cq(c, 'UPDATE fair_seeds SET nonce = nonce + 1 WHERE id = $1', [s.id]);
  return {
    values: floats(s.server_seed, s.client_seed, s.nonce, count),
    serverSeed: s.server_seed,
    fair: { serverHash: s.server_hash, clientSeed: s.client_seed, nonce: s.nonce },
  };
}

export async function seedInfo(c: PoolClient, userId: number) {
  const s = await activeSeed(c, userId);
  const prev = await cq<{ server_seed: string; server_hash: string; client_seed: string; nonce: number; revealed_at: Date }>(c, 'SELECT server_seed, server_hash, client_seed, nonce, revealed_at FROM fair_seeds WHERE user_id = $1 AND NOT active ORDER BY id DESC LIMIT 5',
    [userId],
  );
  return { serverHash: s.server_hash, clientSeed: s.client_seed, nonce: s.nonce, previous: prev };
}

/** Tohumu değiştirir: eskisini açıklar, yeni tohum oluşturur. Aktif oyun varken yapılamaz. */
export async function rotateSeed(c: PoolClient, userId: number, clientSeed?: string) {
  const active = await cq1(c, 'SELECT id FROM game_sessions WHERE user_id = $1 AND status = $2 LIMIT 1', [userId, 'active']);
  if (active) throw new HttpError(400, 'Devam eden bir oyunun varken tohum değiştirilemez. Önce oyunu bitir.');
  const cs = (clientSeed ?? '').trim();
  if (cs && !/^[A-Za-z0-9_-]{1,64}$/.test(cs)) throw new HttpError(400, 'İstemci tohumu 1–64 karakter; harf, rakam, - ve _ içerebilir.');
  await activeSeed(c, userId);
  await cq(c, 'UPDATE fair_seeds SET active = FALSE, revealed_at = NOW() WHERE user_id = $1 AND active', [userId]);
  const seed = newServerSeed();
  await cq(c, 'INSERT INTO fair_seeds (user_id, server_seed, server_hash, client_seed) VALUES ($1, $2, $3, $4)', [
    userId,
    seed,
    sha256(seed),
    cs || newClientSeed(),
  ]);
}
