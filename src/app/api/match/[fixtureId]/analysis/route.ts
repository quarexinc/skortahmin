// GET /api/match/[fixtureId]/analysis
// Tek yanıtta toplanmış tam analiz: maç, iki takımın istatistikleri, son maçlar,
// H2H, puan durumu, oyuncular, API tahmini + hesaplanmış Poisson model çıktısı.
// Model hesabı YALNIZCA burada (sunucu tarafı) yapılır.
import { NextResponse } from 'next/server';
import { apiFootball, ApiFootballError, getDailyCount } from '@/lib/apiFootball';
import { TTL } from '@/lib/cache';
import { getFixture, matchContext } from '@/lib/matchData';
import { computePrediction } from '@/lib/prediction';
import {
  leagueGoalAverages,
  lightFixture,
  parseFormFixtures,
  parseH2H,
  parsePrediction,
  parseStandings,
  parseTeamStats,
} from '@/lib/parsers';
import type {
  AnalysisResponse,
  FixtureRaw,
  PredictionEntryRaw,
  StandingsRaw,
  TeamStatsRaw,
} from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 120;

// Not: Kadro, takım künyesi, gol krallığı ve kupa vitrini /extras uç noktasından
// ayrıca (arka planda) yüklenir; böylece ana analiz ~8 istekle hız limitine
// takılmadan hızlıca döner.
export async function GET(_req: Request, ctx: { params: { fixtureId: string } }) {
  const fixtureId = Number(ctx.params.fixtureId);
  if (!Number.isInteger(fixtureId) || fixtureId <= 0) {
    return NextResponse.json({ error: "Geçerli bir maç id'si gerekli." }, { status: 400 });
  }

  // 1) Maç
  let fixture: FixtureRaw;
  try {
    const f = await getFixture(fixtureId);
    if (!f) return NextResponse.json({ error: 'Maç bulunamadı.' }, { status: 404 });
    fixture = f;
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

  const { warnings, fixtureSeason, dataSeason, seasonNotice, seasonFetch, plainFetch } = matchContext(fixture);
  if (seasonNotice) warnings.push(seasonNotice);

  // 2) Çekirdek veriler (paralel; kuyruk hız limitine göre serileştirir)
  const [homeFormRaw, awayFormRaw, h2hRaw, homeStatsRaw, awayStatsRaw, standingsRaw, predictionRaw] =
    await Promise.all([
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

  // 6) Yanıt
  const body: AnalysisResponse = {
    fixture: lightFixture(fixture),
    fixtureSeason,
    dataSeason,
    seasonFallback: dataSeason !== fixtureSeason,
    home: {
      team: { id: homeId, name: fixture.teams.home.name, logo: fixture.teams.home.logo ?? null },
      profile: null,
      stats: homeStats,
      statsSeason: homeStatsRaw.value ? homeStatsRaw.season : null,
      form: homeForm,
      formSeason: homeFormRaw.value ? homeFormRaw.season : null,
      squad: null,
      squadSeason: null,
      playerTrophies: null,
    },
    away: {
      team: { id: awayId, name: fixture.teams.away.name, logo: fixture.teams.away.logo ?? null },
      profile: null,
      stats: awayStats,
      statsSeason: awayStatsRaw.value ? awayStatsRaw.season : null,
      form: awayForm,
      formSeason: awayFormRaw.value ? awayFormRaw.season : null,
      squad: null,
      squadSeason: null,
      playerTrophies: null,
    },
    h2h,
    standings: standingsRows,
    standingsSeason,
    topScorers: null,
    topScorersSeason: null,
    extrasPending: true,
    apiPrediction,
    model,
    warnings,
    dailyCount: getDailyCount(),
  };

  return NextResponse.json(body);
}
