// Oyun şansları: oyun başına kasa payı, oyunu aç/kapat, blackjack ödeme oranı.
import { revalidatePath } from 'next/cache';
import { HttpError, requireAdmin } from '@/lib/auth';
import { audit, q } from '@/lib/db';
import { EDGE_MAX, EDGE_MIN, GAME_INFO, GAME_KEYS, isGame, type GameKey } from '@/lib/games/registry';
import { body, route } from '@/lib/http';
import { getSettings, invalidateSettings, sanitizeEdges } from '@/lib/settings';

export const dynamic = 'force-dynamic';

const save = (key: string, value: unknown) =>
  q('INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2', [key, JSON.stringify(value)]);

async function snapshot() {
  invalidateSettings();
  const s = await getSettings();
  return {
    games: GAME_KEYS.map((k) => ({
      key: k,
      name: GAME_INFO[k].name,
      kind: GAME_INFO[k].kind,
      tunable: GAME_INFO[k].tunable,
      enabled: !s.disabledGames.includes(k),
      edge: s.edges[k],
      defaultEdge: GAME_INFO[k].edge,
    })),
    blackjackPayout: s.blackjackPayout,
    limits: { min: EDGE_MIN, max: EDGE_MAX },
  };
}

export const GET = route(async () => {
  await requireAdmin();
  return snapshot();
});

export const PUT = route(async (req) => {
  const admin = await requireAdmin();
  const b = await body(req);
  const s = await getSettings();

  if (b.blackjackPayout != null) {
    const v = Number(b.blackjackPayout);
    if (!Number.isFinite(v) || v < 1 || v > 2) throw new HttpError(400, 'Blackjack ödemesi 1,0 ile 2,0 arasında olmalı (1,5 = 3:2).');
    await save('blackjackPayout', Math.round(v * 100) / 100);
    await audit(admin.id, 'admin.odds.blackjack', undefined, { from: s.blackjackPayout, to: v });
  } else {
    if (!isGame(b.game)) throw new HttpError(400, 'Geçersiz oyun.');
    const g: GameKey = b.game;
    if (typeof b.enabled === 'boolean') {
      const off = new Set(s.disabledGames);
      if (b.enabled) off.delete(g);
      else off.add(g);
      await save('disabledGames', [...off]);
      await audit(admin.id, 'admin.odds.toggle', g, { enabled: b.enabled });
    }
    if (b.reset === true || b.edge != null) {
      if (!GAME_INFO[g].tunable) throw new HttpError(400, 'Bu oyunun kasa payı sabit; blackjack için ödeme oranını ayarla.');
      const edge = b.reset === true ? GAME_INFO[g].edge : Number(String(b.edge).replace(',', '.'));
      if (!Number.isFinite(edge) || edge < EDGE_MIN || edge > EDGE_MAX) throw new HttpError(400, `Kasa payı %${EDGE_MIN} ile %${EDGE_MAX} arasında olmalı.`);
      await save('edges', sanitizeEdges({ ...s.edges, [g]: edge }));
      await audit(admin.id, 'admin.odds.edge', g, { from: s.edges[g], to: edge });
    }
  }
  invalidateSettings();
  revalidatePath('/', 'layout');
  return snapshot();
});
