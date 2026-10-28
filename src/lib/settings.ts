// Site ayarları (admin panelden değiştirilir) + aktif duyurular. Kısa süreli bellek önbelleği.
import 'server-only';
import { dbConfigured, q } from '@/lib/db';

export interface SiteSettings {
  maintenance: boolean;
  maintenanceMessage: string;
  registrationsOpen: boolean;
  commentsEnabled: boolean;
  liveChatEnabled: boolean;
  supportHours: string;
  premiumPriceText: string;
  premiumPaymentInfo: string;
  freeCouponLimit: number;
  adsEnabled: boolean;
  hideAdsForPremium: boolean;
  cookieBanner: boolean;
  newsletterEnabled: boolean;
  blogEnabled: boolean;
  heroTitle: string;
  heroSubtitle: string;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  maintenance: false,
  maintenanceMessage: 'Sitede kısa bir bakım çalışması yapıyoruz. Lütfen birazdan tekrar deneyin.',
  registrationsOpen: true,
  commentsEnabled: true,
  liveChatEnabled: true,
  supportHours: 'Her gün 10:00 – 23:00 (TSİ)',
  premiumPriceText: 'Aylık 99 TL',
  premiumPaymentInfo:
    'Premium talebinizi gönderdikten sonra ödeme bilgileri destek ekibimiz tarafından size iletilir. Ödeme onaylanınca üyeliğiniz yönetici tarafından aktifleştirilir.',
  freeCouponLimit: 3,
  adsEnabled: true,
  hideAdsForPremium: true,
  cookieBanner: true,
  newsletterEnabled: true,
  blogEnabled: true,
  heroTitle: 'Futbolu sayılarla oku.',
  heroSubtitle:
    'Gerçek maç verileri ve şeffaf bir Poisson modeliyle her maç için skor olasılıkları. Analizi incele, tahminini yap, liderlik tablosunda yarış.',
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

async function load() {
  if (cache && Date.now() - cache.at < TTL) return cache;
  if (!dbConfigured()) {
    cache = { at: Date.now(), settings: DEFAULT_SETTINGS, announcements: [] };
    return cache;
  }
  try {
    const rows = await q<{ key: string; value: unknown }>('SELECT key, value FROM settings');
    const s = { ...DEFAULT_SETTINGS } as Record<string, unknown>;
    for (const r of rows) if (r.key in s) s[r.key] = r.value;
    const announcements = await q<Announcement>(
      `SELECT id, title, body, level FROM announcements WHERE active ORDER BY created_at DESC LIMIT 3`,
    );
    cache = { at: Date.now(), settings: s as unknown as SiteSettings, announcements };
  } catch (e) {
    console.error('[settings] okunamadı', e);
    cache = { at: Date.now(), settings: DEFAULT_SETTINGS, announcements: [] };
  }
  return cache;
}

export async function getSettings(): Promise<SiteSettings> {
  return (await load()).settings;
}

export async function getAnnouncements(): Promise<Announcement[]> {
  return (await load()).announcements;
}
