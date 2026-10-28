import { requireAdmin } from '@/lib/auth';
import { audit, q } from '@/lib/db';
import { body, route } from '@/lib/http';
import { DEFAULT_SETTINGS, getSettings, invalidateSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

/** sayısal ayarlar: [en az, en çok, ondalık basamak] */
const RANGES: Record<string, [number, number, number]> = {
  minBet: [0.01, 1000, 2],
  maxBet: [1, 10_000_000, 2],
  maxPayout: [100, 1_000_000_000, 0],
  signupBonus: [0, 1_000_000, 0],
  faucetAmount: [0, 100_000, 0],
  faucetMinutes: [1, 1440, 0],
};

export const GET = route(async () => {
  await requireAdmin();
  invalidateSettings();
  return { settings: await getSettings() };
});

export const PUT = route(async (req) => {
  const admin = await requireAdmin();
  const b = await body(req);
  const changed: Record<string, unknown> = {};
  for (const [k, def] of Object.entries(DEFAULT_SETTINGS)) {
    if (!(k in b)) continue;
    let v = b[k];
    if (typeof def === 'boolean') v = v === true;
    else if (typeof def === 'number') {
      const [min, max, dec] = RANGES[k] ?? [0, 1000, 0];
      const n = Number(String(v).replace(',', '.'));
      v = Math.max(min, Math.min(max, Number.isFinite(n) ? Number(n.toFixed(dec)) : (def as number)));
    }
    else v = String(v ?? '').slice(0, 600);
    changed[k] = v;
    await q('INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2', [k, JSON.stringify(v)]);
  }
  const after = await (invalidateSettings(), getSettings());
  if (after.minBet > after.maxBet) {
    await q('INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2', ['minBet', JSON.stringify(after.maxBet)]);
  }
  invalidateSettings();
  await audit(admin.id, 'admin.settings.update', undefined, changed);
  return { settings: await getSettings() };
});
