'use client';

import { Eye, Newspaper } from 'lucide-react';
import Link from 'next/link';
import CrudManager from '@/components/admin/CrudManager';
import { Badge } from '@/components/ui';
import { fmtDate } from '@/lib/client';
import { renderMarkdown } from '@/lib/markdown';

export default function BlogAdmin() {
  return (
    <CrudManager
      endpoint="/api/admin/posts"
      title="Blog yazıları"
      subtitle="Oyun rehberleri, etkinlik duyuruları ve güncellemeler. İçerik basit Markdown destekler: # başlık, **kalın**, *italik*, [bağlantı](https://…), - liste, > alıntı."
      icon={Newspaper}
      emptyText="Henüz yazı yok"
      createLabel="Yeni yazı"
      toggleField="published"
      defaults={{ title: '', slug: '', body: '', published: false }}
      fields={[
        { name: 'title', label: 'Başlık', type: 'text', wide: true },
        { name: 'slug', label: 'Adres (slug)', type: 'text', hint: 'Boş bırakılamaz; ör. haftanin-maclari. Türkçe karakterler otomatik dönüştürülür.' },
        { name: 'tags', label: 'Etiketler', type: 'text', placeholder: 'analiz, süper lig' },
        { name: 'cover_url', label: 'Kapak görseli (URL)', type: 'text', wide: true, placeholder: 'https://…' },
        { name: 'excerpt', label: 'Kısa özet', type: 'textarea', rows: 2 },
        { name: 'body', label: 'İçerik (Markdown)', type: 'code', rows: 14 },
        { name: 'published', label: 'Yayında', type: 'checkbox' },
      ]}
      preview={(d) => (
        <div className="prose-skor max-h-72 overflow-y-auto rounded-xl bg-ink-900 p-4 text-sm text-slate-300" dangerouslySetInnerHTML={{ __html: renderMarkdown(d.body ?? '') }} />
      )}
      renderRow={(r) => (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <div className="min-w-0">
            <p className="truncate font-medium">{r.title}</p>
            <p className="text-xs text-slate-500">/blog/{r.slug} · {fmtDate(r.created_at)}</p>
          </div>
          <span className="flex items-center gap-1 text-xs text-slate-400"><Eye size={13} /> {r.views}</span>
          {r.published ? <Badge color="green">Yayında</Badge> : <Badge>Taslak</Badge>}
          {r.published && <Link href={`/blog/${r.slug}`} target="_blank" className="text-xs text-accent-soft hover:underline">Görüntüle</Link>}
        </div>
      )}
    />
  );
}
