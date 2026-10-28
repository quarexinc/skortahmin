import { crud } from '@/lib/crud';

export const dynamic = 'force-dynamic';

export const { GET, POST, PATCH, DELETE } = crud({
  table: 'promo_codes',
  label: 'Promosyon kodu',
  uniqueMsg: 'Bu kod zaten mevcut.',
  fields: {
    code: { label: 'Kod', type: 'string', required: true, min: 4, max: 32, pattern: /^[A-Z0-9-]+$/, patternMsg: 'Kod yalnızca büyük harf, rakam ve tire içerebilir.', transform: (s) => s.toUpperCase().replace(/\s+/g, '') },
    months: { label: 'Süre (ay)', type: 'int', min: 1, max: 24, default: 1 },
    max_uses: { label: 'Kullanım limiti', type: 'int', min: 1, max: 100000, default: 1 },
    expires_at: { label: 'Son kullanma', type: 'date' },
    active: { label: 'Aktif', type: 'bool', default: true },
    note: { label: 'Not', type: 'string', max: 200 },
  },
});
