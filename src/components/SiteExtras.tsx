'use client';

// Sayfa sayacı, çerez bildirimi, yukarı çık düğmesi, 18+ kapısı ve oturum hatırlatıcısı
import { AlarmClock, ArrowUp, Cookie } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { api } from '@/lib/client';

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

// ---------------------------------------------------------------------------
// 18+ yaş kapısı: ilk ziyarette sorulur. Yaşını doğrulamış üyelere gösterilmez.
// ---------------------------------------------------------------------------
export function AgeGate() {
  const { user } = useAuth();
  const [state, setState] = useState<'hidden' | 'ask' | 'denied'>('hidden');
  useEffect(() => {
    if (user?.ageVerified) return;
    try {
      if (localStorage.getItem('bb_age_ok') === '1') return;
    } catch {
      /* depolama kapalıysa her ziyarette sorulur */
    }
    setState('ask');
  }, [user?.ageVerified]);
  if (state === 'hidden') return null;
  const yes = () => {
    try {
      localStorage.setItem('bb_age_ok', '1');
    } catch {
      /* yoksay */
    }
    setState('hidden');
  };
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-ink-950/90 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="agegate-title">
      <div className="w-full max-w-md animate-pop rounded-3xl border border-white/10 bg-ink-900 p-7 text-center shadow-2xl">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full border-2 border-red-400/60 text-xl font-black text-red-300">18+</span>
        {state === 'ask' ? (
          <>
            <h2 id="agegate-title" className="mt-5 text-2xl font-black">Yaş doğrulaması</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              BloxyBet casino tarzı oyunlar içerir ve yalnızca <b className="text-white">18 yaş ve üzeri</b> kişiler içindir. Oyunlar sanal kredilerle oynanır; gerçek para yatırılmaz veya kazanılmaz.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button onClick={() => setState('denied')} className="rounded-xl border border-white/10 py-3 font-semibold text-slate-300 hover:bg-white/5">18 yaşından küçüğüm</button>
              <button onClick={yes} className="rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 py-3 font-bold text-white">18 yaşından büyüğüm</button>
            </div>
          </>
        ) : (
          <>
            <h2 id="agegate-title" className="mt-5 text-2xl font-black">Erişim kısıtlı</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">Bu site yalnızca 18 yaş ve üzeri kişiler içindir. Anlayışın için teşekkürler.</p>
            <button onClick={() => setState('ask')} className="mt-6 text-sm text-slate-500 underline">Geri dön</button>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Oturum hatırlatıcısı: üyenin seçtiği aralıkla "ne kadar süredir oynuyorsun" uyarısı.
// ---------------------------------------------------------------------------
export function SessionReminder() {
  const [every, setEvery] = useState<number | null>(null);
  const [shown, setShown] = useState<number | null>(null);
  useEffect(() => {
    api<{ session_reminder_min: number | null }>('/api/account/responsible').then((r) => setEvery(r.data?.session_reminder_min ?? null));
  }, []);
  useEffect(() => {
    if (!every) return;
    let start = Date.now();
    try {
      const v = Number(sessionStorage.getItem('bb_session_start'));
      if (v && Date.now() - v < 12 * 3600_000) start = v;
      else sessionStorage.setItem('bb_session_start', String(start));
    } catch {
      /* yoksay */
    }
    let lastStep = Math.floor((Date.now() - start) / (every * 60_000));
    const t = setInterval(() => {
      const mins = Math.floor((Date.now() - start) / 60_000);
      const step = Math.floor(mins / every);
      if (step > lastStep) {
        lastStep = step;
        setShown(mins);
      }
    }, 20_000);
    return () => clearInterval(t);
  }, [every]);
  if (shown == null) return null;
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-ink-950/80 p-4 backdrop-blur" role="alertdialog" aria-modal="true">
      <div className="w-full max-w-sm animate-pop rounded-3xl border border-white/10 bg-ink-900 p-6 text-center">
        <AlarmClock size={36} className="mx-auto text-violet-300" />
        <p className="mt-4 text-lg font-black">{shown} dakikadır buradasın</p>
        <p className="mt-2 text-sm text-slate-400">Kısa bir mola vermek iyi gelebilir. Oyun geçmişine ve kredi işlemlerine her zaman hesabından bakabilirsin.</p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Link href="/hesap/sorumlu-oyun" onClick={() => setShown(null)} className="rounded-xl border border-white/10 py-2.5 text-sm font-semibold hover:bg-white/5">Mola ayarları</Link>
          <button onClick={() => setShown(null)} className="rounded-xl bg-violet-500 py-2.5 text-sm font-bold text-white">Devam et</button>
        </div>
      </div>
    </div>
  );
}
