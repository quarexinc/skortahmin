// GET /api/fixtures?date=YYYY-MM-DD
// Bir güne ait maçlar — yalnızca config'deki ligler, cache'li.
import { NextResponse } from 'next/server';
import { ApiFootballError, getDailyCount } from '@/lib/apiFootball';
import { getDayFixtures } from '@/lib/fixtures';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const date = url.searchParams.get('date');
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'date parametresi gerekli (YYYY-MM-DD).' }, { status: 400 });
  }

  try {
    const { fixtures, hit } = await getDayFixtures(date);
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
