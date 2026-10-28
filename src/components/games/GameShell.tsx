'use client';

// Oyun sayfası iskeleti: giriş/yaş/mola kontrolleri + kontrol paneli + oyun alanı + canlı akış
import { Coffee, LogIn, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { LinkButton } from '@/components/ui';
import AgeVerify from './AgeVerify';
import LiveFeed from './LiveFeed';
import { GAME_META } from './meta';

export default function GameShell({ game, controls, board, fair }: { game: keyof typeof GAME_META; controls: ReactNode; board: ReactNode; fair?: ReactNode }) {
  const { user, enabled } = useAuth();
  const M = GAME_META[game];
  const head = (
    <div className="mb-5 flex flex-wrap items-center gap-3">
      <span className="grid h-11 w-11 place-items-center rounded-2xl" style={{ background: `${M.color}22`, color: M.color }}><M.icon size={24} /></span>
      <div>
        <h1 className="text-2xl font-black tracking-tight">{M.name}</h1>
        <p className="text-sm text-slate-400">{M.desc}</p>
      </div>
      <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs text-slate-400"><ShieldCheck size={14} className="text-accent-soft" /> Doğrulanabilir · {M.edge}</span>
    </div>
  );

  let gate: ReactNode = null;
  if (!enabled) gate = <p className="text-center text-slate-400">Oyunlar şu anda kullanılamıyor.</p>;
  else if (!user)
    gate = (
      <div className="card mx-auto max-w-md p-8 text-center">
        <LogIn size={30} className="mx-auto text-violet-300" />
        <h2 className="mt-3 text-xl font-black">Oynamak için giriş yap</h2>
        <p className="mt-2 text-sm text-slate-400">Üye olduğunda hesabına hoş geldin kredisi eklenir. Krediler sanaldır, gerçek değeri yoktur.</p>
        <div className="mt-5 flex justify-center gap-2">
          <LinkButton href={`/kayit?next=${M.href}`}>Üye ol</LinkButton>
          <LinkButton href={`/giris?next=${M.href}`} variant="secondary">Giriş yap</LinkButton>
        </div>
      </div>
    );
  else if (!user.ageVerified) gate = <AgeVerify />;
  else if (user.selfExcludedUntil)
    gate = (
      <div className="card mx-auto max-w-md p-8 text-center">
        <Coffee size={30} className="mx-auto text-amber-300" />
        <h2 className="mt-3 text-xl font-black">Moladasın</h2>
        <p className="mt-2 text-sm text-slate-400">
          Kendi belirlediğin mola {new Date(user.selfExcludedUntil).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })} tarihine kadar sürüyor. Bu süre erken bitirilemez.
        </p>
        <Link href="/sorumlu-oyun" className="mt-4 inline-block text-sm text-violet-300 underline">Sorumlu oyun hakkında</Link>
      </div>
    );

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {head}
      {gate ?? (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <div className="card h-fit space-y-4 p-5">{controls}</div>
          <div className="min-w-0">{board}</div>
        </div>
      )}
      {fair && !gate && <div className="mt-4">{fair}</div>}
      <div className="mt-6">
        <LiveFeed game={game} />
      </div>
      <p className="mt-6 text-center text-xs text-slate-500">
        BloxyBet yalnızca eğlence amaçlıdır. Krediler sanaldır; paraya, ürüne veya herhangi bir değere çevrilemez. 18+ ·{' '}
        <Link href="/sorumlu-oyun" className="underline">Sorumlu oyun</Link>
      </p>
    </main>
  );
}

export function FairBox({ fair }: { fair: { serverHash: string; clientSeed: string; nonce: number } | null }) {
  if (!fair) return null;
  return (
    <div className="card flex flex-wrap items-center gap-x-6 gap-y-2 p-4 text-xs text-slate-400">
      <span className="inline-flex items-center gap-1.5 font-semibold text-slate-300"><ShieldCheck size={14} className="text-accent-soft" /> Adil oyun</span>
      <span className="min-w-0 truncate">Sunucu hash: <code className="text-slate-300">{fair.serverHash.slice(0, 24)}…</code></span>
      <span>İstemci tohumu: <code className="text-slate-300">{fair.clientSeed}</code></span>
      <span>Nonce: <code className="text-slate-300">{fair.nonce}</code></span>
      <Link href="/adil-oyun" className="ml-auto text-violet-300 underline">Doğrula</Link>
    </div>
  );
}
