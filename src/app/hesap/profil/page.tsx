'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Avatar, Button, Card, Field, Input, Notice, PageHeader, Select, Textarea } from '@/components/ui';
import { api } from '@/lib/client';

const COLORS = ['#22c55e', '#38bdf8', '#f59e0b', '#a78bfa', '#f472b6', '#2dd4bf', '#fb7185', '#facc15', '#60a5fa'];

export default function ProfilePage() {
  const { user, setUser, toast } = useAuth();
  const router = useRouter();
  const [p, setP] = useState({ name: '', favoriteGame: '', bio: '', avatarColor: '#22c55e' });
  const [pw, setPw] = useState({ current: '', next: '', next2: '' });
  const [del, setDel] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<Record<string, string | null>>({});

  useEffect(() => {
    if (user) setP({ name: user.name, favoriteGame: user.favoriteGame ?? '', bio: user.bio ?? '', avatarColor: user.avatarColor });
  }, [user]);
  if (!user) return null;

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy('profile');
    const { data, error } = await api('/api/account', { method: 'PATCH', body: p });
    setBusy(null);
    setErr((x) => ({ ...x, profile: error }));
    if (data) {
      setUser(data.user);
      toast('Profil güncellendi.');
      router.refresh();
    }
  };
  const changePw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.next !== pw.next2) return setErr((x) => ({ ...x, pw: 'Yeni şifreler eşleşmiyor.' }));
    setBusy('pw');
    const { error } = await api('/api/account/password', { body: { current: pw.current, next: pw.next } });
    setBusy(null);
    setErr((x) => ({ ...x, pw: error }));
    if (!error) {
      setPw({ current: '', next: '', next2: '' });
      toast('Şifren değiştirildi. Diğer cihazlardaki oturumlar kapatıldı.');
    }
  };
  const logoutAll = async () => {
    setBusy('all');
    const { error } = await api('/api/account/logout-all', { body: {} });
    setBusy(null);
    toast(error ?? 'Diğer tüm cihazlardaki oturumlar kapatıldı.', error ? 'error' : 'success');
  };
  const remove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm('Hesabın ve tüm verilerin kalıcı olarak silinecek. Emin misin?')) return;
    setBusy('del');
    const { error } = await api('/api/account', { method: 'DELETE', body: { password: del } });
    setBusy(null);
    setErr((x) => ({ ...x, del: error }));
    if (!error) {
      setUser(null);
      toast('Hesabın silindi. Görüşmek üzere!', 'info');
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Profil & ayarlar" subtitle={user.email} />

      <Card>
        <h2 className="mb-4 font-bold">Profil bilgileri</h2>
        <form onSubmit={saveProfile} className="space-y-4">
          {err.profile && <Notice kind="error">{err.profile}</Notice>}
          <div className="flex items-center gap-4">
            <Avatar name={p.name || user.name} color={p.avatarColor} size={56} />
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Profil rengi">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={c}
                  onClick={() => setP((x) => ({ ...x, avatarColor: c }))}
                  className={`h-7 w-7 rounded-full ring-offset-2 ring-offset-ink-800 ${p.avatarColor === c ? 'ring-2 ring-white' : ''}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ad soyad">
              <Input value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} required maxLength={60} />
            </Field>
            <Field label="Favori oyun">
              <Select value={p.favoriteGame} onChange={(e) => setP({ ...p, favoriteGame: e.target.value })}>
                <option value="">Seçilmedi</option>
                <option value="crash">Crash</option>
                <option value="mines">Mines</option>
                <option value="slots">Slots</option>
                <option value="blackjack">Blackjack</option>
              </Select>
            </Field>
          </div>
          <Field label="Hakkımda" hint={`${p.bio.length}/280`}>
            <Textarea value={p.bio} onChange={(e) => setP({ ...p, bio: e.target.value })} maxLength={280} rows={3} />
          </Field>
          <Button type="submit" loading={busy === 'profile'}>Kaydet</Button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-4 font-bold">Şifre değiştir</h2>
        <form onSubmit={changePw} className="grid gap-4 sm:grid-cols-3">
          {err.pw && <div className="sm:col-span-3"><Notice kind="error">{err.pw}</Notice></div>}
          <Field label="Mevcut şifre"><Input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} required autoComplete="current-password" /></Field>
          <Field label="Yeni şifre"><Input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} required minLength={8} autoComplete="new-password" /></Field>
          <Field label="Yeni şifre (tekrar)"><Input type="password" value={pw.next2} onChange={(e) => setPw({ ...pw, next2: e.target.value })} required autoComplete="new-password" /></Field>
          <div className="sm:col-span-3"><Button type="submit" loading={busy === 'pw'}>Şifreyi değiştir</Button></div>
        </form>
      </Card>

      <Card>
        <h2 className="font-bold">Oturumlar</h2>
        <p className="mt-1 text-sm text-slate-400">Hesabına başka bir cihazdan girildiğinden şüpheleniyorsan diğer tüm oturumları kapat.</p>
        <Button variant="secondary" className="mt-4" loading={busy === 'all'} onClick={logoutAll}>Diğer cihazlardan çıkış yap</Button>
      </Card>

      <Card className="border-red-500/20">
        <h2 className="font-bold text-red-300">Hesabı sil</h2>
        <p className="mt-1 text-sm text-slate-400">Bakiyen, kasan, oyun geçmişin, işlemlerin ve destek kayıtların kalıcı olarak silinir. Bu işlem geri alınamaz.</p>
        <form onSubmit={remove} className="mt-4 flex flex-wrap items-end gap-3">
          <div className="w-64"><Field label="Onay için şifren" error={err.del}><Input type="password" value={del} onChange={(e) => setDel(e.target.value)} required /></Field></div>
          <Button type="submit" variant="danger" loading={busy === 'del'}>Hesabımı kalıcı olarak sil</Button>
        </form>
      </Card>
    </div>
  );
}
