// ---------------------------------------------------------------------------
// tr-TR biçimlendirme yardımcıları (tarih/saat Europe/Istanbul).
// ---------------------------------------------------------------------------

import { TIMEZONE } from '@/config';

const nf1 = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nf0 = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 });

/** 0..1 → "13,4%" */
export function pct1(x: number | null | undefined): string {
  if (x == null || !Number.isFinite(x)) return '—';
  return `${nf1.format(x * 100)}%`;
}

/** 1 ondalık sayı: "1,8" */
export function num1(x: number | null | undefined): string {
  if (x == null || !Number.isFinite(x)) return '—';
  return nf1.format(x);
}

/** tam sayı: "1.234" */
export function num0(x: number | null | undefined): string {
  if (x == null || !Number.isFinite(x)) return '—';
  return nf0.format(x);
}

function safe(iso: string | null | undefined, opts: Intl.DateTimeFormatOptions): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('tr-TR', { timeZone: TIMEZONE, ...opts }).format(new Date(iso));
  } catch {
    return '—';
  }
}

/** "20:00" */
export const fmtTime = (iso: string): string => safe(iso, { hour: '2-digit', minute: '2-digit' });
/** "27 Ağustos Perşembe" */
export const fmtDayLong = (iso: string): string => safe(iso, { day: 'numeric', month: 'long', weekday: 'long' });
/** "27 Ağustos 2026" */
export const fmtDateLong = (iso: string): string => safe(iso, { day: 'numeric', month: 'long', year: 'numeric' });
/** "27 Ağu" */
export const fmtDateShort = (iso: string): string => safe(iso, { day: 'numeric', month: 'short' });
/** "Perşembe" */
export const fmtWeekday = (iso: string): string => safe(iso, { weekday: 'long' });
/** "27 Ağustos Perşembe, 20:00" */
export const fmtMatchDateTime = (iso: string): string =>
  iso ? `${safe(iso, { day: 'numeric', month: 'long', weekday: 'long' })}, ${fmtTime(iso)}` : '—';

// ===== Maç durumu etiketleri (fixture.status.short → Türkçe) =====

const STATUS_TR: Record<string, string> = {
  NS: 'Başlamadı',
  '1H': '1. Yarı',
  '2H': '2. Yarı',
  '1ST': '1. Yarı',
  '2ND': '2. Yarı',
  HT: 'İstirahat',
  HALFTIME: 'İstirahat',
  BT: 'Uzatma',
  ET: 'Uzatma',
  PEN: 'Penaltılar',
  FT: 'MS',
  AET: 'MS (Uz.)',
  PENDING: 'Beklemede',
  SUSP: 'Durduruldu',
  INT: 'Yarıda',
  LIVE: 'Canlı',
  INPLAY: 'Canlı',
  PST: 'Ertelendi',
  PRO: 'Ertelendi',
  PD: 'Gecikmeli',
  POff: 'Ertelendi',
  TTBD: 'Belirlenecek',
  CANC: 'İptal',
  ABD: 'İptal',
  AWD: 'Hükmen',
  WO: 'Hükmen Galibiyet',
  ACAN: 'İptal',
  ENDS: 'Bitti',
};

export function statusLabel(short: string | null | undefined): string {
  if (!short) return '—';
  return STATUS_TR[short] ?? short;
}

/** Bilinen API-Football plan hatalarını Türkçeye çevirir; bilinmeyenler olduğu gibi döner. */
export function trApiError(message: string | null | undefined): string {
  if (!message) return 'Veri şu anda mevcut değil.';
  if (/Free plans do not have access to this date/i.test(message)) {
    const range = message.match(/from ([\d-]+) to ([\d-]+)/);
    return range
      ? `Bu tarih aralığına ücretsiz plandan erişilemiyor (${range[1]} – ${range[2]} erişilebilir). Veri şu anda mevcut değil.`
      : 'Bu tarihe ücretsiz plandan erişilemiyor. Veri şu anda mevcut değil.';
  }
  if (/Free plans do not have access to this season/i.test(message)) {
    return 'Bu sezonun verilerine ücretsiz plandan erişilemiyor. Veri şu anda mevcut değil.';
  }
  if (/Free plans do not have access/i.test(message)) {
    return `Ücretsiz plan kısıtı: ${message.replace(/^.*Free plans/i, '')} Veri şu anda mevcut değil.`;
  }
  return message;
}

export const LIVE_STATUSES = new Set([
  '1H', '2H', '1ST', '2ND', 'HT', 'HALFTIME', 'BT', 'ET', 'PEN', 'LIVE', 'INPLAY', 'SUSP',
]);

export const POSTPONED_STATUSES = new Set(['PST', 'PRO', 'PD', 'POff', 'TTBD']);
export const CANCELLED_STATUSES = new Set(['CANC', 'ABD', 'ACAN']);
