// ---------------------------------------------------------------------------
// Tipler: API-Football ham yanıtları + sunucu→istemci alan modelleri.
// Ham tipler savunmacıdır (alan adları API şemasına sadık, opsiyonel).
// ---------------------------------------------------------------------------

// ===== API ham tipleri =====

export interface TeamRefRaw {
  id: number;
  name: string;
  logo: string | null;
  winner?: boolean | null;
}

export interface VenueRaw {
  id: number | null;
  name: string | null;
  city: string | null;
}

export interface FixtureRaw {
  fixture: {
    id: number;
    date: string;
    status: { long?: string; short?: string; elapsed?: number | null; extra?: number | null };
    venue?: VenueRaw | null;
  };
  league: {
    id: number;
    name: string;
    country?: string;
    logo?: string | null;
    flag?: string | null;
    season?: number;
    round?: string | null;
    standings?: boolean;
  };
  teams: { home: TeamRefRaw; away: TeamRefRaw };
  goals: { home: number | null; away: number | null };
  score?: {
    halftime?: { home: number | null; away: number | null } | null;
    fulltime?: { home: number | null; away: number | null } | null;
    extratime?: { home: number | null; away: number | null } | null;
    penalty?: { home: number | null; away: number | null } | null;
  } | null;
}

/** home/away/total üçlüsü */
export interface Hat<T> {
  home: T;
  away: T;
  total: T;
}

export interface GoalStatBlock {
  total?: Hat<number | null> | null;
  average?: Hat<number | string | null> | null;
  minute?: Record<string, { total: number | null; percentage: string | null }> | null;
  under_over?: Record<string, { over: number; under: number }> | null;
}

/** /teams/statistics yanıtı (canlı doğrulanmış şema) */
export interface TeamStatsRaw {
  league?: { id?: number; name?: string; country?: string; logo?: string | null; season?: number } | null;
  team?: { id?: number; name?: string; logo?: string | null } | null;
  form?: string | null;
  fixtures?: {
    played?: Hat<number | null> | null;
    wins?: Hat<number | null> | null;
    draws?: Hat<number | null> | null;
    loses?: Hat<number | null> | null;
  } | null;
  goals?: { for?: GoalStatBlock | null; against?: GoalStatBlock | null } | null;
  biggest?: {
    streak?: { wins?: number | null; draws?: number | null; loses?: number | null } | null;
    wins?: { home?: string | null; away?: string | null } | null;
    loses?: { home?: string | null; away?: string | null } | null;
    goals?: { for?: { home?: number | null; away?: number | null }; against?: { home?: number | null; away?: number | null } } | null;
  } | null;
  clean_sheet?: Hat<number | null> | null;
  failed_to_score?: Hat<number | null> | null;
  lineups?: { formation: string; played: number }[] | null;
}

export interface StandingBlockRaw {
  played: number | null;
  win: number | null;
  draw: number | null;
  lose: number | null;
  goals: { for: number | null; against: number | null };
}

export interface StandingRowRaw {
  rank: number;
  team: TeamRefRaw;
  points: number | null;
  goalsDiff?: number | null;
  form?: string | null;
  all: StandingBlockRaw;
  home: StandingBlockRaw;
  away: StandingBlockRaw;
}

export interface StandingsRaw {
  league?: {
    id?: number;
    name?: string;
    season?: number;
    standings?: StandingRowRaw[][] | null;
  } | null;
}

/** /teams?id= yanıtı (canlı doğrulanmış şema) */
export interface TeamProfileRaw {
  team?: {
    id?: number;
    name?: string;
    code?: string | null;
    country?: string | null;
    founded?: number | null;
    national?: boolean;
    logo?: string | null;
  } | null;
  venue?: {
    id?: number | null;
    name?: string | null;
    address?: string | null;
    city?: string | null;
    capacity?: number | null;
    surface?: string | null;
    image?: string | null;
  } | null;
}

export interface PlayerGameStats {
  appearences?: number | null;
  minutes?: number | null;
  position?: string | null;
  lineups?: number | null;
}

export interface PlayerStatsRaw {
  team?: TeamRefRaw | null;
  league?: { id?: number; name?: string; season?: number } | null;
  games?: PlayerGameStats | null;
  goals?: { total?: number | null; assists?: number | null } | null;
}

export interface PlayerEntryRaw {
  player?: { id?: number; name?: string; photo?: string | null; nationality?: string | null } | null;
  statistics?: PlayerStatsRaw[] | null;
}

/** /predictions yanıtı (canlı doğrulanmış şema) */
export interface PredictionEntryRaw {
  predictions?: {
    winner?: { id?: number; name?: string } | null;
    win_or_draw?: boolean | null;
    under_over?: string | null;
    goals?: { home?: string | null; away?: string | null } | null;
    advice?: string | null;
    percent?: { home?: string | null; draw?: string | null; away?: string | null } | null;
  } | null;
  league?: { id?: number; name?: string } | null;
}

export interface TrophyEntryRaw {
  league?: string | null;
  competition?: string | null;
  country?: string | null;
  season?: string | null;
  type?: string | null;
  status?: string | null;
}

// ===== Alan modelleri (sunucu → istemci) =====

export interface TeamLite {
  id: number;
  name: string;
  logo: string | null;
}

export interface LeagueLite {
  id: number;
  name: string;
  logo: string | null;
  flag: string | null;
  season: number | null;
  round: string | null;
}

export interface LightFixture {
  id: number;
  date: string;
  status: { short: string; long: string };
  league: LeagueLite | null;
  home: TeamLite | null;
  away: TeamLite | null;
  goals: { home: number | null; away: number | null };
}

export interface ParsedTeamStats {
  season: number | null;
  formString: string | null;
  played: Hat<number | null>;
  wins: Hat<number | null>;
  draws: Hat<number | null>;
  losses: Hat<number | null>;
  /** maç başı attığı gol (home/away/total) */
  avgFor: Hat<number | null>;
  /** maç başı yediği gol (home/away/total) */
  avgAgainst: Hat<number | null>;
  cleanSheets: Hat<number | null>;
  failedToScore: Hat<number | null>;
  biggestStreak: { wins: number | null; draws: number | null; losses: number | null };
  biggestWin: { home: string | null; away: string | null };
  biggestLoss: { home: string | null; away: string | null };
  topFormation: string | null;
  goalsForTotal: number | null;
  goalsAgainstTotal: number | null;
}

export interface FormMatch {
  id: number;
  date: string;
  league: string;
  opponent: TeamLite;
  /** bu takımın attığı / yediği */
  gf: number;
  ga: number;
  result: 'G' | 'B' | 'M';
}

export interface FormSummary {
  /** kronolojik (eski → yeni) */
  matches: FormMatch[];
  formString: string | null;
  counts: { G: number; B: number; M: number };
  avgFor: number | null;
  avgAgainst: number | null;
  season: number | null;
}

export interface H2HMatch {
  id: number;
  date: string;
  leagueName: string;
  home: TeamLite;
  away: TeamLite;
  gf: number;
  ga: number;
  /** mevcut fikstürün ev sahibi açısından sonuç */
  outcomeForFixtureHome: 'home' | 'away' | 'draw';
}

export interface H2HSummary {
  /** kronolojik (eski → yeni), en son 10 bitmiş maç */
  matches: H2HMatch[];
  total: number;
  homeWins: number;
  draws: number;
  awayWins: number;
  goalsPerMatch: number | null;
  bttsCount: number;
  avgHomeFor: number | null;
  avgHomeAgainst: number | null;
  avgAwayFor: number | null;
  avgAwayAgainst: number | null;
}

export interface StandingRow {
  rank: number;
  team: TeamLite;
  played: number | null;
  wins: number | null;
  draws: number | null;
  losses: number | null;
  gf: number | null;
  ga: number | null;
  points: number | null;
  homePlayed: number | null;
  homeGf: number | null;
  awayPlayed: number | null;
  awayGf: number | null;
}

export interface TopScorerRow {
  playerId: number;
  name: string;
  photo: string | null;
  team: TeamLite;
  position: string | null;
  appearances: number | null;
  goals: number | null;
  assists: number | null;
}

export interface SquadPlayer {
  playerId: number;
  name: string;
  photo: string | null;
  position: string | null;
  appearances: number | null;
  goals: number | null;
  assists: number | null;
}

export interface PlayerCabinet {
  player: string;
  trophies: { competition: string | null; season: string | null; status: string | null }[];
}

export interface TeamAnalysis {
  team: TeamLite;
  profile: { founded: number | null; country: string | null; city: string | null; venue: string | null } | null;
  stats: ParsedTeamStats | null;
  statsSeason: number | null;
  form: FormSummary | null;
  formSeason: number | null;
  squad: SquadPlayer[] | null;
  squadSeason: number | null;
  playerTrophies: PlayerCabinet | null;
}

export interface ApiPredictionInfo {
  percentHome: number | null;
  percentDraw: number | null;
  percentAway: number | null;
  winnerName: string | null;
  advice: string | null;
  underOver: string | null;
}

// ModelResult lib/prediction.ts'te tanımlıdır (tek kaynak).
import type { ModelResult } from './prediction';
export type { ModelResult } from './prediction';

export interface AnalysisResponse {
  fixture: LightFixture;
  fixtureSeason: number;
  dataSeason: number;
  seasonFallback: boolean;
  home: TeamAnalysis;
  away: TeamAnalysis;
  h2h: H2HSummary;
  standings: StandingRow[] | null;
  standingsSeason: number | null;
  topScorers: TopScorerRow[] | null;
  topScorersSeason: number | null;
  apiPrediction: ApiPredictionInfo | null;
  model: ModelResult;
  warnings: string[];
  dailyCount: number;
  /** true ise kadro/künye/krallık/kupa verileri /extras uç noktasından ayrıca yüklenecek */
  extrasPending?: boolean;
  /** true ise ayrıntılı olasılıklar premium kilidiyle gizlendi */
  locked?: boolean;
}

export interface TeamExtras {
  profile: TeamAnalysis['profile'];
  squad: TeamAnalysis['squad'];
  squadSeason: number | null;
  playerTrophies: TeamAnalysis['playerTrophies'];
}

export interface ExtrasResponse {
  home: TeamExtras;
  away: TeamExtras;
  topScorers: TopScorerRow[] | null;
  topScorersSeason: number | null;
  warnings: string[];
}
