'use client';
import { CheckCircle2, ChevronLeft, ChevronRight, Gem, StickyNote, X, XCircle } from 'lucide-react';

import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Avatar, Badge, Button, Card, Field, Input, Notice, PageHeader, Select, Spinner } from '@/components/ui';
import { api, fmtDate, fmtDateTime, timeAgo } from '@/lib/client';

interface U {
  id: number;
  name: string;
  email: string;
  role: string;
  plan: string;
  premium_until: string | null;
  banned: boolean;
  ban_reason: string | null;
  created_at: string;
  last_login_at: string | null;
  avatar_color: string;
  predictions: number;
  points: number;
}

const premiumActive = (u: U) => u.plan === 'premium' && (!u.premium_until || new Date(u.premium_until).getTime() > Date.now());

function Detail({ id, onClose, onChanged }: { id: number; onClose: () => void; onChanged: () => void }) {
  const { user: me, toast } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [d, setD] = useState<any>(null);
  const [months, setMonths] = useState('1');
  const [reason, setReason] = useState('');
  const [temp, setTemp] = useState<string | null>(null);
  const load = useCallback(() => api(`/api/admin/users/${id}`).then((r) => setD(r.data)), [id]);
  useEffect(() => {
    setTemp(null);
    load();
  }, [load]);

  const act = async (action: string, extra: Record<string, unknown> = {}, confirmMsg?: string) => {
    if (confirmMsg && !confirm(confirmMsg)) return;
    const { data, error } = await api(`/api/admin/users/${id}`, { method: 'PATCH', body: { action, ...extra } });
    if (error) return toast(error, 'error');
    if (data?.tempPassword) setTemp(data.tempPassword);
    toast('İşlem uygulandı.');
    load();
    onChanged();
  };
  const remove = async () => {
    if (!confirm('Kullanıcı ve tüm verileri kalıcı olarak silinecek. Emin misin?')) return;
    const { error } = await api(`/api/admin/users/${id}`, { method: 'DELETE' });
    if (error) return toast(error, 'error');
    toast('Kullanıcı silindi.', 'info');
    onClose();
    onChanged();
  };

  if (!d) return <Card><Spinner /></Card>;
  const u: U & { favorite_team: string | null; bio: string | null } = d.user;
  const self = me?.id === u.id;
  return (
    <Card className="space-y-5">
      <div className="flex items-start gap-3">
        <Avatar name={u.name} color={u.avatar_color} size={48} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold">{u.name}</p>
          <p className="truncate text-sm text-slate-400">{u.email} · #{u.id}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {u.role === 'admin' && <Badge color="violet">Yönetici</Badge>}
            {premiumActive(u) ? <Badge color="amber"><Gem size={11} /> Premium{u.premium_until ? ` · ${fmtDate(u.premium_until)}` : ' · süresiz'}</Badge> : <Badge>Ücretsiz</Badge>}
            {u.banned && <Badge color="red">Askıda</Badge>}
          </div>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white" aria-label="Kapat"><X size={18} /></button>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-sm sm:grid-cols-5">
        {Object.entries({ Tahmin: d.stats.predictions, Puan: d.stats.points, Yorum: d.stats.comments, Kupon: d.stats.coupons, Talep: d.stats.tickets }).map(([k, v]) => (
          <div key={k} className="rounded-xl bg-ink-900 p-2"><p className="text-[11px] text-slate-500">{k}</p><p className="font-bold">{v as number}</p></div>
        ))}
      </div>
      <p className="text-xs text-slate-500">Kayıt: {fmtDateTime(u.created_at)} · Son giriş: {u.last_login_at ? timeAgo(u.last_login_at) : '—'}{u.favorite_team ? ` · Takım: ${u.favorite_team}` : ''}</p>
      {u.banned && u.ban_reason && <Notice kind="error">Askı sebebi: {u.ban_reason}</Notice>}

      <div className="space-y-3 border-t border-white/5 pt-4">
        <p className="label-muted">Premium</p>
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-36"><Select value={months} onChange={(e) => setMonths(e.target.value)}>
            {['1', '3', '6', '12', '0'].map((m) => <option key={m} value={m}>{m === '0' ? 'Süresiz' : `${m} ay ekle`}</option>)}
          </Select></div>
          <Button size="sm" onClick={() => act('grant_premium', { months: Number(months) })}>Premium tanımla</Button>
          {premiumActive(u) && <Button size="sm" variant="secondary" onClick={() => act('revoke_premium', {}, 'Premium kaldırılsın mı?')}>Premium&apos;u kaldır</Button>}
        </div>
      </div>

      <div className="space-y-3 border-t border-white/5 pt-4">
        <p className="label-muted">Hesap</p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => act('reset_password', {}, 'Geçici şifre oluşturulsun mu? Kullanıcının mevcut oturumları kapanır.')}>Şifre sıfırla</Button>
          <Button size="sm" variant="secondary" onClick={() => act('logout')}>Oturumlarını kapat</Button>
          {!self && (u.role === 'admin'
            ? <Button size="sm" variant="secondary" onClick={() => act('set_role', { role: 'user' }, 'Yönetici yetkisi kaldırılsın mı?')}>Yöneticilikten çıkar</Button>
            : <Button size="sm" variant="secondary" onClick={() => act('set_role', { role: 'admin' }, 'Bu kullanıcı yönetici yapılsın mı? Tüm panele erişebilecek.')}>Yönetici yap</Button>)}
        </div>
        {temp && (
          <Notice kind="success">
            Geçici şifre: <code className="select-all rounded bg-ink-900 px-1.5 py-0.5 font-mono">{temp}</code> — kullanıcıya güvenli bir kanaldan ilet; giriş yaptıktan sonra değiştirmesini söyle. Bu şifre bir daha gösterilmeyecek.
          </Notice>
        )}
      </div>

      {!self && (
        <div className="space-y-3 border-t border-white/5 pt-4">
          <p className="label-muted">Yaptırım</p>
          {u.banned ? (
            <Button size="sm" variant="secondary" onClick={() => act('unban')}>Askıyı kaldır</Button>
          ) : (
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-[200px] flex-1"><Field label="Sebep (kullanıcıya gösterilir)"><Input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} /></Field></div>
              <Button size="sm" variant="danger" onClick={() => act('ban', { reason }, 'Hesap askıya alınsın mı?')}>Askıya al</Button>
            </div>
          )}
          <Button size="sm" variant="danger" onClick={remove}>Kullanıcıyı sil</Button>
        </div>
      )}

      <UserNotes id={u.id} />

      {d.logins.length > 0 && (
        <div className="border-t border-white/5 pt-4">
          <p className="label-muted mb-2">Son giriş denemeleri</p>
          <ul className="space-y-1 text-xs text-slate-400">
            {d.logins.map((l: { ip: string; success: boolean; created_at: string }, i: number) => (
              <li key={i} className="flex items-center gap-1.5">{l.success ? <CheckCircle2 size={13} className="text-accent-soft" /> : <XCircle size={13} className="text-red-400" />} {fmtDateTime(l.created_at)} · {l.ip}</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

function UserNotes({ id }: { id: number }) {
  const [items, setItems] = useState<{ id: number; body: string; created_at: string; author: string | null }[]>([]);
  const [text, setText] = useState('');
  const load = useCallback(() => api<{ items: typeof items }>(`/api/admin/users/${id}/notes`).then((r) => setItems(r.data?.items ?? [])), [id]);
  useEffect(() => {
    load();
  }, [load]);
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    await api(`/api/admin/users/${id}/notes`, { body: { body: text } });
    setText('');
    load();
  };
  const del = async (nid: number) => {
    await api(`/api/admin/users/${id}/notes?note=${nid}`, { method: 'DELETE' });
    load();
  };
  return (
    <div className="space-y-3 border-t border-white/5 pt-4">
      <p className="label-muted flex items-center gap-1.5"><StickyNote size={13} /> Yönetici notları (kullanıcı görmez)</p>
      {items.map((n) => (
        <div key={n.id} className="rounded-xl bg-ink-900 p-3 text-sm">
          <p className="whitespace-pre-wrap">{n.body}</p>
          <p className="mt-1 flex justify-between text-[11px] text-slate-500">
            <span>{n.author ?? '—'} · {timeAgo(n.created_at)}</span>
            <button onClick={() => del(n.id)} className="hover:text-red-300">Sil</button>
          </p>
        </div>
      ))}
      <form onSubmit={add} className="flex gap-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Not ekle…" maxLength={1000} />
        <Button size="sm" type="submit">Ekle</Button>
      </form>
    </div>
  );
}

function UsersInner() {
  const params = useSearchParams();
  const [qText, setQText] = useState(params.get('q') ?? '');
  const [filter, setFilter] = useState(params.get('filter') ?? 'all');
  const [page, setPage] = useState(0);
  const [d, setD] = useState<{ items: U[]; total: number } | null>(null);
  const [sel, setSel] = useState<number | null>(params.get('q') && /^\d+$/.test(params.get('q')!) ? Number(params.get('q')) : null);

  const load = useCallback(() => {
    api<{ items: U[]; total: number }>(`/api/admin/users?q=${encodeURIComponent(qText)}&filter=${filter}&page=${page}`).then((r) => setD(r.data));
  }, [qText, filter, page]);
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div>
      <PageHeader title="Kullanıcılar" subtitle={d ? `${d.total} kayıt` : undefined} />
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="min-w-[220px] flex-1"><Input value={qText} onChange={(e) => { setQText(e.target.value); setPage(0); }} placeholder="Ad, e-posta veya #id ara…" /></div>
        {[['all', 'Tümü'], ['free', 'Ücretsiz'], ['premium', 'Premium'], ['admin', 'Yönetici'], ['banned', 'Askıda']].map(([k, l]) => (
          <button key={k} onClick={() => { setFilter(k); setPage(0); }} className={`chip ${filter === k ? 'chip-active' : ''}`}>{l}</button>
        ))}
      </div>
      <div className={`grid gap-4 ${sel ? 'xl:grid-cols-[1fr_420px]' : ''}`}>
        <div className="card overflow-x-auto p-0">
          {!d ? <Spinner /> : (
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Kullanıcı</th><th className="px-2 py-3">Durum</th><th className="px-2 py-3 text-right">Tahmin</th><th className="px-2 py-3">Kayıt</th><th className="px-4 py-3">Son giriş</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {d.items.map((u) => (
                  <tr key={u.id} onClick={() => setSel(u.id)} className={`cursor-pointer transition hover:bg-white/5 ${sel === u.id ? 'bg-violet-500/10' : ''}`}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={u.name} color={u.avatar_color} size={28} />
                        <div className="min-w-0"><p className="truncate font-medium">{u.name}</p><p className="truncate text-xs text-slate-500">{u.email}</p></div>
                      </div>
                    </td>
                    <td className="px-2 py-2.5"><div className="flex flex-wrap gap-1">
                      {u.role === 'admin' && <Badge color="violet">Yönetici</Badge>}
                      {premiumActive(u) && <Badge color="amber">Premium</Badge>}
                      {u.banned && <Badge color="red">Askıda</Badge>}
                      {u.role !== 'admin' && !premiumActive(u) && !u.banned && <Badge>Ücretsiz</Badge>}
                    </div></td>
                    <td className="px-2 py-2.5 text-right tabular-nums">{u.predictions} <span className="text-xs text-slate-500">({u.points}p)</span></td>
                    <td className="px-2 py-2.5 text-xs text-slate-400">{fmtDate(u.created_at)}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-400">{u.last_login_at ? timeAgo(u.last_login_at) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {d && d.total > 50 && (
            <div className="flex items-center justify-between border-t border-white/5 px-4 py-3 text-sm">
              <Button size="sm" variant="ghost" disabled={page === 0} onClick={() => setPage((p) => p - 1)}><ChevronLeft size={14} /> Önceki</Button>
              <span className="text-slate-500">Sayfa {page + 1} / {Math.ceil(d.total / 50)}</span>
              <Button size="sm" variant="ghost" disabled={(page + 1) * 50 >= d.total} onClick={() => setPage((p) => p + 1)}>Sonraki <ChevronRight size={14} /></Button>
            </div>
          )}
        </div>
        {sel && <div className="xl:sticky xl:top-20 xl:self-start"><Detail id={sel} onClose={() => setSel(null)} onChanged={load} /></div>}
      </div>
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense>
      <UsersInner />
    </Suspense>
  );
}
