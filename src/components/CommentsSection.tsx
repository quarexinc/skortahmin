'use client';
import { Gem, MessageSquare, ShieldCheck } from 'lucide-react';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api, timeAgo } from '@/lib/client';
import { useAuth } from './AuthProvider';
import { Avatar, Button, Empty, Notice, Spinner, Textarea } from './ui';

interface C { id: number; body: string; created_at: string; user_id: number; name: string; avatar_color: string; premium: boolean; admin: boolean }

export default function CommentsSection({ fixtureId }: { fixtureId: number }) {
  const { user, toast } = useAuth();
  const [items, setItems] = useState<C[] | null>(null);
  const [meta, setMeta] = useState({ isAdmin: false, enabled: true });
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await api<{ items: C[]; isAdmin: boolean; enabled: boolean }>(`/api/comments?fixture=${fixtureId}`);
    if (error) return setErr(error);
    setItems(data!.items);
    setMeta({ isAdmin: data!.isAdmin, enabled: data!.enabled });
  }, [fixtureId]);
  useEffect(() => {
    load();
  }, [load]);

  const post = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await api('/api/comments', { body: { fixtureId, body: text } });
    setBusy(false);
    if (error) return toast(error, 'error');
    setText('');
    load();
  };
  const del = async (id: number) => {
    if (!confirm('Yorum silinsin mi?')) return;
    await api(`/api/comments?id=${id}`, { method: 'DELETE' });
    load();
  };
  const report = async (id: number) => {
    const { error } = await api('/api/comments/report', { body: { id } });
    toast(error ?? 'Şikâyetin alındı, teşekkürler.', error ? 'error' : 'info');
  };

  if (err) return <Notice kind="error">{err}</Notice>;
  return (
    <div className="space-y-4">
      {meta.enabled &&
        (user ? (
          <form onSubmit={post} className="card space-y-3 p-4">
            <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={600} placeholder="Bu maç hakkında ne düşünüyorsun? (saygılı ol, bağlantı paylaşma)" required minLength={2} />
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">{text.length}/600</span>
              <Button type="submit" size="sm" loading={busy}>Yorum yap</Button>
            </div>
          </form>
        ) : (
          <div className="card p-4 text-sm text-slate-400">
            Yorum yapmak için <Link href={`/giris?next=/mac/${fixtureId}`} className="text-accent-soft underline">giriş yap</Link>.
          </div>
        ))}
      {!meta.enabled && <Notice>Yorumlar yönetici tarafından geçici olarak kapatıldı.</Notice>}
      {items == null ? (
        <Spinner />
      ) : items.length === 0 ? (
        <Empty icon={MessageSquare} title="Henüz yorum yok">Maç hakkındaki ilk yorumu sen yaz.</Empty>
      ) : (
        <div className="card divide-y divide-white/5 p-0">
          {items.map((c) => (
            <div key={c.id} className="flex gap-3 p-4">
              <Avatar name={c.name} color={c.avatar_color} size={34} />
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="font-semibold">{c.name}</span>
                  {c.admin && <span className="ml-1.5 inline-flex items-center gap-0.5 text-[11px] text-violet-300"><ShieldCheck size={12} /> Yönetici</span>}
                  {!c.admin && c.premium && <Gem size={12} className="ml-1.5 inline text-amber-300" aria-label="Premium" />}
                  <span className="ml-2 text-xs text-slate-500">{timeAgo(c.created_at)}</span>
                </p>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-200">{c.body}</p>
                {user && (
                  <div className="mt-1.5 flex gap-3 text-xs text-slate-500">
                    {(c.user_id === user.id || meta.isAdmin) && <button onClick={() => del(c.id)} className="hover:text-red-300">Sil</button>}
                    {c.user_id !== user.id && <button onClick={() => report(c.id)} className="hover:text-amber-300">Şikâyet et</button>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
