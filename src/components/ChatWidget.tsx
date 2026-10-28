'use client';
import { Headset, MessageCircle, X } from 'lucide-react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api, timeAgo } from '@/lib/client';
import { useAuth } from './AuthProvider';

interface Msg {
  id: number;
  sender: 'user' | 'admin';
  body: string;
  created_at: string;
}

export default function ChatWidget({ enabled, supportHours }: { enabled: boolean; supportHours: string }) {
  const { user, unread, refresh } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [status, setStatus] = useState<'open' | 'closed' | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const lastId = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (reset = false) => {
    if (reset) lastId.current = 0;
    const { data } = await api<{ messages: Msg[]; status: 'open' | 'closed' | null }>(`/api/chat?after=${lastId.current}`);
    if (!data) return;
    setStatus(data.status);
    if (data.messages.length > 0) {
      lastId.current = data.messages[data.messages.length - 1].id;
      setMsgs((m) => (reset ? data.messages : [...m, ...data.messages]));
    } else if (reset) setMsgs([]);
  }, []);

  useEffect(() => {
    if (!open || !user) return;
    load(true).then(refresh);
    const t = setInterval(() => document.visibilityState === 'visible' && load(), 4000);
    return () => clearInterval(t);
  }, [open, user, load, refresh]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs.length, open]);

  if (!enabled || pathname.startsWith('/admin')) return null;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setSending(true);
    setErr(null);
    const { error } = await api('/api/chat', { body: { body } });
    setSending(false);
    if (error) return setErr(error);
    setText('');
    await load();
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Canlı destek"
        className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-accent text-ink-950 shadow-xl shadow-accent/20 transition hover:scale-105"
      >
        {open ? <X size={24} /> : <MessageCircle size={26} />}
        {!open && unread.chat > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
            {unread.chat}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed bottom-24 right-4 z-50 flex h-[min(32rem,calc(100vh-8rem))] w-[min(22rem,calc(100vw-2rem))] animate-fade-in flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink-800 shadow-2xl shadow-black/60">
          <div className="border-b border-white/5 bg-ink-700/60 px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <span className="h-2 w-2 rounded-full bg-accent" /> Canlı destek
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">Çalışma saatleri: {supportHours}</p>
          </div>

          {!user ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-sm text-slate-300">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent/15 text-accent-soft"><Headset size={24} /></span>
              Canlı destekle yazışmak için giriş yapın.
              <div className="flex gap-2">
                <Link href="/giris" onClick={() => setOpen(false)} className="rounded-xl bg-accent px-4 py-2 font-semibold text-ink-950">
                  Giriş yap
                </Link>
                <Link href="/iletisim" onClick={() => setOpen(false)} className="rounded-xl border border-white/10 px-4 py-2">
                  Mesaj bırak
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto p-4">
                <div className="rounded-xl bg-ink-900/70 p-3 text-xs text-slate-400">
                  Merhaba {user.name.split(' ')[0]}! Sorunu yaz, ekibimiz buradan yanıtlasın. Daha ayrıntılı konular için{' '}
                  <Link href="/destek/yeni" onClick={() => setOpen(false)} className="text-accent-soft underline">
                    destek talebi
                  </Link>{' '}
                  açabilirsin.
                </div>
                {msgs.map((m) => (
                  <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                        m.sender === 'user' ? 'rounded-br-md bg-accent text-ink-950' : 'rounded-bl-md bg-ink-600 text-slate-100'
                      }`}
                    >
                      {m.sender === 'admin' && <p className="mb-0.5 text-[10px] font-semibold text-accent-soft">Destek ekibi</p>}
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      <p className={`mt-0.5 text-[10px] ${m.sender === 'user' ? 'text-ink-950/60' : 'text-slate-400'}`}>
                        {timeAgo(m.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
                {status === 'closed' && (
                  <p className="text-center text-[11px] text-slate-500">Bu görüşme kapatıldı. Yeni mesaj yeni bir görüşme başlatır.</p>
                )}
              </div>
              <form onSubmit={send} className="border-t border-white/5 p-3">
                {err && <p className="mb-2 text-xs text-red-300">{err}</p>}
                <div className="flex gap-2">
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    maxLength={1000}
                    placeholder="Mesajını yaz…"
                    className="min-w-0 flex-1 rounded-xl border border-white/10 bg-ink-900 px-3 py-2 text-sm outline-none focus:border-accent/60"
                  />
                  <button disabled={sending || !text.trim()} className="rounded-xl bg-accent px-3 text-sm font-semibold text-ink-950 disabled:opacity-50">
                    Gönder
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
