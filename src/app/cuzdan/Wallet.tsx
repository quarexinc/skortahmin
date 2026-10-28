'use client';

import { ArrowDownToLine, ArrowUpFromLine, CalendarCheck, Coins, Crown, Droplets, Gift, Info, Lock, TicketPercent, TrendingDown, TrendingUp, Vault, Zap } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import AgeVerify from '@/components/games/AgeVerify';
import { Button, Card, Input, Notice, Spinner } from '@/components/ui';
import { txType } from '@/config/txTypes';
import { api, timeAgo } from '@/lib/client';
import { fmtCredits, fmtMult } from '@/lib/money';

interface Lvl { level: number; name: string; color: string; dailyBonus: number; rakeback: number; minWager: number; reward: number }
interface W {
  balance: number;
  vault: number;
  rakeback: number;
  vip: { level: Lvl; next: Lvl | null; progress: number; wagered: number };
  levelRewards: number;
  daily: { enabled: boolean; amount: number; availableAt: number; ready: boolean };
  faucet: { amount: number; minutes: number; availableAt: number; lowBalance: boolean; ready: boolean };
  stats: { bets: number; wagered: string; paid: string; biggest: string; best_mult: number; profit: number };
  transactions: { id: number; type: string; amount: string; balance_after: string; ref: string | null; note: string | null; created_at: string }[];
  ageVerified: boolean;
}

function left(ms: number) {
  if (ms <= 0) return 'şimdi';
  const s = Math.ceil(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h ? `${h} sa ${m} dk` : m ? `${m} dk ${sec} sn` : `${sec} sn`;
}

export default function Wallet() {
  const { user, setBalance, toast } = useAuth();
  const [w, setW] = useState<W | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [vaultAmt, setVaultAmt] = useState('');
  const [vaultMode, setVaultMode] = useState<'in' | 'out'>('in');
  const [code, setCode] = useState('');
  const [now, setNow] = useState(Date.now());

  const load = useCallback(() => api<W>('/api/wallet').then((r) => (r.error ? setErr(r.error) : setW(r.data))), []);
  useEffect(() => {
    load();
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [load]);

  const act = async (action: string, extra: Record<string, unknown> = {}) => {
    setBusy(action);
    const r = await api<{ balance: number; message: string }>('/api/wallet', { body: { action, ...extra } });
    setBusy(null);
    if (r.error) return toast(r.error, 'error');
    setBalance(r.data!.balance);
    toast(r.data!.message);
    if (action === 'promo') setCode('');
    if (action.startsWith('vault')) setVaultAmt('');
    load();
  };

  if (err) return <Notice kind="error">{err}</Notice>;
  if (!w || !user) return <Spinner label="Cüzdan yükleniyor" />;
  if (!user.ageVerified) return <div className="mx-auto max-w-lg"><AgeVerify /></div>;

  const total = w.balance + w.vault;
  const profit = w.stats.profit;
  const pct = Math.round(w.vip.progress * 100);

  return (
    <div className="space-y-6">
      {/* Üst özet */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-600/30 via-ink-900 to-pink-600/20 p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 animate-blob rounded-full bg-pink-500/20 blur-3xl" />
        <div className="relative grid gap-6 md:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="flex items-center gap-2 text-sm text-violet-200"><Coins size={16} /> Toplam kredi</p>
            <p className="mt-1 text-4xl font-black tabular-nums sm:text-5xl">{fmtCredits(total)}</p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <span className="rounded-xl bg-black/25 px-3 py-2">Oyun bakiyesi <b className="ml-1 tabular-nums">{fmtCredits(w.balance)}</b></span>
              <span className="rounded-xl bg-black/25 px-3 py-2"><Lock size={13} className="mr-1 inline" />Kasa <b className="ml-1 tabular-nums">{fmtCredits(w.vault)}</b></span>
            </div>
          </div>
          <div className="rounded-2xl bg-black/25 p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-bold"><Crown size={18} style={{ color: w.vip.level.color }} /> {w.vip.level.name}</span>
              <Link href="/vip" className="text-xs text-violet-200 underline">VIP</Link>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-pink-400 transition-all" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-2 text-xs text-slate-300">
              {w.vip.next ? <>Sonraki seviye <b>{w.vip.next.name}</b> · %{pct} · {(w.vip.next.minWager - w.vip.wagered).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} kredi daha oyna</> : 'En yüksek seviyedesin.'}
            </p>
          </div>
        </div>
      </section>

      <Notice>
        <span className="inline-flex items-start gap-2"><Info size={16} className="mt-0.5 shrink-0" /> Krediler sanaldır. Para, ürün, oyun içi eşya veya kripto ile alınamaz, satılamaz, takas edilemez ve dışarı çekilemez.</span>
      </Notice>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Kasa */}
        <Card>
          <h2 className="flex items-center gap-2 text-lg font-black"><Vault size={20} className="text-violet-300" /> Kasa</h2>
          <p className="mt-1 text-sm text-slate-400">Kasaya aktardığın krediler oyunlarda kullanılmaz. Kendine sınır koymak için kullanabilirsin.</p>
          <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-ink-900 p-1 text-sm">
            {(['in', 'out'] as const).map((m) => (
              <button key={m} onClick={() => setVaultMode(m)} className={`flex items-center justify-center gap-1.5 rounded-lg py-2 font-semibold transition ${vaultMode === m ? 'bg-violet-500/25 text-white' : 'text-slate-400 hover:text-white'}`}>
                {m === 'in' ? <><ArrowDownToLine size={15} /> Kasaya koy</> : <><ArrowUpFromLine size={15} /> Kasadan al</>}
              </button>
            ))}
          </div>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              act(vaultMode === 'in' ? 'vaultDeposit' : 'vaultWithdraw', { amount: vaultAmt });
            }}
          >
            <div className="relative flex-1">
              <Input value={vaultAmt} onChange={(e) => setVaultAmt(e.target.value.replace(/[^0-9.,]/g, ''))} placeholder="Miktar" inputMode="decimal" required />
              <button type="button" onClick={() => setVaultAmt(String((vaultMode === 'in' ? w.balance : w.vault) / 100))} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-white/5 px-2 py-1 text-[11px] font-semibold text-slate-300 hover:bg-white/10">Tümü</button>
            </div>
            <Button type="submit" loading={busy === 'vaultDeposit' || busy === 'vaultWithdraw'}>{vaultMode === 'in' ? 'Kilitle' : 'Aktar'}</Button>
          </form>
          <p className="mt-2 text-xs text-slate-500">Kullanılabilir: {fmtCredits(vaultMode === 'in' ? w.balance : w.vault)} kredi</p>
        </Card>

        {/* Promosyon */}
        <Card>
          <h2 className="flex items-center gap-2 text-lg font-black"><TicketPercent size={20} className="text-pink-300" /> Promosyon kodu</h2>
          <p className="mt-1 text-sm text-slate-400">Etkinliklerde ve bültende paylaşılan kodları buradan kullan. Her kod hesap başına bir kez kullanılabilir.</p>
          <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); act('promo', { code }); }}>
            <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="KOD" maxLength={40} className="uppercase tracking-widest" required />
            <Button type="submit" loading={busy === 'promo'}><Gift size={16} /> Kullan</Button>
          </form>
        </Card>
      </div>

      {/* Bonuslar */}
      <section>
        <h2 className="mb-3 text-lg font-black">Ücretsiz krediler</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <BonusCard
            icon={CalendarCheck}
            color="text-amber-300"
            title="Günlük bonus"
            value={`${w.daily.amount.toLocaleString('tr-TR')} kredi`}
            note={!w.daily.enabled ? 'Şu anda kapalı' : now >= w.daily.availableAt ? 'Hazır' : `${left(w.daily.availableAt - now)} sonra`}
            ready={w.daily.enabled && now >= w.daily.availableAt}
            busy={busy === 'daily'}
            onClick={() => act('daily')}
          />
          <BonusCard
            icon={Zap}
            color="text-violet-300"
            title="Rakeback"
            value={`${fmtCredits(w.rakeback)} kredi`}
            note={`Oynadığının %${w.vip.level.rakeback.toString().replace('.', ',')}'i`}
            ready={w.rakeback >= 1}
            busy={busy === 'rakeback'}
            onClick={() => act('rakeback')}
          />
          <BonusCard
            icon={Crown}
            color="text-pink-300"
            title="Seviye ödülleri"
            value={`${w.levelRewards.toLocaleString('tr-TR')} kredi`}
            note={w.levelRewards > 0 ? 'Toplanmayı bekliyor' : 'Yeni seviyede açılır'}
            ready={w.levelRewards > 0}
            busy={busy === 'levelRewards'}
            onClick={() => act('levelRewards')}
          />
          <BonusCard
            icon={Droplets}
            color="text-sky-300"
            title="Musluk"
            value={`${w.faucet.amount} kredi`}
            note={!w.faucet.lowBalance ? 'Bakiye 1 kredinin altına düşünce' : now >= w.faucet.availableAt ? 'Hazır' : `${left(w.faucet.availableAt - now)} sonra`}
            ready={w.faucet.lowBalance && now >= w.faucet.availableAt}
            busy={busy === 'faucet'}
            onClick={() => act('faucet')}
          />
        </div>
      </section>

      {/* İstatistik */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { l: 'Oynanan el', v: w.stats.bets.toLocaleString('tr-TR') },
          { l: 'Toplam oynanan', v: fmtCredits(w.stats.wagered, { compact: true }) },
          { l: 'Net sonuç', v: `${profit >= 0 ? '+' : ''}${fmtCredits(profit, { compact: true })}`, c: profit >= 0 ? 'text-accent-soft' : 'text-red-300', i: profit >= 0 ? TrendingUp : TrendingDown },
          { l: 'En yüksek çarpan', v: w.stats.best_mult ? fmtMult(w.stats.best_mult) : '—' },
        ].map((x) => (
          <Card key={x.l} className="p-4">
            <p className="text-xs text-slate-400">{x.l}</p>
            <p className={`mt-1 flex items-center gap-1.5 text-2xl font-black tabular-nums ${x.c ?? ''}`}>{x.i && <x.i size={18} />}{x.v}</p>
          </Card>
        ))}
      </section>

      {/* Son işlemler */}
      <Card className="p-0">
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
          <h2 className="font-black">Son işlemler</h2>
          <Link href="/hesap/islemler" className="text-sm text-violet-300 hover:underline">Tümü</Link>
        </div>
        {w.transactions.length === 0 ? (
          <p className="p-5 text-sm text-slate-400">Henüz işlem yok.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {w.transactions.slice(0, 12).map((t) => {
              const ty = txType(t.type);
              const a = Number(t.amount);
              return (
                <li key={t.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/5 ${ty.color}`}><ty.icon size={15} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{ty.label}{t.ref ? <span className="text-slate-500"> · {t.ref}</span> : null}</p>
                    <p className="text-xs text-slate-500">{timeAgo(t.created_at)}</p>
                  </div>
                  <span className={`tabular-nums font-semibold ${a >= 0 ? 'text-accent-soft' : 'text-slate-300'}`}>{a >= 0 ? '+' : ''}{fmtCredits(a)}</span>
                  <span className="hidden w-24 text-right text-xs tabular-nums text-slate-500 sm:block">{fmtCredits(t.balance_after)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

function BonusCard({ icon: I, color, title, value, note, ready, busy, onClick }: { icon: typeof Gift; color: string; title: string; value: string; note: string; ready: boolean; busy: boolean; onClick: () => void }) {
  return (
    <Card className={`flex flex-col p-4 ${ready ? 'ring-1 ring-violet-400/40' : ''}`}>
      <span className={`grid h-10 w-10 place-items-center rounded-xl bg-white/5 ${color}`}><I size={20} /></span>
      <p className="mt-3 text-sm text-slate-400">{title}</p>
      <p className="text-xl font-black tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">{note}</p>
      <Button className="mt-4 w-full" size="sm" variant={ready ? 'primary' : 'secondary'} disabled={!ready} loading={busy} onClick={onClick}>
        {ready ? 'Al' : 'Bekliyor'}
      </Button>
    </Card>
  );
}
