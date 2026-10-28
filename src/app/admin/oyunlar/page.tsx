'use client';

import { Gamepad2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button, Card, Empty, Input, PageHeader, Select, Spinner } from '@/components/ui';
import { api, fmtDateTime, timeAgo } from '@/lib/client';
import { GAME_KEYS, GAME_INFO } from '@/lib/games/registry';
import { fmtCredits, fmtMult } from '@/lib/money';
import OddsPanel, { type Odds } from './OddsPanel';

interface Stat { game: string; bets: number; players: number; wagered: string; paid: string; wins: number; best: number; avg_bet: string }
interface Item { id: number; game: string; amount: string; payout: string; multiplier: string; created_at: string; user_id: number; name: string; server_hash: string | null; client_seed: string | null; nonce: number | null }
interface D { stats: Stat[]; items: Item[]; more: boolean; top: { id: number; name: string; bets: number; wagered: string; profit: string }[]; sessions: { id: number; game: string; amount: string; created_at: string; user_id: number; name: string }[] }

const NAMES: Record<string, string> = Object.fromEntries(Object.entries(GAME_INFO).map(([k, v]) => [k, v.name]));

export default function AdminGames() {
  const [period, setPeriod] = useState('week');
  const [game, setGame] = useState('');
  const [user, setUser] = useState('');
  const [big, setBig] = useState(false);
  const [page, setPage] = useState(0);
  const [d, setD] = useState<D | null>(null);
  const [odds, setOdds] = useState<Odds | null>(null);
  useEffect(() => {
    api<Odds>('/api/admin/odds').then((r) => setOdds(r.data));
  }, []);

  useEffect(() => {
    setD(null);
    const p = new URLSearchParams({ period, page: String(page) });
    if (game) p.set('game', game);
    if (user) p.set('user', user);
    if (big) p.set('big', '1');
    api<D>(`/api/admin/games?${p}`).then((r) => setD(r.data));
  }, [period, game, user, big, page]);

  const cr = (v: number | string) => fmtCredits(v, { compact: true });
  const totW = d?.stats.reduce((a, s) => a + Number(s.wagered), 0) ?? 0;
  const totP = d?.stats.reduce((a, s) => a + Number(s.paid), 0) ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Oyunlar & şanslar" subtitle="Oyun başına şans (kasa payı) ayarı, hacim, geri dönüş oranı (RTP) ve tüm eller" />
      {odds && <OddsPanel odds={odds} onChange={setOdds} />}
      <div className="flex flex-wrap gap-2">
        {[['day', 'Bugün'], ['week', '7 gün'], ['month', '30 gün'], ['all', 'Tümü']].map(([k, l]) => (
          <button key={k} onClick={() => { setPeriod(k); setPage(0); }} className={`chip ${period === k ? 'chip-active' : ''}`}>{l}</button>
        ))}
      </div>
      {!d ? (
        <Spinner />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
            {GAME_KEYS.map((g) => {
              const s = d.stats.find((x) => x.game === g);
              const w = Number(s?.wagered ?? 0);
              const p = Number(s?.paid ?? 0);
              return (
                <Card key={g} className="p-4">
                  <p className="flex items-center justify-between font-bold">{NAMES[g]} <span className="text-[11px] font-normal text-slate-500">hedef RTP {odds ? (g === 'blackjack' ? `~%${(100 - GAME_INFO.blackjack.edge - (odds.blackjackPayout < 1.5 ? (1.5 - odds.blackjackPayout) * 2.3 : 0)).toFixed(1).replace('.', ',')}` : `%${(100 - (odds.games.find((x) => x.key === g)?.edge ?? 0)).toFixed(2).replace('.', ',')}`) : '…'}</span></p>
                  <div className="mt-3 grid grid-cols-2 gap-y-1.5 text-xs">
                    <span className="text-slate-500">El / oyuncu</span><span className="text-right tabular-nums">{s?.bets ?? 0} / {s?.players ?? 0}</span>
                    <span className="text-slate-500">Oynanan</span><span className="text-right tabular-nums">{cr(w)}</span>
                    <span className="text-slate-500">Ödenen</span><span className="text-right tabular-nums">{cr(p)}</span>
                    <span className="text-slate-500">Gerçekleşen RTP</span><span className="text-right font-bold tabular-nums">{w ? `%${((p / w) * 100).toFixed(2).replace('.', ',')}` : '—'}</span>
                    <span className="text-slate-500">Kasa sonucu</span><span className={`text-right font-bold tabular-nums ${w - p >= 0 ? 'text-accent-soft' : 'text-red-300'}`}>{cr(w - p)}</span>
                    <span className="text-slate-500">Kazanma oranı</span><span className="text-right tabular-nums">{s?.bets ? `%${Math.round((s.wins / s.bets) * 100)}` : '—'}</span>
                    <span className="text-slate-500">En yüksek çarpan</span><span className="text-right tabular-nums">{s?.best ? fmtMult(s.best) : '—'}</span>
                    <span className="text-slate-500">Ort. bahis</span><span className="text-right tabular-nums">{s ? cr(s.avg_bet) : '—'}</span>
                  </div>
                </Card>
              );
            })}
          </div>
          <p className="text-xs text-slate-500">Toplam: {cr(totW)} oynandı, {cr(totP)} ödendi · kasa sonucu {cr(totW - totP)}. Kısa dönemde gerçekleşen RTP hedeften sapabilir; çok sayıda elde hedefe yaklaşır.</p>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <p className="label-muted mb-3">En çok kazanan oyuncular</p>
              {d.top.length === 0 ? <p className="text-sm text-slate-500">Veri yok.</p> : (
                <ul className="divide-y divide-white/5 text-sm">
                  {d.top.map((t) => (
                    <li key={t.id} className="flex items-center gap-2 py-2">
                      <button onClick={() => { setUser(String(t.id)); setPage(0); }} className="min-w-0 flex-1 truncate text-left hover:text-violet-200">{t.name} <span className="text-slate-500">#{t.id}</span></button>
                      <span className="text-xs text-slate-500">{t.bets} el · {cr(t.wagered)}</span>
                      <span className={`w-20 text-right tabular-nums ${Number(t.profit) >= 0 ? 'text-accent-soft' : 'text-red-300'}`}>{cr(t.profit)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card>
              <p className="label-muted mb-3">Devam eden oyunlar (Mines / Blackjack)</p>
              {d.sessions.length === 0 ? <p className="text-sm text-slate-500">Açık oturum yok.</p> : (
                <ul className="divide-y divide-white/5 text-sm">
                  {d.sessions.map((s) => (
                    <li key={s.id} className="flex items-center gap-2 py-2">
                      <span className="min-w-0 flex-1 truncate">{s.name} <span className="text-slate-500">· {NAMES[s.game]}</span></span>
                      <span className="tabular-nums">{fmtCredits(s.amount)}</span>
                      <span className="w-24 text-right text-xs text-slate-500">{timeAgo(s.created_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <Card className="p-0">
            <div className="flex flex-wrap items-end gap-2 border-b border-white/5 p-4">
              <Select value={game} onChange={(e) => { setGame(e.target.value); setPage(0); }} className="w-40">
                <option value="">Tüm oyunlar</option>
                {Object.entries(NAMES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
              <Input value={user} onChange={(e) => { setUser(e.target.value.replace(/\D/g, '')); setPage(0); }} placeholder="Üye ID" className="w-32" />
              <label className="flex items-center gap-2 text-sm text-slate-400"><input type="checkbox" checked={big} onChange={(e) => { setBig(e.target.checked); setPage(0); }} /> Yalnızca 1.000+ kazançlar</label>
            </div>
            {d.items.length === 0 ? (
              <Empty icon={Gamepad2} title="El bulunamadı" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="bg-white/[0.03] text-left text-xs text-slate-400">
                    <tr><th className="px-4 py-2.5">#</th><th className="px-2">Oyuncu</th><th className="px-2">Oyun</th><th className="px-2 text-right">Bahis</th><th className="px-2 text-right">Çarpan</th><th className="px-2 text-right">Net</th><th className="px-4">Zaman</th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {d.items.map((b) => {
                      const net = Number(b.payout) - Number(b.amount);
                      return (
                        <tr key={b.id} title={b.server_hash ? `hash ${b.server_hash} · client ${b.client_seed} · nonce ${b.nonce}` : undefined}>
                          <td className="px-4 py-2 text-slate-500">{b.id}</td>
                          <td className="px-2"><Link href={`/admin/kullanicilar?q=${b.user_id}`} className="hover:text-violet-200">{b.name}</Link></td>
                          <td className="px-2">{NAMES[b.game]}</td>
                          <td className="px-2 text-right tabular-nums">{fmtCredits(b.amount)}</td>
                          <td className="px-2 text-right tabular-nums">{fmtMult(b.multiplier)}</td>
                          <td className={`px-2 text-right tabular-nums ${net >= 0 ? 'text-accent-soft' : 'text-red-300'}`}>{net >= 0 ? '+' : ''}{fmtCredits(net)}</td>
                          <td className="px-4 text-xs text-slate-500">{fmtDateTime(b.created_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
          <div className="flex justify-between">
            <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Önceki</Button>
            <Button variant="secondary" size="sm" disabled={!d.more} onClick={() => setPage((p) => p + 1)}>Sonraki</Button>
          </div>
        </>
      )}
    </div>
  );
}
