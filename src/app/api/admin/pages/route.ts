import { crud, slugify } from '@/lib/crud';

export const dynamic = 'force-dynamic';

export const { GET, POST, PATCH, DELETE } = crud({
  table: 'pages',
  label: 'Sayfa',
  touch: true,
  uniqueMsg: 'Bu adrese (slug) sahip bir sayfa zaten var.',
  fields: {
    title: { label: 'Başlık', type: 'string', required: true, min: 2, max: 120 },
    slug: { label: 'Adres', type: 'string', required: true, max: 80, transform: slugify, pattern: /^[a-z0-9-]+$/ },
    body: { label: 'İçerik', type: 'string', required: true, max: 60000 },
    published: { label: 'Yayında', type: 'bool', default: true },
    show_in_footer: { label: 'Alt bilgide göster', type: 'bool', default: false },
  },
});
