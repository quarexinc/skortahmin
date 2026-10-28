// Yönetim paneli için genel CRUD route üreticisi.
// Tablo ve sütun adları yalnızca koddaki tanımdan gelir (kullanıcı girdisinden asla gelmez).
import 'server-only';
import { HttpError, requireAdmin } from '@/lib/auth';
import { audit, q, q1 } from '@/lib/db';
import { body, int, route } from '@/lib/http';
import { invalidateSettings } from '@/lib/settings';

export type FieldSpec =
  | { type: 'string'; required?: boolean; max?: number; min?: number; pattern?: RegExp; patternMsg?: string; transform?: (s: string) => string }
  | { type: 'int'; required?: boolean; min?: number; max?: number; default?: number }
  | { type: 'bool'; default?: boolean }
  | { type: 'date' }
  | { type: 'enum'; values: readonly string[]; default?: string };

export interface CrudConfig {
  table: string;
  label: string;
  fields: Record<string, { label: string } & FieldSpec>;
  orderBy?: string;
  /** güncellemede updated_at sütununu yenile */
  touch?: boolean;
  /** benzersiz alan ihlalinde gösterilecek mesaj */
  uniqueMsg?: string;
  afterChange?: () => void;
}

function parseField(name: string, spec: CrudConfig['fields'][string], v: unknown, partial: boolean): { set: boolean; value: unknown } {
  if (v === undefined) {
    if (partial) return { set: false, value: null };
    if (spec.type === 'string' && spec.required) throw new HttpError(400, `${spec.label} gerekli.`);
    if (spec.type === 'int' && spec.required && spec.default === undefined) throw new HttpError(400, `${spec.label} gerekli.`);
    if (spec.type === 'bool') return { set: true, value: spec.default ?? false };
    if (spec.type === 'int') return { set: true, value: spec.default ?? null };
    if (spec.type === 'enum') return { set: true, value: spec.default ?? spec.values[0] };
    return { set: true, value: null };
  }
  switch (spec.type) {
    case 'string': {
      let s = typeof v === 'string' ? v.trim() : '';
      if (spec.transform) s = spec.transform(s);
      if (!s) {
        if (spec.required) throw new HttpError(400, `${spec.label} gerekli.`);
        return { set: true, value: null };
      }
      if (spec.min && s.length < spec.min) throw new HttpError(400, `${spec.label} en az ${spec.min} karakter olmalı.`);
      if (spec.max && s.length > spec.max) throw new HttpError(400, `${spec.label} en fazla ${spec.max} karakter olabilir.`);
      if (spec.pattern && !spec.pattern.test(s)) throw new HttpError(400, spec.patternMsg ?? `${spec.label} geçersiz.`);
      return { set: true, value: s };
    }
    case 'int':
      if (v === null || v === '') return { set: true, value: spec.default ?? null };
      return { set: true, value: int(v, spec.label, { min: spec.min, max: spec.max }) };
    case 'bool':
      return { set: true, value: v === true || v === 'true' };
    case 'date': {
      if (v === null || v === '') return { set: true, value: null };
      const d = new Date(String(v));
      if (Number.isNaN(d.getTime())) throw new HttpError(400, `${spec.label} geçersiz tarih.`);
      return { set: true, value: d.toISOString() };
    }
    case 'enum':
      if (typeof v !== 'string' || !spec.values.includes(v)) throw new HttpError(400, `${spec.label} geçersiz.`);
      return { set: true, value: v };
  }
  void name;
}

export function crud(cfg: CrudConfig) {
  const cols = Object.keys(cfg.fields);
  const handleUnique = (e: unknown): never => {
    if ((e as { code?: string })?.code === '23505') throw new HttpError(409, cfg.uniqueMsg ?? 'Bu kayıt zaten var.');
    throw e;
  };
  return {
    GET: route(async () => {
      await requireAdmin();
      return { items: await q(`SELECT * FROM ${cfg.table} ORDER BY ${cfg.orderBy ?? 'id DESC'} LIMIT 500`) };
    }),
    POST: route(async (req) => {
      const admin = await requireAdmin();
      const b = await body(req);
      const names: string[] = [];
      const vals: unknown[] = [];
      for (const c of cols) {
        const r = parseField(c, cfg.fields[c], b[c], false);
        if (r.set) {
          names.push(c);
          vals.push(r.value);
        }
      }
      const row = await q1(
        `INSERT INTO ${cfg.table} (${names.join(', ')}) VALUES (${names.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`,
        vals,
      ).catch(handleUnique);
      await audit(admin.id, `admin.${cfg.table}.create`, `${cfg.table}:${row.id}`);
      cfg.afterChange?.();
      return { item: row };
    }),
    PATCH: route(async (req) => {
      const admin = await requireAdmin();
      const b = await body(req);
      const id = int(b.id, 'Kayıt');
      const sets: string[] = [];
      const vals: unknown[] = [id];
      for (const c of cols) {
        const r = parseField(c, cfg.fields[c], b[c], true);
        if (r.set) {
          vals.push(r.value);
          sets.push(`${c} = $${vals.length}`);
        }
      }
      if (cfg.touch) sets.push('updated_at = NOW()');
      if (sets.length === 0) return { ok: true };
      const row = await q1(`UPDATE ${cfg.table} SET ${sets.join(', ')} WHERE id = $1 RETURNING *`, vals).catch(handleUnique);
      if (!row) throw new HttpError(404, `${cfg.label} bulunamadı.`);
      await audit(admin.id, `admin.${cfg.table}.update`, `${cfg.table}:${id}`);
      cfg.afterChange?.();
      return { item: row };
    }),
    DELETE: route(async (req) => {
      const admin = await requireAdmin();
      const id = int(new URL(req.url).searchParams.get('id'), 'Kayıt');
      await q(`DELETE FROM ${cfg.table} WHERE id = $1`, [id]);
      await audit(admin.id, `admin.${cfg.table}.delete`, `${cfg.table}:${id}`);
      cfg.afterChange?.();
      return { ok: true };
    }),
  };
}

export const slugify = (s: string) =>
  s
    .toLocaleLowerCase('tr-TR')
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

export { invalidateSettings };
