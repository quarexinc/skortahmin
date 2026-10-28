'use client';

import { TicketPercent } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Button, Card, Input, Notice } from '@/components/ui';
import { api } from '@/lib/client';

export default function PromoRedeem() {
  const { user, refresh, toast } = useAuth();
  const router = useRouter();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  if (!user || user.isAdmin) return null;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await api<{ months: number }>('/api/promo', { body: { code } });
    setBusy(false);
    setErr(error);
    if (data) {
      toast(`${data.months} aylık Premium hesabına tanımlandı!`);
      setCode('');
      await refresh();
      router.refresh();
    }
  };
  return (
    <Card>
      <h2 className="flex items-center gap-2 text-lg font-bold"><TicketPercent size={20} className="text-accent-soft" /> Promosyon kodun mu var?</h2>
      <form onSubmit={submit} className="mt-4 flex flex-wrap gap-2">
        <div className="min-w-[200px] flex-1">
          <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="SKOR-XXXXXX" className="font-mono tracking-wider" maxLength={40} required />
        </div>
        <Button type="submit" loading={busy}>Kodu kullan</Button>
      </form>
      {err && <div className="mt-3"><Notice kind="error">{err}</Notice></div>}
    </Card>
  );
}
