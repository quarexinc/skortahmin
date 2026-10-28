// BloxyBet marka işareti: yuvarlatılmış rozet içinde "B" monogramı ve küçük elmas (nötr, oyun/platform çağrışımı yok)
export function LogoMark({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className} aria-hidden>
      <defs>
        <linearGradient id="bb-g" x1="0" y1="0" x2="40" y2="40">
          <stop stopColor="#a78bfa" />
          <stop offset="1" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="12" fill="url(#bb-g)" />
      <path
        d="M13 10.5h8.2c3.6 0 5.8 1.8 5.8 4.7 0 1.9-1 3.3-2.6 3.9 2.1.6 3.4 2.2 3.4 4.4 0 3.3-2.4 5.3-6.4 5.3H13V10.5Zm4.2 7.3h3.4c1.4 0 2.2-.7 2.2-1.9s-.8-1.9-2.2-1.9h-3.4v3.8Zm0 7.6h4c1.5 0 2.4-.8 2.4-2.1 0-1.3-.9-2.1-2.4-2.1h-4v4.2Z"
        fill="#0b0618"
      />
      <path d="M31 7.5l2 2.5-2 2.5-2-2.5z" fill="#0b0618" opacity=".85" />
    </svg>
  );
}

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2">
      <LogoMark size={size} />
      <span className="text-[16px] font-black tracking-tight max-[430px]:hidden">
        Bloxy<span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">Bet</span>
      </span>
    </span>
  );
}
