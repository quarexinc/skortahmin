'use client';

// Sayfa sayacı, çerez bildirimi ve yukarı çık düğmesi
import { ArrowUp, Cookie } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

function visitorId(): string {
  try {
    let v = localStorage.getItem('skor_vid');
    if (!v) {
      v = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem('skor_vid', v);
    }
    return v;
  } catch {
    return '';
  }
}

export function PageTracker() {
  const path = usePathname();
  useEffect(() => {
    if (!path || path.startsWith('/admin')) return;
    const body = JSON.stringify({ path, vid: visitorId() });
    try {
      if (navigator.sendBeacon) navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }));
      else fetch('/api/track', { method: 'POST', body, headers: { 'content-type': 'application/json' }, keepalive: true });
    } catch {
      /* yok say */
    }
  }, [path]);
  return null;
}

export function CookieBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      setShow(!localStorage.getItem('skor_cookie_ok'));
    } catch {
      setShow(false);
    }
  }, []);
  if (!show) return null;
  const ok = () => {
    try {
      localStorage.setItem('skor_cookie_ok', '1');
    } catch {
      /* yok say */
    }
    setShow(false);
  };
  return (
    <div className="fixed inset-x-3 bottom-24 z-[45] mx-auto max-w-2xl animate-fade-in rounded-2xl border border-white/10 bg-ink-800/95 p-4 shadow-2xl backdrop-blur sm:bottom-5 sm:right-24">
      <div className="flex flex-wrap items-center gap-3">
        <Cookie size={22} className="shrink-0 text-amber-300" />
        <p className="min-w-0 flex-1 text-sm text-slate-300">
          Oturumunu açık tutmak için zorunlu bir çerez ve tercihlerini hatırlamak için tarayıcı depolaması kullanıyoruz. Reklam takibi yapmıyoruz.{' '}
          <Link href="/gizlilik" className="text-accent-soft underline">Ayrıntılar</Link>
        </p>
        <button onClick={ok} className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-ink-950 hover:bg-accent-soft">Anladım</button>
      </div>
    </div>
  );
}

export function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 700);
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  if (!show) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Yukarı çık"
      className="fixed bottom-24 right-6 z-40 grid h-10 w-10 animate-fade-in place-items-center rounded-full border border-white/10 bg-ink-800/90 text-slate-300 shadow-xl backdrop-blur transition hover:text-white"
    >
      <ArrowUp size={18} />
    </button>
  );
}
