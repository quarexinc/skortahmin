'use client';

import { AlarmClock, Ban, Gauge, HeartHandshake, LifeBuoy } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Button, Card, Field, Input, Notice, PageHeader, Select, Spinner } from '@/components/ui';
import { api, fmtDateTime } from '@/lib/client';
import { fmtCredits } from '@/lib/money';

interface R { self_excluded_until: string | null; daily_wager_limit: string | null; session_reminder_min: number | null; wagered24: number; limitChangedAt: string | null }

const EXCLUDE = [
  { d: 1, l: '24 saat' },
  { d: 7, l: '1 hafta' },
  { d: 30, l: '1 ay' },
  { d: 90, l: '3 ay' },
  { d: 180, l: '6 ay' },
  { d: 365, l: '1 yıl' },
];

export default function Responsible() {
  const { refresh, toast } = useAuth();
  const [r, setR] = useState<R | null>(null);
  const [limit, setLimit] = useState('');
  const [rem, setRem] = useState('');
  const [days, setDays] = useState('1');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => api<R>('/api/account/responsible').then((x) => {
    if (!x.data) return;
    setR(x.data);
    setLimit(x.data.daily_wager_limit ? String(Number(x.data.daily_wager_limit) / 100) : '');
    setRem(x.data.session_reminder_min ? String(x.data.session_reminder_min) : '');
  }), []);
  useEffect(() => {
    load();
  }, [load]);

  const post = async (key: string, body: Record<string, unknown>, ok: string) => {
    setBusy(key);
    const x = await api('/api/account/responsible', { body });
    setBusy(null);
    if (x.error) return toast(x.error, 'error');
    toast(ok);
    if (key === 'reminder') {
      try {
        localStorage.setItem('bb_session_start', String(Date.now()));
      } catch {
        /* depolama kapalı */
      }
    }
    load();
    refresh();
  };

  if (!r) return <Spinner />;
  const excluded = r.self_excluded_until && new Date(r.self_excluded_until).getTime() > Date.now();
  const lim = r.daily_wager_limit ? Number(r.daily_wager_limit) : null;

  return (
    <div className="space-y-6">
      <PageHeader title="Sorumlu oyun" subtitle="Krediler sanal olsa da oyun alışkanlıklarını kontrol altında tutmak önemlidir. Bu araçlar her zaman senin elinde." />

      <Card>
        <h2 className="flex items-center gap-2 font-black"><Gauge size={18} className="text-violet-300" /> 24 saatlik oyun limiti</h2>
        <p className="mt-1 text-sm text-slate-400">Son 24 saatte oynayabileceğin toplam krediyi sınırla. Düşürmek hemen geçerlidir; artırmak veya kaldırmak için son değişiklikten itibaren 24 saat beklemelisin.</p>
        {lim != null && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-400"><span>Son 24 saat: {fmtCredits(r.wagered24)}</span><span>Limit: {fmtCredits(lim)}</span></div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/5">
              <div className={`h-full ${r.wagered24 / lim > 0.85 ? 'bg-red-400' : 'bg-violet-400'}`} style={{ width: `${Math.min(100, (r.wagered24 / lim) * 100)}%` }} />
            </div>
          </div>
        )}
        <form className="mt-4 flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); post('limit', { action: 'limit', amount: limit || null }, limit ? 'Limit kaydedildi.' : 'Limit kaldırıldı.'); }}>
          <div className="min-w-[180px] flex-1"><Field label="Limit (kredi, boş = limitsiz)"><Input value={limit} onChange={(e) => setLimit(e.target.value.replace(/[^0-9.,]/g, ''))} inputMode="decimal" placeholder="ör. 5000" /></Field></div>
          <Button type="submit" loading={busy === 'limit'}>Kaydet</Button>
        </form>
        {r.limitChangedAt && <p className="mt-2 text-xs text-slate-500">Son değişiklik: {fmtDateTime(r.limitChangedAt)}</p>}
      </Card>

      <Card>
        <h2 className="flex items-center gap-2 font-black"><AlarmClock size={18} className="text-violet-300" /> Oturum hatırlatıcısı</h2>
        <p className="mt-1 text-sm text-slate-400">Belirlediğin süre dolduğunda ekranda ne kadar süredir oynadığını hatırlatan bir uyarı görürsün.</p>
        <form className="mt-4 flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); post('reminder', { action: 'reminder', minutes: rem || null }, rem ? 'Hatırlatıcı açıldı.' : 'Hatırlatıcı kapatıldı.'); }}>
          <div className="min-w-[180px] flex-1">
            <Field label="Süre">
              <Select value={rem} onChange={(e) => setRem(e.target.value)}>
                <option value="">Kapalı</option>
                {[15, 30, 45, 60, 90, 120].map((m) => <option key={m} value={m}>{m} dakikada bir</option>)}
              </Select>
            </Field>
          </div>
          <Button type="submit" loading={busy === 'reminder'}>Kaydet</Button>
        </form>
      </Card>

      <Card className="border-red-500/20">
        <h2 className="flex items-center gap-2 font-black"><Ban size={18} className="text-red-300" /> Mola ver (kendini dışla)</h2>
        <p className="mt-1 text-sm text-slate-400">Mola süresince hiçbir oyunu oynayamaz ve kredi talep edemezsin. Mola başladıktan sonra <b>kısaltılamaz ve iptal edilemez</b>; yalnızca uzatılabilir.</p>
        {excluded && <div className="mt-4"><Notice kind="info">Şu anda moladasın: {fmtDateTime(r.self_excluded_until)} tarihine kadar.</Notice></div>}
        <form
          className="mt-4 flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const l = EXCLUDE.find((x) => String(x.d) === days)?.l;
            if (!confirm(`${l} boyunca oyunlara erişimin kapatılacak. Bu işlem geri alınamaz. Emin misin?`)) return;
            post('exclude', { action: 'exclude', days: Number(days) }, 'Molan başladı.');
          }}
        >
          <div className="min-w-[180px] flex-1">
            <Field label="Süre">
              <Select value={days} onChange={(e) => setDays(e.target.value)}>{EXCLUDE.map((x) => <option key={x.d} value={x.d}>{x.l}</option>)}</Select>
            </Field>
          </div>
          <Button type="submit" variant="danger" loading={busy === 'exclude'}>{excluded ? 'Molayı uzat' : 'Molayı başlat'}</Button>
        </form>
      </Card>

      <Card>
        <h2 className="flex items-center gap-2 font-black"><HeartHandshake size={18} className="text-violet-300" /> Kendine dikkat et</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-slate-300">
          <li>Oyunu bir eğlence olarak gör; kaybettiğin kredileri geri kazanmak için oynamaya devam etme.</li>
          <li>Uzun süre oynadığını fark edersen ara ver.</li>
          <li>Oyun okul, iş, uyku veya ilişkilerini etkilemeye başladıysa bir uzmana ya da güvendiğin birine danış.</li>
        </ul>
        <p className="mt-4 text-sm text-slate-400">Daha fazla bilgi için <Link href="/sorumlu-oyun" className="text-violet-300 underline">sorumlu oyun sayfamıza</Link> göz at veya <Link href="/destek" className="inline-flex items-center gap-1 text-violet-300 underline"><LifeBuoy size={13} /> destek</Link> ekibimize yaz.</p>
      </Card>
    </div>
  );
}
