'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/client';
import { useAuth, type ClientUser } from './AuthProvider';
import { Button, Field, Input, Notice } from './ui';

export default function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const { setUser, refresh, toast, enabled } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || (mode === 'register' ? '/hesap' : '/');
  const [form, setForm] = useState({ name: '', email: '', password: '', password2: '', acceptTerms: false });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const strength = (() => {
    const p = form.password;
    let s = 0;
    if (p.length >= 8) s++;
    if (p.length >= 12) s++;
    if (/[a-zçğıöşü]/.test(p) && /[A-ZÇĞİÖŞÜ]/.test(p)) s++;
    if (/\d/.test(p)) s++;
    if (/[^A-Za-z0-9çğıöşüÇĞİÖŞÜ]/.test(p)) s++;
    return s;
  })();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === 'register' && form.password !== form.password2) return setError('Şifreler eşleşmiyor.');
    setLoading(true);
    const { data, error } = await api<{ user: ClientUser }>(mode === 'login' ? '/api/auth/login' : '/api/auth/register', {
      body: mode === 'login' ? { email: form.email, password: form.password } : form,
    });
    setLoading(false);
    if (error || !data) return setError(error);
    setUser(data.user);
    await refresh();
    toast(mode === 'login' ? `Tekrar hoş geldin, ${data.user.name.split(' ')[0]}!` : 'Hesabın oluşturuldu. Hoş geldin! 🎉');
    router.push(data.user.isAdmin && mode === 'login' && !params.get('next') ? '/admin' : next);
    router.refresh();
  };

  if (!enabled)
    return <Notice kind="info">Üyelik sistemi henüz yapılandırılıyor. Lütfen daha sonra tekrar deneyin.</Notice>;

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <Notice kind="error">{error}</Notice>}
      {mode === 'register' && (
        <Field label="Ad soyad">
          <Input value={form.name} onChange={set('name')} required minLength={2} maxLength={60} autoComplete="name" placeholder="Adın Soyadın" />
        </Field>
      )}
      <Field label="E-posta">
        <Input type="email" value={form.email} onChange={set('email')} required autoComplete="email" placeholder="ornek@eposta.com" />
      </Field>
      <Field label="Şifre" hint={mode === 'register' ? 'En az 8 karakter, en az bir harf ve bir rakam.' : undefined}>
        <div className="relative">
          <Input
            type={showPw ? 'text' : 'password'}
            value={form.password}
            onChange={set('password')}
            required
            minLength={mode === 'register' ? 8 : 1}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            className="pr-16"
          />
          <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white">
            {showPw ? 'Gizle' : 'Göster'}
          </button>
        </div>
        {mode === 'register' && form.password && (
          <div className="mt-2 flex gap-1" aria-label="Şifre gücü">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full ${i < strength ? (strength <= 2 ? 'bg-red-400' : strength === 3 ? 'bg-amber-400' : 'bg-accent') : 'bg-white/10'}`}
              />
            ))}
          </div>
        )}
      </Field>
      {mode === 'register' && (
        <>
          <Field label="Şifre (tekrar)">
            <Input type={showPw ? 'text' : 'password'} value={form.password2} onChange={set('password2')} required autoComplete="new-password" />
          </Field>
          <label className="flex items-start gap-2.5 text-sm text-slate-300">
            <input type="checkbox" checked={form.acceptTerms} onChange={set('acceptTerms')} className="mt-0.5 h-4 w-4 accent-[#22c55e]" />
            <span>
              18 yaşından büyüğüm;{' '}
              <Link href="/kullanim-kosullari" target="_blank" className="text-accent-soft underline">
                kullanım koşullarını
              </Link>{' '}
              ve{' '}
              <Link href="/kvkk" target="_blank" className="text-accent-soft underline">
                KVKK aydınlatma metnini
              </Link>{' '}
              okudum, kabul ediyorum.
            </span>
          </label>
        </>
      )}
      <Button type="submit" loading={loading} className="w-full" size="lg">
        {mode === 'login' ? 'Giriş yap' : 'Hesap oluştur'}
      </Button>
      {mode === 'login' && (
        <p className="text-center text-xs text-slate-500">
          Şifreni mi unuttun?{' '}
          <Link href="/iletisim?konu=sifre" className="text-accent-soft underline">
            Bize yaz
          </Link>
          , hesabını doğrulayıp sıfırlayalım.
        </p>
      )}
    </form>
  );
}
