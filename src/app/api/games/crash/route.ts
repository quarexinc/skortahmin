import { getUser, HttpError, requireUser } from '@/lib/auth';
import { cq, cq1, tx } from '@/lib/db';
import { ensureRound, multiplierAt, msForMultiplier } from '@/lib/games/crash';
import { body, route } from '@/lib/http';
import { ledger, lockUser, parseAmount, settle, takeBet } from '@/lib/wallet';

export const dynamic = 'force-dynamic';

export const GET = route(async () => {
  const me = await getUser();
  return tx(async (c) => {
    const r = await ensureRound(c);
    const now = Date.now();
    const start = new Date(r.starts_at).getTime();
    const crashed = !!r.crashed_at;
    const bets = await cq(c, `SELECT b.user_id, u.name, u.avatar_color, b.amount, b.auto_cashout, b.cashout_mult, b.payout, b.status
       FROM crash_bets b JOIN users u ON u.id = b.user_id WHERE b.round_id = $1 ORDER BY b.amount DESC LIMIT 50`,
      [r.id],
    );
    const history = await cq(c, `SELECT id, crash_point, edge FROM crash_rounds WHERE crashed_at IS NOT NULL ORDER BY id DESC LIMIT 20`,
    );
    return {
      now,
      round: {
        id: Number(r.id),
        hash: r.hash,
        edge: Number(r.edge),
        startsAt: start,
        phase: now < start ? 'betting' : crashed ? 'crashed' : 'flying',
        crashPoint: crashed ? Number(r.crash_point) : null,
        seed: crashed ? r.seed : null,
        crashedAt: crashed ? new Date(r.crashed_at!).getTime() : null,
      },
      bets: bets.map((b) => ({ ...b, mine: me?.id === b.user_id })),
      myBet: me ? bets.find((b) => b.user_id === me.id) ?? null : null,
      history: history.map((h) => ({ id: Number(h.id), crashPoint: Number(h.crash_point), edge: Number(h.edge) })),
    };
  });
});

export const POST = route(async (req) => {
  const u = await requireUser();
  const b = await body(req);
  return tx(async (c) => {
    const r = await ensureRound(c);
    const now = Date.now();
    const start = new Date(r.starts_at).getTime();
    const lu = await lockUser(c, u.id);

    if (b.action === 'bet') {
      if (now >= start || r.crashed_at) throw new HttpError(400, 'Bu turun bahisleri kapandı; bir sonraki turu bekle.');
      const amount = parseAmount(b.amount);
      let auto: number | null = null;
      if (b.autoCashout != null && b.autoCashout !== '') {
        auto = Number(String(b.autoCashout).replace(',', '.'));
        if (!Number.isFinite(auto) || auto < 1.01 || auto > 1000) throw new HttpError(400, 'Otomatik çıkış 1,01x ile 1000x arasında olmalı.');
        auto = Math.floor(auto * 100) / 100;
      }
      const exists = await cq1(c, 'SELECT id FROM crash_bets WHERE round_id = $1 AND user_id = $2', [r.id, u.id]);
      if (exists) throw new HttpError(400, 'Bu turda zaten bahsin var.');
      const balance = await takeBet(c, lu, 'crash', amount, `crash:${r.id}`);
      await cq(c, 'INSERT INTO crash_bets (round_id, user_id, amount, auto_cashout) VALUES ($1, $2, $3, $4)', [r.id, u.id, amount, auto]);
      return { ok: true, balance };
    }

    const bet = await cq1<{ id: string; amount: string; auto_cashout: string | null; status: string }>(c, `SELECT id, amount, auto_cashout, status FROM crash_bets WHERE round_id = $1 AND user_id = $2 FOR UPDATE`,
      [r.id, u.id],
    );

    if (b.action === 'cancel') {
      if (!bet || bet.status !== 'active') throw new HttpError(400, 'İptal edilecek bahis yok.');
      if (now >= start) throw new HttpError(400, 'Tur başladı; bahis iptal edilemez.');
      const amount = Number(bet.amount);
      const balance = await ledger(c, u.id, 'refund', amount, { ref: `crash:${r.id}` });
      await cq(c, 'UPDATE users SET wagered = GREATEST(0, wagered - $2) WHERE id = $1', [u.id, amount]);
      await cq(c, 'DELETE FROM crash_bets WHERE id = $1', [bet.id]);
      return { ok: true, balance };
    }

    if (b.action === 'cashout') {
      if (!bet || bet.status !== 'active') throw new HttpError(400, 'Bu turda aktif bahsin yok.');
      if (now < start) throw new HttpError(400, 'Tur henüz başlamadı.');
      if (r.crashed_at) throw new HttpError(400, 'Geç kaldın, roket patladı.');
      let m = multiplierAt(now - start);
      const auto = bet.auto_cashout == null ? null : Number(bet.auto_cashout);
      if (auto != null && auto <= m) m = auto;
      if (m >= Number(r.crash_point) || now - start >= msForMultiplier(Number(r.crash_point))) throw new HttpError(400, 'Geç kaldın, roket patladı.');
      const amount = Number(bet.amount);
      const res = await settle(c, u.id, 'crash', amount, amount * m, { round: Number(r.id), cashout: m });
      await cq(c, `UPDATE crash_bets SET status = 'won', cashout_mult = $2, payout = $3 WHERE id = $1`, [bet.id, m, res.payout]);
      return { ok: true, multiplier: m, payout: res.payout, balance: res.balance };
    }
    throw new HttpError(400, 'Geçersiz işlem.');
  });
});
