// Tarayıcı tarafı yardımcılar: JSON API çağrısı, tarih biçimleri, kupon taslağı.
'use client';

export interface ApiResult<T> {
  data: T | null;
  error: string | null;
  status: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function api<T = any>(url: string, init?: { method?: string; body?: unknown }): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method: init?.method ?? (init?.body !== undefined ? 'POST' : 'GET'),
      headers: init?.body !== undefined ? { 'content-type': 'application/json' } : undefined,
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: 'no-store',
    });
    const j = await res.json().catch(() => null);
    if (!res.ok || (j && j.error)) return { data: null, error: j?.error ?? `İstek başarısız (${res.status}).`, status: res.status };
    return { data: j as T, error: null, status: res.status };
  } catch {
    return { data: null, error: 'Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.', status: 0 };
  }
}

const TZ = 'Europe/Istanbul';

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('tr-TR', {
    timeZone: TZ,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('tr-TR', { timeZone: TZ, day: '2-digit', month: 'long', year: 'numeric' }).format(
    new Date(iso),
  );
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '';
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 45) return 'az önce';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} dk önce`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} sa önce`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} gün önce`;
  return fmtDate(iso);
}

export const pct = (p: number | null | undefined, digits = 0) =>
  p == null ? '—' : `%${(p * 100).toFixed(digits).replace('.', ',')}`;

// ===== Kupon taslağı (tarayıcıda saklanır) =====
export interface CouponPick {
  fixtureId: number;
  home: string;
  away: string;
  league: string | null;
  date: string;
  market: string; // ör. "1X2", "KG", "Alt/Üst 2.5"
  selection: string; // ör. "1", "KG Var", "Üst"
  prob: number; // modelin olasılığı (0-1)
}

const KEY = 'skor_coupon_draft';
const EVT = 'skor-coupon-change';

export function readCoupon(): CouponPick[] {
  try {
    const raw = localStorage.getItem(KEY);
    const v = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function writeCoupon(picks: CouponPick[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(picks));
  } catch {
    /* depolama kapalı olabilir */
  }
  window.dispatchEvent(new Event(EVT));
}

/** Aynı maça tek seçim: varsa değiştirir. Dönen değer: eklendi mi (true) / çıkarıldı mı (false) */
export function togglePick(p: CouponPick): boolean {
  const cur = readCoupon();
  const same = cur.find((x) => x.fixtureId === p.fixtureId && x.market === p.market && x.selection === p.selection);
  if (same) {
    writeCoupon(cur.filter((x) => x !== same));
    return false;
  }
  writeCoupon([...cur.filter((x) => x.fixtureId !== p.fixtureId), p]);
  return true;
}

export function onCouponChange(cb: () => void): () => void {
  window.addEventListener(EVT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(EVT, cb);
    window.removeEventListener('storage', cb);
  };
}
