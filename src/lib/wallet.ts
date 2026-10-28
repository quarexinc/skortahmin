// Cüzdan çekirdeği: tüm kredi hareketleri bu fonksiyonlardan geçer.
// Her fonksiyon bir transaction istemcisi (c) alır; çağıran tx() içinde kullanıcı satırını kilitler.
import 'server-only';
import { vipFor } from '@/config/vip';
import { ageFrom, HttpError } from '@/lib/auth';
import { cq, cq1, type PoolClient } from '@/lib/db';
import { toCredits, toUnits } from '@/lib/money';
import { getSettings, type SiteSettings } from '@/lib/settings';

export type GameKey = 'mines' | 'crash' | 'slots' | 'blackjack';

export interface LockedUser {
  id: number;
  name: string;
  balance: number;
  vault: number;
  wagered: number;
  rakeback: number;
  banned: boolean;
  birth_date: Date | null;
  self_excluded_until: Date | null;
  daily_wager_limit: number | null;
}

export async function lockUser(c: PoolClient, id: number): Promise<LockedUser> {
  const r = await cq1<Record<string, unknown>>(
    `SELECT id, name, balance, vault, wagered, rakeback, banned, birth_date, self_excluded_until, daily_wager_limit
     FROM users WHERE id = $1 FOR UPDATE`,
    [id],
  );
  if (!r) throw new HttpError(404, 'Kullanıcı bulunamadı.');
  return {
    id: r.id as number,
    name: r.name as string,
    balance: Number(r.balance),
    vault: Number(r.vault),
    wagered: Number(r.wagered),
    rakeback: Number(r.rakeback),
    banned: r.banned as boolean,
    birth_date: r.birth_date as Date | null,
    self_excluded_until: r.self_excluded_until as Date | null,
    daily_wager_limit: r.daily_wager_limit == null ? null : Number(r.daily_wager_limit),
  };
}

/** Bakiyeye işlem uygular (amount kuruş, işaretli) ve deftere yazar. Yeni bakiyeyi döndürür. */
export async function ledger(
  c: PoolClient,
  userId: number,
  type: string,
  amount: number,
  opts: { ref?: string; note?: string } = {},
): Promise<number> {
  if (!Number.isInteger(amount)) throw new Error('ledger: tamsayı olmayan tutar');
  const row = await cq1<{ balance: string }>(
    'UPDATE users SET balance = balance + $2 WHERE id = $1 AND balance + $2 >= 0 RETURNING balance',
    [userId, amount],
  );
  if (!row) throw new HttpError(400, 'Yetersiz bakiye.');
  const balance = Number(row.balance);
  await cq(c, 'INSERT INTO transactions (user_id, type, amount, balance_after, ref, note) VALUES ($1, $2, $3, $4, $5, $6)', [
    userId,
    type,
    amount,
    balance,
    opts.ref ?? null,
    opts.note ?? null,
  ]);
  return balance;
}

const GAME_FLAG: Record<GameKey, keyof SiteSettings> = {
  mines: 'minesEnabled',
  crash: 'crashEnabled',
  slots: 'slotsEnabled',
  blackjack: 'blackjackEnabled',
};

export const GAME_NAMES: Record<GameKey, string> = { mines: 'Mines', crash: 'Crash', slots: 'Slots', blackjack: 'Blackjack' };

/** Oynama koşulları: yaş, ban, mola, oyun açık mı, bahis sınırları, günlük limit. */
export async function assertCanPlay(c: PoolClient, u: LockedUser, game: GameKey, amount: number): Promise<SiteSettings> {
  const s = await getSettings();
  if (u.banned) throw new HttpError(403, 'Hesabınız askıya alınmış.');
  if ((ageFrom(u.birth_date) ?? 0) < 18) throw new HttpError(403, 'Oyunlar yalnızca 18 yaş ve üzeri üyelere açıktır. Lütfen doğum tarihinizi doğrulayın.');
  if (u.self_excluded_until && new Date(u.self_excluded_until).getTime() > Date.now())
    throw new HttpError(403, `Kendi belirlediğin mola süresi devam ediyor (${new Date(u.self_excluded_until).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })} tarihine kadar).`);
  if (!s[GAME_FLAG[game]]) throw new HttpError(403, `${GAME_NAMES[game]} şu anda bakımda.`);
  if (!Number.isInteger(amount) || amount < toUnits(s.minBet)) throw new HttpError(400, `En düşük bahis ${s.minBet.toLocaleString('tr-TR')} kredi.`);
  if (amount > toUnits(s.maxBet)) throw new HttpError(400, `En yüksek bahis ${s.maxBet.toLocaleString('tr-TR')} kredi.`);
  if (amount > u.balance) throw new HttpError(400, 'Yetersiz bakiye.');
  if (u.daily_wager_limit != null) {
    const [{ sum }] = await cq<{ sum: string }>(
      `SELECT COALESCE(-SUM(amount), 0) AS sum FROM transactions WHERE user_id = $1 AND type = 'bet' AND created_at > NOW() - INTERVAL '24 hours'`,
      [u.id],
    );
    if (Number(sum) + amount > u.daily_wager_limit)
      throw new HttpError(403, `Kendi belirlediğin 24 saatlik oyun limitine ulaştın (${toCredits(u.daily_wager_limit).toLocaleString('tr-TR')} kredi).`);
  }
  return s;
}

/** Bahsi alır: bakiyeden düşer, wager ve rakeback biriktirir, seviye atlamayı bildirir. */
export async function takeBet(c: PoolClient, u: LockedUser, game: GameKey, amount: number, ref?: string): Promise<number> {
  await assertCanPlay(c, u, game, amount);
  const balance = await ledger(c, u.id, 'bet', -amount, { ref: ref ?? game });
  const s = await getSettings();
  const before = vipFor(toCredits(u.wagered)).current;
  const rate = s.rakebackEnabled ? before.rakeback : 0;
  const rb = Math.floor((amount * rate) / 100);
  await cq(c, 'UPDATE users SET wagered = wagered + $2, rakeback = rakeback + $3 WHERE id = $1', [u.id, amount, rb]);
  const after = vipFor(toCredits(u.wagered + amount)).current;
  if (after.level > before.level)
    await cq(c, `INSERT INTO notifications (user_id, title, body, link) VALUES ($1, $2, $3, '/vip')`, [
      u.id,
      `Yeni seviye: ${after.name}`,
      `Tebrikler! ${after.reward.toLocaleString('tr-TR')} kredilik seviye ödülün VIP sayfasında seni bekliyor.`,
    ]);
  u.balance = balance;
  u.wagered += amount;
  return balance;
}

export interface FairRef {
  serverHash: string;
  clientSeed: string;
  nonce: number;
}

/** Sonucu kaydeder, kazancı (varsa) öder. Yeni bakiyeyi döndürür. */
export async function settle(
  c: PoolClient,
  userId: number,
  game: GameKey,
  amount: number,
  rawPayout: number,
  detail: unknown,
  fair?: FairRef,
): Promise<{ balance: number; payout: number; multiplier: number; betId: number }> {
  const s = await getSettings();
  const payout = Math.max(0, Math.min(Math.floor(rawPayout), toUnits(s.maxPayout)));
  const multiplier = amount > 0 ? payout / amount : 0;
  const bet = await cq1<{ id: string }>(
    `INSERT INTO bets (user_id, game, amount, payout, multiplier, detail, server_hash, client_seed, nonce)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
    [userId, game, amount, payout, multiplier.toFixed(4), JSON.stringify(detail ?? null), fair?.serverHash ?? null, fair?.clientSeed ?? null, fair?.nonce ?? null],
  );
  let balance: number;
  if (payout > 0) balance = await ledger(c, userId, 'win', payout, { ref: `${game}:${bet!.id}` });
  else balance = Number((await cq1<{ balance: string }>('SELECT balance FROM users WHERE id = $1', [userId]))!.balance);
  return { balance, payout, multiplier, betId: Number(bet!.id) };
}

/** Kullanıcının girdiği kredi tutarını kuruşa çevirir ve doğrular. */
export function parseAmount(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) throw new HttpError(400, 'Geçerli bir bahis tutarı girin.');
  return toUnits(n);
}
