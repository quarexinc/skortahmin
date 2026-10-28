// GET /api/match/[fixtureId]/extras
// Analizin ikincil verileri: takım künyesi, kadro, lig gol krallığı, kupa vitrini.
// Ana analizden ayrı yüklenir ki maç sayfası hız limitine takılmadan hemen açılsın.
import { NextResponse } from 'next/server';
import { apiFootball, ApiFootballError } from '@/lib/apiFootball';
import { cachedFetch, TTL } from '@/lib/cache';
import { getFixture, matchContext } from '@/lib/matchData';
import { parseCabinet, parseSquad, parseTeamProfile, parseTopScorers } from '@/lib/parsers';
import type {
  ExtrasResponse,
  PlayerEntryRaw,
  TeamAnalysis,
  TeamProfileRaw,
  TopScorerRow,
  TrophyEntryRaw,
} from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 120;

export async function GET(_req: Request, ctx: { params: { fixtureId: string } }) {
  const fixtureId = Number(ctx.params.fixtureId);
  if (!Number.isInteger(fixtureId) || fixtureId <= 0) {
    return NextResponse.json({ error: "Geçerli bir maç id'si gerekli." }, { status: 400 });
  }

  let fixture;
  try {
    fixture = await getFixture(fixtureId);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof ApiFootballError ? e.message : 'Maç verisi alınamadı.' },
      { status: 502 },
    );
  }
  if (!fixture) return NextResponse.json({ error: 'Maç bulunamadı.' }, { status: 404 });

  const leagueId = fixture.league?.id ?? null;
  const homeId = fixture.teams?.home?.id ?? null;
  const awayId = fixture.teams?.away?.id ?? null;
  if (!leagueId || !homeId || !awayId) {
    return NextResponse.json({ error: 'Maç verisi eksik.' }, { status: 404 });
  }

  const { warnings, seasonFetch, plainFetch } = matchContext(fixture);

  const [homeTeamRaw, awayTeamRaw, topScorersRaw, homeSquadRaw, awaySquadRaw] = await Promise.all([
    plainFetch<TeamProfileRaw[]>(`team:${homeId}`, TTL.team, 'Takım künyesi (ev sahibi)', () =>
      apiFootball<TeamProfileRaw[]>('teams', { id: homeId }),
    ),
    plainFetch<TeamProfileRaw[]>(`team:${awayId}`, TTL.team, 'Takım künyesi (deplasman)', () =>
      apiFootball<TeamProfileRaw[]>('teams', { id: awayId }),
    ),
    seasonFetch<PlayerEntryRaw[]>(`topscorers:${leagueId}`, TTL.players, 'Lig gol krallığı', (season) =>
      apiFootball<PlayerEntryRaw[]>('players/topscorers', { league: leagueId, season }),
    ),
    seasonFetch<PlayerEntryRaw[]>(`squad:${homeId}`, TTL.players, 'Kadro (ev sahibi)', (season) =>
      apiFootball<PlayerEntryRaw[]>('players', { team: homeId, season }),
    ),
    seasonFetch<PlayerEntryRaw[]>(`squad:${awayId}`, TTL.players, 'Kadro (deplasman)', (season) =>
      apiFootball<PlayerEntryRaw[]>('players', { team: awayId, season }),
    ),
  ]);

  const topScorers = parseTopScorers(topScorersRaw.value);

  // Kupa vitrini: her takımdan lig krallığında temsil edilen ilk oyuncu
  const cabinetFor = async (teamId: number): Promise<TeamAnalysis['playerTrophies']> => {
    const row: TopScorerRow | undefined = topScorers.find((r) => r.team.id === teamId);
    if (!row) return null;
    try {
      const { value } = await cachedFetch<TrophyEntryRaw[]>(`trophies:player:${row.playerId}`, TTL.trophies, () =>
        apiFootball<TrophyEntryRaw[]>('trophies', { player: row.playerId }),
      );
      const trophies = parseCabinet(Array.isArray(value) ? value : null);
      if (trophies.length === 0) return null;
      return { player: row.name, trophies: trophies.slice(0, 12) };
    } catch {
      return null;
    }
  };
  const [homeCabinet, awayCabinet] = await Promise.all([cabinetFor(homeId), cabinetFor(awayId)]);

  const homeSquad = parseSquad(homeSquadRaw.value);
  const awaySquad = parseSquad(awaySquadRaw.value);

  const body: ExtrasResponse = {
    home: {
      profile: parseTeamProfile(Array.isArray(homeTeamRaw) ? homeTeamRaw[0] : null),
      squad: homeSquad.length > 0 ? homeSquad : null,
      squadSeason: homeSquadRaw.value ? homeSquadRaw.season : null,
      playerTrophies: homeCabinet,
    },
    away: {
      profile: parseTeamProfile(Array.isArray(awayTeamRaw) ? awayTeamRaw[0] : null),
      squad: awaySquad.length > 0 ? awaySquad : null,
      squadSeason: awaySquadRaw.value ? awaySquadRaw.season : null,
      playerTrophies: awayCabinet,
    },
    topScorers: topScorers.length > 0 ? topScorers : null,
    topScorersSeason: topScorersRaw.value ? topScorersRaw.season : null,
    warnings,
  };
  return NextResponse.json(body);
}
