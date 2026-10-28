'use client';

import { CheckCircle2, Mail } from 'lucide-react';
import { useState } from 'react';
import { api } from '@/lib/client';

export default function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
  const [err, setErr] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('busy');
    const { error } = await api('/api/newsletter', { body: { email } });
    if (error) {
      setErr(error);
      setState('idle');
    } else setState('done');
  };
  if (state === 'done')
    return (
      <p className="flex items-center justify-center gap-2 text-sm text-accent-soft">
        <CheckCircle2 size={16} /> Bültene kaydoldun, teşekkürler!
      </p>
    );
  return (
    <form onSubmit={submit} className="space-y-2">
      <div className={`flex gap-2 ${compact ? '' : 'flex-col sm:flex-row'}`}>
        <div className="relative flex-1">
          <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-posta adresin"
            aria-label="E-posta adresi"
            className="w-full rounded-xl border border-white/10 bg-ink-900 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-accent/60"
          />
        </div>
        <button disabled={state === 'busy'} className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-accent-soft disabled:opacity-60">
          Abone ol
        </button>
      </div>
      {err && <p className="text-xs text-red-300">{err}</p>}
    </form>
  );
}
