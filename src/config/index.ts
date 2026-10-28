// ---------------------------------------------------------------------------
// Merkezi yapılandırma: API bilgileri, saat dilimi, plan limitleri, sezon hesap.
// Buradaki sabitler yapılandırma değerleridir; istatistik verisi DEĞİLDİR.
// ---------------------------------------------------------------------------

export const API_FOOTBALL_BASE_URL = 'https://v3.football.api-sports.io';

// API anahtarı: ortam değişkeninden okunur (.env.local veya Vercel Environment Variables).
export const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY ?? '';

export const TIMEZONE = 'Europe/Istanbul';

// API-Football ücretsiz plan limitleri (istek kuyruğu ve günlük sayaç için)
export const DAILY_REQUEST_LIMIT = 100;
// Bu eşiğe ulaşınca yeni upstream isteği gönderilmez; yalnızca cache'ten servis edilir.
export const DAILY_SOFT_LIMIT = 95;
// İki istek arası minimum bekleme. (Asıl dakika limiti, apiFootball.ts'teki
// kayan 1-dakika penceresiyle uygulanır: ≤9 istek/dk.)
export const MIN_REQUEST_INTERVAL_MS = 250;

// Ana sayfada gösterilecek gün sayısı
export const DAYS_AHEAD = 10;

// ---------------------------------------------------------------------------
// Plan kısıtı (canlı doğrulandı): ücretsiz planda sezon bazlı uç noktalar
// (/teams/statistics, /standings, /players, /teams?league&season,
//  /fixtures?team&season) yalnızca 2022–2024 sezonları için erişilebilir.
// Maçın sezonu bu aralıkta değilse sezon bazlı veriler en yakın erişilebilir
// sezondan alınır ve arayüzde açıkça etiketlenir.
// ---------------------------------------------------------------------------
export const ACCESSIBLE_SEASONS: readonly number[] = [2024, 2023, 2022];
export const MAX_ACCESSIBLE_SEASON = Math.max(...ACCESSIBLE_SEASONS);

/** İstanbul saatine göre gün parçaları */
export function istDateParts(d: Date = new Date()): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { year: get('year'), month: get('month'), day: get('day') };
}

/**
 * Avrupa takvimli ligler (Ağu–May) için mevcut sezon:
 * ay >= Temmuz ise yıl, değilse yıl - 1. Dinamik hesaplanır, hardcode yoktur.
 */
export function currentSeason(d: Date = new Date()): number {
  const { year, month } = istDateParts(d);
  return month >= 7 ? year : year - 1;
}

/**
 * Sezon bazlı verinin (istatistik/tablo/kadro) isteneceği sezon.
 * Erişilebilir ise maçın kendi sezonu, değilse en yakın erişilebilir sezon.
 */
export function seasonForData(season: number): number {
  return ACCESSIBLE_SEASONS.includes(season) ? season : MAX_ACCESSIBLE_SEASON;
}

/** İstanbul saatiyle YYYY-MM-DD anahtarı */
export function istDateKey(d: Date): string {
  const { year, month, day } = istDateParts(d);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** API-Football'da sezon başlangıç yılıyla anılır: 2024 → "2024/25" */
export function seasonLabel(season: number | null): string {
  if (season == null) return '';
  return `${season}/${String(season + 1).slice(2)}`;
}
