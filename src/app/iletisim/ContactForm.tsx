'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Button, Field, Input, Notice, Select, Textarea } from '@/components/ui';
import { api } from '@/lib/client';

export default function ContactForm() {
  const { user } = useAuth();
  const params = useSearchParams();
  const pw = params.get('konu') === 'sifre';
  const [f, setF] = useState({
    name: '',
    email: '',
    category: pw ? 'hesap' : 'genel',
    subject: pw ? 'Şifre sıfırlama talebi' : '',
    message: '',
    website: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ ticketId: number; member: boolean } | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF((x) => ({ ...x, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { data, error } = await api<{ ticketId: number; member: boolean }>('/api/contact', { body: f });
    setLoading(false);
    if (error || !data) return setError(error);
    setDone(data);
  };

  if (done)
    return (
      <Notice kind="success">
        Mesajın bize ulaştı (talep no: #{done.ticketId}).{' '}
        {done.member ? (
          <>
            Yanıtları <Link href={`/destek/${done.ticketId}`} className="underline">destek talebinden</Link> takip edebilirsin.
          </>
        ) : (
          'En kısa sürede e-posta adresine dönüş yapacağız.'
        )}
      </Notice>
    );

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <Notice kind="error">{error}</Notice>}
      {!user && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ad soyad">
            <Input value={f.name} onChange={set('name')} required maxLength={60} />
          </Field>
          <Field label="E-posta" hint={pw ? 'Hesabına kayıtlı e-posta adresini yaz.' : undefined}>
            <Input type="email" value={f.email} onChange={set('email')} required />
          </Field>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
        <Field label="Kategori">
          <Select value={f.category} onChange={set('category')}>
            <option value="genel">Genel</option>
            <option value="hesap">Hesap & giriş</option>
            <option value="oyun">Oyun & krediler</option>
            <option value="adil">Adil oyun</option>
            <option value="sorumlu">Sorumlu oyun</option>
            <option value="hata">Hata bildirimi</option>
            <option value="oneri">Öneri</option>
          </Select>
        </Field>
        <Field label="Konu">
          <Input value={f.subject} onChange={set('subject')} required minLength={3} maxLength={120} />
        </Field>
      </div>
      <Field label="Mesaj">
        <Textarea value={f.message} onChange={set('message')} required minLength={10} maxLength={4000} rows={6} />
      </Field>
      <input type="text" name="website" value={f.website} onChange={set('website')} className="hidden" tabIndex={-1} autoComplete="off" />
      <Button type="submit" loading={loading}>
        Gönder
      </Button>
    </form>
  );
}
