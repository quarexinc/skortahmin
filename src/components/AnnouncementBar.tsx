'use client';

import { useEffect, useState } from 'react';

interface Item {
  id: number;
  title: string;
  body: string | null;
  level: 'info' | 'success' | 'warning';
}

const STYLE = {
  info: 'border-sky-500/20 bg-sky-500/10 text-sky-100',
  success: 'border-accent/20 bg-accent/10 text-accent-soft',
  warning: 'border-amber-500/20 bg-amber-500/10 text-amber-100',
};
const ICON = { info: '📢', success: '🎉', warning: '⚠️' };
const KEY = 'skor_dismissed_ann';

export default function AnnouncementBar({ items }: { items: Item[] }) {
  const [dismissed, setDismissed] = useState<number[] | null>(null);

  useEffect(() => {
    try {
      setDismissed(JSON.parse(localStorage.getItem(KEY) ?? '[]'));
    } catch {
      setDismissed([]);
    }
  }, []);

  if (dismissed == null) return null;
  const visible = items.filter((i) => !dismissed.includes(i.id));
  if (visible.length === 0) return null;

  const close = (id: number) => {
    const next = [...dismissed, id];
    setDismissed(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next.slice(-30)));
    } catch {
      /* yok say */
    }
  };

  return (
    <div>
      {visible.map((a) => (
        <div key={a.id} className={`border-b ${STYLE[a.level] ?? STYLE.info}`}>
          <div className="mx-auto flex max-w-6xl items-start gap-3 px-4 py-2 text-sm">
            <span aria-hidden>{ICON[a.level] ?? '📢'}</span>
            <p className="min-w-0 flex-1">
              <span className="font-semibold">{a.title}</span>
              {a.body && <span className="opacity-80"> — {a.body}</span>}
            </p>
            <button onClick={() => close(a.id)} aria-label="Duyuruyu kapat" className="opacity-60 hover:opacity-100">
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
