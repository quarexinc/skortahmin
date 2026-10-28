// ---------------------------------------------------------------------------
// Bellek içi önbellek (Map + TTL). Sunucu tarafında, process başına yaşar.
// ---------------------------------------------------------------------------

export interface CacheHit<T> {
  value: T;
  /** true ise upstream isteği GÖNDERİLMEDİ */
  hit: boolean;
}

interface Entry {
  value: unknown;
  expiresAt: number;
}

const store = new Map<string, Entry>();
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = 0;

function cleanup(now: number): void {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (entry.expiresAt <= now) store.delete(key);
  }
}

export function cacheGet<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    store.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  cleanup(Date.now());
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

/** Bozuk/boş yanıtı cache'ten atmak için (örn. satırsız puan durumu kabuğu) */
export function cacheDel(key: string): void {
  store.delete(key);
}

/**
 * Önce cache'e bakar; ısrar edemezse fn() ile getirir ve TTL ile saklar.
 */
export async function cachedFetch<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<CacheHit<T>> {
  const existing = cacheGet<T>(key);
  if (existing !== undefined) {
    console.log(`[cache] HIT  ${key}`);
    return { value: existing, hit: true };
  }
  console.log(`[cache] MISS ${key} → upstream istek`);
  const value = await fn();
  cacheSet(key, value, ttlMs);
  return { value, hit: false };
}

/** Önbellek süreleri (proje gereksinimi) */
export const TTL = {
  /** tek maç detayı */
  fixture: 60 * 60_000, // 60 dk
  /** tarih bazlı fikstür */
  fixtures: 60 * 60_000, // 60 dk
  /** takım sezon istatistikleri */
  stats: 24 * 3_600_000, // 24 saat
  /** H2H */
  h2h: 24 * 3_600_000, // 24 saat
  /** son maçlar (form) */
  form: 6 * 3_600_000, // 6 saat
  /** puan durumu */
  standings: 6 * 3_600_000, // 6 saat
  /** kupalar */
  trophies: 7 * 24 * 3_600_000, // 7 gün
  /** takım künyesi */
  team: 24 * 3_600_000, // 24 saat
  /** API tahmini */
  prediction: 60 * 60_000, // 60 dk
  /** oyuncular (krallık + kadro) */
  players: 24 * 3_600_000, // 24 saat
} as const;
