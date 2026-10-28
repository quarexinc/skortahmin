// ---------------------------------------------------------------------------
// Maç analizi uç noktalarının ortak yardımcıları: maçı getir, sezon seçimi,
// hata toplayan fetch sarmalayıcıları.
// ---------------------------------------------------------------------------
import { currentSeason, MAX_ACCESSIBLE_SEASON, seasonForData, seasonLabel } from '@/config';
import { apiFootball, ApiFootballError } from '@/lib/apiFootball';
import { cachedFetch, TTL } from '@/lib/cache';
import type { FixtureRaw } from '@/lib/types';

export interface SeasonFetchResult<T> {
  value: T | null;
  season: number;
  fallback: boolean;
  error: string | null;
}

export const errMsg = (e: unknown): string => (e instanceof ApiFootballError ? e.message : 'veri alınamadı');

export async function getFixture(fixtureId: number): Promise<FixtureRaw | null> {
  const { value } = await cachedFetch<FixtureRaw[]>(`fixture:${fixtureId}`, TTL.fixture, () =>
    apiFootball<FixtureRaw[]>('fixtures', { id: fixtureId }, { timezone: true }),
  );
  return Array.isArray(value) && value[0] ? value[0] : null;
}

export function matchContext(fixture: FixtureRaw) {
  const warnings: string[] = [];
  const fixtureSeason = fixture.league?.season ?? currentSeason(new Date(fixture.fixture.date));
  const dataSeason = seasonForData(fixtureSeason);
  const primaryBlocked = fixtureSeason > MAX_ACCESSIBLE_SEASON;

  const seasonNotice =
    dataSeason !== fixtureSeason
      ? `Mevcut sezonun (${fixtureSeason}) sezon verileri (istatistik, puan durumu, kadro) API planı tarafından kısıtlanmış; ` +
        `bu bölümler ${seasonLabel(dataSeason)} sezonundaki son gerçek verilerle dolduruldu ve ilgili yerlerde etiketlendi.`
      : null;

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

  return { warnings, fixtureSeason, dataSeason, seasonNotice, seasonFetch, plainFetch };
}
