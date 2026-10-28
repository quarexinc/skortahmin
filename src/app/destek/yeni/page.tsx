'use client';
import { ArrowLeft } from 'lucide-react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Button, Card, Field, Input, LinkButton, Notice, PageHeader, Select, Textarea } from '@/components/ui';
import { api } from '@/lib/client';

export default function NewTicket() {
  const { user, toast } = useAuth();
  const router = useRouter();
  const [f, setF] = useState({ subject: '', category: 'genel', priority: 'normal', message: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!user)
    return (
      <main className="mx-auto max-w-xl px-4 py-12 text-center">
        <p className="font-semibold">Destek talebi açmak için giriş yapmalısın.</p>
        <div className="mt-4 flex justify-center gap-2">
          <LinkButton href="/giris?next=/destek/yeni">Giriş yap</LinkButton>
          <LinkButton href="/iletisim" variant="secondary">İletişim formu</LinkButton>
        </div>
      </main>
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await api<{ id: number }>('/api/tickets', { body: f });
    setBusy(false);
    if (error || !data) return setErr(error);
    toast('Talebin oluşturuldu.');
    router.push(`/destek/${data.id}`);
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/destek" className="text-sm text-slate-400 hover:text-white"><ArrowLeft size={14} className="inline" /> Taleplerim</Link>
      <div className="mt-3"><PageHeader title="Yeni destek talebi" subtitle="Sorununu olabildiğince ayrıntılı anlat; ilgili oyun, el numarası veya sayfa bağlantısını eklemen çözümü hızlandırır." /></div>
      <Card>
        <form onSubmit={submit} className="space-y-4">
          {err && <Notice kind="error">{err}</Notice>}
          <Field label="Konu"><Input value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} required minLength={3} maxLength={120} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Kategori">
              <Select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
                <option value="genel">Genel</option>
                <option value="hesap">Hesap & giriş</option>
                <option value="oyun">Oyun & krediler</option>
                <option value="adil">Adil oyun</option>
                <option value="sorumlu">Sorumlu oyun</option>
                <option value="hata">Hata bildirimi</option>
                <option value="oneri">Öneri</option>
              </Select>
            </Field>
            <Field label="Öncelik" hint={user.vipLevel >= 4 ? 'Gümüş I ve üzeri VIP üyelerin talepleri öncelikli işlenir.' : undefined}>
              <Select value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })}>
                <option value="low">Düşük</option>
                <option value="normal">Normal</option>
                <option value="high">Yüksek</option>
                {user.vipLevel >= 4 && <option value="urgent">Acil</option>}
              </Select>
            </Field>
          </div>
          <Field label="Mesaj"><Textarea value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} rows={7} required minLength={10} maxLength={4000} /></Field>
          <Button type="submit" loading={busy}>Talebi gönder</Button>
        </form>
      </Card>
    </main>
  );
}
