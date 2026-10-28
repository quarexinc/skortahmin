'use client';

import { useState } from 'react';
import { seasonLabel } from '@/config';
import { num0, num1, pct1 } from '@/lib/format';
import type { AnalysisResponse, ModelResult } from '@/lib/types';
import Alert from './Alert';
import { useAuth } from './AuthProvider';
import PickButton from './PickButton';
import PremiumLock from './PremiumLock';
import ProgressBar from './ProgressBar';

const w = (x: number) => `${(x * 100).toFixed(2)}%`;

export default function PredictionPanel({ data }: { data: AnalysisResponse }) {
  const m = data.model;
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const f = data.fixture;

  if (!m.ok) {
    return (
      <Alert variant="warn" title="Tahmin şu anda mevcut değil">
        {m.reason} Gerçek istatistikler diğer sekmelerde görüntülenebilir.
      </Alert>
    );
  }
  const best = m.bestScore;

  return (
    <div className="space-y-4">
      {/* Büyük skor kartı */}
      <div className="card animate-fade-in p-6 text-center">
        <p className="label-muted">Modelin en olası skoru</p>
        <p className="my-3 text-6xl font-black tabular-nums tracking-tight text-white">
          {best?.home}
          <span className="mx-3 text-slate-600">–</span>
          {best?.away}
        </p>
        <p className="text-sm text-slate-400">
          Bu skorun tutma olasılığı:{' '}
          <span className="text-base font-bold text-accent-soft">{best ? pct1(best.prob) : '—'}</span>
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs">
          <span className="rounded-full bg-ink-950/70 px-3 py-1.5 text-slate-300">
            Ev sahibi λ: <b className="tabular-nums text-accent-soft">{num1(m.lambdaHome)}</b>
          </span>
          <span className="rounded-full bg-ink-950/70 px-3 py-1.5 text-slate-300">
            Deplasman λ: <b className="tabular-nums text-sky-400">{num1(m.lambdaAway)}</b>
          </span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 1X2 */}
        <div className="card animate-fade-in p-5">
          <p className="label-muted mb-3">Maç Sonucu (1X2)</p>
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-ink-950/70">
            <div className="bg-accent" style={{ width: w(m.oneXTwo!.home) }} />
            <div className="bg-slate-500" style={{ width: w(m.oneXTwo!.draw) }} />
            <div className="bg-sky-500" style={{ width: w(m.oneXTwo!.away) }} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[11px] text-slate-500">1 · Ev Sahibi</p>
              <p className="text-sm font-bold tabular-nums text-accent-soft">{pct1(m.oneXTwo!.home)}</p>
              <PickButton fixture={f} market="1X2" selection="1" prob={m.oneXTwo!.home} />
            </div>
            <div>
              <p className="text-[11px] text-slate-500">X · Beraberlik</p>
              <p className="text-sm font-bold tabular-nums text-slate-300">{pct1(m.oneXTwo!.draw)}</p>
              <PickButton fixture={f} market="1X2" selection="X" prob={m.oneXTwo!.draw} />
            </div>
            <div>
              <p className="text-[11px] text-slate-500">2 · Deplasman</p>
              <p className="text-sm font-bold tabular-nums text-sky-400">{pct1(m.oneXTwo!.away)}</p>
              <PickButton fixture={f} market="1X2" selection="2" prob={m.oneXTwo!.away} />
            </div>
          </div>
        </div>

        {data.locked ? (
          <PremiumLock loggedIn={!!user} />
        ) : (
          <div className="card animate-fade-in p-5">
            <p className="label-muted mb-3">Karşılıklı Gol (KG)</p>
            <div className="space-y-4">
              <div>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-300">KG Var <PickButton fixture={f} market="KG" selection="KG Var" prob={m.btts!.yes} /></span>
                  <span className="font-bold tabular-nums text-accent-soft">{pct1(m.btts!.yes)}</span>
                </div>
                <ProgressBar percent={m.btts!.yes * 100} barClassName="bg-accent" />
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-300">KG Yok <PickButton fixture={f} market="KG" selection="KG Yok" prob={m.btts!.no} /></span>
                  <span className="font-bold tabular-nums text-slate-300">{pct1(m.btts!.no)}</span>
                </div>
                <ProgressBar percent={m.btts!.no * 100} barClassName="bg-slate-500" />
              </div>
            </div>
          </div>
        )}
      </div>

      {!data.locked && (
        <>
      {/* Toplam gol */}
      <div className="card animate-fade-in p-5">
        <p className="label-muted mb-3">Toplam Gol</p>
        <div className="space-y-4">
          {[
            { label: '1,5', o: m.totals!.over15, u: m.totals!.under15 },
            { label: '2,5', o: m.totals!.over25, u: m.totals!.under25 },
            { label: '3,5', o: m.totals!.over35, u: m.totals!.under35 },
          ].map((r) => (
            <div key={r.label}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-semibold text-slate-200">
                  {r.label} Gol
                  <PickButton fixture={f} market={`Alt/Üst ${r.label}`} selection={`${r.label} Alt`} prob={r.u} />
                  <PickButton fixture={f} market={`Alt/Üst ${r.label}`} selection={`${r.label} Üst`} prob={r.o} />
                </span>
                <span className="text-xs tabular-nums text-slate-400">
                  Alt <b className="text-sky-400">{pct1(r.u)}</b> · Üst <b className="text-accent-soft">{pct1(r.o)}</b>
                </span>
              </div>
              <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-ink-950/70">
                <div className="bg-sky-500" style={{ width: w(r.u) }} />
                <div className="bg-accent" style={{ width: w(r.o) }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* En olası 5 skor */}
      <div className="card animate-fade-in p-5">
        <p className="label-muted mb-3">En Olası 5 Skor</p>
        <div className="space-y-2.5">
          {m.topScores.map((s) => (
            <div key={`${s.home}-${s.away}`} className="flex items-center gap-3">
              <span className="w-12 text-center text-sm font-bold tabular-nums text-slate-100">
                {s.home}–{s.away}
              </span>
              <div className="flex-1">
                <ProgressBar percent={s.prob * 100} barClassName="bg-accent/70" height="h-2" />
              </div>
              <span className="w-14 text-right text-sm font-semibold tabular-nums text-accent-soft">
                {pct1(s.prob)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Nasıl hesaplandı? */}
      <div className="card animate-fade-in overflow-hidden">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-3 p-5 text-left"
          aria-expanded={open}
        >
          <span className="font-semibold text-slate-200">Bu tahmin nasıl hesaplandı?</span>
          <span className={`text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
        </button>
        {open && <HowCalculated data={data} />}
      </div>

      {/* API tahmini karşılaştırması */}
      {data.apiPrediction ? (
        <div className="card animate-fade-in p-5">
          <p className="label-muted mb-3">API-Football Tahmini (karşılaştırma)</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="pb-2">Sonuç</th>
                  <th className="pb-2">Modelimiz</th>
                  <th className="pb-2">API-Football</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr>
                  <td className="py-2 text-slate-300">Ev Sahibi (1)</td>
                  <td className="py-2 font-bold tabular-nums text-accent-soft">{pct1(m.oneXTwo!.home)}</td>
                  <td className="py-2 tabular-nums text-slate-300">{pct1(data.apiPrediction.percentHome)}</td>
                </tr>
                <tr>
                  <td className="py-2 text-slate-300">Beraberlik (X)</td>
                  <td className="py-2 font-bold tabular-nums text-slate-300">{pct1(m.oneXTwo!.draw)}</td>
                  <td className="py-2 tabular-nums text-slate-300">{pct1(data.apiPrediction.percentDraw)}</td>
                </tr>
                <tr>
                  <td className="py-2 text-slate-300">Deplasman (2)</td>
                  <td className="py-2 font-bold tabular-nums text-sky-400">{pct1(m.oneXTwo!.away)}</td>
                  <td className="py-2 tabular-nums text-slate-300">{pct1(data.apiPrediction.percentAway)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          {data.apiPrediction.winnerName && (
            <p className="mt-3 text-xs text-slate-500">
              API önerisi: {data.apiPrediction.winnerName}
              {data.apiPrediction.underOver ? ` · ${data.apiPrediction.underOver}` : ''}
            </p>
          )}
        </div>
      ) : (
        <div className="card animate-fade-in p-5 text-sm text-slate-400">
          API tahmini bu planda mevcut değil.
        </div>
      )}

        </>
      )}

      <p className="px-1 text-[11px] leading-relaxed text-slate-500">
        Tahminler gerçek istatistiklerden hesaplanan matematiksel olasılıklardır; garanti sonuç değildir.
      </p>
    </div>
  );
}

function HowCalculated({ data }: { data: AnalysisResponse }) {
  const m: ModelResult = data.model;
  const i = m.inputs.season;
  return (
    <div className="space-y-3 border-t border-white/10 p-5 text-[13px] leading-relaxed text-slate-300">
      <p>
        <b className="text-slate-100">1) Girdiler — API-Football gerçek verisi</b>
        {i && <span className="text-slate-500"> (sezon: {seasonLabel(i && (data.home.statsSeason ?? data.fixtureSeason))})</span>}
      </p>
      <ul className="grid gap-1.5 sm:grid-cols-2">
        <li>
          AFH — {data.home.team.name} evde maç başı attığı gol: <b className="tabular-nums text-slate-100">{num1(i?.afh)}</b>
        </li>
        <li>
          DAH — {data.home.team.name} evde maç başı yediği gol: <b className="tabular-nums text-slate-100">{num1(i?.dah)}</b>
        </li>
        <li>
          AFA — {data.away.team.name} deplasmanda attığı gol: <b className="tabular-nums text-slate-100">{num1(i?.afa)}</b>
        </li>
        <li>
          DAA — {data.away.team.name} deplasmanda yediği gol: <b className="tabular-nums text-slate-100">{num1(i?.daa)}</b>
        </li>
        <li>
          μ_home — lig ev sahibi maç başı gol ort: <b className="tabular-nums text-slate-100">{num1(i?.muHome)}</b>
        </li>
        <li>
          μ_away — lig deplasman maç başı gol ort: <b className="tabular-nums text-slate-100">{num1(i?.muAway)}</b>
        </li>
        <li>
          Oynanan maç — {data.home.team.name} evde / {data.away.team.name} deplasmanda:{' '}
          <b className="tabular-nums text-slate-100">
            {num0(i?.playedHome)} / {num0(i?.playedAway)}
          </b>
        </li>
      </ul>
      <p>
        <b className="text-slate-100">2) Beklenen goller (sezon):</b>{' '}
        {m.partLambdas.season ? (
          <>
            λ_home = (AFH × DAA) / μ_home = <b className="tabular-nums text-accent-soft">{num1(m.partLambdas.season.home)}</b>{' '}
            · λ_away = (AFA × DAH) / μ_away = <b className="tabular-nums text-sky-400">{num1(m.partLambdas.season.away)}</b>
          </>
        ) : (
          <>
            kullanılamadı{' '}
            <span className="text-slate-500">
              ({num0(i?.playedHome) === '0' || num0(i?.playedAway) === '0'
                ? 'takımlardan biri bu yarışmada oynanmış maça sahip değil — 0 maç veri olarak değerlendirilmez, ağırlık 0’a çekildi'
                : 'sezon verisi eksik, ağırlık 0’a çekildi'})
            </span>
          </>
        )}
      </p>
      <p>
        <b className="text-slate-100">3) Form (son 10 maç):</b>{' '}
        {m.partLambdas.form ? (
          <>
            λ_home = <b className="tabular-nums text-accent-soft">{num1(m.partLambdas.form.home)}</b> · λ_away ={' '}
            <b className="tabular-nums text-sky-400">{num1(m.partLambdas.form.away)}</b>
          </>
        ) : (
          'kullanılamadı — ağırlığı 0’a çekildi'
        )}
      </p>
      <p>
        <b className="text-slate-100">4) H2H (son {m.inputs.h2h?.matches ?? 0} maç):</b>{' '}
        {m.partLambdas.h2h ? (
          <>
            λ_home = <b className="tabular-nums text-accent-soft">{num1(m.partLambdas.h2h.home)}</b> · λ_away ={' '}
            <b className="tabular-nums text-sky-400">{num1(m.partLambdas.h2h.away)}</b>
          </>
        ) : (
          'veri yok — ağırlığı 0’a çekildi'
        )}
      </p>
      <p>
        <b className="text-slate-100">5) Ağırlıklar (normalize edilmiş):</b> Sezon{' '}
        <b className="tabular-nums text-slate-100">{pct1(m.weights?.season)}</b> · Form{' '}
        <b className="tabular-nums text-slate-100">{pct1(m.weights?.form)}</b> · H2H{' '}
        <b className="tabular-nums text-slate-100">{pct1(m.weights?.h2h)}</b>
      </p>
      <p>
        <b className="text-slate-100">6) Skor matrisi:</b> P(i,j) = Poisson(i; λ_home) × Poisson(j; λ_away), i,j = 0…
        {m.matrixMax} (λ &gt; 4 ise 8’e genişler); matris toplamı 1’e normalize edilir. λ_home ={' '}
        <b className="tabular-nums text-accent-soft">{num1(m.lambdaHome)}</b>, λ_away ={' '}
        <b className="tabular-nums text-sky-400">{num1(m.lambdaAway)}</b>. 1X2, KG, Alt/Üst ve tam skor olasılıkları
        bu matristen türetilir.
      </p>
      {data.seasonFallback && (
        <p className="text-amber-300/90">
          Not: Mevcut sezonun sezon verileri plan kısıtı nedeniyle {seasonLabel(data.dataSeason)} sezonundaki son
          gerçek verilerle hesaplanmıştır.
        </p>
      )}
    </div>
  );
}
