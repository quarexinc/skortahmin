// ---------------------------------------------------------------------------
// API ham yanıtlarını alan modellerine dönüştüren savunmacı parser'lar.
// Alan adları API-Football şemasına sadıktır (canlı doğrulanmıştır).
// ---------------------------------------------------------------------------

import type {
  FixtureRaw,
  FormMatch,
  FormSummary,
  H2HMatch,
  H2HSummary,
  Hat,
  LeagueLite,
  LightFixture,
  ParsedTeamStats,
  PlayerCabinet,
  PlayerEntryRaw,
  PredictionEntryRaw,
  SquadPlayer,
  StandingRow,
  StandingsRaw,
  TeamLite,
  TeamProfileRaw,
  TeamRefRaw,
  TeamStatsRaw,
  TopScorerRow,
  TrophyEntryRaw,
} from './types';

const n = (v: unknown): number | null => {
  if (v == null) return null;
  const x = typeof v === 'string' ? parseFloat(v) : (v as number);
  return Number.isFinite(x) ? x : null;
};

const hat = (h: unknown): Hat<number | null> => {
  const o = (h ?? {}) as Record<string, unknown>;
  return { home: n(o.home), away: n(o.away), total: n(o.total) };
};

const FALLBACK_TEAM: TeamLite = { id: 0, name: 'Bilinmiyor', logo: null };

export function liteTeam(t: TeamRefRaw | null | undefined): TeamLite {
  if (!t) return FALLBACK_TEAM;
  return { id: t.id, name: t.name, logo: t.logo ?? null };
}

const FINISHED_STATUSES = new Set(['FT', 'AET', 'PEN', 'ABD', 'AWD']);

/** Skorlanmış ve bitmiş maç mı? */
export function isFinished(f: FixtureRaw): boolean {
  const gf = f.goals?.home;
  const ga = f.goals?.away;
  if (gf == null || ga == null) return false;
  const st = f.fixture?.status?.short ?? '';
  return (
    FINISHED_STATUSES.has(st) || (f.score?.fulltime?.home != null && f.score?.fulltime?.away != null)
  );
}

export function lightFixture(f: FixtureRaw): LightFixture {
  const league: LeagueLite | null = f.league
    ? {
        id: f.league.id,
        name: f.league.name,
        logo: f.league.logo ?? null,
        flag: f.league.flag ?? null,
        season: f.league.season ?? null,
        round: f.league.round ?? null,
      }
    : null;
  return {
    id: f.fixture.id,
    date: f.fixture.date,
    status: { short: f.fixture?.status?.short ?? '', long: f.fixture?.status?.long ?? '' },
    league,
    home: liteTeam(f.teams?.home),
    away: liteTeam(f.teams?.away),
    goals: { home: f.goals?.home ?? null, away: f.goals?.away ?? null },
  };
}

// ===== /teams/statistics =====

export function parseTeamStats(raw: TeamStatsRaw | null | undefined, season: number | null): ParsedTeamStats | null {
  if (!raw) return null;
  const lineups = Array.isArray(raw.lineups) ? raw.lineups : null;
  const top = lineups && lineups.length > 0 ? lineups.reduce((a, b) => (b.played > a.played ? b : a)) : null;
  return {
    season: raw.league?.season ?? season,
    formString: raw.form ?? null,
    played: hat(raw.fixtures?.played),
    wins: hat(raw.fixtures?.wins),
    draws: hat(raw.fixtures?.draws),
    losses: hat(raw.fixtures?.loses),
    avgFor: hat(raw.goals?.for?.average),
    avgAgainst: hat(raw.goals?.against?.average),
    cleanSheets: hat(raw.clean_sheet),
    failedToScore: hat(raw.failed_to_score),
    biggestStreak: {
      wins: raw.biggest?.streak?.wins ?? null,
      draws: raw.biggest?.streak?.draws ?? null,
      losses: raw.biggest?.streak?.loses ?? null,
    },
    biggestWin: { home: raw.biggest?.wins?.home ?? null, away: raw.biggest?.wins?.away ?? null },
    biggestLoss: { home: raw.biggest?.loses?.home ?? null, away: raw.biggest?.loses?.away ?? null },
    topFormation: top?.formation ?? null,
    goalsForTotal: n(raw.goals?.for?.total?.total),
    goalsAgainstTotal: n(raw.goals?.against?.total?.total),
  };
}

// ===== Form (takımın bitmiş maçları → son 10) =====

export function parseFormFixtures(
  raw: FixtureRaw[] | null | undefined,
  teamId: number,
  season: number | null,
): FormSummary | null {
  const list = Array.isArray(raw) ? raw : [];
  const done: FormMatch[] = list
    .filter(isFinished)
    .map((f) => {
      const homeIsTeam = f.teams?.home?.id === teamId;
      const gf = homeIsTeam ? (f.goals?.home ?? 0) : (f.goals?.away ?? 0);
      const ga = homeIsTeam ? (f.goals?.away ?? 0) : (f.goals?.home ?? 0);
      return {
        id: f.fixture.id,
        date: f.fixture.date,
        league: f.league?.name ?? '',
        opponent: liteTeam(homeIsTeam ? f.teams?.away : f.teams?.home),
        gf,
        ga,
        result: (gf > ga ? 'G' : gf === ga ? 'B' : 'M') as FormMatch['result'],
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const last10 = done.slice(0, 10).reverse(); // kronolojik (eski → yeni)
  if (last10.length === 0) return null;

  const counts = { G: 0, B: 0, M: 0 };
  let gf = 0;
  let ga = 0;
  for (const m of last10) {
    counts[m.result] += 1;
    gf += m.gf;
    ga += m.ga;
  }
  return {
    matches: last10,
    formString: last10.map((m) => m.result).join(''),
    counts,
    avgFor: gf / last10.length,
    avgAgainst: ga / last10.length,
    season,
  };
}

// ===== H2H (tam geçmiş → son 10 bitmiş maç) =====

export function parseH2H(
  raw: FixtureRaw[] | null | undefined,
  homeId: number,
  awayId: number,
): H2HSummary {
  const list = Array.isArray(raw) ? raw : [];
  const done = list
    .filter(isFinished)
    .sort((a, b) => new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime());

  const last10: H2HMatch[] = done
    .slice(0, 10)
    .map((f) => {
      const gf = f.goals?.home ?? 0;
      const ga = f.goals?.away ?? 0;
      return {
        id: f.fixture.id,
        date: f.fixture.date,
        leagueName: f.league?.name ?? '',
        home: liteTeam(f.teams?.home),
        away: liteTeam(f.teams?.away),
        gf,
        ga,
        outcomeForFixtureHome: (gf > ga ? 'home' : gf < ga ? 'away' : 'draw') as H2HMatch['outcomeForFixtureHome'],
      };
    })
    .reverse(); // kronolojik

  const total = last10.length;
  let homeWins = 0;
  let draws = 0;
  let awayWins = 0;
  let btts = 0;
  let totalGoals = 0;
  let hFor = 0;
  let hAgainst = 0;
  let aFor = 0;
  let aAgainst = 0;

  for (const m of last10) {
    if (m.outcomeForFixtureHome === 'home') homeWins += 1;
    else if (m.outcomeForFixtureHome === 'draw') draws += 1;
    else awayWins += 1;
    totalGoals += m.gf + m.ga;
    if (m.gf > 0 && m.ga > 0) btts += 1;
    // Geçmiş maçta saha değişmiş olabilir; mevcut fikstür takımlarının perspektifine çevir
    const histHomeIsFixtureHome = m.home.id === homeId;
    if (histHomeIsFixtureHome) {
      hFor += m.gf;
      hAgainst += m.ga;
      aFor += m.ga;
      aAgainst += m.gf;
    } else {
      hFor += m.ga;
      hAgainst += m.gf;
      aFor += m.gf;
      aAgainst += m.ga;
    }
  }

  return {
    matches: last10,
    total,
    homeWins,
    draws,
    awayWins,
    goalsPerMatch: total > 0 ? totalGoals / total : null,
    bttsCount: btts,
    avgHomeFor: total > 0 ? hFor / total : null,
    avgHomeAgainst: total > 0 ? hAgainst / total : null,
    avgAwayFor: total > 0 ? aFor / total : null,
    avgAwayAgainst: total > 0 ? aAgainst / total : null,
  };
}

// ===== Puan durumu =====

export function parseStandings(raw: StandingsRaw[] | null | undefined): StandingRow[] | null {
  const list = Array.isArray(raw) ? raw : [];
  if (list.length === 0) return null;
  const rows: StandingRow[] = [];
  for (const group of list) {
    // API şeması: response[].league.standings[] = tablo dizileri
    for (const table of group.league?.standings ?? []) {
      for (const r of table) {
        if (!r?.team) continue;
        rows.push({
          rank: r.rank ?? rows.length + 1,
          team: liteTeam(r.team),
          played: r.all?.played ?? null,
          wins: r.all?.win ?? null,
          draws: r.all?.draw ?? null,
          losses: r.all?.lose ?? null,
          gf: r.all?.goals?.for ?? null,
          ga: r.all?.goals?.against ?? null,
          points: r.points ?? null,
          homePlayed: r.home?.played ?? null,
          homeGf: r.home?.goals?.for ?? null,
          awayPlayed: r.away?.played ?? null,
          awayGf: r.away?.goals?.for ?? null,
        });
      }
    }
  }
  if (rows.length === 0) return null;
  rows.sort((a, b) => a.rank - b.rank);
  return rows.slice(0, 50);
}

/** Lig maç başı gol ortalamaları: μ_home, μ_away (puan durumundaki ev/depl gol verilerinden) */
export function leagueGoalAverages(rows: StandingRow[] | null): { muHome: number | null; muAway: number | null } {
  if (!rows) return { muHome: null, muAway: null };
  let hp = 0;
  let hf = 0;
  let ap = 0;
  let af = 0;
  for (const r of rows) {
    hp += r.homePlayed ?? 0;
    hf += r.homeGf ?? 0;
    ap += r.awayPlayed ?? 0;
    af += r.awayGf ?? 0;
  }
  return {
    muHome: hp > 0 ? hf / hp : null,
    muAway: ap > 0 ? af / ap : null,
  };
}

// ===== Oyuncular (gol krallığı + kadro) =====

function playerRows(raw: PlayerEntryRaw[] | null | undefined): TopScorerRow[] {
  const list = Array.isArray(raw) ? raw : [];
  const out: TopScorerRow[] = [];
  for (const e of list) {
    const p = e.player;
    const s = e.statistics?.[0];
    if (!p?.id || !s) continue;
    out.push({
      playerId: p.id,
      name: p.name ?? 'Bilinmiyor',
      photo: p.photo ?? null,
      team: liteTeam(s.team),
      position: s.games?.position ?? null,
      appearances: s.games?.appearences ?? null,
      goals: s.goals?.total ?? null,
      assists: s.goals?.assists ?? null,
    });
  }
  return out;
}

export function parseTopScorers(raw: PlayerEntryRaw[] | null | undefined): TopScorerRow[] {
  return playerRows(raw).sort((a, b) => (b.goals ?? 0) - (a.goals ?? 0));
}

export function parseSquad(raw: PlayerEntryRaw[] | null | undefined): SquadPlayer[] {
  return playerRows(raw)
    .sort(
      (a, b) =>
        (b.goals ?? 0) - (a.goals ?? 0) || (b.appearances ?? 0) - (a.appearances ?? 0),
    )
    .map(({ playerId, name, photo, position, appearances, goals, assists }) => ({
      playerId,
      name,
      photo,
      position,
      appearances,
      goals,
      assists,
    }));
}

// ===== Takım künyesi =====

export function parseTeamProfile(
  raw: TeamProfileRaw | null | undefined,
): { founded: number | null; country: string | null; city: string | null; venue: string | null } | null {
  if (!raw) return null;
  return {
    founded: raw.team?.founded ?? null,
    country: raw.team?.country ?? null,
    city: raw.venue?.city ?? null,
    venue: raw.venue?.name ?? null,
  };
}

// ===== API /predictions (karşılaştırma) =====

export function parsePrediction(
  raw: PredictionEntryRaw | null | undefined,
): {
  percentHome: number | null;
  percentDraw: number | null;
  percentAway: number | null;
  winnerName: string | null;
  advice: string | null;
  underOver: string | null;
} | null {
  const p = raw?.predictions;
  if (!p) return null;
  const pct = (s: string | null | undefined): number | null => {
    const v = n(s != null ? s.replace('%', '') : null);
    return v == null ? null : v / 100;
  };
  return {
    percentHome: pct(p.percent?.home),
    percentDraw: pct(p.percent?.draw),
    percentAway: pct(p.percent?.away),
    winnerName: p.winner?.name ?? null,
    advice: p.advice ?? null,
    underOver: p.under_over ?? null,
  };
}

// ===== Kupa vitrini (/trophies?player=) =====

export function parseCabinet(raw: TrophyEntryRaw[] | null | undefined): PlayerCabinet['trophies'] {
  const list = Array.isArray(raw) ? raw : [];
  return list.map((t) => ({
    competition: t.competition ?? t.league ?? null,
    season: t.season ?? null,
    status: t.status ?? t.type ?? null,
  }));
}
