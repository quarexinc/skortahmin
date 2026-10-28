import { seasonLabel } from '@/config';
import type { AnalysisResponse } from '@/lib/types';
import Alert from './Alert';
import TeamLogo from './TeamLogo';

const TR_POSITION: Record<string, string> = {
  Goalkeeper: 'Kaleci',
  Forward: 'Forvet',
  Midfielder: 'Orta Saha',
  Defender: 'Defans',
  'Left Defender': 'Sol Defans',
  'Right Defender': 'Sağ Defans',
  'Center Defender': 'Merkez Defans',
  'Left Midfielder': 'Sol Orta Saha',
  'Right Midfielder': 'Sağ Orta Saha',
  'Center Midfielder': 'Merkez Orta Saha',
};

function posTr(p: string | null): string | null {
  if (!p) return null;
  return TR_POSITION[p] ?? p;
}

function TeamPlayers({ side, data }: { side: 'home' | 'away'; data: AnalysisResponse }) {
  const t = data[side];
  const scorers = (data.topScorers ?? []).filter((r) => r.team.id === t.team.id);

  return (
    <div className="card animate-fade-in space-y-5 p-5">
      <div className="flex items-center gap-3">
        <TeamLogo logo={t.team.logo} name={t.team.name} size="lg" />
        <h3 className="truncate text-lg font-bold text-slate-100">{t.team.name}</h3>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="label-muted">Lig Gol Krallığında</p>
          {data.topScorersSeason != null && data.topScorersSeason !== data.fixtureSeason && (
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
              {seasonLabel(data.topScorersSeason)} sezonu
            </span>
          )}
        </div>
        {scorers.length > 0 ? (
          <div className="divide-y divide-white/5">
            {scorers.map((p) => (
              <div key={p.playerId} className="flex items-center gap-3 py-2.5 text-sm">
                <img src={p.photo ?? undefined} alt="" loading="lazy" className="h-8 w-8 rounded-full object-cover bg-ink-700" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-100">{p.name}</p>
                  <p className="text-xs text-slate-500">
                    {posTr(p.position) ?? ''}
                    {p.appearances != null ? ` · ${p.appearances} maç` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold tabular-nums text-accent-soft">{p.goals ?? 0} gol</p>
                  <p className="text-xs tabular-nums text-slate-500">{p.assists ?? 0} asist</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Bu ligde gol krallığında temsilcisi bulunmuyor.</p>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="label-muted">Kadro Öne Çıkanları</p>
          {t.squadSeason != null && t.squadSeason !== data.fixtureSeason && (
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
              {seasonLabel(t.squadSeason)} sezonu
            </span>
          )}
        </div>
        {t.squad && t.squad.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[380px] text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="pb-2">Oyuncu</th>
                  <th className="pb-2">Poz.</th>
                  <th className="pb-2 text-right">Maç</th>
                  <th className="pb-2 text-right">Gol</th>
                  <th className="pb-2 text-right">Asist</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {t.squad.slice(0, 12).map((p) => (
                  <tr key={p.playerId}>
                    <td className="py-2">
                      <span className="flex items-center gap-2">
                        <img src={p.photo ?? undefined} alt="" loading="lazy" className="h-6 w-6 rounded-full object-cover bg-ink-700" />
                        <span className="truncate font-medium text-slate-200">{p.name}</span>
                      </span>
                    </td>
                    <td className="py-2 text-xs text-slate-500">{posTr(p.position) ?? '—'}</td>
                    <td className="py-2 text-right tabular-nums text-slate-300">{p.appearances ?? '—'}</td>
                    <td className="py-2 text-right font-semibold tabular-nums text-accent-soft">{p.goals ?? 0}</td>
                    <td className="py-2 text-right tabular-nums text-slate-300">{p.assists ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Kadro verisi şu anda mevcut değil.</p>
        )}
      </div>
    </div>
  );
}

export default function PlayersSection({ data }: { data: AnalysisResponse }) {
  if (data.extrasPending) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="space-y-3">
            <div className="h-6 w-40 animate-pulse rounded-lg bg-ink-800" />
            <div className="h-64 animate-pulse rounded-2xl bg-ink-800" />
          </div>
        ))}
        <p className="text-xs text-slate-500 lg:col-span-2">Oyuncu verileri yükleniyor…</p>
      </div>
    );
  }
  const hasData = data.topScorers || data.home.squad || data.away.squad;
  if (!hasData) {
    return (
      <Alert variant="info" title="Veri şu anda mevcut değil">
        Oyuncu verileri API planı kısıtı veya eksik sezon verisi nedeniyle alınamadı.
      </Alert>
    );
  }
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <TeamPlayers side="home" data={data} />
      <TeamPlayers side="away" data={data} />
    </div>
  );
}
