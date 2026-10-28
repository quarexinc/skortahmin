// GET /api/match/[fixtureId]/analysis
// Tek yanıtta toplanmış tam analiz: maç, iki takımın istatistikleri, son maçlar,
// H2H, puan durumu, oyuncular, API tahmini + hesaplanmış Poisson model çıktısı.
// Model hesabı YALNIZCA burada (sunucu tarafı) yapılır.
import { NextResponse } from 'next/server';
import {
  currentSeason,
  MAX_ACCESSIBLE_SEASON,
  seasonForData,
  seasonLabel,
} from '@/config';
import { apiFootball, ApiFootballError, getDailyCount } from '@/lib/apiFootball';
import { cachedFetch, TTL } from '@/lib/cache';
import { computePrediction } from '@/lib/prediction';
import {
  leagueGoalAverages,
  lightFixture,
  parseCabinet,
  parseFormFixtures,
  parseH2H,
  parsePrediction,
  parseSquad,
  parseStandings,
  parseTeamProfile,
  parseTeamStats,
  parseTopScorers,
} from '@/lib/parsers';
import type {
  AnalysisResponse,
  FixtureRaw,
  PlayerEntryRaw,
  PredictionEntryRaw,
  StandingsRaw,
  TeamProfileRaw,
  TeamStatsRaw,
  TopScorerRow,
  TrophyEntryRaw,
} from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface SeasonFetchResult<T> {
  value: T | null;
  season: number;
  fallback: boolean;
  error: string | null;
}

const errMsg = (e: unknown): string => (e instanceof ApiFootballError ? e.message : 'veri alınamadı');

export async function GET(_req: Request, ctx: { params: { fixtureId: string } }) {
  const fixtureId = Number(ctx.params.fixtureId);
  if (!Number.isInteger(fixtureId) || fixtureId <= 0) {
    return NextResponse.json({ error: "Geçerli bir maç id'si gerekli." }, { status: 400 });
  }

  const warnings: string[] = [];

  // 1) Maç
  let fixture: FixtureRaw;
  try {
    const { value } = await cachedFetch<FixtureRaw[]>(
      `fixture:${fixtureId}`,
      TTL.fixture,
      () => apiFootball<FixtureRaw[]>('fixtures', { id: fixtureId }, { timezone: true }),
    );
    const first = Array.isArray(value) ? value[0] : undefined;
    if (!first) return NextResponse.json({ error: 'Maç bulunamadı.' }, { status: 404 });
    fixture = first;
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof ApiFootballError ? e.message : 'Maç verisi alınamadı.' },
      { status: e instanceof ApiFootballError && (e.isQuota || e.isPlan) ? 503 : 502 },
    );
  }

  const leagueId = fixture.league?.id ?? null;
  const homeId = fixture.teams?.home?.id ?? null;
  const awayId = fixture.teams?.away?.id ?? null;
  if (!leagueId || !homeId || !awayId) {
    return NextResponse.json({ error: 'Maç verisi eksik.' }, { status: 404 });
  }

  const fixtureSeason = fixture.league?.season ?? currentSeason(new Date(fixture.fixture.date));
  const dataSeason = seasonForData(fixtureSeason);
  const primaryBlocked = fixtureSeason > MAX_ACCESSIBLE_SEASON;
  if (dataSeason !== fixtureSeason) {
    warnings.push(
      `Mevcut sezonun (${fixtureSeason}) sezon verileri (istatistik, puan durumu, kadro) API planı tarafından kısıtlanmış; ` +
        `bu bölümler ${seasonLabel(dataSeason)} sezonundaki son gerçek verilerle dolduruldu ve ilgili yerlerde etiketlendi.`,
    );
  }

  // Sezon deneyen yardımcı: önce maçın sezonu, plan hatasıysa erişilebilir sezon.
  const seasonFetch = async <T>(
    keyBase: string,
    ttl: number,
    label: string,
    fn: (season: number) => Promise<T>,
  ): Promise<SeasonFetchResult<T>> => {
    const attempt = (season: number) =>
      cachedFetch<T>(`${keyBase}:${season}`, ttl, () => fn(season)).then((r) => r.value);

    if (!primaryBlocked) {
      try {
        return { value: await attempt(fixtureSeason), season: fixtureSeason, fallback: false, error: null };
      } catch (e) {
        if (e instanceof ApiFootballError && e.isPlan) {
          try {
            return { value: await attempt(dataSeason), season: dataSeason, fallback: true, error: null };
          } catch (e2) {
            warnings.push(`${label}: ${errMsg(e2)}`);
            return { value: null, season: dataSeason, fallback: true, error: errMsg(e2) };
          }
        }
        warnings.push(`${label}: ${errMsg(e)}`);
        return { value: null, season: fixtureSeason, fallback: false, error: errMsg(e) };
      }
    }
    try {
      return { value: await attempt(dataSeason), season: dataSeason, fallback: true, error: null };
    } catch (e) {
      warnings.push(`${label}: ${errMsg(e)}`);
      return { value: null, season: dataSeason, fallback: true, error: errMsg(e) };
    }
  };

  const plainFetch = async <T>(key: string, ttl: number, label: string, fn: () => Promise<T>): Promise<T | null> => {
    try {
      const { value } = await cachedFetch<T>(key, ttl, fn);
      return value;
    } catch (e) {
      warnings.push(`${label}: ${errMsg(e)}`);
      return null;
    }
  };

  // 2) Veriler (paralel; kuyruk 250 ms aralıklarla seriler)
  const [
    homeFormRaw,
    awayFormRaw,
    h2hRaw,
    homeStatsRaw,
    awayStatsRaw,
    standingsRaw,
    homeTeamRaw,
    awayTeamRaw,
    homeSquadRaw,
    awaySquadRaw,
    topScorersRaw,
    predictionRaw,
  ] = await Promise.all([
    seasonFetch<FixtureRaw[]>(`form:${homeId}`, TTL.form, 'Son maçlar (ev sahibi)', (season) =>
      apiFootball<FixtureRaw[]>('fixtures', { team: homeId, season }, { timezone: true }),
    ),
    seasonFetch<FixtureRaw[]>(`form:${awayId}`, TTL.form, 'Son maçlar (deplasman)', (season) =>
      apiFootball<FixtureRaw[]>('fixtures', { team: awayId, season }, { timezone: true }),
    ),
    plainFetch<FixtureRaw[]>(`h2h:${homeId}-${awayId}`, TTL.h2h, 'Karşılıklı maçlar (H2H)', () =>
      apiFootball<FixtureRaw[]>('fixtures/headtohead', { h2h: `${homeId}-${awayId}` }, { timezone: true }),
    ),
    seasonFetch<TeamStatsRaw>(`stats:${homeId}:${leagueId}`, TTL.stats, 'Sezon istatistikleri (ev sahibi)', (season) =>
      apiFootball<TeamStatsRaw>('teams/statistics', { league: leagueId, season, team: homeId }),
    ),
    seasonFetch<TeamStatsRaw>(`stats:${awayId}:${leagueId}`, TTL.stats, 'Sezon istatistikleri (deplasman)', (season) =>
      apiFootball<TeamStatsRaw>('teams/statistics', { league: leagueId, season, team: awayId }),
    ),
    seasonFetch<StandingsRaw[]>(`standings:${leagueId}`, TTL.standings, 'Lig puan durumu', (season) =>
      apiFootball<StandingsRaw[]>('standings', { league: leagueId, season }),
    ),
    plainFetch<TeamProfileRaw[]>(`team:${homeId}`, TTL.team, 'Takım künyesi (ev sahibi)', () =>
      apiFootball<TeamProfileRaw[]>('teams', { id: homeId }),
    ),
    plainFetch<TeamProfileRaw[]>(`team:${awayId}`, TTL.team, 'Takım künyesi (deplasman)', () =>
      apiFootball<TeamProfileRaw[]>('teams', { id: awayId }),
    ),
    seasonFetch<PlayerEntryRaw[]>(`squad:${homeId}`, TTL.players, 'Kadro (ev sahibi)', (season) =>
      apiFootball<PlayerEntryRaw[]>('players', { team: homeId, season }),
    ),
    seasonFetch<PlayerEntryRaw[]>(`squad:${awayId}`, TTL.players, 'Kadro (deplasman)', (season) =>
      apiFootball<PlayerEntryRaw[]>('players', { team: awayId, season }),
    ),
    seasonFetch<PlayerEntryRaw[]>(`topscorers:${leagueId}`, TTL.players, 'Lig gol krallığı', (season) =>
      apiFootball<PlayerEntryRaw[]>('players/topscorers', { league: leagueId, season }),
    ),
    plainFetch<PredictionEntryRaw[]>(`prediction:${fixtureId}`, TTL.prediction, 'API tahmini', () =>
      apiFootball<PredictionEntryRaw[]>('predictions', { fixture: fixtureId }),
    ),
  ]);

  // 3) Pars et
  const homeStats = parseTeamStats(homeStatsRaw.value, homeStatsRaw.season);
  const awayStats = parseTeamStats(awayStatsRaw.value, awayStatsRaw.season);
  const homeForm = parseFormFixtures(homeFormRaw.value, homeId, homeFormRaw.season);
  const awayForm = parseFormFixtures(awayFormRaw.value, awayId, awayFormRaw.season);
  const h2h = parseH2H(h2hRaw, homeId, awayId);
  const standingsRows = parseStandings(standingsRaw.value);
  const standingsSeason = standingsRows ? standingsRaw.season : null;
  const homeProfile = parseTeamProfile(Array.isArray(homeTeamRaw) ? homeTeamRaw[0] : null);
  const awayProfile = parseTeamProfile(Array.isArray(awayTeamRaw) ? awayTeamRaw[0] : null);
  const topScorers = parseTopScorers(topScorersRaw.value);
  const homeSquad = parseSquad(homeSquadRaw.value);
  const awaySquad = parseSquad(awaySquadRaw.value);
  const apiPrediction = parsePrediction(Array.isArray(predictionRaw) ? predictionRaw[0] : null);

  // Lig ortalamaları (μ): puan durumundaki ev/deplasman gol verisinden;
  // yoksa iki takımın sezon ortalamalarından (aynı lig) türetilir.
  const mu = leagueGoalAverages(standingsRows);
  let muHome = mu.muHome;
  let muAway = mu.muAway;
  if (muHome == null) {
    const xs = [homeStats?.avgFor.home, awayStats?.avgFor.home].filter((v): v is number => v != null);
    muHome = xs.length > 0 ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
  }
  if (muAway == null) {
    const xs = [homeStats?.avgFor.away, awayStats?.avgFor.away].filter((v): v is number => v != null);
    muAway = xs.length > 0 ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
  }

  // 4) Poisson modeli (yalnızca sunucu tarafında)
  const model = computePrediction({
    season: {
      afh: homeStats?.avgFor.home ?? null,
      daa: awayStats?.avgAgainst.away ?? null,
      afa: awayStats?.avgFor.away ?? null,
      dah: homeStats?.avgAgainst.home ?? null,
      muHome,
      muAway,
      playedHome: homeStats?.played.home ?? null,
      playedAway: awayStats?.played.away ?? null,
    },
    form: {
      homeFor: homeForm?.avgFor ?? null,
      homeAgainst: homeForm?.avgAgainst ?? null,
      awayFor: awayForm?.avgFor ?? null,
      awayAgainst: awayForm?.avgAgainst ?? null,
    },
    h2h: {
      homeFor: h2h.avgHomeFor,
      homeAgainst: h2h.avgHomeAgainst,
      awayFor: h2h.avgAwayFor,
      awayAgainst: h2h.avgAwayAgainst,
      matches: h2h.total,
    },
  });

  if (!model.ok) warnings.push(`Tahmin modeli: ${model.reason}`);

  // 5) Kupa vitrini: her takımdan lig krallığında temsil edilen ilk oyuncu
  const cabinetFor = async (teamId: number): Promise<AnalysisResponse['home']['playerTrophies']> => {
    const row: TopScorerRow | undefined = topScorers.find((r) => r.team.id === teamId);
    if (!row) return null;
    try {
      const { value } = await cachedFetch<TrophyEntryRaw[]>(
        `trophies:player:${row.playerId}`,
        TTL.trophies,
        () => apiFootball<TrophyEntryRaw[]>('trophies', { player: row.playerId }),
      );
      const trophies = parseCabinet(Array.isArray(value) ? value : null);
      if (trophies.length === 0) return null;
      return { player: row.name, trophies: trophies.slice(0, 12) };
    } catch {
      return null;
    }
  };
  const [homeCabinet, awayCabinet] = await Promise.all([cabinetFor(homeId), cabinetFor(awayId)]);

  // 6) Yanıt
  const body: AnalysisResponse = {
    fixture: lightFixture(fixture),
    fixtureSeason,
    dataSeason,
    seasonFallback: dataSeason !== fixtureSeason,
    home: {
      team: { id: homeId, name: fixture.teams.home.name, logo: fixture.teams.home.logo ?? null },
      profile: homeProfile,
      stats: homeStats,
      statsSeason: homeStatsRaw.value ? homeStatsRaw.season : null,
      form: homeForm,
      formSeason: homeFormRaw.value ? homeFormRaw.season : null,
      squad: homeSquad.length > 0 ? homeSquad : null,
      squadSeason: homeSquadRaw.value ? homeSquadRaw.season : null,
      playerTrophies: homeCabinet,
    },
    away: {
      team: { id: awayId, name: fixture.teams.away.name, logo: fixture.teams.away.logo ?? null },
      profile: awayProfile,
      stats: awayStats,
      statsSeason: awayStatsRaw.value ? awayStatsRaw.season : null,
      form: awayForm,
      formSeason: awayFormRaw.value ? awayFormRaw.season : null,
      squad: awaySquad.length > 0 ? awaySquad : null,
      squadSeason: awaySquadRaw.value ? awaySquadRaw.season : null,
      playerTrophies: awayCabinet,
    },
    h2h,
    standings: standingsRows,
    standingsSeason,
    topScorers: topScorers.length > 0 ? topScorers : null,
    topScorersSeason: topScorersRaw.value ? topScorersRaw.season : null,
    apiPrediction,
    model,
    warnings,
    dailyCount: getDailyCount(),
  };

  return NextResponse.json(body);
}
