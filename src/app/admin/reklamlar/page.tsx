'use client';

import { ExternalLink, Eye, Image as ImageIcon, MousePointerClick } from 'lucide-react';
import CrudManager, { type Row } from '@/components/admin/CrudManager';
import { Badge } from '@/components/ui';
import { AD_PLACEMENTS } from '@/config/ads';
import { fmtDate } from '@/lib/client';

const placementLabel = (id: string) => AD_PLACEMENTS.find((p) => p.id === id)?.label ?? id;

function Preview({ d }: { d: Row }) {
  if (d.kind === 'html')
    return d.html ? (
      <iframe title="Önizleme" srcDoc={d.html} sandbox="allow-scripts" className="h-[120px] w-full rounded-2xl border border-white/5 bg-ink-900" />
    ) : (
      <p className="text-sm text-slate-500">HTML kodu girin.</p>
    );
  if (d.kind === 'image')
    return d.image_url ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={d.image_url} alt="" className="max-h-40 w-full rounded-2xl border border-white/5 object-cover" />
    ) : (
      <p className="text-sm text-slate-500">Görsel adresi girin.</p>
    );
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-amber-400/20 bg-gradient-to-r from-amber-400/10 via-ink-800 to-ink-800 p-4">
      {d.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={d.image_url} alt="" className="h-12 w-12 rounded-xl object-cover" />
      )}
      <div className="min-w-0 flex-1">
        <p className="font-bold">{d.title || 'Başlık'}</p>
        <p className="text-sm text-slate-300">{d.body || 'Reklam metni'}</p>
      </div>
      {d.cta && <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-3 py-1.5 text-sm font-bold text-ink-950">{d.cta} <ExternalLink size={13} /></span>}
    </div>
  );
}

export default function AdsAdmin() {
  return (
    <CrudManager
      endpoint="/api/admin/ads"
      title="Reklam bannerları"
      subtitle="Görsel, metin veya HTML (ör. AdSense) reklamları yerleşim alanlarına yerleştir. Reklamlar Site ayarlarından tamamen kapatılabilir. Kumar, bahis veya gerçek para içeren reklam yayınlama."
      icon={ImageIcon}
      emptyText="Henüz reklam yok"
      createLabel="Yeni reklam"
      toggleField="active"
      defaults={{ name: '', placement: 'home_hero', kind: 'image', weight: 1, active: true, cta: 'İncele' }}
      fields={[
        { name: 'name', label: 'Reklam adı (iç kullanım)', type: 'text', wide: true },
        { name: 'placement', label: 'Yerleşim', type: 'select', options: AD_PLACEMENTS.map((p) => ({ value: p.id, label: p.label })) },
        { name: 'kind', label: 'Tür', type: 'select', options: [{ value: 'image', label: 'Görsel banner' }, { value: 'text', label: 'Metin + düğme' }, { value: 'html', label: 'HTML / reklam kodu' }] },
        { name: 'image_url', label: 'Görsel adresi (URL)', type: 'text', wide: true, placeholder: 'https://…/banner.jpg', showIf: (d) => d.kind !== 'html' },
        { name: 'link_url', label: 'Tıklanınca gidilecek adres', type: 'text', wide: true, placeholder: 'https://…', showIf: (d) => d.kind !== 'html' },
        { name: 'title', label: 'Başlık', type: 'text', showIf: (d) => d.kind === 'text' },
        { name: 'cta', label: 'Düğme metni', type: 'text', showIf: (d) => d.kind === 'text' },
        { name: 'body', label: 'Metin', type: 'text', wide: true, showIf: (d) => d.kind === 'text' },
        { name: 'html', label: 'HTML kodu', type: 'code', rows: 6, hint: 'Güvenlik için izole bir çerçevede (iframe) çalıştırılır.', showIf: (d) => d.kind === 'html' },
        { name: 'starts_at', label: 'Başlangıç (isteğe bağlı)', type: 'datetime' },
        { name: 'ends_at', label: 'Bitiş (isteğe bağlı)', type: 'datetime' },
        { name: 'weight', label: 'Ağırlık (1–100)', type: 'number', hint: 'Aynı alanda birden fazla reklam varsa gösterim oranı.' },
        { name: 'active', label: 'Aktif', type: 'checkbox' },
      ]}
      preview={(d) => <Preview d={d} />}
      renderRow={(r) => {
        const ctr = r.impressions ? ((r.clicks / r.impressions) * 100).toFixed(2) : '0.00';
        const expired = r.ends_at && new Date(r.ends_at).getTime() < Date.now();
        return (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <div className="min-w-0">
              <p className="truncate font-medium">{r.name}</p>
              <p className="text-xs text-slate-500">
                {placementLabel(r.placement)} · {r.kind === 'image' ? 'Görsel' : r.kind === 'text' ? 'Metin' : 'HTML'}
                {r.ends_at && ` · bitiş ${fmtDate(r.ends_at)}`}
              </p>
            </div>
            <span className="flex items-center gap-1 text-xs text-slate-400"><Eye size={13} /> {r.impressions}</span>
            <span className="flex items-center gap-1 text-xs text-slate-400"><MousePointerClick size={13} /> {r.clicks}</span>
            <Badge color="blue">TO %{ctr.replace('.', ',')}</Badge>
            {expired && <Badge color="red">Süresi doldu</Badge>}
          </div>
        );
      }}
    />
  );
}
