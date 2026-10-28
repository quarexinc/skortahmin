// Kredi birimleri: veritabanında 1/100 kredi (BIGINT). Arayüzde 2 ondalıklı kredi.
export const toUnits = (credits: number): number => Math.round(credits * 100);
export const toCredits = (units: number | string | bigint): number => Number(units) / 100;

export function fmtCredits(units: number | string | bigint | null | undefined, opts: { compact?: boolean } = {}): string {
  const v = toCredits(units ?? 0);
  if (opts.compact && Math.abs(v) >= 10_000)
    return new Intl.NumberFormat('tr-TR', { notation: 'compact', maximumFractionDigits: 1 }).format(v);
  return v.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const fmtMult = (m: number | string) => `${Number(m).toFixed(2).replace('.', ',')}x`;
