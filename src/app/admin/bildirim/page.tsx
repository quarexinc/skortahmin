'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Button, Card, Field, Input, PageHeader, Select, Textarea } from '@/components/ui';
import { api } from '@/lib/client';

export default function Broadcast() {
  const { toast } = useAuth();
  const [f, setF] = useState({ audience: 'all', title: '', body: '', link: '' });
  const [busy, setBusy] = useState(false);
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm('Bildirim seçilen tüm üyelere gönderilecek. Devam edilsin mi?')) return;
    setBusy(true);
    const { data, error } = await api<{ sent: number }>('/api/admin/broadcast', { body: f });
    setBusy(false);
    if (error) return toast(error, 'error');
    toast(`${data!.sent} üyeye bildirim gönderildi.`);
    setF({ ...f, title: '', body: '', link: '' });
  };
  return (
    <div>
      <PageHeader title="Toplu bildirim" subtitle="Üyelerin bildirim zilinde görünür." />
      <Card>
        <form onSubmit={send} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
            <Field label="Hedef kitle"><Select value={f.audience} onChange={(e) => setF({ ...f, audience: e.target.value })}><option value="all">Tüm üyeler</option><option value="players">Oynamış üyeler</option><option value="vip">VIP (Gümüş I ve üzeri)</option><option value="inactive">14 gündür giriş yapmayanlar</option></Select></Field>
            <Field label="Başlık"><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required maxLength={120} /></Field>
          </div>
          <Field label="Metin"><Textarea rows={3} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} maxLength={400} /></Field>
          <Field label="Bağlantı (isteğe bağlı)" hint="Site içi yol, ör. /oyunlar/crash veya /cuzdan"><Input value={f.link} onChange={(e) => setF({ ...f, link: e.target.value })} placeholder="/cuzdan" /></Field>
          <Button type="submit" loading={busy}>Gönder</Button>
        </form>
      </Card>
    </div>
  );
}
