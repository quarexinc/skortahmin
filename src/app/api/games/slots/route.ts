import { requireUser } from '@/lib/auth';
import { tx } from '@/lib/db';
import { nextRoll } from '@/lib/fair';
import { edgeFraction } from '@/lib/games/registry';
import { evaluate, slotScale, spinGrid } from '@/lib/games/slots';
import { body, route } from '@/lib/http';
import { getSettings } from '@/lib/settings';
import { lockUser, parseAmount, settle, takeBet } from '@/lib/wallet';

export const dynamic = 'force-dynamic';

export const POST = route(async (req) => {
  const u = await requireUser();
  const amount = parseAmount((await body(req)).amount);
  return tx(async (c) => {
    const lu = await lockUser(c, u.id);
    await takeBet(c, lu, 'slots', amount);
    const roll = await nextRoll(c, u.id, 15);
    const grid = spinGrid(roll.values);
    const ev = evaluate(grid);
    const edge = edgeFraction((await getSettings(c)).edges, 'slots');
    const scale = slotScale(edge);
    const res = await settle(c, u.id, 'slots', amount, amount * ev.totalMult * scale, { grid, lines: ev.lines, scatter: ev.scatter, edge, scale }, roll.fair);
    return { grid, lines: ev.lines, scatter: ev.scatter, scatterMult: ev.scatterMult, multiplier: res.multiplier, payout: res.payout, balance: res.balance, fair: roll.fair, scale };
  });
});
