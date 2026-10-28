import { crud } from '@/lib/crud';

export const dynamic = 'force-dynamic';

export const { GET, POST, PATCH, DELETE } = crud({
  table: 'faqs',
  label: 'Soru',
  orderBy: 'category, sort, id',
  fields: {
    category: { label: 'Kategori', type: 'string', required: true, max: 40 },
    question: { label: 'Soru', type: 'string', required: true, max: 200 },
    answer: { label: 'Yanıt', type: 'string', required: true, max: 3000 },
    sort: { label: 'Sıra', type: 'int', min: 0, max: 1000, default: 0 },
    active: { label: 'Aktif', type: 'bool', default: true },
  },
});
