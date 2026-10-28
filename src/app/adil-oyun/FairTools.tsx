'use client';

import { Bomb, CheckCircle2, Copy, RefreshCw, Rocket, ShieldCheck, Spade, Cherry, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Button, Card, Field, Input, Select, Spinner } from '@/components/ui';
import { handValue, rank, shuffle, suit } from '@/lib/games/blackjack';
import { minePositions, minesMultiplier } from '@/lib/games/mines';
import { evaluate, spinGrid } from '@/lib/games/slots';
import { fmtDateTime } from '@/lib/client';
import { api } from '@/lib/client';
import { fmtMult } from '@/lib/money';

interface Seeds { serverHash: string; clientSeed: string; nonce: number; previous: { server_seed: string; server_hash: string; client_seed: string; nonce: number; revealed_at: string }[] }

const enc = new TextEncoder();
const hex = (b: ArrayBuffer) => Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, '0')).join('');
async function hmac(key: string, msg: string) {
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(msg)));
}
const sha256 = async (s: string) => hex(await crypto.subtle.digest('SHA-256', enc.encode(s)));
async function floats(server: string, client: string, nonce: number, count: number) {
  const out: number[] = [];
  let cursor = 0;
  while (out.length < count) {
    const b = await hmac(server, `${client}:${nonce}:${cursor}`);
    for (let i = 0; i + 4 <= b.length && out.length < count; i += 4) out.push(b[i] / 256 + b[i + 1] / 256 ** 2 + b[i + 2] / 256 ** 3 + b[i + 3] / 256 ** 4);
    cursor++;
  }
  return out;
}
async function crashPoint(seed: string) {
  const h = hex((await hmac(seed, 'crash')).buffer as ArrayBuffer);
  const r = parseInt(h.slice(0, 13), 16) / 2 ** 52;
  return Math.min(1000, Math.max(1, Math.floor(99 / (1 - r)) / 100));
}
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUITS = ['♠', '♥', '♦', '♣'];
const card = (c: number) => `${RANKS[rank(c)]}${SUITS[suit(c)]}`;

type Game = 'mines' | 'slots' | 'blackjack' | 'crash';

export default function FairTools({ loggedIn }: { loggedIn: boolean }) {
  const { toast } = useAuth();
  const [seeds, setSeeds] = useState<Seeds | null>(null);
  const [cs, setCs] = useState('');
  const [busy, setBusy] = useState(false);

  const [game, setGame] = useState<Game>('mines');
  const [f, setF] = useState({ server: '', client: '', nonce: '0', mines: '3', hash: '' });
  const [out, setOut] = useState<{ hashOk: boolean | null; hash: string; lines: React.ReactNode } | null>(null);

  const load = useCallback(() => api<Seeds>('/api/fair').then((r) => r.data && (setSeeds(r.data), setCs(r.data.clientSeed))), []);
  useEffect(() => {
    if (loggedIn) load();
  }, [loggedIn, load]);

  const rotate = async () => {
    setBusy(true);
    const r = await api<Seeds>('/api/fair', { body: { clientSeed: cs } });
    setBusy(false);
    if (r.error) return toast(r.error, 'error');
    setSeeds(r.data);
    toast('Tohum değiştirildi; önceki sunucu tohumu açıklandı.');
  };

  const fill = (p: Seeds['previous'][number]) => {
    setF({ ...f, server: p.server_seed, client: p.client_seed, nonce: String(Math.max(0, p.nonce - 1)), hash: p.server_hash });
    document.getElementById('verify')?.scrollIntoView({ behavior: 'smooth' });
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crypto?.subtle) return toast('Tarayıcın Web Crypto desteklemiyor.', 'error');
    const server = f.server.trim();
    const hash = await sha256(server);
    const hashOk = f.hash.trim() ? hash === f.hash.trim().toLowerCase() : null;
    const nonce = Math.max(0, Math.floor(Number(f.nonce) || 0));
    let lines: React.ReactNode;
    if (game === 'crash') {
      const cp = await crashPoint(server);
      lines = <p className="text-3xl font-black">{fmtMult(cp)}</p>;
    } else if (game === 'mines') {
      const m = Math.min(24, Math.max(1, Number(f.mines) || 3));
      const pos = minePositions(await floats(server, f.client.trim(), nonce, 25), m);
      lines = (
        <div>
          <div className="grid w-56 grid-cols-5 gap-1.5">
            {Array.from({ length: 25 }, (_, i) => (
              <span key={i} className={`grid aspect-square place-items-center rounded-md ${pos.includes(i) ? 'bg-red-500/30 text-red-300' : 'bg-white/5 text-slate-600'}`}>{pos.includes(i) ? <Bomb size={14} /> : i + 1}</span>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-400">Mayınlar: {pos.map((p) => p + 1).join(', ')} · {25 - m} güvenli kare açıldığında çarpan {fmtMult(minesMultiplier(m, 25 - m))}</p>
        </div>
      );
    } else if (game === 'slots') {
      const g = spinGrid(await floats(server, f.client.trim(), nonce, 15));
      const ev = evaluate(g);
      lines = (
        <div>
          <div className="grid w-fit grid-cols-5 gap-1 text-[11px]">
            {[0, 1, 2].map((row) => g.map((col, reel) => <span key={`${reel}-${row}`} className="rounded bg-white/5 px-1.5 py-1 text-center">{col[row]}</span>))}
          </div>
          <p className="mt-2 text-xs text-slate-400">Toplam çarpan {fmtMult(ev.totalMult)} · {ev.lines.length} çizgi · {ev.scatter} dağınık</p>
        </div>
      );
    } else {
      const shoe = shuffle(await floats(server, f.client.trim(), nonce, 312));
      const p = [shoe[0], shoe[2]];
      const d = [shoe[1], shoe[3]];
      lines = (
        <div className="text-sm">
          <p>Oyuncu: <b>{p.map(card).join(' ')}</b> ({handValue(p).total}) · Krupiye: <b>{d.map(card).join(' ')}</b> ({handValue(d).total})</p>
          <p className="mt-1 text-xs text-slate-400">Sonraki kartlar: {shoe.slice(4, 16).map(card).join(' ')}</p>
        </div>
      );
    }
    setOut({ hashOk, hash, lines });
  };

  return (
    <>
      {loggedIn ? (
        <Card className="mt-8">
          <h2 className="flex items-center gap-2 text-lg font-black"><ShieldCheck size={20} className="text-violet-300" /> Tohumların</h2>
          {!seeds ? (
            <Spinner />
          ) : (
            <div className="mt-4 space-y-4">
              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <Field label="Aktif sunucu tohumu (hash)">
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-ink-900 px-3 py-2.5 font-mono text-xs">
                    <span className="min-w-0 flex-1 truncate">{seeds.serverHash}</span>
                    <button onClick={() => { navigator.clipboard?.writeText(seeds.serverHash); toast('Kopyalandı.'); }} aria-label="Kopyala"><Copy size={14} /></button>
                  </div>
                </Field>
                <Field label="Sonraki nonce"><div className="rounded-xl border border-white/10 bg-ink-900 px-3 py-2.5 font-mono text-xs">{seeds.nonce}</div></Field>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-[220px] flex-1"><Field label="İstemci tohumu"><Input value={cs} onChange={(e) => setCs(e.target.value)} maxLength={64} /></Field></div>
                <Button onClick={rotate} loading={busy}><RefreshCw size={16} /> Tohumu değiştir</Button>
              </div>
              <p className="text-xs text-slate-500">Devam eden bir Mines veya Blackjack oyununun varken tohum değiştirilemez.</p>
              {seeds.previous.length > 0 && (
                <div>
                  <p className="label-muted mb-2">Açıklanan önceki tohumlar</p>
                  <ul className="space-y-2">
                    {seeds.previous.map((p) => (
                      <li key={p.server_hash} className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-white/[0.03] px-3 py-2 text-xs">
                        <code className="min-w-0 flex-1 truncate">{p.server_seed}</code>
                        <span className="text-slate-500">istemci {p.client_seed} · {p.nonce} el · {fmtDateTime(p.revealed_at)}</span>
                        <button onClick={() => fill(p)} className="text-violet-300 underline">Doğrula</button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Card>
      ) : (
        <Card className="mt-8 text-sm text-slate-400">Kendi tohumlarını görmek ve değiştirmek için <Link href="/giris?next=/adil-oyun" className="text-violet-300 underline">giriş yap</Link>. Doğrulama aracını giriş yapmadan da kullanabilirsin.</Card>
      )}

      <Card className="mt-8">
        <h2 id="verify" className="text-lg font-black">Doğrulama aracı</h2>
        <p className="mt-1 text-sm text-slate-400">Hesaplama tamamen tarayıcında yapılır; hiçbir veri sunucuya gönderilmez.</p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {([['mines', 'Mines', Bomb], ['slots', 'Slots', Cherry], ['blackjack', 'Blackjack', Spade], ['crash', 'Crash', Rocket]] as const).map(([k, l, I]) => (
            <button key={k} onClick={() => { setGame(k); setOut(null); }} className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition ${game === k ? 'bg-violet-500/25 text-white ring-1 ring-violet-400/40' : 'bg-white/5 text-slate-400 hover:text-white'}`}>
              <I size={16} /> {l}
            </button>
          ))}
        </div>
        <form onSubmit={verify} className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label={game === 'crash' ? 'Tur tohumu' : 'Sunucu tohumu (açıklanmış)'}><Input value={f.server} onChange={(e) => setF({ ...f, server: e.target.value })} required className="font-mono text-xs" /></Field>
          <Field label="Beklenen hash (isteğe bağlı)"><Input value={f.hash} onChange={(e) => setF({ ...f, hash: e.target.value })} className="font-mono text-xs" /></Field>
          {game !== 'crash' && (
            <>
              <Field label="İstemci tohumu"><Input value={f.client} onChange={(e) => setF({ ...f, client: e.target.value })} required /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nonce"><Input type="number" min={0} value={f.nonce} onChange={(e) => setF({ ...f, nonce: e.target.value })} /></Field>
                {game === 'mines' && (
                  <Field label="Mayın">
                    <Select value={f.mines} onChange={(e) => setF({ ...f, mines: e.target.value })}>{Array.from({ length: 24 }, (_, i) => <option key={i + 1}>{i + 1}</option>)}</Select>
                  </Field>
                )}
              </div>
            </>
          )}
          <div className="sm:col-span-2"><Button type="submit"><ShieldCheck size={16} /> Hesapla</Button></div>
        </form>
        {out && (
          <div className="mt-5 space-y-3 rounded-2xl bg-ink-900 p-4">
            <p className="flex items-center gap-2 text-xs">
              {out.hashOk === null ? null : out.hashOk ? <CheckCircle2 size={16} className="text-accent-soft" /> : <XCircle size={16} className="text-red-400" />}
              <span className="text-slate-400">SHA-256:</span> <code className="min-w-0 truncate">{out.hash}</code>
              {out.hashOk === false && <span className="text-red-300">eşleşmiyor</span>}
            </p>
            {out.lines}
          </div>
        )}
      </Card>
    </>
  );
}
