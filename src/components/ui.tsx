// Ortak arayüz parçaları (koyu tema, yeşil vurgu).
import Link from 'next/link';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
const BTN: Record<BtnVariant, string> = {
  primary: 'bg-accent text-ink-950 hover:bg-accent-soft disabled:bg-accent/40',
  secondary: 'border border-white/10 bg-ink-700 text-slate-100 hover:border-white/25 hover:bg-ink-600',
  ghost: 'text-slate-300 hover:bg-white/5 hover:text-white',
  danger: 'border border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20',
};
const SIZE = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2.5 text-sm', lg: 'px-6 py-3 text-base' };

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: keyof typeof SIZE; loading?: boolean }) {
  return (
    <button
      {...rest}
      disabled={rest.disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${BTN[variant]} ${SIZE[size]} ${className}`}
    >
      {loading && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  variant = 'primary',
  size = 'md',
  className = '',
  children,
}: {
  href: string;
  variant?: BtnVariant;
  size?: keyof typeof SIZE;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition ${BTN[variant]} ${SIZE[size]} ${className}`}
    >
      {children}
    </Link>
  );
}

const FIELD =
  'w-full rounded-xl border border-white/10 bg-ink-900 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/20 disabled:opacity-60';

export function Field({ label, hint, error, children }: { label?: string; hint?: string; error?: string | null; children: ReactNode }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-slate-300">{label}</span>}
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-red-300">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-slate-500">{hint}</span>
      ) : null}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${FIELD} ${props.className ?? ''}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={4} {...props} className={`${FIELD} resize-y ${props.className ?? ''}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${FIELD} ${props.className ?? ''}`} />;
}

export function Card({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`card p-5 ${className}`}>{children}</div>;
}

const BADGE: Record<string, string> = {
  green: 'bg-accent/15 text-accent-soft',
  blue: 'bg-sky-500/15 text-sky-300',
  amber: 'bg-amber-500/15 text-amber-300',
  red: 'bg-red-500/15 text-red-300',
  violet: 'bg-violet-500/15 text-violet-300',
  slate: 'bg-white/5 text-slate-300',
};

export function Badge({ color = 'slate', children }: { color?: keyof typeof BADGE; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ${BADGE[color]}`}>
      {children}
    </span>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Empty({ icon = '📭', title, children }: { icon?: string; title: string; children?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      <span className="text-4xl" aria-hidden>
        {icon}
      </span>
      <p className="mt-3 font-semibold text-slate-200">{title}</p>
      {children && <div className="mt-1 max-w-md text-sm text-slate-400">{children}</div>}
    </div>
  );
}

export function Avatar({ name, color, size = 36 }: { name: string; color: string; size?: number }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toLocaleUpperCase('tr-TR'))
    .join('');
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full font-bold text-ink-950"
      style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}
      aria-hidden
    >
      {initials || '?'}
    </span>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-sm text-slate-400">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      {label ?? 'Yükleniyor…'}
    </div>
  );
}

export function Notice({ kind = 'info', children }: { kind?: 'info' | 'error' | 'success'; children: ReactNode }) {
  const cls =
    kind === 'error'
      ? 'border-red-500/30 bg-red-500/10 text-red-200'
      : kind === 'success'
        ? 'border-accent/30 bg-accent/10 text-accent-soft'
        : 'border-sky-500/30 bg-sky-500/10 text-sky-200';
  return <div className={`rounded-xl border px-3.5 py-2.5 text-sm ${cls}`}>{children}</div>;
}

export const STATUS_TR: Record<string, { label: string; color: keyof typeof BADGE }> = {
  open: { label: 'Açık', color: 'blue' },
  answered: { label: 'Yanıtlandı', color: 'green' },
  waiting: { label: 'Yanıt bekliyor', color: 'amber' },
  closed: { label: 'Kapalı', color: 'slate' },
  pending: { label: 'Bekliyor', color: 'amber' },
  approved: { label: 'Onaylandı', color: 'green' },
  rejected: { label: 'Reddedildi', color: 'red' },
  scored: { label: 'Sonuçlandı', color: 'green' },
};

export const PRIORITY_TR: Record<string, { label: string; color: keyof typeof BADGE }> = {
  low: { label: 'Düşük', color: 'slate' },
  normal: { label: 'Normal', color: 'blue' },
  high: { label: 'Yüksek', color: 'amber' },
  urgent: { label: 'Acil', color: 'red' },
};

export const CATEGORY_TR: Record<string, string> = {
  genel: 'Genel',
  hesap: 'Hesap & giriş',
  premium: 'Premium & ödeme',
  tahmin: 'Tahmin & veri',
  hata: 'Hata bildirimi',
  oneri: 'Öneri',
  iletisim: 'İletişim formu',
};
