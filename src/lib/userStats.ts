// Bir üyenin herkese açık oyun istatistikleri + rozetleri
import 'server-only';
import { computeBadges, type BadgeStats } from '@/config/badges';
import { vipFor } from '@/config/vip';
import { q1 } from '@/lib/db';

export async function userBadgeStats(id: number): Promise<BadgeStats | null> {
  const r = await q1<{
    bets: number; wins: number; wagered: string; best_mult: string | null; biggest_win: string | null; games: number;
    mines: number; crash: number; slots: number; blackjack: number; bj21: number; daily: number; tickets: number; days: number; rank: number | null;
  }>(
    `SELECT
       (SELECT COUNT(*)::int FROM bets WHERE user_id = u.id) AS bets,
       (SELECT COUNT(*)::int FROM bets WHERE user_id = u.id AND payout > amount) AS wins,
       u.wagered::text AS wagered,
       (SELECT MAX(multiplier)::text FROM bets WHERE user_id = u.id AND payout > 0) AS best_mult,
       (SELECT MAX(payout - amount)::text FROM bets WHERE user_id = u.id) AS biggest_win,
       (SELECT COUNT(DISTINCT game)::int FROM bets WHERE user_id = u.id) AS games,
       (SELECT COUNT(*)::int FROM bets WHERE user_id = u.id AND game = 'mines') AS mines,
       (SELECT COUNT(*)::int FROM bets WHERE user_id = u.id AND game = 'crash') AS crash,
       (SELECT COUNT(*)::int FROM bets WHERE user_id = u.id AND game = 'slots') AS slots,
       (SELECT COUNT(*)::int FROM bets WHERE user_id = u.id AND game = 'blackjack') AS blackjack,
       (SELECT COUNT(*)::int FROM bets WHERE user_id = u.id AND game = 'blackjack' AND detail::text LIKE '%"blackjack"%') AS bj21,
       (SELECT COUNT(*)::int FROM transactions WHERE user_id = u.id AND type = 'daily_bonus') AS daily,
       (SELECT COUNT(*)::int FROM tickets WHERE user_id = u.id) AS tickets,
       EXTRACT(DAY FROM NOW() - u.created_at)::int AS days,
       (SELECT rank::int FROM (SELECT id, RANK() OVER (ORDER BY wagered DESC) AS rank FROM users WHERE NOT banned AND wagered > 0) r WHERE r.id = u.id) AS rank
     FROM users u WHERE u.id = $1 AND NOT u.banned`,
    [id],
  );
  if (!r) return null;
  const wagered = Number(r.wagered) / 100;
  return {
    bets: r.bets,
    wins: r.wins,
    wagered,
    bestMult: Number(r.best_mult ?? 0),
    biggestWin: Math.max(0, Number(r.biggest_win ?? 0) / 100),
    games: r.games,
    mines: r.mines,
    crash: r.crash,
    slots: r.slots,
    blackjack: r.blackjack,
    bj21: r.bj21,
    vip: vipFor(wagered).current.level,
    dailyClaims: r.daily,
    tickets: r.tickets,
    days: r.days,
    rank: r.rank,
  };
}

export async function userBadges(id: number) {
  const s = await userBadgeStats(id);
  return s ? { stats: s, badges: computeBadges(s) } : null;
}
