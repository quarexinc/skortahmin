import { crud } from '@/lib/crud';

export const dynamic = 'force-dynamic';

export const { GET, POST, PATCH, DELETE } = crud({
  table: 'canned_replies',
  label: 'Hazır yanıt',
  fields: {
    title: { label: 'Başlık', type: 'string', required: true, max: 60 },
    body: { label: 'Yanıt metni', type: 'string', required: true, max: 2000 },
  },
});
