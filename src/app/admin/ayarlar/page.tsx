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
      <button type="button" role="switch" aria-checked={value} onClick={() => onChange(!value)} className={`relative mt-1 h-6 w-11 shrink-0 rounded-full transition ${value ? 'bg-accent' : 'bg-ink-600'}`}>
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
      <Card className="divide-y divide-white/5 py-2">
        <Toggle label="Bakım modu" desc="Açıkken yöneticiler dışında herkes bakım ekranını görür (giriş sayfası açık kalır)." value={!!s.maintenance} onChange={set('maintenance')} />
        <Toggle label="Yeni üye kaydı" desc="Kapalıyken kayıt formu yeni hesap oluşturmaz." value={!!s.registrationsOpen} onChange={set('registrationsOpen')} />
        <Toggle label="Maç yorumları" desc="Kapalıyken yeni yorum yapılamaz; mevcutlar görünmeye devam eder." value={!!s.commentsEnabled} onChange={set('commentsEnabled')} />
        <Toggle label="Canlı destek" desc="Sağ alttaki canlı destek balonunu gösterir." value={!!s.liveChatEnabled} onChange={set('liveChatEnabled')} />
      </Card>
      <Card className="space-y-4">
        <Field label="Bakım mesajı"><Textarea rows={2} value={String(s.maintenanceMessage)} onChange={(e) => set('maintenanceMessage')(e.target.value)} /></Field>
        <Field label="Destek çalışma saatleri"><Input value={String(s.supportHours)} onChange={(e) => set('supportHours')(e.target.value)} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Premium fiyat metni"><Input value={String(s.premiumPriceText)} onChange={(e) => set('premiumPriceText')(e.target.value)} /></Field>
          <Field label="Ücretsiz üye kupon limiti"><Input type="number" min={0} max={100} value={Number(s.freeCouponLimit)} onChange={(e) => set('freeCouponLimit')(Number(e.target.value))} /></Field>
        </div>
        <Field label="Premium ödeme bilgilendirmesi" hint="Premium sayfasında talep formunun üstünde görünür."><Textarea rows={3} value={String(s.premiumPaymentInfo)} onChange={(e) => set('premiumPaymentInfo')(e.target.value)} /></Field>
      </Card>
    </div>
  );
}
