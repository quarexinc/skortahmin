'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Badge, Button, Card, Field, LinkButton, Notice, Select, STATUS_TR, Textarea } from '@/components/ui';
import { api, fmtDate } from '@/lib/client';

interface Req { id: number; months: number; status: string; admin_note: string | null; created_at: string }

export default function PremiumRequest({ priceText, paymentInfo, loggedIn, isPremium, premiumUntil }: { priceText: string; paymentInfo: string; loggedIn: boolean; isPremium: boolean; premiumUntil: string | null }) {
  const { toast } = useAuth();
  const [items, setItems] = useState<Req[] | null>(null);
  const [months, setMonths] = useState('1');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const load = () => api<{ items: Req[] }>('/api/premium').then((r) => setItems(r.data?.items ?? []));
  useEffect(() => {
    if (loggedIn) load();
  }, [loggedIn]);

  if (!loggedIn)
    return (
      <Card className="text-center">
        <p className="font-semibold">Premium talebi için önce giriş yap</p>
        <div className="mt-4 flex justify-center gap-3">
          <LinkButton href="/kayit?next=/premium">Ücretsiz üye ol</LinkButton>
          <LinkButton href="/giris?next=/premium" variant="secondary">Giriş yap</LinkButton>
        </div>
      </Card>
    );

  if (isPremium)
    return (
      <Notice kind="success">
        Premium üyeliğin aktif{premiumUntil ? ` (${fmtDate(premiumUntil)} tarihine kadar)` : ''}. Tüm analizlerin keyfini çıkar!
      </Notice>
    );

  const pending = items?.find((i) => i.status === 'pending');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await api('/api/premium', { body: { months: Number(months), note } });
    setBusy(false);
    setErr(error);
    if (!error) {
      toast('Premium talebin alındı. Ödeme bilgileri için seninle iletişime geçeceğiz.');
      setNote('');
      load();
    }
  };

  return (
    <Card>
      <h2 className="text-lg font-bold">Premium talebi oluştur</h2>
      <p className="mt-1 text-sm text-slate-400">{paymentInfo}</p>
      {pending ? (
        <div className="mt-4">
          <Notice>Bekleyen bir talebin var ({pending.months} ay, {fmtDate(pending.created_at)}). Ekibimiz en kısa sürede dönüş yapacak.</Notice>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-[200px_1fr]">
          {err && <div className="sm:col-span-2"><Notice kind="error">{err}</Notice></div>}
          <Field label="Süre" hint={priceText}>
            <Select value={months} onChange={(e) => setMonths(e.target.value)}>
              {[1, 3, 6, 12].map((m) => <option key={m} value={m}>{m} ay</option>)}
            </Select>
          </Field>
          <Field label="Not (isteğe bağlı)">
            <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Tercih ettiğin ödeme yöntemi vb." />
          </Field>
          <div className="sm:col-span-2"><Button type="submit" loading={busy}>Talep gönder</Button></div>
        </form>
      )}
      {items && items.length > 0 && (
        <div className="mt-6 border-t border-white/5 pt-4">
          <p className="label-muted mb-2">Taleplerim</p>
          <ul className="space-y-2 text-sm">
            {items.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-2">
                <span className="text-slate-300">{fmtDate(i.created_at)} · {i.months} ay</span>
                <Badge color={STATUS_TR[i.status]?.color}>{STATUS_TR[i.status]?.label ?? i.status}</Badge>
                {i.admin_note && <span className="text-slate-400">— {i.admin_note}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
