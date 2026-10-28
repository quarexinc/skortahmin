// Site ayarları (admin panelden değiştirilir) + aktif duyurular. Kısa süreli bellek önbelleği.
import 'server-only';
import { cq, dbConfigured, q, type PoolClient } from '@/lib/db';
import { DEFAULT_EDGES, EDGE_MAX, EDGE_MIN, GAME_KEYS, type GameKey } from '@/lib/games/registry';

export interface SiteSettings {
  maintenance: boolean;
  maintenanceMessage: string;
  registrationsOpen: boolean;
  liveChatEnabled: boolean;
  supportHours: string;
  adsEnabled: boolean;
  cookieBanner: boolean;
  newsletterEnabled: boolean;
  blogEnabled: boolean;
  heroTitle: string;
  heroSubtitle: string;
  // oyunlar
  /** kapalı (bakımdaki) oyunlar */
  disabledGames: string[];
  /** oyun başına kasa payı (%) — herkese açık gösterilir */
  edges: Record<string, number>;
  /** blackjack ödeme oranı (1,5 = 3:2) */
  blackjackPayout: number;
  minBet: number;
  maxBet: number;
  maxPayout: number;
  // ekonomi (kredi)
  signupBonus: number;
  faucetAmount: number;
  faucetMinutes: number;
  dailyBonusEnabled: boolean;
  rakebackEnabled: boolean;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  maintenance: false,
  maintenanceMessage: 'Sitede kısa bir bakım çalışması yapıyoruz. Lütfen birazdan tekrar deneyin.',
  registrationsOpen: true,
  liveChatEnabled: true,
  supportHours: 'Her gün 10:00 – 23:00 (TSİ)',
  adsEnabled: true,
  cookieBanner: true,
  newsletterEnabled: true,
  blogEnabled: true,
  heroTitle: 'Şansını sanal kredilerle dene.',
  heroSubtitle:
    '14 oyun — Crash, Mines, Slots, Blackjack, Plinko, Rulet ve daha fazlası. Doğrulanabilir adil sonuçlar, günlük bonuslar, VIP seviyeleri. Gerçek para yok, yalnızca eğlence.',
  disabledGames: [],
  edges: { ...DEFAULT_EDGES },
  blackjackPayout: 1.5,
  minBet: 0.1,
  maxBet: 10000,
  maxPayout: 1000000,
  signupBonus: 1000,
  faucetAmount: 50,
  faucetMinutes: 15,
  dailyBonusEnabled: true,
  rakebackEnabled: true,
};

export interface Announcement {
  id: number;
  title: string;
  body: string | null;
  level: 'info' | 'success' | 'warning';
}

let cache: { at: number; settings: SiteSettings; announcements: Announcement[] } | null = null;
const TTL = 20_000;

export function invalidateSettings() {
  cache = null;
}

/** c verilirse sorgular o bağlantı üzerinden yapılır (işlem içindeyken havuzdan ikinci bağlantı istememek için). */
async function load(c?: PoolClient) {
  if (cache && Date.now() - cache.at < TTL) return cache;
  if (!dbConfigured()) {
    cache = { at: Date.now(), settings: DEFAULT_SETTINGS, announcements: [] };
    return cache;
  }
  try {
    const run = <T,>(text: string) => (c ? cq<T>(c, text) : q<T>(text));
    const [rows, announcements] = await Promise.all([
      run<{ key: string; value: unknown }>('SELECT key, value FROM settings'),
      run<Announcement>(`SELECT id, title, body, level FROM announcements WHERE active ORDER BY created_at DESC LIMIT 3`),
    ]);
    const s = { ...DEFAULT_SETTINGS } as Record<string, unknown>;
    for (const r of rows) if (r.key in s && typeof r.value === typeof s[r.key]) s[r.key] = r.value;
    s.edges = sanitizeEdges(s.edges);
    s.disabledGames = (Array.isArray(s.disabledGames) ? s.disabledGames : []).filter((g): g is string => typeof g === 'string' && (GAME_KEYS as readonly string[]).includes(g));
    cache = { at: Date.now(), settings: s as unknown as SiteSettings, announcements };
  } catch (e) {
    console.error('[settings] okunamadı', e);
    cache = { at: Date.now(), settings: DEFAULT_SETTINGS, announcements: [] };
  }
  return cache;
}

export async function getSettings(c?: PoolClient): Promise<SiteSettings> {
  return (await load(c)).settings;
}

export async function getAnnouncements(): Promise<Announcement[]> {
  return (await load()).announcements;
}

export function sanitizeEdges(v: unknown): Record<string, number> {
  const src = v && typeof v === 'object' ? (v as Record<string, unknown>) : {};
  const out: Record<string, number> = { ...DEFAULT_EDGES };
  for (const k of GAME_KEYS) {
    const n = Number(src[k]);
    if (src[k] != null && Number.isFinite(n)) out[k] = Math.round(Math.max(EDGE_MIN, Math.min(EDGE_MAX, n)) * 100) / 100;
  }
  return out;
}

export const gameEnabled = (s: SiteSettings, g: GameKey) => !s.disabledGames.includes(g);
