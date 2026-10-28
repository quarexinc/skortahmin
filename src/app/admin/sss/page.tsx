'use client';

import { HelpCircle } from 'lucide-react';
import CrudManager from '@/components/admin/CrudManager';
import { Badge } from '@/components/ui';

export default function FaqAdmin() {
  return (
    <CrudManager
      endpoint="/api/admin/faqs"
      title="SSS yönetimi"
      subtitle="Buraya en az bir soru eklediğinde SSS sayfası ve açılış sayfası bu listeyi kullanır; hiç soru yoksa varsayılan sorular gösterilir."
      icon={HelpCircle}
      emptyText="Henüz soru eklenmedi (varsayılanlar gösteriliyor)"
      createLabel="Yeni soru"
      toggleField="active"
      defaults={{ category: 'Genel', question: '', answer: '', sort: 0, active: true }}
      fields={[
        { name: 'category', label: 'Kategori', type: 'text', placeholder: 'Genel, Üyelik, Tahminler…' },
        { name: 'sort', label: 'Sıra', type: 'number' },
        { name: 'question', label: 'Soru', type: 'text', wide: true },
        { name: 'answer', label: 'Yanıt', type: 'textarea', rows: 5 },
        { name: 'active', label: 'Yayında', type: 'checkbox' },
      ]}
      renderRow={(r) => (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Badge color="blue">{r.category}</Badge>
          <span className="font-medium">{r.question}</span>
          <span className="text-xs text-slate-500">sıra {r.sort}</span>
        </div>
      )}
    />
  );
}
