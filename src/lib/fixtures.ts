// Günün maçları (yalnızca yapılandırılmış ligler) — API route ve sunucu sayfaları ortak kullanır.
import 'server-only';
import { ACTIVE_LEAGUE_IDS } from '@/config/leagues';
import { apiFootball } from '@/lib/apiFootball';
import { cachedFetch, TTL } from '@/lib/cache';
import { lightFixture } from '@/lib/parsers';
import type { FixtureRaw, LightFixture } from '@/lib/types';

export async function getDayFixtures(date: string): Promise<{ fixtures: LightFixture[]; hit: boolean }> {
  const { value, hit } = await cachedFetch<LightFixture[]>(`fixtures-light:${date}`, TTL.fixtures, async () => {
    const all = await apiFootball<FixtureRaw[]>('fixtures', { date }, { timezone: true });
    return (Array.isArray(all) ? all : [])
      .filter((f) => f.league && ACTIVE_LEAGUE_IDS.has(f.league.id))
      .map(lightFixture);
  });
  return { fixtures: value, hit };
}
