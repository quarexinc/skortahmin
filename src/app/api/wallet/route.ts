// Cüzdan: bakiye, kasa, bonuslar, VIP ödülleri, rakeback, promosyon kodu, işlem geçmişi.
import { VIP_LEVELS, vipFor } from '@/config/vip';
import { ageFrom, HttpError, requireUser } from '@/lib/auth';
import { audit, cq, cq1, q, q1, tx } from '@/lib/db';
import { body, route, str } from '@/lib/http';
import { fmtCredits, toCredits, toUnits } from '@/lib/money';
import { getSettings } from '@/lib/settings';
import { ledger, lockUser, parseAmount } from '@/lib/wallet';

export const dynamic = 'force-dynamic';

const DAY = 24 * 3600_000;

export const GET = route(async () => {
  const u = await requireUser();
  const s = await getSettings();
  const r = await q1(
    `SELECT balance, vault, wagered, rakeback, level_claimed, last_daily_at, last_faucet_at FROM users WHERE id = $1`,
    [u.id],
  );
  const wagered = toCredits(r.wagered);
  const vip = vipFor(wagered);
  const claimable = VIP_LEVELS.filter((l) => l.level > r.level_claimed && l.level <= vip.current.level).reduce((a, l) => a + l.reward, 0);
  const now = Date.now();
  const dailyAt = r.last_daily_at ? new Date(r.last_daily_at).getTime() + DAY : 0;
  const faucetAt = r.last_faucet_at ? new Date(r.last_faucet_at).getTime() + s.faucetMinutes * 60_000 : 0;
  const lowBalance = Number(r.balance) + Number(r.vault) < toUnits(1);
  const stats = await q1(
    `SELECT COUNT(*)::int AS bets, COALESCE(SUM(amount),0)::bigint AS wagered, COALESCE(SUM(payout),0)::bigint AS paid,
       COALESCE(MAX(payout),0)::bigint AS biggest, COALESCE(MAX(multiplier),0)::float AS best_mult
     FROM bets WHERE user_id = $1`,
    [u.id],
  );
  const transactions = await q(
    `SELECT id, type, amount, balance_after, ref, note, created_at FROM transactions WHERE user_id = $1 ORDER BY id DESC LIMIT 25`,
    [u.id],
  );
  return {
    balance: Number(r.balance),
    vault: Number(r.vault),
    rakeback: Number(r.rakeback),
    vip: { level: vip.current, next: vip.next, progress: vip.progress, wagered },
    levelRewards: claimable,
    daily: { enabled: s.dailyBonusEnabled, amount: vip.current.dailyBonus, availableAt: dailyAt, ready: s.dailyBonusEnabled && now >= dailyAt },
    faucet: { amount: s.faucetAmount, minutes: s.faucetMinutes, availableAt: faucetAt, lowBalance, ready: lowBalance && now >= faucetAt },
    stats: { ...stats, profit: Number(stats.paid) - Number(stats.wagered) },
    transactions,
    ageVerified: u.ageVerified,
  };
});

export const POST = route(async (req) => {
  const u = await requireUser();
  const b = await body(req);
  const s = await getSettings();
  return tx(async (c) => {
    const lu = await lockUser(c, u.id);
    if ((ageFrom(lu.birth_date) ?? 0) < 18) throw new HttpError(403, 'Kredi işlemleri için önce 18 yaşından büyük olduğunu doğrulamalısın.');
    const row = await cq1(c, 'SELECT last_daily_at, last_faucet_at, level_claimed FROM users WHERE id = $1', [u.id]);
    const now = Date.now();
    let balance: number;
    let message: string;

    switch (b.action) {
      case 'daily': {
        if (!s.dailyBonusEnabled) throw new HttpError(403, 'Günlük bonus şu anda kapalı.');
        if (row.last_daily_at && now < new Date(row.last_daily_at).getTime() + DAY) throw new HttpError(400, 'Günlük bonusu zaten aldın.');
        const amt = vipFor(toCredits(lu.wagered)).current.dailyBonus;
        balance = await ledger(c, u.id, 'daily_bonus', toUnits(amt));
        await cq(c, 'UPDATE users SET last_daily_at = NOW() WHERE id = $1', [u.id]);
        message = `${amt.toLocaleString('tr-TR')} kredi günlük bonus hesabına eklendi.`;
        break;
      }
      case 'faucet': {
        if (lu.balance + lu.vault >= toUnits(1)) throw new HttpError(400, 'Ücretsiz kredi yalnızca bakiyen 1 kredinin altına düştüğünde alınabilir.');
        if (row.last_faucet_at && now < new Date(row.last_faucet_at).getTime() + s.faucetMinutes * 60_000)
          throw new HttpError(400, `Ücretsiz krediyi ${s.faucetMinutes} dakikada bir alabilirsin.`);
        balance = await ledger(c, u.id, 'faucet', toUnits(s.faucetAmount));
        await cq(c, 'UPDATE users SET last_faucet_at = NOW() WHERE id = $1', [u.id]);
        message = `${s.faucetAmount} ücretsiz kredi eklendi.`;
        break;
      }
      case 'rakeback': {
        if (!s.rakebackEnabled) throw new HttpError(403, 'Rakeback şu anda kapalı.');
        if (lu.rakeback < 1) throw new HttpError(400, 'Toplanacak rakeback yok.');
        balance = await ledger(c, u.id, 'rakeback', lu.rakeback);
        await cq(c, 'UPDATE users SET rakeback = 0 WHERE id = $1', [u.id]);
        message = `${fmtCredits(lu.rakeback)} kredi rakeback alındı.`;
        break;
      }
      case 'levelRewards': {
        const vip = vipFor(toCredits(lu.wagered)).current;
        const levels = VIP_LEVELS.filter((l) => l.level > row.level_claimed && l.level <= vip.level);
        const total = levels.reduce((a, l) => a + l.reward, 0);
        if (total <= 0) throw new HttpError(400, 'Alınacak seviye ödülü yok.');
        balance = await ledger(c, u.id, 'level_reward', toUnits(total), { note: levels.map((l) => l.name).join(', ') });
        await cq(c, 'UPDATE users SET level_claimed = $2 WHERE id = $1', [u.id, vip.level]);
        message = `${total.toLocaleString('tr-TR')} kredi seviye ödülü alındı.`;
        break;
      }
      case 'vaultDeposit': {
        const amt = parseAmount(b.amount);
        balance = await ledger(c, u.id, 'vault_in', -amt);
        await cq(c, 'UPDATE users SET vault = vault + $2 WHERE id = $1', [u.id, amt]);
        message = `${fmtCredits(amt)} kredi kasaya kilitlendi.`;
        break;
      }
      case 'vaultWithdraw': {
        const amt = parseAmount(b.amount);
        const v = await cq1(c, 'UPDATE users SET vault = vault - $2 WHERE id = $1 AND vault >= $2 RETURNING vault', [u.id, amt]);
        if (!v) throw new HttpError(400, 'Kasada yeterli kredi yok.');
        balance = await ledger(c, u.id, 'vault_out', amt);
        message = `${fmtCredits(amt)} kredi kasadan bakiyeye aktarıldı.`;
        break;
      }
      case 'promo': {
        const code = str(b.code, 'Kod', { max: 40 }).toUpperCase().replace(/\s+/g, '');
        const [{ n }] = await cq(c, `SELECT COUNT(*)::int AS n FROM audit_logs WHERE actor_id = $1 AND action = 'promo.fail' AND created_at > NOW() - INTERVAL '10 minutes'`, [u.id]);
        if (n >= 5) throw new HttpError(429, 'Çok fazla hatalı deneme. 10 dakika sonra tekrar dene.');
        const pc = await cq1(c, 'SELECT * FROM promo_codes WHERE code = $1 FOR UPDATE', [code]);
        const fail = async (msg: string): Promise<never> => {
          await audit(u.id, 'promo.fail', code);
          throw new HttpError(400, msg);
        };
        if (!pc || !pc.active) await fail('Kod geçersiz.');
        if (pc.expires_at && new Date(pc.expires_at).getTime() < now) await fail('Bu kodun süresi dolmuş.');
        if (pc.used_count >= pc.max_uses) await fail('Bu kodun kullanım limiti dolmuş.');
        if (await cq1(c, 'SELECT 1 FROM promo_redemptions WHERE code_id = $1 AND user_id = $2', [pc.id, u.id])) await fail('Bu kodu zaten kullandın.');
        if (Number(pc.credits) <= 0) await fail('Bu kod kredi içermiyor.');
        await cq(c, 'UPDATE promo_codes SET used_count = used_count + 1 WHERE id = $1', [pc.id]);
        await cq(c, 'INSERT INTO promo_redemptions (code_id, user_id) VALUES ($1, $2)', [pc.id, u.id]);
        balance = await ledger(c, u.id, 'promo', toUnits(Number(pc.credits)), { ref: code });
        message = `${Number(pc.credits).toLocaleString('tr-TR')} kredi promosyon kodundan eklendi.`;
        break;
      }
      default:
        throw new HttpError(400, 'Geçersiz işlem.');
    }
    return { ok: true, balance, message };
  });
});
