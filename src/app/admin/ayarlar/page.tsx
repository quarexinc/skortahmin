'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Button, Card, Field, Input, PageHeader, Spinner, Textarea } from '@/components/ui';
import { api } from '@/lib/client';

type S = Record<string, string | number | boolean>;

function Toggle({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-3">
      <span>
        <span className="block font-medium">{label}</span>
        <span className="block text-sm text-slate-400">{desc}</span>
      </span>
      <button type="button" role="switch" aria-checked={value} onClick={() => onChange(!value)} className={`relative mt-1 h-6 w-11 shrink-0 rounded-full transition ${value ? 'bg-violet-500' : 'bg-ink-600'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${value ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </label>
  );
}

export default function SettingsAdmin() {
  const { toast } = useAuth();
  const router = useRouter();
  const [s, setS] = useState<S | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api<{ settings: S }>('/api/admin/settings').then((r) => setS(r.data?.settings ?? null));
  }, []);
  if (!s) return <Spinner />;
  const set = (k: string) => (v: string | number | boolean) => setS({ ...s, [k]: v });
  const num = (k: string, label: string, hint?: string, step = '1') => (
    <Field label={label} hint={hint}><Input type="number" step={step} min={0} value={String(s[k])} onChange={(e) => set(k)(e.target.value)} /></Field>
  );
  const save = async () => {
    setBusy(true);
    const { data, error } = await api<{ settings: S }>('/api/admin/settings', { method: 'PUT', body: s });
    setBusy(false);
    if (error) return toast(error, 'error');
    setS(data!.settings);
    toast('Ayarlar kaydedildi.');
    router.refresh();
  };
  return (
    <div className="space-y-6">
      <PageHeader title="Site ayarları" actions={<Button onClick={save} loading={busy}>Kaydet</Button>} />

      <div>
        <p className="label-muted mb-2">Oyunlar</p>
        <Card className="divide-y divide-white/5 py-2">
          <p className="px-5 py-3 text-sm text-slate-400">Oyunları açıp kapatmak, kasa payını (şansı) ve blackjack ödemesini ayarlamak için <a href="/admin/oyunlar" className="text-violet-300 underline">Oyunlar &amp; şanslar</a> sayfasını kullan.</p>
        </Card>
        <Card className="mt-3 grid gap-4 sm:grid-cols-3">
          {num('minBet', 'En düşük bahis (kredi)', undefined, '0.01')}
          {num('maxBet', 'En yüksek bahis (kredi)')}
          {num('maxPayout', 'Tek elde en yüksek ödeme', 'Bu tutarın üstündeki kazançlar sınırlanır.')}
        </Card>
      </div>

      <div>
        <p className="label-muted mb-2">Sanal kredi ekonomisi</p>
        <Card className="divide-y divide-white/5 py-2">
          <Toggle label="Günlük bonus" desc="Üyeler 24 saatte bir VIP seviyesine göre bonus alabilir." value={!!s.dailyBonusEnabled} onChange={set('dailyBonusEnabled')} />
          <Toggle label="Rakeback" desc="Oynanan her bahsin bir yüzdesi rakeback hesabında birikir." value={!!s.rakebackEnabled} onChange={set('rakebackEnabled')} />
        </Card>
        <Card className="mt-3 grid gap-4 sm:grid-cols-3">
          {num('signupBonus', 'Hoş geldin kredisi')}
          {num('faucetAmount', 'Musluk miktarı', 'Bakiye 1 kredinin altındayken verilir.')}
          {num('faucetMinutes', 'Musluk bekleme süresi (dk)')}
        </Card>
        <p className="mt-2 text-xs text-slate-500">Krediler sanaldır; satın alınamaz, satılamaz ve paraya veya herhangi bir değere çevrilemez.</p>
      </div>

      <div>
        <p className="label-muted mb-2">Site</p>
        <Card className="divide-y divide-white/5 py-2">
          <Toggle label="Bakım modu" desc="Açıkken yöneticiler dışında herkes bakım ekranını görür (giriş sayfası açık kalır)." value={!!s.maintenance} onChange={set('maintenance')} />
          <Toggle label="Yeni üye kaydı" desc="Kapalıyken kayıt formu yeni hesap oluşturmaz." value={!!s.registrationsOpen} onChange={set('registrationsOpen')} />
          <Toggle label="Canlı destek" desc="Sağ alttaki canlı destek balonunu gösterir." value={!!s.liveChatEnabled} onChange={set('liveChatEnabled')} />
          <Toggle label="Reklamlar" desc="Reklam bannerlarını sitede gösterir." value={!!s.adsEnabled} onChange={set('adsEnabled')} />
          <Toggle label="Blog" desc="Blog menüsünü ve yazıları gösterir." value={!!s.blogEnabled} onChange={set('blogEnabled')} />
          <Toggle label="Bülten aboneliği" desc="Açılış sayfası ve alt bilgide bülten formunu gösterir." value={!!s.newsletterEnabled} onChange={set('newsletterEnabled')} />
          <Toggle label="Çerez bildirimi" desc="İlk ziyarette çerez/yerel depolama bilgilendirmesi gösterir." value={!!s.cookieBanner} onChange={set('cookieBanner')} />
        </Card>
        <Card className="mt-3 space-y-4">
          <Field label="Açılış sayfası başlığı" hint="İçinde “sanal kredilerle” geçerse o kısım animasyonlu döner."><Input value={String(s.heroTitle)} onChange={(e) => set('heroTitle')(e.target.value)} /></Field>
          <Field label="Açılış sayfası alt başlığı"><Textarea rows={2} value={String(s.heroSubtitle)} onChange={(e) => set('heroSubtitle')(e.target.value)} /></Field>
          <Field label="Bakım mesajı"><Textarea rows={2} value={String(s.maintenanceMessage)} onChange={(e) => set('maintenanceMessage')(e.target.value)} /></Field>
          <Field label="Destek çalışma saatleri"><Input value={String(s.supportHours)} onChange={(e) => set('supportHours')(e.target.value)} /></Field>
        </Card>
      </div>
    </div>
  );
}
