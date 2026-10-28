// GET /api/teams/[teamId]?league={id}&season={yıl}
// Takım künyesi + (lig verildiyse) sezon istatistiği.
import { NextResponse } from 'next/server';
import { currentSeason } from '@/config';
import { apiFootball, ApiFootballError, getDailyCount } from '@/lib/apiFootball';
import { cachedFetch, TTL } from '@/lib/cache';
import { parseTeamProfile, parseTeamStats } from '@/lib/parsers';
import type { TeamProfileRaw, TeamStatsRaw } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request, ctx: { params: { teamId: string } }) {
  const teamId = Number(ctx.params.teamId);
  if (!Number.isInteger(teamId) || teamId <= 0) {
    return NextResponse.json({ error: "Geçerli bir takım id'si gerekli." }, { status: 400 });
  }

  const url = new URL(req.url);
  const leagueId = Number(url.searchParams.get('league') ?? 0) || null;
  const season = Number(url.searchParams.get('season') ?? 0) || currentSeason();

  try {
    const [teamRes, statsRes] = await Promise.all([
      cachedFetch<TeamProfileRaw[]>(`team:${teamId}`, TTL.team, () =>
        apiFootball<TeamProfileRaw[]>('teams', { id: teamId }),
      ),
      leagueId
        ? cachedFetch<TeamStatsRaw>(`stats:${teamId}:${leagueId}:${season}`, TTL.stats, () =>
            apiFootball<TeamStatsRaw>('teams/statistics', { league: leagueId, season, team: teamId }),
          ).catch((e) => {
            if (e instanceof ApiFootballError) {
              throw new ApiFootballError(e.message, e.code, e.isPlan, e.isQuota);
            }
            throw e;
          })
        : Promise.resolve(null),
    ]);

    const teamList = Array.isArray(teamRes.value) ? teamRes.value : [];
    const team = teamList[0] ? parseTeamProfile(teamList[0]) : null;
    const stats = leagueId ? parseTeamStats(statsRes?.value ?? null, season) : null;

    return NextResponse.json({
      teamId,
      leagueId,
      season,
      team,
      stats,
      dailyCount: getDailyCount(),
    });
  } catch (e) {
    if (e instanceof ApiFootballError) {
      const status = e.isQuota ? 503 : e.isPlan ? 503 : e.code >= 400 && e.code < 500 ? e.code : 502;
      return NextResponse.json({ error: e.message }, { status });
    }
    return NextResponse.json({ error: 'Beklenmeyen sunucu hatası.' }, { status: 500 });
  }
}
