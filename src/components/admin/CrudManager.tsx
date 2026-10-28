'use client';

// Yönetim paneli için genel liste + form yöneticisi.
import { Pencil, Plus, Trash2, X, type LucideIcon } from 'lucide-react';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Button, Card, Empty, Field, Input, Notice, PageHeader, Select, Spinner, Textarea } from '@/components/ui';
import { api } from '@/lib/client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any> & { id: number };

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'checkbox' | 'select' | 'datetime' | 'code';
  options?: { value: string; label: string }[];
  hint?: string;
  placeholder?: string;
  wide?: boolean;
  rows?: number;
  /** yalnızca bu koşul doğruysa göster */
  showIf?: (draft: Row) => boolean;
}

interface Props {
  endpoint: string;
  title: string;
  subtitle?: ReactNode;
  icon: LucideIcon;
  emptyText: string;
  fields: FormField[];
  defaults: Record<string, unknown>;
  renderRow: (r: Row) => ReactNode;
  preview?: (draft: Row) => ReactNode;
  toggleField?: 'active' | 'published';
  createLabel?: string;
  extraActions?: (r: Row, reload: () => void) => ReactNode;
  headerExtra?: ReactNode;
}

const toLocalInput = (iso: string | null | undefined) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function CrudManager(p: Props) {
  const { toast } = useAuth();
  const [items, setItems] = useState<Row[] | null>(null);
  const [draft, setDraft] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(() => api<{ items: Row[] }>(p.endpoint).then((r) => setItems(r.data?.items ?? [])), [p.endpoint]);
  useEffect(() => {
    load();
  }, [load]);

  const open = (r?: Row) => {
    setErr(null);
    if (r) {
      const d: Row = { ...r };
      for (const f of p.fields) if (f.type === 'datetime') d[f.name] = toLocalInput(r[f.name]);
      setDraft(d);
    } else setDraft({ id: 0, ...p.defaults });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setBusy(true);
    const payload: Record<string, unknown> = { id: draft.id || undefined };
    for (const f of p.fields) {
      let v = draft[f.name];
      if (f.type === 'number') v = v === '' || v == null ? null : Number(v);
      if (f.type === 'datetime') v = v ? new Date(v).toISOString() : null;
      payload[f.name] = v ?? (f.type === 'checkbox' ? false : null);
    }
    const { error } = await api(p.endpoint, { method: draft.id ? 'PATCH' : 'POST', body: payload });
    setBusy(false);
    if (error) return setErr(error);
    toast(draft.id ? 'Kaydedildi.' : 'Oluşturuldu.');
    setDraft(null);
    load();
  };

  const remove = async (r: Row) => {
    if (!confirm('Bu kayıt kalıcı olarak silinsin mi?')) return;
    const { error } = await api(`${p.endpoint}?id=${r.id}`, { method: 'DELETE' });
    if (error) return toast(error, 'error');
    toast('Silindi.', 'info');
    if (draft?.id === r.id) setDraft(null);
    load();
  };

  const toggle = async (r: Row) => {
    if (!p.toggleField) return;
    const { error } = await api(p.endpoint, { method: 'PATCH', body: { id: r.id, [p.toggleField]: !r[p.toggleField] } });
    if (error) return toast(error, 'error');
    load();
  };

  const set = (name: string, v: unknown) => setDraft((d) => (d ? { ...d, [name]: v } : d));

  return (
    <div>
      <PageHeader
        title={p.title}
        subtitle={p.subtitle}
        actions={
          <>
            {p.headerExtra}
            <Button onClick={() => open()}>
              <Plus size={16} /> {p.createLabel ?? 'Yeni ekle'}
            </Button>
          </>
        }
      />
      <div className={`grid gap-4 ${draft ? 'xl:grid-cols-[1fr_460px]' : ''}`}>
        <div className="min-w-0">
          {!items ? (
            <Spinner />
          ) : items.length === 0 ? (
            <Empty icon={p.icon} title={p.emptyText}>
              <div className="mt-3">
                <Button size="sm" onClick={() => open()}>
                  <Plus size={14} /> {p.createLabel ?? 'Yeni ekle'}
                </Button>
              </div>
            </Empty>
          ) : (
            <div className="card divide-y divide-white/5 p-0">
              {items.map((r) => (
                <div key={r.id} className={`flex flex-wrap items-center gap-3 px-5 py-3.5 ${draft?.id === r.id ? 'bg-violet-500/10' : ''}`}>
                  <div className="min-w-0 flex-1">{p.renderRow(r)}</div>
                  {p.extraActions?.(r, load)}
                  {p.toggleField && (
                    <button
                      role="switch"
                      aria-checked={!!r[p.toggleField]}
                      aria-label="Aktif/pasif"
                      onClick={() => toggle(r)}
                      className={`relative h-6 w-11 shrink-0 rounded-full transition ${r[p.toggleField] ? 'bg-accent' : 'bg-ink-600'}`}
                    >
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${r[p.toggleField] ? 'left-[22px]' : 'left-0.5'}`} />
                    </button>
                  )}
                  <button onClick={() => open(r)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white" aria-label="Düzenle">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => remove(r)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-300" aria-label="Sil">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {draft && (
          <div className="xl:sticky xl:top-20 xl:self-start">
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-bold">{draft.id ? 'Düzenle' : p.createLabel ?? 'Yeni kayıt'}</h2>
                <button onClick={() => setDraft(null)} className="text-slate-500 hover:text-white" aria-label="Kapat">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
                {err && (
                  <div className="sm:col-span-2">
                    <Notice kind="error">{err}</Notice>
                  </div>
                )}
                {p.fields
                  .filter((f) => !f.showIf || f.showIf(draft))
                  .map((f) => (
                    <div key={f.name} className={f.wide || f.type === 'textarea' || f.type === 'code' ? 'sm:col-span-2' : ''}>
                      {f.type === 'checkbox' ? (
                        <label className="flex items-center gap-2.5 pt-6 text-sm text-slate-300">
                          <input type="checkbox" checked={!!draft[f.name]} onChange={(e) => set(f.name, e.target.checked)} className="h-4 w-4 accent-[#22c55e]" />
                          {f.label}
                        </label>
                      ) : (
                        <Field label={f.label} hint={f.hint}>
                          {f.type === 'textarea' || f.type === 'code' ? (
                            <Textarea
                              rows={f.rows ?? 4}
                              value={draft[f.name] ?? ''}
                              onChange={(e) => set(f.name, e.target.value)}
                              placeholder={f.placeholder}
                              className={f.type === 'code' ? 'font-mono text-xs' : ''}
                            />
                          ) : f.type === 'select' ? (
                            <Select value={draft[f.name] ?? ''} onChange={(e) => set(f.name, e.target.value)}>
                              {f.options!.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </Select>
                          ) : (
                            <Input
                              type={f.type === 'number' ? 'number' : f.type === 'datetime' ? 'datetime-local' : 'text'}
                              value={draft[f.name] ?? ''}
                              onChange={(e) => set(f.name, e.target.value)}
                              placeholder={f.placeholder}
                            />
                          )}
                        </Field>
                      )}
                    </div>
                  ))}
                {p.preview && (
                  <div className="sm:col-span-2">
                    <p className="label-muted mb-2">Önizleme</p>
                    {p.preview(draft)}
                  </div>
                )}
                <div className="flex gap-2 sm:col-span-2">
                  <Button type="submit" loading={busy}>
                    Kaydet
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setDraft(null)}>
                    Vazgeç
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
