'use client';

import { Activity, Ban, BellRing, Coins, Gamepad2, HeartHandshake, Image, Landmark, LifeBuoy, LineChart, Megaphone, MessagesSquare, PenSquare, Rocket, TicketPercent, TrendingUp, UserCheck, UserPlus, Users, Wallet, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Badge, Card, PageHeader, PRIORITY_TR, Spinner, STATUS_TR } from '@/components/ui';
import { api, timeAgo } from '@/lib/client';
import { fmtCredits, fmtMult } from '@/lib/money';

interface D {
  counts: Record<string, number | string>;
  daily: { day: string; signups: number; wagered: string; house: string; bets: number }[];
  games: { game: string; bets: number; wagered: string; paid: string }[];
  latestUsers: { id: number; name: string; email: string; created_at: string; balance: string }[];
  latestTickets: { id: number; subject: string; status: string; priority: string; updated_at: string; who: string }[];
  bigWins: { id: number; game: string; amount: string; payout: string; multiplier: string; created_at: string; user_id: number; name: string }[];
}

const NAMES: Record<string, string> = { mines: 'Mines', crash: 'Crash', slots: 'Slots', blackjack: 'Blackjack' };

export default function Dashboard() {
  const [d, setD] = useState<D | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [chart, setChart] = useState<'wagered' | 'house' | 'signups'>('wagered');
  useEffect(() => {
    api<D>('/api/admin/stats').then((r) => (r.error ? setErr(r.error) : setD(r.data)));
  }, []);
  if (err) return <p className="text-red-300">{err}</p>;
  if (!d) return <Spinner />;
  const c = d.counts;
  const cr = (v: number | string) => fmtCredits(v, { compact: true });
  const tiles: [string, string | number, string, LucideIcon, string?][] = [
    ['Toplam üye', c.users, '/admin/kullanicilar', Users, `+${c.users_week} bu hafta`],
    ['Bugün yeni üye', c.users_today, '/admin/kullanicilar', UserPlus],
    ['Bugün aktif', c.active_today, '/admin/kullanicilar', Activity, `${c.players_today} oyuncu oynadı`],
    ['Bugün oynanan', cr(c.wagered_today), '/admin/oyunlar', Coins, `${c.bets_today} el`],
    ['Bugün kasa sonucu', cr(c.house_today), '/admin/oyunlar', TrendingUp, 'oynanan − ödenen'],
    ['Bugün dağıtılan bonus', cr(c.issued_today), '/admin/islemler', Wallet],
    ['Dolaşımdaki kredi', cr(c.circulating), '/admin/islemler', Landmark, 'bakiye + kasa'],
    ['Açık oyun oturumu', c.sessions_active, '/admin/oyunlar', Gamepad2],
    ['Açık destek talebi', c.tickets_open, '/admin/destek', LifeBuoy, `${c.tickets_active} aktif`],
    ['Okunmamış canlı mesaj', c.chat_unread, '/admin/canli-destek', MessagesSquare, `${c.chats_open} açık görüşme`],
    ['Molada olan üye', c.excluded, '/admin/kullanicilar?filter=excluded', HeartHandshake],
    ['Yaş doğrulamasız', c.unverified, '/admin/kullanicilar?filter=unverified', UserCheck],
    ['Askıdaki hesap', c.banned, '/admin/kullanicilar?filter=banned', Ban],
  ];
  const vals = d.daily.map((x) => (chart === 'signups' ? x.signups : Number(chart === 'wagered' ? x.wagered : x.house) / 100));
  const max = Math.max(1, ...vals.map(Math.abs));

  return (
    <div className="space-y-6">
      <PageHeader title="Gösterge paneli" subtitle="BloxyBet genel durumu (tüm tutarlar sanal kredidir)" />
      <div className="flex flex-wrap gap-2">
        {[
          { href: '/admin/oyunlar', label: 'Oyun istatistikleri', icon: Gamepad2 },
          { href: '/admin/crash', label: 'Crash turları', icon: Rocket },
          { href: '/admin/promosyon', label: 'Promosyon kodu', icon: TicketPercent },
          { href: '/admin/reklamlar', label: 'Reklam ekle', icon: Image },
          { href: '/admin/blog', label: 'Yazı yaz', icon: PenSquare },
          { href: '/admin/duyurular', label: 'Duyuru', icon: Megaphone },
          { href: '/admin/bildirim', label: 'Bildirim gönder', icon: BellRing },
          { href: '/admin/analitik', label: 'Analitik', icon: LineChart },
        ].map((a) => (
          <Link key={a.href} href={a.href} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-ink-800 px-3.5 py-2 text-sm font-medium text-slate-300 transition hover:border-violet-400/40 hover:text-white">
            <a.icon size={15} /> {a.label}
          </Link>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {tiles.map(([label, v, href, Icon, sub]) => (
          <Link key={label} href={href} className="card p-4 transition hover:border-violet-400/30">
            <p className="flex items-center gap-1.5 text-xs text-slate-500"><Icon size={14} /> {label}</p>
            <p className="mt-1 text-2xl font-black tabular-nums">{v}</p>
            {sub && <p className="text-[11px] text-slate-500">{sub}</p>}
          </Link>
        ))}
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="label-muted">Son 14 gün</p>
          <div className="flex gap-1">
            {([['wagered', 'Oynanan'], ['house', 'Kasa sonucu'], ['signups', 'Yeni üye']] as const).map(([k, l]) => (
              <button key={k} onClick={() => setChart(k)} className={`chip ${chart === k ? 'chip-active' : ''}`}>{l}</button>
            ))}
          </div>
        </div>
        <div className="flex h-40 items-end gap-1.5">
          {d.daily.map((x, i) => (
            <div key={x.day} className="group flex h-full flex-1 flex-col items-center justify-end gap-1">
              <span className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100">{chart === 'signups' ? vals[i] : Math.round(vals[i]).toLocaleString('tr-TR')}</span>
              <div className={`w-full rounded-t ${vals[i] < 0 ? 'bg-red-400/70' : 'bg-violet-400/70'}`} style={{ height: `${(Math.abs(vals[i]) / max) * 100}%`, minHeight: vals[i] ? 4 : 1 }} />
              <span className="text-[9px] text-slate-600">{x.day.slice(8)}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between"><p className="label-muted">Oyunlar (tüm zamanlar)</p><Link href="/admin/oyunlar" className="text-xs text-violet-300">Ayrıntı</Link></div>
          {d.games.length === 0 ? (
            <p className="text-sm text-slate-500">Henüz oynanmış el yok.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-slate-500"><tr><th className="py-1">Oyun</th><th className="text-right">El</th><th className="text-right">Oynanan</th><th className="text-right">RTP</th><th className="text-right">Kasa</th></tr></thead>
              <tbody>
                {d.games.map((g) => {
                  const w = Number(g.wagered);
                  const p = Number(g.paid);
                  return (
                    <tr key={g.game} className="border-t border-white/5">
                      <td className="py-2">{NAMES[g.game] ?? g.game}</td>
                      <td className="text-right tabular-nums">{g.bets}</td>
                      <td className="text-right tabular-nums">{cr(w)}</td>
                      <td className="text-right tabular-nums">{w ? `%${((p / w) * 100).toFixed(1).replace('.', ',')}` : '—'}</td>
                      <td className={`text-right tabular-nums ${w - p >= 0 ? 'text-accent-soft' : 'text-red-300'}`}>{cr(w - p)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>
        <Card>
          <p className="label-muted mb-3">Haftanın en büyük kazançları</p>
          {d.bigWins.length === 0 ? (
            <p className="text-sm text-slate-500">Bu hafta kazanç yok.</p>
          ) : (
            <ul className="divide-y divide-white/5 text-sm">
              {d.bigWins.map((b) => (
                <li key={b.id} className="flex items-center gap-2 py-2">
                  <Link href={`/admin/kullanicilar?q=${b.user_id}`} className="min-w-0 flex-1 truncate hover:text-violet-200">{b.name} <span className="text-slate-500">· {NAMES[b.game]}</span></Link>
                  <span className="text-amber-300">{fmtMult(b.multiplier)}</span>
                  <span className="w-20 text-right tabular-nums text-accent-soft">+{cr(Number(b.payout) - Number(b.amount))}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <p className="label-muted mb-3">Son üyeler</p>
          <ul className="divide-y divide-white/5 text-sm">
            {d.latestUsers.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-2 py-2">
                <Link href={`/admin/kullanicilar?q=${u.id}`} className="min-w-0 truncate hover:text-violet-200">{u.name} <span className="text-slate-500">· {u.email}</span></Link>
                <span className="shrink-0 text-xs text-slate-500">{cr(u.balance)} · {timeAgo(u.created_at)}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <p className="label-muted mb-3">Aktif destek talepleri</p>
          {d.latestTickets.length === 0 ? (
            <p className="text-sm text-slate-500">Açık talep yok.</p>
          ) : (
            <ul className="divide-y divide-white/5 text-sm">
              {d.latestTickets.map((t) => (
                <li key={t.id} className="flex items-center gap-2 py-2">
                  <Link href={`/admin/destek/${t.id}`} className="min-w-0 flex-1 truncate hover:text-violet-200">#{t.id} {t.subject} <span className="text-slate-500">· {t.who}</span></Link>
                  <Badge color={PRIORITY_TR[t.priority]?.color}>{PRIORITY_TR[t.priority]?.label}</Badge>
                  <Badge color={STATUS_TR[t.status]?.color}>{STATUS_TR[t.status]?.label}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
