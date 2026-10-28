'use client';

import { FileText } from 'lucide-react';
import Link from 'next/link';
import CrudManager from '@/components/admin/CrudManager';
import { Badge } from '@/components/ui';
import { renderMarkdown } from '@/lib/markdown';

export default function PagesAdmin() {
  return (
    <CrudManager
      endpoint="/api/admin/pages"
      title="Özel sayfalar"
      subtitle="Kampanya, reklam ver, iş birliği gibi kendi sayfalarını oluştur. /sayfa/adres altında yayınlanır; istersen alt bilgide bağlantısı görünür."
      icon={FileText}
      emptyText="Henüz özel sayfa yok"
      createLabel="Yeni sayfa"
      toggleField="published"
      defaults={{ title: '', slug: '', body: '', published: true, show_in_footer: false }}
      fields={[
        { name: 'title', label: 'Başlık', type: 'text' },
        { name: 'slug', label: 'Adres (slug)', type: 'text', placeholder: 'reklam-ver' },
        { name: 'body', label: 'İçerik (Markdown)', type: 'code', rows: 14 },
        { name: 'published', label: 'Yayında', type: 'checkbox' },
        { name: 'show_in_footer', label: 'Alt bilgide göster', type: 'checkbox' },
      ]}
      preview={(d) => (
        <div className="prose-skor max-h-72 overflow-y-auto rounded-xl bg-ink-900 p-4 text-sm text-slate-300" dangerouslySetInnerHTML={{ __html: renderMarkdown(d.body ?? '') }} />
      )}
      renderRow={(r) => (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <div className="min-w-0">
            <p className="truncate font-medium">{r.title}</p>
            <p className="text-xs text-slate-500">/sayfa/{r.slug}</p>
          </div>
          {r.show_in_footer && <Badge color="blue">Alt bilgide</Badge>}
          {r.published && <Link href={`/sayfa/${r.slug}`} target="_blank" className="text-xs text-accent-soft hover:underline">Görüntüle</Link>}
        </div>
      )}
    />
  );
}
