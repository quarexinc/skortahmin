import { GitCompareArrows } from 'lucide-react';
import { fmtDateShort, num1, pct1 } from '@/lib/format';
import type { AnalysisResponse } from '@/lib/types';
import EmptyState from './EmptyState';
import TeamLogo from './TeamLogo';

function H2HStat({ label, value, sub, tone }: { label: string; value: number; sub: string; tone: 'accent' | 'slate' | 'sky' }) {
  const toneCls =
    tone === 'accent' ? 'text-accent-soft' : tone === 'sky' ? 'text-sky-400' : 'text-slate-300';
  return (
    <div className="card p-4 text-center">
      <p className="truncate text-[11px] text-slate-500" title={label}>
        {label}
      </p>
      <p className={`mt-1 text-3xl font-black tabular-nums ${toneCls}`}>{value}</p>
      <p className="mt-0.5 text-xs tabular-nums text-slate-500">{sub}</p>
    </div>
  );
}

export default function H2HSection({ data }: { data: AnalysisResponse }) {
  const h = data.h2h;

  if (h.total === 0) {
    return (
      <EmptyState icon={GitCompareArrows} title="Bu iki takımın kayıtlarda geçmiş karşılaşması bulunamadı">
        Tahmin modelinde H2H ağırlığı otomatik olarak 0&apos;a çekilir.
      </EmptyState>
    );
  }

  const pctOf = (x: number) => (h.total > 0 ? (x / h.total) * 100 : 0);
  const homeId = data.home.team.id;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2.5">
        <H2HStat label={`${data.home.team.name} galibiyeti`} value={h.homeWins} sub={pct1(pctOf(h.homeWins))} tone="accent" />
        <H2HStat label="Beraberlik" value={h.draws} sub={pct1(pctOf(h.draws))} tone="slate" />
        <H2HStat label={`${data.away.team.name} galibiyeti`} value={h.awayWins} sub={pct1(pctOf(h.awayWins))} tone="sky" />
      </div>

      <div className="card flex flex-wrap gap-x-6 gap-y-1.5 p-4 text-sm text-slate-400">
        <span>
          Toplam karşılaşma (son 10): <b className="text-slate-200">{h.total}</b>
        </span>
        <span>
          Maç başı gol: <b className="text-slate-200">{num1(h.goalsPerMatch)}</b>
        </span>
        <span>
          Karşılıklı gol: <b className="text-slate-200">{h.bttsCount} maç</b>
        </span>
      </div>

      <div className="card divide-y divide-white/5 p-2">
        {h.matches.map((m) => {
          // Kazanan vurgusu: mevcut fikstürün ev sahibi / deplasman takımına göre
          const fixtureHomeWon = m.outcomeForFixtureHome === 'home';
          const fixtureAwayWon = m.outcomeForFixtureHome === 'away';
          const homeIsFixtureHome = m.home.id === homeId;
          const homeBold = homeIsFixtureHome ? fixtureHomeWon : fixtureAwayWon;
          const awayBold = !homeIsFixtureHome ? fixtureHomeWon : fixtureAwayWon;
          return (
            <div key={m.id} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 p-2.5 text-sm">
              <span className="flex min-w-0 items-center justify-end gap-2 text-right">
                <span className={`min-w-0 truncate ${homeBold ? 'font-bold text-white' : 'text-slate-300'}`}>
                  {m.home.name}
                </span>
                <TeamLogo logo={m.home.logo} name={m.home.name} size="sm" />
              </span>
              <span className="min-w-[76px] rounded-lg bg-ink-950/70 px-2.5 py-1 text-center text-xs font-bold tabular-nums text-slate-100">
                <span className="block text-[10px] font-medium text-slate-500">{fmtDateShort(m.date)}</span>
                {m.gf} : {m.ga}
              </span>
              <span className="flex min-w-0 items-center gap-2">
                <TeamLogo logo={m.away.logo} name={m.away.name} size="sm" />
                <span className={`min-w-0 truncate ${awayBold ? 'font-bold text-white' : 'text-slate-300'}`}>
                  {m.away.name}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
