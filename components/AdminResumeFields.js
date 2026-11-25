'use client';

import { useState } from 'react';
import { FIELD_TYPES } from '@/lib/resumeFields';

const TYPE_LABEL = Object.fromEntries(FIELD_TYPES.map((t) => [t.value, t.label]));
const EMPTY = { label: '', type: 'text', options: '', hint: '', required: false };

export default function AdminResumeFields({ fields, onChanged }) {
  const [draft, setDraft] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function set(k, v) { setDraft((d) => ({ ...d, [k]: v })); }

  async function send(url, method, body) {
    setBusy(true);
    setError('');
    const res = await fetch(url, {
      method,
      ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
    });
    const d = await res.json();
    setBusy(false);
    if (!d.ok) { setError(d.error || 'عملیات انجام نشد.'); return null; }
    await onChanged();
    return d;
  }

  async function submit(e) {
    e.preventDefault();
    if (!draft.label.trim()) { setError('عنوان فیلد را بنویسید.'); return; }
    const payload = {
      label: draft.label,
      type: draft.type,
      options: draft.type === 'select' ? draft.options : '',
      hint: draft.hint,
      required: draft.required,
    };
    const done = editing
      ? await send(`/api/admin/resume-fields/${editing}`, 'PATCH', payload)
      : await send('/api/admin/resume-fields', 'POST', payload);
    if (done) { setDraft(EMPTY); setEditing(null); }
  }

  function startEdit(f) {
    setEditing(f.id);
    setDraft({ label: f.label, type: f.type, options: f.options || '', hint: f.hint || '', required: f.required });
    setError('');
  }

  async function remove(f) {
    if (!window.confirm(`فیلد «${f.label}» حذف شود؟ مقداری که برای رزومه‌ها ثبت شده دیگر نمایش داده نمی‌شود.`)) return;
    await send(`/api/admin/resume-fields/${f.id}`, 'DELETE');
    if (editing === f.id) { setEditing(null); setDraft(EMPTY); }
  }

  async function move(index, delta) {
    const target = fields[index + delta];
    const current = fields[index];
    if (!target) return;
    setBusy(true);
    setError('');
    await Promise.all([
      fetch(`/api/admin/resume-fields/${current.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sortOrder: target.sortOrder }),
      }),
      fetch(`/api/admin/resume-fields/${target.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sortOrder: current.sortOrder }),
      }),
    ]);
    setBusy(false);
    await onChanged();
  }

  return (
    <div className="rz-fields">
      {error && <div className="alert alert--error">{error}</div>}

      <section className="rz-card">
        <div className="rz-card__head">
          <h3>{editing ? 'ویرایش فیلد' : 'ساخت فیلد تازه'}</h3>
          <p>هر فیلدی که این‌جا بسازید، در فرم ساخت رزومه به‌صورت خودکار ظاهر می‌شود.</p>
        </div>
        <form onSubmit={submit} className="rz-grid">
          <div className="form-group">
            <label className="form-label">عنوان فیلد *</label>
            <input className="form-input" value={draft.label} onChange={(e) => set('label', e.target.value)} placeholder="رنگ چشم" />
          </div>
          <div className="form-group">
            <label className="form-label">نوع فیلد</label>
            <select className="form-input" value={draft.type} onChange={(e) => set('type', e.target.value)}>
              {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">راهنمای زیر فیلد (اختیاری)</label>
            <input className="form-input" value={draft.hint} onChange={(e) => set('hint', e.target.value)} />
          </div>
          {draft.type === 'select' && (
            <div className="form-group rz-grid__full">
              <label className="form-label">گزینه‌ها — هر گزینه در یک خط *</label>
              <textarea className="form-input" rows={4} value={draft.options} onChange={(e) => set('options', e.target.value)} placeholder={'قهوه‌ای\nمشکی\nسبز'} />
            </div>
          )}
          <div className="form-group rz-grid__full">
            <label className="rz-check">
              <input type="checkbox" checked={draft.required} onChange={(e) => set('required', e.target.checked)} />
              <span>پرکردن این فیلد هنگام ساخت رزومه الزامی باشد</span>
            </label>
          </div>
          <div className="rz-grid__full rz-foot__actions">
            {editing && (
              <button type="button" className="btn btn--outline" onClick={() => { setEditing(null); setDraft(EMPTY); }}>انصراف</button>
            )}
            <button type="submit" className="btn btn--dark" disabled={busy}>
              {busy ? 'در حال ذخیره…' : editing ? 'ذخیره تغییرات' : 'افزودن فیلد'}
            </button>
          </div>
        </form>
      </section>

      <section className="rz-card">
        <div className="rz-card__head">
          <h3>فیلدهای ساخته‌شده</h3>
          <p>ترتیب این فهرست همان ترتیبی است که در فرم رزومه دیده می‌شود.</p>
        </div>

        {fields.length === 0 ? (
          <p className="rz-empty">هنوز فیلدی نساخته‌اید. فرم رزومه فعلاً فقط فیلدهای پایه را دارد.</p>
        ) : (
          <div className="rz-fieldlist">
            {fields.map((f, i) => (
              <div key={f.id} className="rz-fieldrow">
                <div className="rz-fieldrow__main">
                  <strong>{f.label}</strong>
                  <span className="su-tag su-tag--muted">{TYPE_LABEL[f.type] || f.type}</span>
                  {f.required && <span className="su-tag su-tag--enrolled">الزامی</span>}
                  {!f.active && <span className="su-tag su-tag--off">غیرفعال</span>}
                  {f.hint && <small>{f.hint}</small>}
                </div>
                <div className="rz-photo__actions">
                  <button type="button" className="btn btn--sm btn--ghost" disabled={busy || i === 0} onClick={() => move(i, -1)}>بالا</button>
                  <button type="button" className="btn btn--sm btn--ghost" disabled={busy || i === fields.length - 1} onClick={() => move(i, 1)}>پایین</button>
                  <button type="button" className="btn btn--sm btn--outline" disabled={busy}
                    onClick={() => send(`/api/admin/resume-fields/${f.id}`, 'PATCH', { active: !f.active })}>
                    {f.active ? 'غیرفعال‌کردن' : 'فعال‌کردن'}
                  </button>
                  <button type="button" className="btn btn--sm btn--outline" disabled={busy} onClick={() => startEdit(f)}>ویرایش</button>
                  <button type="button" className="btn btn--sm btn--danger" disabled={busy} onClick={() => remove(f)}>حذف</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
