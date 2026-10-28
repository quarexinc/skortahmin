'use client';

import { useEffect, useState } from 'react';

export default function RotatingWord({ words, interval = 2400 }: { words: string[]; interval?: number }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % words.length), interval);
    return () => clearInterval(t);
  }, [words.length, interval]);
  return (
    <span className="relative inline-block overflow-hidden align-bottom">
      <span key={i} className="text-gradient inline-block animate-word-in">
        {words[i]}
      </span>
    </span>
  );
}
