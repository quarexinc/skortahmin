import { requireAdmin } from '@/lib/auth';
import { audit, q } from '@/lib/db';
import { body, route } from '@/lib/http';
import { DEFAULT_SETTINGS, getSettings, invalidateSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

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
    else if (typeof def === 'number') v = Math.max(0, Math.min(1000, Math.round(Number(v) || 0)));
    else v = String(v ?? '').slice(0, 600);
    changed[k] = v;
    await q('INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2', [k, JSON.stringify(v)]);
  }
  invalidateSettings();
  await audit(admin.id, 'admin.settings.update', undefined, changed);
  return { settings: await getSettings() };
});
