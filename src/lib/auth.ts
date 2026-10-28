// ---------------------------------------------------------------------------
// Oturum yönetimi: imzalı JWT (HS256) httpOnly çerezde. Her istekte kullanıcı
// veritabanından yüklenir; ban veya "tüm oturumları kapat" (token_version) anında etkili olur.
// ---------------------------------------------------------------------------
import 'server-only';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { vipFor } from '@/config/vip';
import { dbConfigured, q1 } from '@/lib/db';

export const SESSION_COOKIE = 'skor_session';
const SESSION_DAYS = 30;

export interface SessionUser {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'admin';
  isAdmin: boolean;
  /** VIP seviyesi (toplam oynanan krediye göre) */
  vipLevel: number;
  /** profilde gösterilen favori oyun (mines/crash/slots/blackjack) */
  favoriteGame: string | null;
  bio: string | null;
  avatarColor: string;
  createdAt: string;
  /** kuruş (1/100 kredi) */
  balance: number;
  vault: number;
  wagered: number;
  birthDate: string | null;
  ageVerified: boolean;
  selfExcludedUntil: string | null;
}

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error('AUTH_SECRET tanımlı değil (en az 32 karakter).');
  return new TextEncoder().encode(s);
}

export async function createSession(userId: number, tokenVersion: number): Promise<void> {
  const token = await new SignJWT({ tv: tokenVersion })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 3600,
  });
}

export function clearSession(): void {
  cookies().set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
}

interface UserRow {
  id: number;
  email: string;
  name: string;
  role: string;
  plan: string;
  premium_until: Date | null;
  favorite_team: string | null;
  bio: string | null;
  avatar_color: string;
  banned: boolean;
  token_version: number;
  created_at: Date;
  balance?: string | number;
  vault?: string | number;
  wagered?: string | number;
  birth_date?: Date | string | null;
  self_excluded_until?: Date | null;
}

export function ageFrom(birth: Date | string | null | undefined): number | null {
  if (!birth) return null;
  const b = new Date(birth);
  if (Number.isNaN(b.getTime())) return null;
  const now = new Date();
  let a = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) a--;
  return a;
}

export function toSessionUser(r: UserRow): SessionUser {
  const isAdmin = r.role === 'admin';
  return {
    id: r.id,
    email: r.email,
    name: r.name,
    role: isAdmin ? 'admin' : 'user',
    isAdmin,
    favoriteGame: r.favorite_team,
    vipLevel: vipFor(Number(r.wagered ?? 0) / 100).current.level,
    bio: r.bio,
    avatarColor: r.avatar_color,
    createdAt: new Date(r.created_at).toISOString(),
    balance: Number(r.balance ?? 0),
    vault: Number(r.vault ?? 0),
    wagered: Number(r.wagered ?? 0),
    birthDate: r.birth_date ? new Date(r.birth_date).toISOString().slice(0, 10) : null,
    ageVerified: (ageFrom(r.birth_date) ?? 0) >= 18,
    selfExcludedUntil:
      r.self_excluded_until && new Date(r.self_excluded_until).getTime() > Date.now() ? new Date(r.self_excluded_until).toISOString() : null,
  };
}

/** Geçerli kullanıcı (yoksa null). Veritabanı bağlı değilse de null döner. */
export async function getUser(): Promise<SessionUser | null> {
  if (!dbConfigured() || !process.env.AUTH_SECRET) return null;
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const id = Number(payload.sub);
    if (!Number.isInteger(id)) return null;
    const row = await q1<UserRow>('SELECT * FROM users WHERE id = $1', [id]);
    if (!row || row.banned || row.token_version !== payload.tv) return null;
    return toSessionUser(row);
  } catch {
    return null;
  }
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function requireUser(): Promise<SessionUser> {
  const u = await getUser();
  if (!u) throw new HttpError(401, 'Bu işlem için giriş yapmalısınız.');
  return u;
}

export async function requireAdmin(): Promise<SessionUser> {
  const u = await requireUser();
  if (!u.isAdmin) throw new HttpError(403, 'Bu işlem için yönetici yetkisi gerekir.');
  return u;
}

/** Sunucu sayfaları için: giriş yoksa giriş sayfasına yönlendirir. */
export async function pageUser(next: string): Promise<SessionUser> {
  const { redirect } = await import('next/navigation');
  const u = await getUser();
  if (!u) redirect(`/giris?next=${encodeURIComponent(next)}`);
  return u as SessionUser;
}
