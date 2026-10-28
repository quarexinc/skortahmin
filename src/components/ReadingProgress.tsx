'use client';

import { useEffect, useState } from 'react';

export default function ReadingProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const on = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setP(max > 0 ? Math.min(1, h.scrollTop / max) : 0);
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return <div className="fixed left-0 top-0 z-[55] h-0.5 bg-gradient-to-r from-accent to-cyan-400" style={{ width: `${p * 100}%` }} aria-hidden />;
}
