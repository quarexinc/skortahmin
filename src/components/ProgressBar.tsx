'use client';

import { useEffect, useState } from 'react';

interface ProgressBarProps {
  /** 0..100 */
  percent: number;
  barClassName?: string;
  height?: string;
  className?: string;
}

export default function ProgressBar({
  percent,
  barClassName = 'bg-accent',
  height = 'h-2.5',
  className = '',
}: ProgressBarProps) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = requestAnimationFrame(() => setW(percent));
    return () => cancelAnimationFrame(t);
  }, [percent]);
  return (
    <div className={`w-full overflow-hidden rounded-full bg-ink-950/70 ${height} ${className}`}>
      <div
        className={`h-full rounded-full ${barClassName} transition-[width] duration-700 ease-out`}
        style={{ width: `${Math.min(100, Math.max(0, w))}%` }}
      />
    </div>
  );
}
