// ---------------------------------------------------------------------------
// API-Football v3 istemcisi:
//  - x-apisports-key header'ı
//  - istek kuyruğu: her iki istek arası ≥ 250 ms (dakikada ~10 limitine karşı)
//  - günlük istek sayacı (log) + yumuşak limit (cache'e düşme)
//  - errors alanı kontrolü (plan kısıtı tespiti dahil)
// ---------------------------------------------------------------------------

import {
  API_FOOTBALL_BASE_URL,
  API_FOOTBALL_KEY,
  DAILY_SOFT_LIMIT,
  MIN_REQUEST_INTERVAL_MS,
  TIMEZONE,
} from '@/config';

export class ApiFootballError extends Error {
  constructor(
    message: string,
    public readonly code: number = 502,
    /** plan kısıtı mı (sezon/parametre erişimi yok) */
    public readonly isPlan = false,
    /** günlük kota yumuşak limitine takıldı mı */
    public readonly isQuota = false,
  ) {
    super(message);
    this.name = 'ApiFootballError';
  }
}

// ===== Günlük istek sayacı =====
let dayKey = '';
let dailyCount = 0;

export function getDailyCount(): number {
  return dailyCount;
}

function bumpDailyCount(): void {
  const key = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(new Date());
  if (key !== dayKey) {
    dayKey = key;
    dailyCount = 0;
  }
  dailyCount += 1;
  console.log(`[api] upstream istek #${dailyCount} (günlük, ${key})`);
}

// ===== Hız sınırlayıcı: kayan 1-dakika penceresi (≤9 istek/dk, plan limiti 10) +
// ===== istekler arası minimum aralık; 429 olursa 30 sn bekle + 1 yeniden deneme.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 9;
const requestStamps: number[] = [];
let lastRequestAt = 0;
let queue: Promise<unknown> = Promise.resolve();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function rateLimited<T>(task: () => Promise<T>): Promise<T> {
  const run = async (): Promise<T> => {
    for (;;) {
      const now = Date.now();
      while (requestStamps.length > 0 && now - requestStamps[0] >= WINDOW_MS) requestStamps.shift();
      const gap = lastRequestAt + MIN_REQUEST_INTERVAL_MS - Date.now();
      if (requestStamps.length >= MAX_PER_WINDOW) {
        // Pencere dolu: en eski istek pencereden çıkana kadar bekle
        const wait = requestStamps[0] + WINDOW_MS - Date.now() + 150;
        if (wait > 0) {
          console.log(`[api] hız penceresi dolu; ${Math.round(wait / 1000)} sn bekleniyor (10/dk limiti)`);
          await sleep(wait);
        }
        continue;
      }
      if (gap > 0) await sleep(gap);
      lastRequestAt = Date.now();
      requestStamps.push(lastRequestAt);
      return task();
    }
  };
  const next = queue.then(run);
  queue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

function errorText(errors: unknown): string {
  if (!errors) return '';
  if (Array.isArray(errors)) return errors.map(String).join(' | ');
  if (typeof errors === 'string') return errors;
  if (typeof errors === 'object') return Object.values(errors).map(String).join(' | ');
  return String(errors);
}

interface ApiEnvelope<T> {
  response?: T | null;
  get?: string;
  parameters?: Record<string, string>;
  errors?: string[] | string | Record<string, string> | null;
  results?: number;
  paging?: { current: number; total: number };
  data?: T | null;
}

export interface ApiOptions {
  /** timezone=Europe/Istanbul parametresi eklensin mi (yalnızca bazı uç noktalar destekler) */
  timezone?: boolean;
}

/**
 * API-Football GET isteği. Başarıda data alanını, hata durumunda ApiFootballError fırlatır.
 */
export async function apiFootball<T>(
  endpoint: string,
  params: Record<string, string | number> = {},
  opts: ApiOptions = {},
): Promise<T> {
  if (dailyCount >= DAILY_SOFT_LIMIT) {
    throw new ApiFootballError(
      'Günlük API istek limitine yaklaşıldığı için yeni istek gönderilmedi; veri önbellekten servis edilir.',
      503,
      false,
      true,
    );
  }

  return rateLimited(async (): Promise<T> => {
    bumpDailyCount();
    const url = new URL(`${API_FOOTBALL_BASE_URL.replace(/\/$/, '')}/${endpoint}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
    if (opts.timezone) url.searchParams.set('timezone', TIMEZONE);

    let res: Response;
    try {
      for (let attempt = 0; ; attempt++) {
        let r: Response;
        try {
          r = await fetch(url, {
            headers: { 'x-apisports-key': API_FOOTBALL_KEY },
            cache: 'no-store',
          });
        } catch (netErr) {
          const cause = netErr instanceof Error && netErr.cause ? String(netErr.cause) : '';
          console.error('[api] fetch hatası:', netErr instanceof Error ? netErr.message : String(netErr), cause);
          throw new ApiFootballError(
            `API-Football sunucusuna ulaşılamadı (ağ hatası): ${netErr instanceof Error ? netErr.message : ''} ${cause}`,
            502,
          );
        }
        if (r.status === 429 && attempt === 0) {
          console.log('[api] 429 (hız limiti) alındı; 30 sn beklendikten sonra 1 kez yeniden denenecek.');
          await sleep(30_000);
          continue;
        }
        res = r;
        break;
      }
    } catch (e) {
      if (e instanceof ApiFootballError) throw e;
      throw new ApiFootballError('Beklenmeyen istek hatası.', 502);
    }

    if (res.status === 429) {
      throw new ApiFootballError('API-Football hız limiti (429) aşıldı; lütfen biraz sonra tekrar deneyin.', 429);
    }
    if (res.status === 401) {
      throw new ApiFootballError('API-Football anahtarı geçersiz görünüyor (401).', 401);
    }

    let json: ApiEnvelope<T>;
    try {
      json = (await res.json()) as ApiEnvelope<T>;
    } catch {
      throw new ApiFootballError(`API-Football beklenmeyen bir yanıt döndürdü (HTTP ${res.status}).`, 502);
    }

    const errs = json.errors ?? null;
    const isPlan =
      !!errs && typeof errs === 'object' && !Array.isArray(errs) && Object.keys(errs).length > 0;
    const message = errorText(errs);
    if (message) {
      throw new ApiFootballError(
        `API-Football: ${message}`,
        res.status >= 400 ? res.status : 400,
        isPlan,
      );
    }

    const data = (json.response ?? json.data ?? null) as T | null;
    if (data === null || data === undefined) {
      throw new ApiFootballError('API-Football boş veri döndürdü.', 404, isPlan);
    }
    return data as T;
  });
}
