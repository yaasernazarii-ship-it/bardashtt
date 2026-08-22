'use client';

import { useEffect, useState } from 'react';
import Icon from './Icon';
import { uploadFile } from '@/lib/uploadClient';

export default function AdminSiteContent() {
  const [groups, setGroups] = useState([]);
  const [values, setValues] = useState({});
  const [initial, setInitial] = useState({});
  const [openIds, setOpenIds] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [okMsg, setOkMsg] = useState('');
  const [uploadingKey, setUploadingKey] = useState('');

  async function load() {
    const res = await fetch('/api/admin/content');
    const data = await res.json();
    if (data.ok) {
      setGroups(data.groups);
      const v = {};
      for (const g of data.groups) for (const f of g.fields) v[f.key] = f.value;
      setValues(v);
      setInitial(v);
      // بخش اول باز و بقیه بسته؛ با این تعداد فیلد، بازبودنِ همه صفحه را غیرقابل‌استفاده می‌کند.
      setOpenIds(data.groups.length ? [data.groups[0].id] : []);
    } else {
      setError(data.error || 'خطا در بارگذاری.');
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function set(key, val) {
    setValues((prev) => ({ ...prev, [key]: val }));
    setOkMsg('');
  }

  async function uploadImage(key, file) {
    if (!file) return;
    setUploadingKey(key); setError('');
    const data = await uploadFile(file);
    setUploadingKey('');
    if (data.ok) set(key, data.url);
    else setError(data.error || 'آپلود ناموفق بود.');
  }

  // آپلود عکس و افزودن آن به انتهای فهرست عکس‌های یک فیلد چند‌عکسی (اسلایدشو).
  async function uploadImageAppend(key, file) {
    if (!file) return;
    setUploadingKey(key); setError('');
    const data = await uploadFile(file);
    setUploadingKey('');
    if (data.ok) {
      setValues((prev) => {
        const cur = String(prev[key] ?? '').split('\n').map((s) => s.trim()).filter(Boolean);
        return { ...prev, [key]: [...cur, data.url].join('\n') };
      });
      setOkMsg('');
    } else setError(data.error || 'آپلود ناموفق بود.');
  }

  // فقط فیلدهای تغییرکرده ارسال می‌شوند؛ هم نوشتن بی‌مورد در دیتابیس کم می‌شود
  // و هم «گزارش تغییرات» دقیقاً همان چیزی را نشان می‌دهد که واقعاً عوض شده.
  const changedKeys = Object.keys(values).filter((k) => values[k] !== initial[k]);

  async function save(e) {
    e.preventDefault();
    if (changedKeys.length === 0) { setOkMsg('تغییری برای ذخیره وجود ندارد.'); return; }
    setSaving(true); setError(''); setOkMsg('');
    const updates = {};
    for (const k of changedKeys) updates[k] = values[k];
    const res = await fetch('/api/admin/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.ok) {
      setInitial(values);
      setOkMsg('تغییرات ذخیره شد و روی سایت اعمال شد.');
    } else setError(data.error || 'خطا در ذخیره.');
  }

  function toggle(id) {
    setOpenIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const q = query.trim().toLowerCase();
  const visibleGroups = q
    ? groups
        .map((g) => ({
          ...g,
          fields: g.fields.filter(
            (f) => f.label.toLowerCase().includes(q) || f.key.toLowerCase().includes(q) || String(values[f.key] ?? '').toLowerCase().includes(q)
          ),
        }))
        .filter((g) => g.fields.length > 0 || g.title.toLowerCase().includes(q))
    : groups;

  if (loading) return <p style={{ color: 'var(--muted)' }}>در حال بارگذاری…</p>;

  return (
    <form onSubmit={save} className="admin-content-editor">
      {error && <div className="alert alert--error" style={{ marginBottom: 12 }}>{error}</div>}
      {okMsg && <div className="alert alert--success" style={{ marginBottom: 12 }}>{okMsg}</div>}

      <div className="admin-content-editor__search">
        <input
          className="form-input"
          type="search"
          placeholder="جست‌وجو در عنوان فیلدها و متن‌ها… (مثلاً «منو»، «فوتر»، «عنوان سئو»)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <p className="form-hint">
          {q
            ? `${visibleGroups.reduce((n, g) => n + g.fields.length, 0)} فیلد پیدا شد.`
            : `${groups.reduce((n, g) => n + g.fields.length, 0)} فیلد در ${groups.length} بخش. روی عنوان هر بخش بزنید تا باز شود.`}
        </p>
      </div>

      {visibleGroups.map((g) => {
        const open = q ? true : openIds.includes(g.id);
        const dirty = g.fields.filter((f) => values[f.key] !== initial[f.key]).length;
        return (
        <div key={g.id} className="form-shell admin-content-group" style={{ marginBottom: 12 }}>
          <button
            type="button"
            onClick={() => toggle(g.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', background: 'none', border: 'none', padding: 0, cursor: q ? 'default' : 'pointer', font: 'inherit', textAlign: 'right' }}
          >
            <span style={{ color: 'var(--muted)', fontSize: '.9rem' }}>{open ? '▾' : '◂'}</span>
            <h2 className="heading" style={{ fontSize: '1.1rem', margin: 0, flex: 1 }}>{g.title}</h2>
            {dirty > 0 && <span className="tag tag--gold" style={{ fontSize: '.72rem' }}>{dirty} تغییر ذخیره‌نشده</span>}
            <span style={{ color: 'var(--muted)', fontSize: '.78rem' }}>{g.fields.length} فیلد</span>
          </button>
          {open && <div style={{ marginTop: 16 }} />}
          {open && g.fields.map((f) => (
            <div className={`form-group admin-content-field${['textarea', 'list', 'image', 'images'].includes(f.type) ? ' admin-content-field--wide' : ''}`} key={f.key}>
              <label className="form-label">{f.label}</label>
              {f.type === 'image' ? (
                <div>
                  {values[f.key] ? (
                    <img
                      src={values[f.key]}
                      alt=""
                      style={{ display: 'block', maxWidth: 220, maxHeight: 150, objectFit: 'contain', borderRadius: 10, border: '1px solid var(--border)', marginBottom: 10, background: 'var(--surface)' }}
                    />
                  ) : null}
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <label className="btn btn--dark" style={{ cursor: 'pointer', margin: 0 }}>
                      {uploadingKey === f.key ? 'در حال آپلود…' : 'انتخاب عکس'}
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        disabled={uploadingKey === f.key}
                        onChange={(e) => uploadImage(f.key, e.target.files?.[0])}
                      />
                    </label>
                    {values[f.key] ? (
                      <button type="button" className="btn" onClick={() => set(f.key, '')}>حذف عکس</button>
                    ) : null}
                  </div>
                  <input
                    className="form-input"
                    style={{ marginTop: 10, direction: 'ltr', fontSize: '.82rem' }}
                    placeholder="/media/..."
                    value={values[f.key] ?? ''}
                    onChange={(e) => set(f.key, e.target.value)}
                  />
                </div>
              ) : f.type === 'images' ? (
                <ImagesField
                  value={values[f.key] ?? ''}
                  uploading={uploadingKey === f.key}
                  onUpload={(file) => uploadImageAppend(f.key, file)}
                  onChange={(v) => set(f.key, v)}
                />
              ) : f.type === 'textarea' || f.type === 'list' ? (
                <textarea
                  className="form-input"
                  rows={f.type === 'list' ? 6 : 4}
                  value={values[f.key] ?? ''}
                  onChange={(e) => set(f.key, e.target.value)}
                />
              ) : (
                <input
                  className="form-input"
                  value={values[f.key] ?? ''}
                  onChange={(e) => set(f.key, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
        );
      })}

      <div className="admin-content-savebar">
        <button className="btn btn--dark" type="submit" disabled={saving || changedKeys.length === 0}>
          {saving ? 'در حال ذخیره…' : 'ذخیره تغییرات'}
        </button>
        <span style={{ color: 'var(--muted)', fontSize: '.85rem' }}>
          {changedKeys.length === 0 ? 'تغییری ثبت نشده.' : `${changedKeys.length} فیلد تغییر کرده و ذخیره نشده است.`}
        </span>
      </div>
    </form>
  );
}

// فیلد چند‌عکسی (اسلایدشو): افزودن با آپلود یا نشانی، حذف و جابه‌جایی ترتیب عکس‌ها.
function ImagesField({ value, uploading, onUpload, onChange }) {
  const [url, setUrl] = useState('');
  const list = String(value ?? '').split('\n').map((s) => s.trim()).filter(Boolean);

  function update(next) { onChange(next.join('\n')); }
  function removeAt(i) { update(list.filter((_, j) => j !== i)); }
  function move(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    update(next);
  }
  function addUrl() {
    const u = url.trim();
    if (!u) return;
    update([...list, u]);
    setUrl('');
  }

  return (
    <div>
      {list.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
          {list.map((src, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', border: '1px solid var(--border)', borderRadius: 10, padding: 8, background: 'var(--surface)' }}>
              <span style={{ fontSize: '.8rem', fontWeight: 700, color: 'var(--muted)', width: 20, textAlign: 'center', flexShrink: 0 }}>{i + 1}</span>
              <img src={src} alt="" style={{ width: 84, height: 56, objectFit: 'cover', borderRadius: 6, flexShrink: 0, border: '1px solid var(--border)' }} />
              <span style={{ flex: 1, minWidth: 0, fontSize: '.75rem', direction: 'ltr', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--muted)' }}>{src}</span>
              <button type="button" className="btn btn--sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label="جابه‌جایی به بالا">↑</button>
              <button type="button" className="btn btn--sm" onClick={() => move(i, 1)} disabled={i === list.length - 1} aria-label="جابه‌جایی به پایین">↓</button>
              <button type="button" className="btn btn--sm" onClick={() => removeAt(i)} aria-label="حذف عکس">حذف</button>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <label className="btn btn--dark" style={{ cursor: 'pointer', margin: 0 }}>
          {uploading ? 'در حال آپلود…' : <><Icon name="plus" size={15} /> افزودن عکس</>}
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            disabled={uploading}
            onChange={(e) => onUpload(e.target.files?.[0])}
          />
        </label>
        <input
          className="form-input"
          style={{ flex: 1, minWidth: 180, direction: 'ltr', fontSize: '.82rem' }}
          placeholder="یا نشانی عکس را اینجا بگذارید"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }}
        />
        <button type="button" className="btn" onClick={addUrl}>افزودن نشانی</button>
      </div>
    </div>
  );
}
