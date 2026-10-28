'use client';
import Countdown from './Countdown';
import { ChevronDown, ChevronUp } from 'lucide-react';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api, pct } from '@/lib/client';
import type { LightFixture } from '@/lib/types';
import { useAuth } from './AuthProvider';
import { Button } from './ui';

interface Mine { home_goals: number; away_goals: number; status: string; points: number | null; actual_home: number | null; actual_away: number | null }
interface Community { total: number; home: number; draw: number; away: number; top: { home_goals: number; away_goals: number; n: number }[] }

function Stepper({ value, onChange, disabled }: { value: number; onChange: (n: number) => void; disabled: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button type="button" disabled={disabled || value >= 15} onClick={() => onChange(value + 1)} className="h-7 w-10 rounded-lg bg-ink-700 text-slate-300 hover:bg-ink-600 disabled:opacity-30" aria-label="Artır"><ChevronUp size={16} className="mx-auto" /></button>
      <span className="w-12 text-center text-4xl font-black tabular-nums">{value}</span>
      <button type="button" disabled={disabled || value <= 0} onClick={() => onChange(value - 1)} className="h-7 w-10 rounded-lg bg-ink-700 text-slate-300 hover:bg-ink-600 disabled:opacity-30" aria-label="Azalt"><ChevronDown size={16} className="mx-auto" /></button>
    </div>
  );
}

export default function UserPredictionBox({ fixture }: { fixture: LightFixture }) {
  const { user, toast, enabled } = useAuth();
  const [mine, setMine] = useState<Mine | null>(null);
  const [com, setCom] = useState<Community | null>(null);
  const [h, setH] = useState(1);
  const [a, setA] = useState(1);
  const [busy, setBusy] = useState(false);
  const started = fixture.status.short !== 'NS' && fixture.status.short !== 'TBD' || new Date(fixture.date).getTime() <= Date.now();

  const load = useCallback(async () => {
    const { data } = await api<{ mine: Mine | null; community: Community }>(`/api/predictions?fixture=${fixture.id}`);
    if (!data) return;
    setMine(data.mine);
    setCom(data.community);
    if (data.mine) {
      setH(data.mine.home_goals);
      setA(data.mine.away_goals);
    }
  }, [fixture.id]);
  useEffect(() => {
    if (enabled) load();
  }, [enabled, load, user]);

  if (!enabled) return null;

  const save = async () => {
    setBusy(true);
    const { error } = await api('/api/predictions', { body: { fixtureId: fixture.id, home: h, away: a } });
    setBusy(false);
    if (error) return toast(error, 'error');
    toast(mine ? 'Tahminin güncellendi.' : 'Tahminin kaydedildi! Maç bitince puanın hesaplanacak.');
    load();
  };

  const total = com?.total ?? 0;
  return (
    <div className="card grid gap-5 p-5 md:grid-cols-[1fr_1fr]">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="label-muted">Senin tahminin</p>
          {!started && <Countdown to={fixture.date} label="Tahminler kapanıyor:" />}
        </div>
        {!user ? (
          <div className="mt-3 text-sm text-slate-400">
            Skor tahmini yapıp liderlik tablosunda yarışmak için{' '}
            <Link href={`/giris?next=/mac/${fixture.id}`} className="text-accent-soft underline">giriş yap</Link>.
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-4">
            <span className="w-20 truncate text-right text-sm font-semibold">{fixture.home?.name}</span>
            <Stepper value={h} onChange={setH} disabled={started} />
            <span className="text-2xl text-slate-600">–</span>
            <Stepper value={a} onChange={setA} disabled={started} />
            <span className="w-20 truncate text-sm font-semibold">{fixture.away?.name}</span>
          </div>
        )}
        {user && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {started ? (
              mine ? (
                mine.status === 'scored' ? (
                  <span className="text-sm">
                    Sonuç {mine.actual_home}–{mine.actual_away} ·{' '}
                    <b className={mine.points ? 'text-accent-soft' : 'text-slate-400'}>{mine.points} puan</b>
                  </span>
                ) : (
                  <span className="text-sm text-slate-400">Tahminin kilitlendi; maç bitince puanlanacak.</span>
                )
              ) : (
                <span className="text-sm text-slate-400">Maç başladı; tahminler kapandı.</span>
              )
            ) : (
              <>
                <Button onClick={save} loading={busy} size="sm">{mine ? 'Tahmini güncelle' : 'Tahmini kaydet'}</Button>
                <span className="text-xs text-slate-500">Tam skor 3 · doğru sonuç 1 puan</span>
              </>
            )}
          </div>
        )}
      </div>
      <div className="border-t border-white/5 pt-4 md:border-l md:border-t-0 md:pl-5 md:pt-0">
        <p className="label-muted">Topluluk tahmini {total > 0 && <span className="normal-case tracking-normal text-slate-500">· {total} kişi</span>}</p>
        {total === 0 ? (
          <p className="mt-3 text-sm text-slate-400">Henüz kimse tahmin yapmadı. İlk sen ol!</p>
        ) : (
          <>
            <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-ink-950/70">
              <div className="bg-accent" style={{ width: `${(com!.home / total) * 100}%` }} />
              <div className="bg-slate-500" style={{ width: `${(com!.draw / total) * 100}%` }} />
              <div className="bg-sky-500" style={{ width: `${(com!.away / total) * 100}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-xs text-slate-400">
              <span>1 · {pct(com!.home / total)}</span>
              <span>X · {pct(com!.draw / total)}</span>
              <span>2 · {pct(com!.away / total)}</span>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              En çok tahmin edilen: {com!.top.map((t) => `${t.home_goals}–${t.away_goals} (${t.n})`).join(' · ')}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
