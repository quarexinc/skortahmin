import { CalendarCheck, Crown, Gift, Headphones, Zap } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import AdSlot from '@/components/AdSlot';
import Reveal from '@/components/landing/Reveal';
import { LinkButton } from '@/components/ui';
import { VIP_LEVELS, vipFor } from '@/config/vip';
import { getUser } from '@/lib/auth';
import { toCredits } from '@/lib/money';

export const metadata: Metadata = { title: 'VIP kulübü', description: '13 VIP seviyesi: rakeback, günlük bonus ve seviye ödülleri.' };
export const dynamic = 'force-dynamic';

const n = (v: number) => v.toLocaleString('tr-TR');

export default async function VipPage() {
  const user = await getUser();
  const vip = user ? vipFor(toCredits(user.wagered)) : null;
  const pct = vip ? Math.round(vip.progress * 100) : 0;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <AdSlot placement="match_top" className="mb-8" />
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-amber-500/15 via-ink-900 to-violet-600/20 p-8 sm:p-12">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 animate-blob rounded-full bg-amber-400/15 blur-3xl" />
        <div className="relative grid items-center gap-8 md:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="label-muted text-amber-200/80">VIP kulübü</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">Oynadıkça kazan</h1>
            <p className="mt-4 max-w-lg text-slate-300">Toplam oynadığın kredi seni 13 seviye boyunca ilerletir. Her seviye daha yüksek rakeback, daha büyük günlük bonus ve tek seferlik bir seviye ödülü getirir.</p>
            {!user && <div className="mt-6"><LinkButton href="/kayit" size="lg">Üye ol ve başla</LinkButton></div>}
          </div>
          {vip && (
            <div className="rounded-2xl bg-black/30 p-5">
              <p className="text-sm text-slate-400">Mevcut seviyen</p>
              <p className="mt-1 flex items-center gap-2 text-2xl font-black"><Crown size={24} style={{ color: vip.current.color }} /> {vip.current.name}</p>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-pink-400" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-2 text-xs text-slate-400">
                {vip.next ? `${vip.next.name} için ${n(Math.ceil(vip.next.minWager - toCredits(user!.wagered)))} kredi daha · %${pct}` : 'En yüksek seviyedesin.'}
              </p>
              <Link href="/cuzdan" className="mt-4 inline-block text-sm text-amber-200 underline">Ödüllerini cüzdandan topla</Link>
            </div>
          )}
        </div>
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { i: Zap, t: 'Rakeback', d: 'Oynadığın her bahsin bir yüzdesi rakeback hesabında birikir; istediğin an toplarsın.' },
          { i: CalendarCheck, t: 'Günlük bonus', d: 'Her 24 saatte bir alınabilen bonus, seviyen yükseldikçe büyür.' },
          { i: Gift, t: 'Seviye ödülü', d: 'Her yeni seviyeye ulaştığında tek seferlik kredi ödülü açılır.' },
          { i: Headphones, t: 'Öncelikli destek', d: 'Gümüş I ve üzeri seviyelerde destek talepleri öncelikli işlenir.' },
        ].map((x, i) => (
          <Reveal key={x.t} delay={i * 80}>
            <div className="card h-full p-5">
              <x.i size={22} className="text-amber-300" />
              <p className="mt-3 font-bold">{x.t}</p>
              <p className="mt-1 text-sm text-slate-400">{x.d}</p>
            </div>
          </Reveal>
        ))}
      </section>

      <section className="card mt-10 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-white/[0.03] text-left text-xs text-slate-400">
              <tr>
                <th className="px-4 py-3">Seviye</th>
                <th className="px-4 py-3 text-right">Gereken toplam oyun</th>
                <th className="px-4 py-3 text-right">Seviye ödülü</th>
                <th className="px-4 py-3 text-right">Rakeback</th>
                <th className="px-4 py-3 text-right">Günlük bonus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {VIP_LEVELS.map((l) => {
                const mine = vip?.current.level === l.level;
                return (
                  <tr key={l.level} className={mine ? 'bg-amber-400/10' : ''}>
                    <td className="px-4 py-3 font-semibold"><span className="inline-flex items-center gap-2"><Crown size={16} style={{ color: l.color }} /> {l.name}{mine && <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] text-amber-200">sen</span>}</span></td>
                    <td className="px-4 py-3 text-right tabular-nums">{n(l.minWager)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-accent-soft">{l.reward ? `+${n(l.reward)}` : '—'}</td>
                    <td className="px-4 py-3 text-right tabular-nums">%{l.rakeback.toString().replace('.', ',')}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{n(l.dailyBonus)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <p className="mt-4 text-center text-xs text-slate-500">Tüm ödüller sanal kredidir; paraya veya herhangi bir değere çevrilemez. 18+</p>
    </main>
  );
}
