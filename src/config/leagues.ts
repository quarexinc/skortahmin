// ---------------------------------------------------------------------------
// Desteklenen ligler. ID'ler API-Football'ın kendi lig ID'leridir.
// Logolar API-Football'ın medya URL şablonundan üretilen yapılandırma sabitleridir.
// ---------------------------------------------------------------------------

export interface LeagueConfig {
  id: number;
  /** Arayüzde görünen Türkçe ad */
  name: string;
  country: string;
  logo: string;
  /** Lig filtresinde gösterilsin mi */
  active: boolean;
}

export const LEAGUES: LeagueConfig[] = [
  { id: 203, name: 'Trendyol Süper Lig', country: 'Türkiye', logo: 'https://media.api-sports.io/football/leagues/203.png', active: true },
  { id: 39, name: 'Premier Lig', country: 'İngiltere', logo: 'https://media.api-sports.io/football/leagues/39.png', active: true },
  { id: 140, name: 'La Liga', country: 'İspanya', logo: 'https://media.api-sports.io/football/leagues/140.png', active: true },
  { id: 135, name: 'Serie A', country: 'İtalya', logo: 'https://media.api-sports.io/football/leagues/135.png', active: true },
  { id: 78, name: 'Bundesliga', country: 'Almanya', logo: 'https://media.api-sports.io/football/leagues/78.png', active: true },
  { id: 61, name: 'Ligue 1', country: 'Fransa', logo: 'https://media.api-sports.io/football/leagues/61.png', active: true },
  { id: 2, name: 'UEFA Şampiyonlar Ligi', country: 'Avrupa', logo: 'https://media.api-sports.io/football/leagues/2.png', active: true },
  { id: 3, name: 'UEFA Avrupa Ligi', country: 'Avrupa', logo: 'https://media.api-sports.io/football/leagues/3.png', active: true },
  { id: 848, name: 'UEFA Konferans Ligi', country: 'Avrupa', logo: 'https://media.api-sports.io/football/leagues/848.png', active: true },
  { id: 88, name: 'Eredivisie', country: 'Hollanda', logo: 'https://media.api-sports.io/football/leagues/88.png', active: true },
  { id: 94, name: 'Primeira Liga', country: 'Portekiz', logo: 'https://media.api-sports.io/football/leagues/94.png', active: true },
  { id: 40, name: 'Championship', country: 'İngiltere', logo: 'https://media.api-sports.io/football/leagues/40.png', active: true },
  { id: 307, name: 'Suudi Pro Ligi', country: 'Suudi Arabistan', logo: 'https://media.api-sports.io/football/leagues/307.png', active: true },
];

export const ACTIVE_LEAGUE_IDS: ReadonlySet<number> = new Set(
  LEAGUES.filter((l) => l.active).map((l) => l.id),
);

export function leagueById(id: number | null | undefined): LeagueConfig | undefined {
  if (id == null) return undefined;
  return LEAGUES.find((l) => l.id === id);
}
