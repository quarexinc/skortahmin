'use client';

import { ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Button, Field, Input, Notice } from '@/components/ui';
import { api } from '@/lib/client';

export default function AgeVerify() {
  const { refresh } = useAuth();
  const [d, setD] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await api('/api/account/age', { body: { birthDate: d } });
    setBusy(false);
    setErr(error);
    await refresh();
  };
  return (
    <div className="card mx-auto max-w-md p-6 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-400/15 text-amber-300"><ShieldAlert size={28} /></span>
      <h2 className="mt-4 text-xl font-black">18 yaş doğrulaması</h2>
      <p className="mt-2 text-sm text-slate-400">Oyunlar yalnızca 18 yaş ve üzerindekilere açıktır. Devam etmek için doğum tarihini gir. Bu bilgi bir kez girilir.</p>
      <form onSubmit={submit} className="mt-5 space-y-3 text-left">
        {err && <Notice kind="error">{err}</Notice>}
        <Field label="Doğum tarihi">
          <Input type="date" value={d} onChange={(e) => setD(e.target.value)} required />
        </Field>
        <Button type="submit" loading={busy} className="w-full">Doğrula</Button>
      </form>
    </div>
  );
}
