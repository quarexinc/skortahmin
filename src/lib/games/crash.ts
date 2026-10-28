// Crash: tüm oyuncuların ortak oynadığı turlar. Sunucuda sürekli çalışan bir döngü yok;
// her durum isteğinde tur zaman çizelgesi ilerletilir (kilitli transaction ile), böylece
// sunucusuz ortamda da tutarlı çalışır.
import 'server-only';
import { createHmac, randomBytes } from 'crypto';
import { cq, cq1, type PoolClient } from '@/lib/db';
import { sha256 } from '@/lib/fair';
import { ledger, settle } from '@/lib/wallet';

export const BETTING_MS = 7000;
export const POST_MS = 3500;
export const GROWTH = 0.00006; // çarpan(t) = e^(GROWTH * ms)
export const MAX_CRASH = 1000;

export const multiplierAt = (ms: number) => Math.max(1, Math.floor(Math.exp(GROWTH * Math.max(0, ms)) * 100) / 100);
export const msForMultiplier = (m: number) => Math.log(m) / GROWTH;

/** Tohumdan çökme noktası: ~%1 anında 1,00x, beklenen ev avantajı %1. */
export function crashPointFromSeed(seed: string): number {
  const h = createHmac('sha256', seed).update('crash').digest('hex');
  const r = parseInt(h.slice(0, 13), 16) / 2 ** 52;
  const cp = Math.floor(99 / (1 - r)) / 100;
  return Math.min(MAX_CRASH, Math.max(1, cp));
}

export interface Round {
  id: number;
  crash_point: string;
  seed: string;
  hash: string;
  starts_at: Date;
  crashed_at: Date | null;
  settled: boolean;
}

async function settleRound(c: PoolClient, r: Round) {
  const cp = Number(r.crash_point);
  const bets = await cq<{ id: string; user_id: number; amount: string; auto_cashout: string | null }>(c, `SELECT id, user_id, amount, auto_cashout FROM crash_bets WHERE round_id = $1 AND status = 'active' ORDER BY user_id FOR UPDATE`,
    [r.id],
  );
  for (const b of bets) {
    await cq(c, 'SELECT id FROM users WHERE id = $1 FOR UPDATE', [b.user_id]);
    const auto = b.auto_cashout == null ? null : Number(b.auto_cashout);
    const amount = Number(b.amount);
    const won = auto != null && auto <= cp;
    const mult = won ? auto! : 0;
    const res = await settle(c, b.user_id, 'crash', amount, won ? amount * mult : 0, { round: r.id, crashPoint: cp, cashout: won ? mult : null, auto });
    await cq(c, `UPDATE crash_bets SET status = $2, cashout_mult = $3, payout = $4 WHERE id = $1`, [b.id, won ? 'won' : 'lost', won ? mult : null, res.payout]);
  }
  await cq(c, 'UPDATE crash_rounds SET settled = TRUE WHERE id = $1', [r.id]);
}

/** Zaman çizelgesini ilerletir ve güncel turu döndürür. */
export async function ensureRound(c: PoolClient): Promise<Round> {
  await cq(c, 'SELECT pg_advisory_xact_lock(424242)');
  const now = Date.now();
  let r = await cq1<Round>(c, 'SELECT * FROM crash_rounds ORDER BY id DESC LIMIT 1');
  if (r) {
    const start = new Date(r.starts_at).getTime();
    const cp = Number(r.crash_point);
    const crashAt = start + msForMultiplier(cp);
    if (!r.crashed_at && now >= crashAt) {
      await cq(c, 'UPDATE crash_rounds SET crashed_at = $2 WHERE id = $1', [r.id, new Date(crashAt)]);
      r.crashed_at = new Date(crashAt);
    }
    if (r.crashed_at && !r.settled) {
      await settleRound(c, r);
      r.settled = true;
    }
  }
  if (!r || (r.crashed_at && now >= new Date(r.crashed_at).getTime() + POST_MS)) {
    const seed = randomBytes(32).toString('hex');
    r = await cq1<Round>(c, 'INSERT INTO crash_rounds (crash_point, seed, hash, starts_at) VALUES ($1, $2, $3, $4) RETURNING *',
      [crashPointFromSeed(seed), seed, sha256(seed), new Date(now + BETTING_MS)],
    );
  }
  return r!;
}

export { ledger };
