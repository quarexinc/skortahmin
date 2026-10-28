import { crud, slugify } from '@/lib/crud';

export const dynamic = 'force-dynamic';

export const { GET, POST, PATCH, DELETE } = crud({
  table: 'posts',
  label: 'Yazı',
  touch: true,
  uniqueMsg: 'Bu adrese (slug) sahip bir yazı zaten var.',
  fields: {
    title: { label: 'Başlık', type: 'string', required: true, min: 3, max: 160 },
    slug: { label: 'Adres', type: 'string', required: true, max: 80, transform: slugify, pattern: /^[a-z0-9-]+$/ },
    excerpt: { label: 'Özet', type: 'string', max: 300 },
    body: { label: 'İçerik', type: 'string', required: true, max: 60000 },
    cover_url: { label: 'Kapak görseli', type: 'string', max: 500, pattern: /^https?:\/\//i, patternMsg: 'Kapak görseli http(s):// ile başlamalı.' },
    tags: { label: 'Etiketler', type: 'string', max: 200 },
    published: { label: 'Yayında', type: 'bool', default: false },
  },
});
