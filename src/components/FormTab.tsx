import { BarChart3, TrendingUp } from 'lucide-react';
import { seasonLabel } from '@/config';
import { fmtDateShort, num0, num1 } from '@/lib/format';
import type { AnalysisResponse, Hat, TeamAnalysis } from '@/lib/types';
import EmptyState from './EmptyState';
import TeamLogo from './TeamLogo';

function StatBox({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl bg-ink-950/50 px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-0.5 text-sm font-bold tabular-nums ${accent ? 'text-accent-soft' : 'text-slate-100'}`}>
        {value}
      </p>
    </div>
  );
}

function SeasonStats({ side, data }: { side: 'home' | 'away'; data: AnalysisResponse }) {
  const t = data[side];
  const s = t.stats;
  if (!s) return <EmptyState icon={BarChart3} title="Veri şu anda mevcut değil">Sezon istatistikleri alınamadı.</EmptyState>;
  const h = (x: Hat<number | null>) => num1(x.total);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="label-muted">Sezon İstatistikleri</p>
        {s.season != null && s.season !== data.fixtureSeason && (
          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
            {seasonLabel(s.season)} sezonu
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatBox label="Oynanan" value={num0(s.played.total)} />
        <StatBox label="G / B / M" value={`${num0(s.wins.total)} / ${num0(s.draws.total)} / ${num0(s.losses.total)}`} accent />
        <StatBox label="Attığı gol ( maç ort.)" value={`${num0(s.goalsForTotal)} (${h(s.avgFor)})`} />
        <StatBox label="Yediği gol (maç ort.)" value={`${num0(s.goalsAgainstTotal)} (${h(s.avgAgainst)})`} />
        <StatBox label="Evde attığı / yediği (ort.)" value={`${num1(s.avgFor.home)} / ${num1(s.avgAgainst.home)}`} />
        <StatBox label="Depl. attığı / yediği (ort.)" value={`${num1(s.avgFor.away)} / ${num1(s.avgAgainst.away)}`} />
        <StatBox label="Kartopu (clean sheet)" value={num0(s.cleanSheets.total)} />
        <StatBox label="Gol atamadığı maç" value={num0(s.failedToScore.total)} />
        <StatBox label="En uzun galibiyet serisi" value={num0(s.biggestStreak.wins)} accent />
        <StatBox
          label="En farklı galibiyet"
          value={`${s.biggestWin.home ?? '—'} / ${s.biggestWin.away ?? '—'}`}
        />
        <StatBox
          label="En farklı mağlubiyet"
          value={`${s.biggestLoss.home ?? '—'} / ${s.biggestLoss.away ?? '—'}`}
        />
        <StatBox label="Tercih edilen diziliş" value={s.topFormation ?? '—'} />
      </div>
    </div>
  );
}

function TeamFormSection({ side, data }: { side: 'home' | 'away'; data: AnalysisResponse }) {
  const t: TeamAnalysis = data[side];
  const f = t.form;

  return (
    <div className="card animate-fade-in space-y-5 p-5">
      <div className="flex items-center gap-3">
        <TeamLogo logo={t.team.logo} name={t.team.name} size="lg" />
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold text-slate-100">{t.team.name}</h3>
          {f && f.season != null && f.season !== data.fixtureSeason && (
            <span className="text-[11px] font-medium text-amber-400">
              Form verisi: {seasonLabel(f.season)} sezonu (plandan daha yeni sezon erişilemiyor)
            </span>
          )}
        </div>
      </div>

      {/* Form rozetleri */}
      {f && f.matches.length > 0 ? (
        <>
          <div>
            <p className="label-muted mb-2">Son {f.matches.length} Maç</p>
            <div className="flex flex-wrap gap-1.5">
              {f.matches.map((m) => (
                <span
                  key={m.id}
                  title={`${fmtDateShort(m.date)} · ${m.league} · ${m.opponent.name} ${m.gf}-${m.ga}`}
                  className={`grid h-8 w-8 place-items-center rounded-lg text-xs font-bold ${
                    m.result === 'G'
                      ? 'bg-accent/20 text-accent-soft'
                      : m.result === 'B'
                        ? 'bg-slate-500/20 text-slate-300'
                        : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {m.result}
                </span>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-400">
              <span>
                G <b className="text-accent-soft">{f.counts.G}</b>
              </span>
              <span>
                B <b className="text-slate-300">{f.counts.B}</b>
              </span>
              <span>
                M <b className="text-red-400">{f.counts.M}</b>
              </span>
              <span>
                Maç başı gol: <b className="text-slate-200">{num1(f.avgFor)}</b>
              </span>
              <span>
                Maç başı yenen gol: <b className="text-slate-200">{num1(f.avgAgainst)}</b>
              </span>
              {f.formString && (
                <span className="font-mono tracking-wider text-slate-500">{f.formString}</span>
              )}
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {f.matches.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="w-16 shrink-0 text-xs tabular-nums text-slate-500">{fmtDateShort(m.date)}</span>
                <span className="min-w-0 flex-1 truncate text-slate-300">
                  vs {m.opponent.name}
                  <span className="ml-1.5 text-[10px] text-slate-600">{m.league}</span>
                </span>
                <span
                  className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-bold tabular-nums ${
                    m.result === 'G'
                      ? 'bg-accent/15 text-accent-soft'
                      : m.result === 'B'
                        ? 'bg-slate-500/15 text-slate-300'
                        : 'bg-red-500/15 text-red-400'
                  }`}
                >
                  {m.gf}–{m.ga}
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <EmptyState icon={TrendingUp} title="Veri şu anda mevcut değil">
          Bu takımın son maçı verisi alınamadı.
        </EmptyState>
      )}

      <SeasonStats side={side} data={data} />

      {/* Takım künyesi */}
      {t.profile && (
        <div>
          <p className="label-muted mb-2">Künye</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatBox label="Kuruluş" value={num0(t.profile.founded)} />
            <StatBox label="Ülke" value={t.profile.country ?? '—'} />
            <StatBox label="Şehir" value={t.profile.city ?? '—'} />
            <StatBox label="Stat" value={t.profile.venue ?? '—'} />
          </div>
        </div>
      )}

      {/* Kupa vitrini (öncelikli oyuncudan) */}
      {t.playerTrophies ? (
        <div>
          <p className="label-muted mb-2">Kupa Vitrini — {t.playerTrophies.player}</p>
          <div className="flex flex-wrap gap-1.5">
            {t.playerTrophies.trophies.map((tr, i) => (
              <span key={i} className="chip px-3 py-1 text-xs">
                {tr.season ?? ''} {tr.competition ?? ''}
                {tr.status ? ` · ${tr.status}` : ''}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-500">
          Takım kupa verisi bu planda API&apos;nin ilgili parametresiyle sunulmuyor; öncelikli oyuncunun kupa
          vitrini (varsa) yukarıda listelenir.
        </p>
      )}
    </div>
  );
}

function LeagueTable({ data }: { data: AnalysisResponse }) {
  if (!data.standings || data.standings.length === 0) return null;
  return (
    <div className="card animate-fade-in p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="label-muted">Lig Puan Durumu (ilk 10)</p>
        {data.standingsSeason != null && data.standingsSeason !== data.fixtureSeason && (
          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
            {seasonLabel(data.standingsSeason)} sezonu
          </span>
        )}
      </div>
      <div className="divide-y divide-white/5 text-sm">
        {data.standings.slice(0, 10).map((r) => {
          const hl = r.team.id === data.home.team.id || r.team.id === data.away.team.id;
          return (
            <div key={`${r.rank}-${r.team.id}`} className="flex items-center gap-3 py-2">
              <span className="w-5 shrink-0 text-right text-xs tabular-nums text-slate-500">{r.rank}</span>
              <img src={r.team.logo ?? undefined} alt="" loading="lazy" className="h-4 w-4 shrink-0 object-contain" />
              <span className={`min-w-0 flex-1 truncate ${hl ? 'font-bold text-accent-soft' : 'text-slate-300'}`}>
                {r.team.name}
              </span>
              <span className="hidden text-xs tabular-nums text-slate-500 sm:inline">
                {num0(r.played)} O · {num0(r.gf)}-{num0(r.ga)}
              </span>
              <span className="w-8 shrink-0 text-right font-bold tabular-nums text-slate-200">{num0(r.points)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function FormTab({ data }: { data: AnalysisResponse }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <TeamFormSection side="home" data={data} />
        <TeamFormSection side="away" data={data} />
      </div>
      <LeagueTable data={data} />
    </div>
  );
}
