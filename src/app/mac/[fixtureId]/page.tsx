'use client';

// ---------------------------------------------------------------------------
// Maç Analiz Sayfası — /mac/[fixtureId]
// Tüm veri /api/match/{id}/analysis'ten gelir; model hesabı frontend'de YAPILMAZ.
// ---------------------------------------------------------------------------
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Alert from '@/components/Alert';
import FormTab from '@/components/FormTab';
import H2HSection from '@/components/H2HSection';
import MatchHeader from '@/components/MatchHeader';
import PlayersSection from '@/components/PlayersSection';
import PredictionPanel from '@/components/PredictionPanel';
import Skeleton from '@/components/Skeleton';
import Tabs from '@/components/Tabs';
import { trApiError } from '@/lib/format';
import type { AnalysisResponse, ExtrasResponse } from '@/lib/types';

type TabId = 'genel' | 'form' | 'h2h' | 'oyuncular';

const TABS: { id: TabId; label: string }[] = [
  { id: 'genel', label: 'Genel Özet & Tahmin' },
  { id: 'form', label: 'Form & Kariyer' },
  { id: 'h2h', label: 'Karşılıklı Maçlar' },
  { id: 'oyuncular', label: 'Oyuncular' },
];

function MatchSkeleton() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <Skeleton className="mb-6 h-5 w-28" />
      <Skeleton className="h-48 w-full" />
      <div className="mt-6 flex gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-32" />
        ))}
      </div>
      <div className="mt-6 space-y-4">
        <Skeleton className="h-60 w-full" />
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-44 w-full" />
      </div>
    </main>
  );
}

export default function MacPage() {
  const { fixtureId } = useParams<{ fixtureId: string }>();
  const [data, setData] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>('genel');

  const [slow, setSlow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    setSlow(false);
    setTab('genel');
    const slowTimer = setTimeout(() => !cancelled && setSlow(true), 6000);

    const loadExtras = (attempt = 0) => {
      fetch(`/api/match/${fixtureId}/extras`)
        .then(async (r) => {
          const j = (await r.json().catch(() => null)) as (ExtrasResponse & { error?: string }) | null;
          if (cancelled) return;
          if (!r.ok || !j || j.error) {
            if (attempt < 1) return void setTimeout(() => !cancelled && loadExtras(attempt + 1), 3000);
            setData((d) => (d ? { ...d, extrasPending: false } : d));
            return;
          }
          setData((d) =>
            d
              ? {
                  ...d,
                  extrasPending: false,
                  home: { ...d.home, ...j.home },
                  away: { ...d.away, ...j.away },
                  topScorers: j.topScorers,
                  topScorersSeason: j.topScorersSeason,
                  warnings: [...d.warnings, ...j.warnings.filter((w) => !d.warnings.includes(w))],
                }
              : d,
          );
        })
        .catch(() => {
          if (!cancelled) setData((d) => (d ? { ...d, extrasPending: false } : d));
        });
    };

    fetch(`/api/match/${fixtureId}/analysis`)
      .then(async (r) => {
        const j = await r.json().catch(() => null);
        if (cancelled) return;
        if (!r.ok || !j || j.error) setError(j?.error ?? 'Analiz verisi alınamadı.');
        else {
          setData(j);
          if (j.extrasPending) loadExtras();
        }
      })
      .catch(() => {
        if (!cancelled) setError('Sunucuya ulaşılamadı. Tekrar deneyin.');
      })
      .finally(() => clearTimeout(slowTimer));
    return () => {
      cancelled = true;
      clearTimeout(slowTimer);
    };
  }, [fixtureId]);

  if (error) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12">
        <Alert variant="error" title="Analiz alınamadı">
          {error}
        </Alert>
        <Link href="/" className="mt-4 inline-block text-sm text-accent-soft hover:underline">
          ← Maç listesine dön
        </Link>
      </main>
    );
  }

  if (!data)
    return (
      <>
        {slow && (
          <div className="mx-auto max-w-5xl px-4 pt-6">
            <Alert variant="info" title="Analiz hazırlanıyor">
              Bu maç ilk kez açılıyor; veriler API-Football&apos;dan çekiliyor (ücretsiz plan dakikada 10 istekle sınırlı).
              Birkaç saniye sürebilir — sonraki açılışlar anında gelir.
            </Alert>
          </div>
        )}
        <MatchSkeleton />
      </>
    );

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <Link href="/" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-white">
        ← Maç listesi
      </Link>

      <MatchHeader data={data} />

      {data.warnings.length > 0 && (
        <div className="mt-4 space-y-2">
          {data.warnings.map((warn, i) => (
            <Alert key={i} variant="info">
              {trApiError(warn)}
            </Alert>
          ))}
        </div>
      )}

      <div className="mt-6">
        <Tabs tabs={TABS} value={tab} onChange={setTab} />
      </div>

      <div className="mt-5">
        {tab === 'genel' && <PredictionPanel data={data} />}
        {tab === 'form' && <FormTab data={data} />}
        {tab === 'h2h' && <H2HSection data={data} />}
        {tab === 'oyuncular' && <PlayersSection data={data} />}
      </div>

      <footer className="mt-10 border-t border-white/5 pt-5 text-center text-[11px] leading-relaxed text-slate-600">
        Veri kaynağı: API-Football v3 · Tüm sayılar çalışma anında API&apos;dendir
        <br />
        Tahminler gerçek istatistiklerden hesaplanan matematiksel olasılıklardır; garanti sonuç değildir.
      </footer>
    </main>
  );
}
