'use client';

// ---------------------------------------------------------------------------
// Ana Sayfa — bugünden itibaren 10 günün maçları (gerçek API verisi).
// ---------------------------------------------------------------------------
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Alert from '@/components/Alert';
import DateStrip from '@/components/DateStrip';
import FixtureCard from '@/components/FixtureCard';
import LeagueFilter from '@/components/LeagueFilter';
import SearchBox from '@/components/SearchBox';
import Skeleton from '@/components/Skeleton';
import { currentSeason, DAYS_AHEAD, istDateKey, seasonLabel } from '@/config';
import { fmtDayLong, fmtDateShort, fmtWeekday, trApiError } from '@/lib/format';
import type { LightFixture } from '@/lib/types';

interface DayState {
  loading: boolean;
  error: string | null;
  fixtures: LightFixture[] | null;
}

function buildDates(): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    keys.push(istDateKey(d));
  }
  return keys;
}

export default function HomePage() {
  const [dates] = useState<string[]>(buildDates);
  const [days, setDays] = useState<Record<string, DayState>>({});
  const [selected, setSelected] = useState<string>(dates[0]);
  const [league, setLeague] = useState<number>(0);
  const [query, setQuery] = useState('');

  const loadDay = useCallback((key: string) => {
    setDays((d) => ({ ...d, [key]: { loading: true, error: null, fixtures: d[key]?.fixtures ?? null } }));
    fetch(`/api/fixtures?date=${key}`)
      .then((r) => r.json().then((j) => ({ r, j })))
      .then(({ r, j }) => {
        setDays((d) => ({
          ...d,
          [key]:
            j.error || !r.ok
              ? { loading: false, error: j.error ?? 'Beklenmeyen hata.', fixtures: null }
              : { loading: false, error: null, fixtures: Array.isArray(j.fixtures) ? j.fixtures : [] },
        }));
      })
      .catch(() => {
        setDays((d) => ({ ...d, [key]: { loading: false, error: 'Sunucuya ulaşılamadı. Tekrar deneyin.', fixtures: null } }));
      });
  }, []);

  // Yalnızca bugün ve yarın baştan yüklenir; diğer günler seçilince yüklenir.
  // (API-Football ücretsiz planı dakikada 10 istekle sınırlı; 10 günü birden
  // istemek kuyruğu tıkayıp maç analizlerini yavaşlatıyordu.)
  useEffect(() => {
    loadDay(dates[0]);
    const t = setTimeout(() => loadDay(dates[1]), 400);
    return () => clearTimeout(t);
  }, [dates, loadDay]);

  const selectDay = useCallback(
    (key: string) => {
      setSelected(key);
      if (!days[key]) loadDay(key);
    },
    [days, loadDay],
  );

  const dayMeta = useMemo(
    () =>
      dates.map((key, i) => {
        const st = days[key];
        return {
          key,
          label: fmtWeekday(`${key}T12:00:00`),
          sub: fmtDateShort(`${key}T12:00:00`),
          isToday: i === 0,
          count: st?.fixtures?.length ?? null,
          loading: !!st?.loading,
          error: !!st?.error,
          selected: key === selected,
        };
      }),
    [dates, days, selected],
  );

  const day = days[selected];
  const visible = useMemo(() => {
    const list = day?.fixtures ?? [];
    const q = query.trim().toLocaleLowerCase('tr-TR');
    return list
      .filter((f) => {
        if (league !== 0 && f.league?.id !== league) return false;
        if (q) {
          const hn = (f.home?.name ?? '').toLocaleLowerCase('tr-TR');
          const an = (f.away?.name ?? '').toLocaleLowerCase('tr-TR');
          if (!hn.includes(q) && !an.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [day?.fixtures, league, query]);

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-white/5 bg-ink-950/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-accent/15 text-lg">⚽</span>
            <span>
              <span className="block text-base font-black leading-tight tracking-tight">
                Skor <span className="text-accent-soft">Çıkartıcı</span>
              </span>
              <span className="block text-[10px] leading-tight text-slate-500">
                Gerçek verilerle analiz · Poisson tahmini
              </span>
            </span>
          </Link>
          <span className="hidden items-center gap-1.5 rounded-full bg-ink-800 px-3 py-1 text-[11px] text-slate-400 sm:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            API-Football canlı veri
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-16 pt-5">
        <DateStrip days={dayMeta} onSelect={selectDay} />

        <div className="mt-4 space-y-3">
          <LeagueFilter value={league} onChange={setLeague} />
          <SearchBox value={query} onChange={setQuery} />
        </div>

        <div className="mt-5 mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-lg font-bold text-slate-100">{fmtDayLong(`${selected}T12:00:00`)}</h1>
          <span className="text-sm text-slate-500">
            {!day || day.loading ? 'yükleniyor…' : visible.length > 0 ? `${visible.length} maç` : ''}
          </span>
        </div>

        {!day || day.loading ? (
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : day?.error ? (
          <Alert variant="error" title="Maçlar şu anda mevcut değil" action={
            <button
              onClick={() => loadDay(selected)}
              className="mt-2 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/30"
            >
              Tekrar dene
            </button>
          }>
            {trApiError(day.error)}
          </Alert>
        ) : visible.length === 0 ? (
          <Alert variant="info" title="Maç bulunamadı">
            Bu gün için seçilen liglerde ve aramada maç yok. Başka bir gün, lig veya arama deneyin.
          </Alert>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {visible.map((f) => (
              <FixtureCard key={f.id} f={f} />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-white/5 py-6 text-center text-[11px] leading-relaxed text-slate-600">
        Veri kaynağı: API-Football v3 · Tüm sayılar çalışma anında API&apos;dendir · Mevcut sezon: {seasonLabel(currentSeason())}
        <br />
        Tahminler gerçek istatistiklerden hesaplanan matematiksel olasılıklardır; garanti sonuç değildir.
      </footer>
    </>
  );
}
