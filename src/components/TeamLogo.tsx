'use client';

import { useState } from 'react';

const SIZES = {
  sm: 'h-5 w-5 text-[8px]',
  md: 'h-7 w-7 text-[9px]',
  lg: 'h-10 w-10 text-xs',
  xl: 'h-16 w-16 text-lg',
} as const;

interface TeamLogoProps {
  logo: string | null;
  name: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}

export default function TeamLogo({ logo, name, size = 'md', className = '' }: TeamLogoProps) {
  const [failed, setFailed] = useState(false);
  const initials =
    (name ?? '?')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toLocaleUpperCase('tr-TR') || '?';

  if (!logo || failed) {
    return (
      <span
        className={`grid shrink-0 place-items-center rounded-full bg-ink-600 font-bold text-slate-300 ${SIZES[size]} ${className}`}
        title={name ?? ''}
      >
        {initials}
      </span>
    );
  }
  return (
    <img
      src={logo}
      alt={name ?? ''}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`shrink-0 object-contain ${SIZES[size]} ${className}`}
    />
  );
}
