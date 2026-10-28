'use client';

import { Percent, Power, RotateCcw, Save } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { GameIcon } from '@/components/icons/GameIcons';
import { Badge, Button, Card, Input, Notice } from '@/components/ui';
import { api } from '@/lib/client';
import type { GameKey } from '@/lib/games/registry';

export interface OddsGame { key: GameKey; name: string; kind: string; tunable: boolean; enabled: boolean; edge: number; defaultEdge: number }
export interface Odds { games: OddsGame[]; blackjackPayout: number; limits: { min: number; max: number } }

export default function OddsPanel({ odds, onChange }: { odds: Odds; onChange: (o: Odds) => void }) {
  const { toast } = useAuth();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [bj, setBj] = useState(String(odds.blackjackPayout));
  const [busy, setBusy] = useState<string | null>(null);

  const send = async (id: string, body: Record<string, unknown>, ok: string) => {
    setBusy(id);
    const r = await api<Odds>('/api/admin/odds', { method: 'PUT', body });
    setBusy(null);
    if (r.error || !r.data) return toast(r.error ?? 'Kaydedilemedi', 'error');
    onChange(r.data);
    setDraft((d) => {
      const n = { ...d };
      delete n[id];
      return n;
    });
    toast(ok);
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2">
        <p className="flex items-center gap-2 font-bold"><Percent size={18} className="text-violet-300" /> Oyun şansları</p>
        <Badge color="violet">Kasa payı = oyuncunun uzun vadede kaybettiği oran</Badge>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Kasa payı düştükçe oyuncunun şansı artar (RTP = 100 − kasa payı). Değerler oyun sayfalarında ve lobide <b>herkese açık</b> gösterilir; sonuçlar yine doğrulanabilir adil kalır. Sınır: %{odds.limits.min} – %{odds.limits.max}.
        Crash için değişiklik bir sonraki turdan, oturumlu oyunlarda (Mines, Hi-Lo, Kule, Blackjack) bir sonraki oyundan itibaren geçerlidir.
      </p>
      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {odds.games.map((g) => {
          const val = draft[g.key] ?? String(g.edge);
          const dirty = draft[g.key] !== undefined && Number(draft[g.key].replace(',', '.')) !== g.edge;
          return (
            <div key={g.key} className={`flex flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-ink-900/60 p-3 ${g.enabled ? '' : 'opacity-60'}`}>
              <GameIcon game={g.key} size={36} />
              <div className="min-w-[6rem] flex-1">
                <p className="font-semibold">{g.name}</p>
                <p className="text-[11px] text-slate-500">
                  {g.tunable ? <>RTP %{(100 - g.edge).toFixed(2).replace('.', ',')} · varsayılan %{g.defaultEdge}</> : 'Sabit kurallı (aşağıdaki ödeme oranı)'}
                </p>
              </div>
              {g.tunable && (
                <div className="flex items-center gap-1.5">
                  <Input
                    className="!w-20 !py-1.5 text-right tabular-nums"
                    inputMode="decimal"
                    value={val}
                    onChange={(e) => setDraft({ ...draft, [g.key]: e.target.value.replace(/[^0-9.,]/g, '') })}
                    aria-label={`${g.name} kasa payı yüzdesi`}
                  />
                  <span className="text-xs text-slate-500">%</span>
                  <Button size="sm" disabled={!dirty} loading={busy === g.key} onClick={() => send(g.key, { game: g.key, edge: val }, `${g.name} kasa payı güncellendi.`)} aria-label="Kaydet"><Save size={14} /></Button>
                  <Button size="sm" variant="ghost" disabled={g.edge === g.defaultEdge} onClick={() => send(g.key, { game: g.key, reset: true }, 'Varsayılana döndü.')} aria-label="Varsayılana döndür"><RotateCcw size={14} /></Button>
                </div>
              )}
              <button
                onClick={() => send(`t${g.key}`, { game: g.key, enabled: !g.enabled }, g.enabled ? `${g.name} kapatıldı.` : `${g.name} açıldı.`)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold ${g.enabled ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'}`}
                aria-pressed={g.enabled}
              >
                <Power size={13} /> {g.enabled ? 'Açık' : 'Kapalı'}
              </button>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-white/5 bg-ink-900/60 p-3">
        <GameIcon game="blackjack" size={36} />
        <div className="min-w-[10rem] flex-1">
          <p className="font-semibold">Blackjack ödemesi</p>
          <p className="text-[11px] text-slate-500">1,5 = 3:2 · 1,2 = 6:5 (oyuncu için daha düşük şans). Yeni dağıtılan ellerde geçerli.</p>
        </div>
        <Input className="!w-24 !py-1.5 text-right tabular-nums" inputMode="decimal" value={bj} onChange={(e) => setBj(e.target.value.replace(/[^0-9.,]/g, ''))} aria-label="Blackjack ödeme oranı" />
        <Button size="sm" loading={busy === 'bj'} disabled={Number(bj.replace(',', '.')) === odds.blackjackPayout} onClick={() => send('bj', { blackjackPayout: bj.replace(',', '.') }, 'Blackjack ödemesi güncellendi.')}><Save size={14} /> Kaydet</Button>
      </div>
      <div className="mt-3"><Notice kind="info">Her değişiklik denetim günlüğüne yazılır. Oyuncular kasa payını oyun sayfasının üstünde görür.</Notice></div>
    </Card>
  );
}
