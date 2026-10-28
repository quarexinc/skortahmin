'use client';

import { Link2, MessageCircle, Send, Share2 } from 'lucide-react';
import { useAuth } from './AuthProvider';

// Paylaşım: X, WhatsApp, Telegram, bağlantı kopyala (marka logoları yerine genel ikonlar)
export default function ShareButtons({ title }: { title: string }) {
  const { toast } = useAuth();
  const share = (kind: string) => {
    const url = window.location.href;
    const t = encodeURIComponent(title);
    const u = encodeURIComponent(url);
    const map: Record<string, string> = {
      x: `https://twitter.com/intent/tweet?text=${t}&url=${u}`,
      wa: `https://wa.me/?text=${t}%20${u}`,
      tg: `https://t.me/share/url?url=${u}&text=${t}`,
    };
    if (kind === 'copy') navigator.clipboard.writeText(url).then(() => toast('Bağlantı kopyalandı.'));
    else window.open(map[kind], '_blank', 'noopener,width=600,height=500');
  };
  const btn = 'inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-white/25 hover:text-white';
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 inline-flex items-center gap-1.5 text-sm text-slate-400"><Share2 size={15} /> Paylaş</span>
      <button className={btn} onClick={() => share('x')}><Send size={14} /> X</button>
      <button className={btn} onClick={() => share('wa')}><MessageCircle size={14} /> WhatsApp</button>
      <button className={btn} onClick={() => share('tg')}><Send size={14} /> Telegram</button>
      <button className={btn} onClick={() => share('copy')}><Link2 size={14} /> Bağlantıyı kopyala</button>
    </div>
  );
}
