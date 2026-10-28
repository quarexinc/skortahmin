'use client';

import { Copy, TicketPercent } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import CrudManager from '@/components/admin/CrudManager';
import { Badge } from '@/components/ui';
import { fmtDate } from '@/lib/client';

function randomCode() {
  const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return 'BLOXY-' + Array.from({ length: 6 }, () => a[Math.floor(Math.random() * a.length)]).join('');
}

export default function PromoAdmin() {
  const { toast } = useAuth();
  return (
    <CrudManager
      endpoint="/api/admin/promo"
      title="Promosyon kodları"
      subtitle="Üyeler Cüzdan sayfasından kodu girerek belirtilen miktarda sanal kredi kazanır. Etkinlik, bülten ve topluluk kampanyaları için kullan. Kodlar satılmaz; krediler paraya çevrilemez."
      icon={TicketPercent}
      emptyText="Henüz promosyon kodu yok"
      createLabel="Yeni kod"
      toggleField="active"
      defaults={{ code: randomCode(), credits: 500, max_uses: 100, active: true }}
      fields={[
        { name: 'code', label: 'Kod', type: 'text', hint: 'Büyük harf, rakam ve tire' },
        { name: 'credits', label: 'Verilecek kredi', type: 'number' },
        { name: 'max_uses', label: 'Toplam kullanım limiti', type: 'number' },
        { name: 'expires_at', label: 'Son kullanma (isteğe bağlı)', type: 'datetime' },
        { name: 'note', label: 'Not (iç kullanım)', type: 'text', wide: true },
        { name: 'active', label: 'Aktif', type: 'checkbox' },
      ]}
      extraActions={(r) => (
        <button
          onClick={() => navigator.clipboard.writeText(r.code).then(() => toast('Kod kopyalandı.'))}
          className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white"
          aria-label="Kodu kopyala"
        >
          <Copy size={15} />
        </button>
      )}
      renderRow={(r) => {
        const expired = r.expires_at && new Date(r.expires_at).getTime() < Date.now();
        const full = r.used_count >= r.max_uses;
        return (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <code className="rounded-lg bg-ink-900 px-2 py-1 font-mono text-sm font-bold tracking-wider text-accent-soft">{r.code}</code>
            <span className="text-sm text-slate-300">{Number(r.credits).toLocaleString('tr-TR')} kredi</span>
            <span className="text-xs text-slate-500">{r.used_count}/{r.max_uses} kullanım{r.expires_at ? ` · son: ${fmtDate(r.expires_at)}` : ''}</span>
            {expired && <Badge color="red">Süresi doldu</Badge>}
            {full && <Badge color="amber">Limit doldu</Badge>}
            {r.note && <span className="text-xs text-slate-500">{r.note}</span>}
          </div>
        );
      }}
    />
  );
}
