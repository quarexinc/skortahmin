'use client';
import CannedPicker from '@/components/admin/CannedPicker';
import { Crown, MessagesSquare } from 'lucide-react';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Avatar, Badge, Button, Empty, PageHeader, Spinner } from '@/components/ui';
import { api, fmtDate, timeAgo } from '@/lib/client';
import { fmtCredits } from '@/lib/money';

interface Chat { id: number; status: string; admin_unread: number; last_message_at: string; user_id: number; name: string; email: string; avatar_color: string; vip: boolean; last_body: string | null; last_sender: string | null }
interface Msg { id: number; sender: 'user' | 'admin'; body: string; created_at: string }

const QUICK = [
  'Merhaba, size nasıl yardımcı olabilirim?',
  'Kontrol edip hemen dönüş yapıyorum.',
  'Bu konuyu daha ayrıntılı inceleyebilmemiz için lütfen bir destek talebi açın.',
  'Sorununuz çözüldüyse görüşmeyi kapatıyorum. İyi günler!',
];

function Conversation({ id, onChange }: { id: number; onChange: () => void }) {
  const { toast } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [chat, setChat] = useState<any>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const last = useRef(0);
  const box = useRef<HTMLDivElement>(null);

  const load = useCallback(async (reset = false) => {
    if (reset) last.current = 0;
    const { data } = await api<{ chat: unknown; messages: Msg[] }>(`/api/admin/chats/${id}?after=${last.current}`);
    if (!data) return;
    setChat(data.chat);
    if (data.messages.length) {
      last.current = data.messages[data.messages.length - 1].id;
      setMsgs((m) => (reset ? data.messages : [...m, ...data.messages]));
    } else if (reset) setMsgs([]);
  }, [id]);
  useEffect(() => {
    load(true).then(onChange);
    const t = setInterval(() => document.visibilityState === 'visible' && load(), 3500);
    return () => clearInterval(t);
  }, [load, onChange]);
  useEffect(() => {
    box.current?.scrollTo({ top: box.current.scrollHeight });
  }, [msgs.length]);

  const send = async (body: string) => {
    if (!body.trim()) return;
    const { error } = await api(`/api/admin/chats/${id}`, { body: { body } });
    if (error) return toast(error, 'error');
    setText('');
    load();
    onChange();
  };
  const setStatus = async (action: 'close' | 'reopen') => {
    await api(`/api/admin/chats/${id}`, { body: { action } });
    load(true);
    onChange();
  };

  if (!chat) return <div className="card"><Spinner /></div>;
  return (
    <div className="card flex h-[70vh] flex-col overflow-hidden p-0">
      <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3">
        <div className="min-w-0 flex-1">
          <Link href={`/admin/kullanicilar?q=${chat.user_id}`} className="font-semibold hover:text-violet-200">{chat.name}</Link>
          <p className="truncate text-xs text-slate-500">{chat.email} · bakiye {fmtCredits(chat.balance ?? 0, { compact: true })} · oynanan {fmtCredits(chat.wagered ?? 0, { compact: true })} · üye {fmtDate(chat.user_created)}</p>
        </div>
        {chat.status === 'open' ? (
          <Button size="sm" variant="secondary" onClick={() => setStatus('close')}>Görüşmeyi kapat</Button>
        ) : (
          <Button size="sm" variant="secondary" onClick={() => setStatus('reopen')}>Yeniden aç</Button>
        )}
      </div>
      <div ref={box} className="flex-1 space-y-2 overflow-y-auto p-4">
        {msgs.map((m) => (
          <div key={m.id} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.sender === 'admin' ? 'rounded-br-md bg-violet-500/80 text-white' : 'rounded-bl-md bg-ink-600'}`}>
              <p className="whitespace-pre-wrap break-words">{m.body}</p>
              <p className="mt-0.5 text-[10px] opacity-60">{timeAgo(m.created_at)}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-white/5 p-3">
        <div className="no-scrollbar mb-2 flex gap-1.5 overflow-x-auto">
          {QUICK.map((q) => <button key={q} onClick={() => send(q)} className="shrink-0 rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-slate-400 hover:text-white">{q.slice(0, 34)}…</button>)}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="flex gap-2">
          <CannedPicker up onPick={(b) => setText(b)} />
          <input value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} placeholder="Yanıt yaz…" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-ink-900 px-3 py-2 text-sm outline-none focus:border-violet-400/60" />
          <Button type="submit" disabled={!text.trim()}>Gönder</Button>
        </form>
      </div>
    </div>
  );
}

export default function LiveChatAdmin() {
  const [status, setStatus] = useState('open');
  const [items, setItems] = useState<Chat[] | null>(null);
  const [sel, setSel] = useState<number | null>(null);
  const load = useCallback(() => api<{ items: Chat[] }>(`/api/admin/chats?status=${status}`).then((r) => setItems(r.data?.items ?? [])), [status]);
  useEffect(() => {
    load();
    const t = setInterval(() => document.visibilityState === 'visible' && load(), 5000);
    return () => clearInterval(t);
  }, [load]);
  return (
    <div>
      <PageHeader title="Canlı destek" subtitle="Mesajlar birkaç saniyede bir otomatik yenilenir." />
      <div className="mb-4 flex gap-2">
        {[['open', 'Açık'], ['closed', 'Kapalı'], ['all', 'Tümü']].map(([k, l]) => <button key={k} onClick={() => setStatus(k)} className={`chip ${status === k ? 'chip-active' : ''}`}>{l}</button>)}
      </div>
      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <div className="card max-h-[70vh] divide-y divide-white/5 overflow-y-auto p-0">
          {!items ? <Spinner /> : items.length === 0 ? <p className="p-6 text-center text-sm text-slate-500">Görüşme yok</p> : items.map((c) => (
            <button key={c.id} onClick={() => setSel(c.id)} className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-white/5 ${sel === c.id ? 'bg-violet-500/10' : ''}`}>
              <Avatar name={c.name} color={c.avatar_color} size={32} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-sm font-semibold"><span className="truncate">{c.name}</span>{c.vip && <Crown size={12} className="shrink-0 text-amber-300" />}</p>
                <p className="truncate text-xs text-slate-500">{c.last_sender === 'admin' ? 'Siz: ' : ''}{c.last_body}</p>
                <p className="text-[10px] text-slate-600">{timeAgo(c.last_message_at)}</p>
              </div>
              {c.admin_unread > 0 && <Badge color="red">{c.admin_unread}</Badge>}
            </button>
          ))}
        </div>
        {sel ? <Conversation id={sel} onChange={load} /> : <Empty icon={MessagesSquare} title="Bir görüşme seç">Soldaki listeden yanıtlamak istediğin görüşmeyi aç.</Empty>}
      </div>
    </div>
  );
}
