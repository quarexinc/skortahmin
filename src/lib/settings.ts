// Site ayarları (admin panelden değiştirilir) + aktif duyurular. Kısa süreli bellek önbelleği.
import 'server-only';
import { cq, dbConfigured, q, type PoolClient } from '@/lib/db';

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
  minesEnabled: boolean;
  crashEnabled: boolean;
  slotsEnabled: boolean;
  blackjackEnabled: boolean;
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
    'Mines, Crash, Slots ve Blackjack — doğrulanabilir adil sonuçlar, günlük bonuslar, VIP seviyeleri. Gerçek para yok, yalnızca eğlence.',
  minesEnabled: true,
  crashEnabled: true,
  slotsEnabled: true,
  blackjackEnabled: true,
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
    const rows = await run<{ key: string; value: unknown }>('SELECT key, value FROM settings');
    const s = { ...DEFAULT_SETTINGS } as Record<string, unknown>;
    for (const r of rows) if (r.key in s && typeof r.value === typeof s[r.key]) s[r.key] = r.value;
    const announcements = await run<Announcement>(
      `SELECT id, title, body, level FROM announcements WHERE active ORDER BY created_at DESC LIMIT 3`,
    );
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
