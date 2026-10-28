'use client';

import { Bomb, Cherry, ChevronDown, History, Rocket, Spade } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button, Card, Empty, PageHeader, Spinner } from '@/components/ui';
import { api, fmtDateTime } from '@/lib/client';
import { fmtCredits, fmtMult } from '@/lib/money';

interface Bet { id: number; game: string; amount: string; payout: string; multiplier: string; detail: Record<string, unknown> | null; server_hash: string | null; client_seed: string | null; nonce: number | null; created_at: string }
interface Per { game: string; bets: number; wagered: string; paid: string; best: number }

const GAMES = [
  { id: '', n: 'Tümü', i: History },
  { id: 'crash', n: 'Crash', i: Rocket },
  { id: 'mines', n: 'Mines', i: Bomb },
  { id: 'slots', n: 'Slots', i: Cherry },
  { id: 'blackjack', n: 'Blackjack', i: Spade },
];

function describe(b: Bet): string {
  const d = (b.detail ?? {}) as Record<string, unknown>;
  if (b.game === 'mines') return `${d.mines ?? '?'} mayın · ${Array.isArray(d.revealed) ? d.revealed.length : 0} kare açıldı${d.hit != null ? ' · mayına basıldı' : ''}`;
  if (b.game === 'crash') return `Tur #${d.round ?? '?'}${d.crashPoint ? ` · patlama ${fmtMult(Number(d.crashPoint))}` : ''}${d.cashout ? ` · çıkış ${fmtMult(Number(d.cashout))}` : ''}`;
  if (b.game === 'slots') return `${Array.isArray(d.lines) ? d.lines.length : 0} kazanan çizgi${d.scatter ? ` · ${d.scatter} dağınık` : ''}`;
  if (b.game === 'blackjack') {
    const hands = Array.isArray(d.hands) ? (d.hands as { result?: string }[]) : [];
    return hands.map((h) => ({ win: 'kazandı', lose: 'kaybetti', bust: 'battı', push: 'berabere', blackjack: 'blackjack' })[h.result ?? ''] ?? '?').join(' / ');
  }
  return '';
}

export default function GameHistory() {
  const [game, setGame] = useState('');
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<Bet[] | null>(null);
  const [per, setPer] = useState<Per[]>([]);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    setItems(null);
    api<{ items: Bet[]; perGame: Per[] }>(`/api/bets/mine?page=${page}${game ? `&game=${game}` : ''}`).then((r) => {
      setItems(r.data?.items ?? []);
      setPer(r.data?.perGame ?? []);
    });
  }, [game, page]);

  return (
    <div>
      <PageHeader title="Oyun geçmişi" subtitle="Oynadığın her el, adil oyun bilgileriyle birlikte." />
      <div className="mb-4 flex flex-wrap gap-2">
        {GAMES.map((g) => {
          const p = per.find((x) => x.game === g.id);
          return (
            <button key={g.id} onClick={() => { setGame(g.id); setPage(0); }} className={`chip inline-flex items-center gap-1.5 ${game === g.id ? 'chip-active' : ''}`}>
              <g.i size={14} /> {g.n}{p ? <span className="text-slate-500">{p.bets}</span> : null}
            </button>
          );
        })}
      </div>
      {items == null ? (
        <Spinner />
      ) : items.length === 0 ? (
        <Empty icon={History} title="Henüz el yok">
          <Link href="/oyunlar" className="text-violet-300 underline">Oyunlara göz at</Link>
        </Empty>
      ) : (
        <Card className="overflow-hidden p-0">
          <ul className="divide-y divide-white/5">
            {items.map((b) => {
              const net = Number(b.payout) - Number(b.amount);
              const G = GAMES.find((g) => g.id === b.game) ?? GAMES[0];
              return (
                <li key={b.id}>
                  <button onClick={() => setOpen(open === b.id ? null : b.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-white/[0.02]">
                    <G.i size={17} className="shrink-0 text-violet-300" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{G.n} <span className="text-slate-500">#{b.id}</span></p>
                      <p className="truncate text-xs text-slate-500">{fmtDateTime(b.created_at)} · {describe(b)}</p>
                    </div>
                    <span className="hidden w-20 text-right tabular-nums text-slate-400 sm:block">{fmtCredits(b.amount)}</span>
                    <span className="w-16 text-right tabular-nums text-slate-300">{fmtMult(b.multiplier)}</span>
                    <span className={`w-24 text-right font-semibold tabular-nums ${net >= 0 ? 'text-accent-soft' : 'text-red-300'}`}>{net >= 0 ? '+' : ''}{fmtCredits(net)}</span>
                    <ChevronDown size={15} className={`text-slate-500 transition ${open === b.id ? 'rotate-180' : ''}`} />
                  </button>
                  {open === b.id && (
                    <div className="space-y-1 bg-black/20 px-4 py-3 text-xs text-slate-400">
                      <p>Bahis: <b className="text-slate-200">{fmtCredits(b.amount)}</b> · Ödeme: <b className="text-slate-200">{fmtCredits(b.payout)}</b></p>
                      {b.server_hash && <p className="truncate">Sunucu hash: <code>{b.server_hash}</code></p>}
                      {b.client_seed && <p>İstemci tohumu: <code>{b.client_seed}</code> · Nonce: <code>{b.nonce}</code></p>}
                      <Link href="/adil-oyun" className="text-violet-300 underline">Bu eli doğrula</Link>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      )}
      <div className="mt-4 flex justify-between">
        <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Önceki</Button>
        <Button variant="secondary" size="sm" disabled={(items?.length ?? 0) < 30} onClick={() => setPage((p) => p + 1)}>Sonraki</Button>
      </div>
    </div>
  );
}
