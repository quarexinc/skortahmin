// GET /api/fixtures?date=YYYY-MM-DD
// Bir güne ait maçlar — yalnızca config'deki ligler, cache'li.
import { NextResponse } from 'next/server';
import { ACTIVE_LEAGUE_IDS } from '@/config/leagues';
import { apiFootball, ApiFootballError, getDailyCount } from '@/lib/apiFootball';
import { cachedFetch, TTL } from '@/lib/cache';
import { lightFixture } from '@/lib/parsers';
import type { FixtureRaw } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const date = url.searchParams.get('date');
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'date parametresi gerekli (YYYY-MM-DD).' }, { status: 400 });
  }

  try {
    const { value, hit } = await cachedFetch<FixtureRaw[]>(
      `fixtures:${date}`,
      TTL.fixtures,
      () => apiFootball<FixtureRaw[]>('fixtures', { date }, { timezone: true }),
    );
    const all = Array.isArray(value) ? value : [];
    const fixtures = all
      .filter((f) => f.league && ACTIVE_LEAGUE_IDS.has(f.league.id))
      .map(lightFixture);
    return NextResponse.json({
      date,
      count: fixtures.length,
      cached: hit,
      dailyCount: getDailyCount(),
      fixtures,
    });
  } catch (e) {
    if (e instanceof ApiFootballError) {
      const status = e.isQuota ? 503 : e.code >= 400 && e.code < 500 ? e.code : 502;
      return NextResponse.json({ error: e.message }, { status });
    }
    return NextResponse.json({ error: 'Beklenmeyen sunucu hatası.' }, { status: 500 });
  }
}
