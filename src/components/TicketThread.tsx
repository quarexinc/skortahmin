'use client';
import CannedPicker from './admin/CannedPicker';
import { ArrowLeft } from 'lucide-react';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import { Avatar, Badge, Button, Card, CATEGORY_TR, Notice, PRIORITY_TR, Select, Spinner, STATUS_TR, Textarea } from './ui';
import { api, fmtDateTime } from '@/lib/client';

interface Ticket {
  id: number;
  subject: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  user_id: number | null;
  user_name: string | null;
  user_email: string | null;
  user_vip: boolean | null;
  guest_name: string | null;
  guest_email: string | null;
}
interface Msg { id: number; body: string; is_staff: boolean; created_at: string; author_name: string | null; avatar_color: string | null }

export default function TicketThread({ id, staff = false }: { id: number; staff?: boolean }) {
  const { toast } = useAuth();
  const [t, setT] = useState<Ticket | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await api<{ ticket: Ticket; messages: Msg[] }>(`/api/tickets/${id}`);
    if (error) return setErr(error);
    setT(data!.ticket);
    setMsgs(data!.messages);
  }, [id]);
  useEffect(() => {
    load();
  }, [load]);

  if (err) return <Notice kind="error">{err}</Notice>;
  if (!t) return <Spinner />;

  const reply = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await api(`/api/tickets/${id}`, { body: { body: text } });
    setBusy(false);
    if (error) return toast(error, 'error');
    setText('');
    load();
  };
  const patch = async (b: Record<string, string>) => {
    const { error } = await api(`/api/tickets/${id}`, { method: 'PATCH', body: b });
    if (error) return toast(error, 'error');
    toast('Güncellendi.');
    load();
  };

  const who = t.user_name ?? t.guest_name ?? 'Ziyaretçi';
  return (
    <div className="space-y-5">
      <Link href={staff ? '/admin/destek' : '/destek'} className="text-sm text-slate-400 hover:text-white"><ArrowLeft size={14} className="inline" /> Taleplere dön</Link>
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-slate-500">#{t.id} · {CATEGORY_TR[t.category] ?? t.category} · {fmtDateTime(t.created_at)}</p>
            <h1 className="mt-1 text-xl font-bold">{t.subject}</h1>
            {staff && (
              <p className="mt-1 text-sm text-slate-400">
                {who} · {t.user_email ?? t.guest_email}
                {t.user_vip && ' · VIP (öncelikli)'}
                {!t.user_id && ' · üye değil (e-postayla yanıtlayın)'}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge color={STATUS_TR[t.status]?.color}>{STATUS_TR[t.status]?.label ?? t.status}</Badge>
            <Badge color={PRIORITY_TR[t.priority]?.color}>{PRIORITY_TR[t.priority]?.label ?? t.priority}</Badge>
          </div>
        </div>
        {staff && (
          <div className="mt-4 flex flex-wrap gap-3 border-t border-white/5 pt-4">
            <div className="w-40"><Select value={t.status} onChange={(e) => patch({ status: e.target.value })}>
              {['open', 'answered', 'waiting', 'closed'].map((s) => <option key={s} value={s}>{STATUS_TR[s].label}</option>)}
            </Select></div>
            <div className="w-40"><Select value={t.priority} onChange={(e) => patch({ priority: e.target.value })}>
              {['low', 'normal', 'high', 'urgent'].map((s) => <option key={s} value={s}>{PRIORITY_TR[s].label}</option>)}
            </Select></div>
          </div>
        )}
      </Card>

      <div className="space-y-3">
        {msgs.map((m) => (
          <div key={m.id} className={`card flex gap-3 p-4 ${m.is_staff ? 'border-accent/25 bg-accent/5' : ''}`}>
            <Avatar name={m.is_staff ? 'Destek' : m.author_name ?? who} color={m.is_staff ? '#22c55e' : m.avatar_color ?? '#64748b'} size={34} />
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                <span className="font-semibold">{m.is_staff ? 'Destek ekibi' : m.author_name ?? who}</span>
                <span className="ml-2 text-xs text-slate-500">{fmtDateTime(m.created_at)}</span>
              </p>
              <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-200">{m.body}</p>
            </div>
          </div>
        ))}
      </div>

      {t.status === 'closed' && !staff ? (
        <Card className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="text-slate-400">Bu talep kapatıldı.</span>
          <Button size="sm" variant="secondary" onClick={() => patch({ status: 'open' })}>Talebi yeniden aç</Button>
        </Card>
      ) : (
        <Card>
          <form onSubmit={reply} className="space-y-3">
            <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder={staff ? 'Kullanıcıya yanıt yaz…' : 'Mesajını yaz…'} required minLength={2} maxLength={4000} />
            <div className="flex flex-wrap gap-2">
              <Button type="submit" loading={busy}>{staff ? 'Yanıtla' : 'Gönder'}</Button>
              {staff && <CannedPicker up onPick={(b) => setText((t) => (t ? `${t}\n\n${b}` : b))} />}
              {t.status !== 'closed' && (
                <Button type="button" variant="ghost" onClick={() => patch({ status: 'closed' })}>Talebi kapat</Button>
              )}
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
