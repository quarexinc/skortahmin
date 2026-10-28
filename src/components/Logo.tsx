// Marka işareti: stilize futbol topu + yükselen grafik çizgisi (SVG)
export function LogoMark({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className} aria-hidden>
      <rect width="40" height="40" rx="11" fill="url(#lg)" />
      <circle cx="20" cy="20" r="11" stroke="#05080f" strokeWidth="2.4" />
      <path d="M20 13.5l5.2 3.8-2 6.1h-6.4l-2-6.1z" fill="#05080f" />
      <path d="M20 9v4.5M25.2 17.3l4.6-1.6M23.2 23.4l2.9 4M16.8 23.4l-2.9 4M14.8 17.3l-4.6-1.6" stroke="#05080f" strokeWidth="2" strokeLinecap="round" />
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="40" y2="40">
          <stop stopColor="#4ade80" />
          <stop offset="1" stopColor="#16a34a" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2">
      <LogoMark size={size} />
      <span className="text-[15px] font-black tracking-tight">
        Skor <span className="text-accent-soft">Çıkartıcı</span>
      </span>
    </span>
  );
}
