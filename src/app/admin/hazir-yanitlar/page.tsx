'use client';

import { Zap } from 'lucide-react';
import CrudManager from '@/components/admin/CrudManager';

export default function CannedAdmin() {
  return (
    <CrudManager
      endpoint="/api/admin/canned"
      title="Hazır yanıtlar"
      subtitle="Destek talepleri ve canlı destekte tek tıkla kullanabileceğin yanıt şablonları."
      icon={Zap}
      emptyText="Henüz hazır yanıt yok"
      createLabel="Yeni yanıt"
      defaults={{ title: '', body: '' }}
      fields={[
        { name: 'title', label: 'Kısa ad', type: 'text', wide: true, placeholder: 'Ör. Ödeme bilgisi' },
        { name: 'body', label: 'Yanıt metni', type: 'textarea', rows: 6 },
      ]}
      renderRow={(r) => (
        <div>
          <p className="font-medium">{r.title}</p>
          <p className="line-clamp-1 text-sm text-slate-400">{r.body}</p>
        </div>
      )}
    />
  );
}
