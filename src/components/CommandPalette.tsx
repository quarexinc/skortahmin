'use client';

// Ctrl/Cmd+K ile açılan hızlı arama: oyunlar, sayfalar, üyeler, blog yazıları.
import { GAME_INFO, GAME_KEYS } from '@/lib/games/registry';
import { ArrowDown, ArrowRight, ArrowUp, CornerDownLeft, Gamepad2, FileText, Search, UserRound, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@/lib/client';

interface Hit {
  type: 'page' | 'game' | 'user' | 'post';
  title: string;
  sub?: string;
  href: string;
}

const PAGES: Hit[] = [
  ['Oyun lobisi', '/oyunlar'],
  ...GAME_KEYS.map((k) => [GAME_INFO[k].name, `/oyunlar/${k}`] as [string, string]),
  ['Cüzdan', '/cuzdan'],
  ['VIP kulübü', '/vip'],
  ['Adil oyun', '/adil-oyun'],
  ['Liderlik tablosu', '/liderlik'],
  ['Blog', '/blog'],
  ['Destek talepleri', '/destek'],
  ['Yeni destek talebi', '/destek/yeni'],
  ['Hesabım', '/hesap'],
  ['Oyun geçmişi', '/hesap/oyun-gecmisi'],
  ['Kredi işlemleri', '/hesap/islemler'],
  ['Sorumlu oyun ayarları', '/hesap/sorumlu-oyun'],
  ['Profil & ayarlar', '/hesap/profil'],
  ['Rozetlerim', '/hesap/rozetler'],
  ['Sıkça sorulan sorular', '/sss'],
  ['İletişim', '/iletisim'],
  ['Hakkımızda', '/hakkimizda'],
  ['Kullanım koşulları', '/kullanim-kosullari'],
  ['Gizlilik politikası', '/gizlilik'],
  ['KVKK', '/kvkk'],
  ['Sorumlu oyun', '/sorumlu-oyun'],
].map(([title, href]) => ({ type: 'page' as const, title, href }));

const ICON = { page: ArrowRight, game: Gamepad2, user: UserRound, post: FileText };
const norm = (s: string) => s.toLocaleLowerCase('tr-TR');

export default function SearchTrigger() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Ara (Ctrl+K)"
        className="flex h-9 items-center gap-2 rounded-xl border border-white/10 px-2.5 text-sm text-slate-400 transition hover:border-white/25 hover:text-white"
      >
        <Search size={16} />
        <span className="hidden xl:inline">Ara</span>
        <kbd className="hidden rounded bg-white/5 px-1.5 text-[10px] text-slate-500 xl:inline">Ctrl K</kbd>
      </button>
      {open && <Palette onClose={() => setOpen(false)} />}
    </>
  );
}

function Palette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [remote, setRemote] = useState<Hit[]>([]);
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.focus(), []);

  useEffect(() => {
    if (q.trim().length < 2) return setRemote([]);
    const t = setTimeout(async () => {
      const { data } = await api<{ hits: Hit[] }>(`/api/search?q=${encodeURIComponent(q.trim())}`);
      setRemote(data?.hits ?? []);
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  const hits = useMemo(() => {
    const n = norm(q.trim());
    const pages = n ? PAGES.filter((p) => norm(p.title).includes(n)) : PAGES.slice(0, 8);
    return [...remote, ...pages].slice(0, 14);
  }, [q, remote]);
  useEffect(() => setSel(0), [hits.length]);

  const go = (h: Hit) => {
    onClose();
    router.push(h.href);
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSel((s) => Math.min(s + 1, hits.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSel((s) => Math.max(s - 1, 0));
    } else if (e.key === 'Enter' && hits[sel]) go(hits[sel]);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/60 px-4 pt-[12vh] backdrop-blur-sm" onMouseDown={onClose}>
      <div className="w-full max-w-xl animate-pop overflow-hidden rounded-2xl border border-white/10 bg-ink-800 shadow-2xl shadow-black/60" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-white/5 px-4">
          <Search size={18} className="text-slate-500" />
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Oyun, sayfa, oyuncu veya yazı ara…"
            className="h-14 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-500"
          />
          <button onClick={onClose} aria-label="Kapat" className="text-slate-500 hover:text-white"><X size={18} /></button>
        </div>
        <ul className="max-h-[50vh] overflow-y-auto p-2">
          {hits.length === 0 && <li className="px-3 py-6 text-center text-sm text-slate-500">Sonuç bulunamadı.</li>}
          {hits.map((h, i) => {
            const I = ICON[h.type];
            return (
              <li key={`${h.type}-${h.href}`}>
                <button
                  onMouseEnter={() => setSel(i)}
                  onClick={() => go(h)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm ${sel === i ? 'bg-accent/15 text-white' : 'text-slate-300'}`}
                >
                  <I size={16} className="shrink-0 text-slate-500" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{h.title}</span>
                    {h.sub && <span className="block truncate text-xs text-slate-500">{h.sub}</span>}
                  </span>
                  {sel === i && <CornerDownLeft size={14} className="text-slate-500" />}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="flex gap-4 border-t border-white/5 px-4 py-2 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1"><ArrowUp size={11} /><ArrowDown size={11} /> gezin</span><span>Enter aç</span><span>Esc kapat</span>
        </div>
      </div>
    </div>
  );
}
