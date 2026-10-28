import { AD_PLACEMENT_IDS } from '@/config/ads';
import { crud } from '@/lib/crud';

export const dynamic = 'force-dynamic';

const URL_RE = /^(https?:\/\/|\/)/i;

export const { GET, POST, PATCH, DELETE } = crud({
  table: 'ads',
  label: 'Reklam',
  fields: {
    name: { label: 'Reklam adı', type: 'string', required: true, max: 80 },
    placement: { label: 'Yerleşim', type: 'enum', values: AD_PLACEMENT_IDS },
    kind: { label: 'Tür', type: 'enum', values: ['image', 'text', 'html'] },
    image_url: { label: 'Görsel adresi', type: 'string', max: 500, pattern: URL_RE, patternMsg: 'Görsel adresi http(s):// ile başlamalı.' },
    link_url: { label: 'Hedef bağlantı', type: 'string', max: 500, pattern: URL_RE, patternMsg: 'Hedef bağlantı http(s):// veya / ile başlamalı.' },
    title: { label: 'Başlık', type: 'string', max: 120 },
    body: { label: 'Metin', type: 'string', max: 300 },
    cta: { label: 'Düğme metni', type: 'string', max: 40 },
    html: { label: 'HTML kodu', type: 'string', max: 20000 },
    active: { label: 'Aktif', type: 'bool', default: true },
    starts_at: { label: 'Başlangıç', type: 'date' },
    ends_at: { label: 'Bitiş', type: 'date' },
    weight: { label: 'Ağırlık', type: 'int', min: 1, max: 100, default: 1 },
  },
});
