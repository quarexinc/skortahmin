// ---------------------------------------------------------------------------
// İki katmanlı önbellek:
//  L1: bellek içi Map + TTL (aynı sunucu örneği içinde anında yanıt)
//  L2: Next.js Data Cache (unstable_cache) — Vercel'de kalıcıdır ve TÜM sunucu
//      örnekleri/bölgeler arasında paylaşılır. Böylece soğuk başlayan bir örnek
//      API-Football'a tekrar gitmez.
// Ayrıca aynı anahtar için eşzamanlı istekler tek bir upstream çağrısında birleşir.
// Plan kısıtı hataları (ör. erişilemeyen tarih/sezon) da önbelleğe alınır ki
// her ziyarette boşuna istek harcanmasın.
// ---------------------------------------------------------------------------
import { unstable_cache } from 'next/cache';
import { ApiFootballError } from '@/lib/apiFootball';

export interface CacheHit<T> {
  value: T;
  /** true ise bu çağrıda upstream isteği GÖNDERİLMEDİ */
  hit: boolean;
}

interface Entry {
  value: unknown;
  expiresAt: number;
}

const store = new Map<string, Entry>();
const inflight = new Map<string, Promise<CacheHit<unknown>>>();
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

export function cacheDel(key: string): void {
  store.delete(key);
}

/** L2'de saklanan zarf: başarı ya da önbelleğe alınabilir plan hatası */
type Stored<T> =
  | { ok: true; value: T }
  | { ok: false; message: string; code: number; isPlan: boolean };

const CACHE_VERSION = 'v2';

/**
 * Önce L1, sonra L2 (kalıcı, paylaşılan) önbelleğe bakar; ikisinde de yoksa fn() çağrılır.
 * Plan kısıtı hataları da TTL boyunca saklanır ve aynı hata tekrar fırlatılır.
 */
export async function cachedFetch<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<CacheHit<T>> {
  const l1 = cacheGet<Stored<T>>(key);
  if (l1 !== undefined) return unwrap(l1, true);

  const pending = inflight.get(key) as Promise<CacheHit<T>> | undefined;
  if (pending) return pending;

  const p = (async (): Promise<CacheHit<T>> => {
    let calledUpstream = false;
    const load = async (): Promise<Stored<T>> => {
      calledUpstream = true;
      console.log(`[cache] MISS ${key} → upstream istek`);
      try {
        return { ok: true, value: await fn() };
      } catch (e) {
        // Yalnızca kalıcı plan kısıtları önbelleğe alınır; geçici hatalar fırlatılır (saklanmaz).
        if (e instanceof ApiFootballError && e.isPlan) {
          return { ok: false, message: e.message, code: e.code, isPlan: true };
        }
        throw e;
      }
    };

    let stored: Stored<T>;
    try {
      stored = await unstable_cache(load, [CACHE_VERSION, key], {
        revalidate: Math.max(60, Math.round(ttlMs / 1000)),
      })();
    } catch (e) {
      // Data Cache kullanılamıyorsa (yerel/derleme ortamı vb.) doğrudan getir
      if (calledUpstream) throw e;
      stored = await load();
    }
    if (!calledUpstream) console.log(`[cache] HIT  ${key} (kalıcı)`);
    cacheSet(key, stored, ttlMs);
    return unwrap(stored, !calledUpstream);
  })();

  inflight.set(key, p as Promise<CacheHit<unknown>>);
  try {
    return await p;
  } finally {
    inflight.delete(key);
  }
}

function unwrap<T>(s: Stored<T>, hit: boolean): CacheHit<T> {
  if (s.ok) return { value: s.value, hit };
  throw new ApiFootballError(s.message, s.code, s.isPlan);
}

/** Önbellek süreleri */
export const TTL = {
  /** tek maç detayı */
  fixture: 30 * 60_000, // 30 dk
  /** tarih bazlı fikstür */
  fixtures: 60 * 60_000, // 60 dk
  /** takım sezon istatistikleri */
  stats: 24 * 3_600_000, // 24 saat
  /** H2H */
  h2h: 24 * 3_600_000, // 24 saat
  /** son maçlar (form) */
  form: 12 * 3_600_000, // 12 saat
  /** puan durumu */
  standings: 12 * 3_600_000, // 12 saat
  /** kupalar */
  trophies: 7 * 24 * 3_600_000, // 7 gün
  /** takım künyesi */
  team: 7 * 24 * 3_600_000, // 7 gün
  /** API tahmini */
  prediction: 3 * 3_600_000, // 3 saat
  /** oyuncular (krallık + kadro) */
  players: 24 * 3_600_000, // 24 saat
} as const;
