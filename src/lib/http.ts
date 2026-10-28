// API route yardımcıları: tek tip hata yanıtı ve girdi doğrulama.
import 'server-only';
import { NextResponse } from 'next/server';
import { HttpError } from '@/lib/auth';
import { dbConfigured } from '@/lib/db';

type Handler<C> = (req: Request, ctx: C) => Promise<Response | unknown>;

/** Route handler sarmalayıcı: HttpError → JSON hata, diğerleri → 500. Düz nesneler JSON'a çevrilir. */
export function route<C = { params: Record<string, string> }>(fn: Handler<C>) {
  return async (req: Request, ctx: C): Promise<Response> => {
    try {
      if (!dbConfigured()) throw new HttpError(503, 'Üyelik sistemi henüz yapılandırılmadı (veritabanı bağlı değil).');
      const out = await fn(req, ctx);
      if (out instanceof Response) return out;
      return NextResponse.json(out ?? { ok: true });
    } catch (e) {
      if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
      console.error('[route] hata', e);
      return NextResponse.json({ error: 'Beklenmeyen bir sunucu hatası oluştu.' }, { status: 500 });
    }
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function body<T = any>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new HttpError(400, 'Geçersiz istek gövdesi.');
  }
}

export function str(v: unknown, label: string, opts: { min?: number; max?: number; optional?: boolean } = {}): string {
  const s = typeof v === 'string' ? v.trim() : '';
  if (!s) {
    if (opts.optional) return '';
    throw new HttpError(400, `${label} gerekli.`);
  }
  if (opts.min && s.length < opts.min) throw new HttpError(400, `${label} en az ${opts.min} karakter olmalı.`);
  if (opts.max && s.length > opts.max) throw new HttpError(400, `${label} en fazla ${opts.max} karakter olabilir.`);
  return s;
}

export function int(v: unknown, label: string, opts: { min?: number; max?: number } = {}): number {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isInteger(n)) throw new HttpError(400, `${label} geçersiz.`);
  if (opts.min != null && n < opts.min) throw new HttpError(400, `${label} en az ${opts.min} olmalı.`);
  if (opts.max != null && n > opts.max) throw new HttpError(400, `${label} en fazla ${opts.max} olabilir.`);
  return n;
}

export function oneOf<T extends string>(v: unknown, allowed: readonly T[], label: string): T {
  if (typeof v === 'string' && (allowed as readonly string[]).includes(v)) return v as T;
  throw new HttpError(400, `${label} geçersiz.`);
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function clientIp(req: Request): string {
  return (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'yerel';
}
