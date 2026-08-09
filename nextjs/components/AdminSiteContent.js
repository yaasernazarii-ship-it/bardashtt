'use client';

import { useEffect, useState } from 'react';
import Icon from './Icon';
import { uploadFile } from '@/lib/uploadClient';

export default function AdminSiteContent() {
  const [groups, setGroups] = useState([]);
  const [values, setValues] = useState({});
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

  async function save(e) {
    e.preventDefault();
    setSaving(true); setError(''); setOkMsg('');
    const res = await fetch('/api/admin/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates: values }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.ok) setOkMsg('تغییرات ذخیره شد و روی سایت اعمال شد.');
    else setError(data.error || 'خطا در ذخیره.');
  }

  if (loading) return <p style={{ color: 'var(--muted)' }}>در حال بارگذاری…</p>;

  return (
    <form onSubmit={save}>
      {error && <div className="alert alert--error" style={{ marginBottom: 12 }}>{error}</div>}
      {okMsg && <div className="alert alert--success" style={{ marginBottom: 12 }}>{okMsg}</div>}

      {groups.map((g) => (
        <div key={g.id} className="form-shell" style={{ marginBottom: 22 }}>
          <h2 className="heading" style={{ fontSize: '1.1rem', marginBottom: 16 }}>{g.title}</h2>
          {g.fields.map((f) => (
            <div className="form-group" key={f.key}>
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
      ))}

      <div style={{ position: 'sticky', bottom: 0, background: 'var(--bg)', padding: '12px 0' }}>
        <button className="btn btn--dark" type="submit" disabled={saving}>
          {saving ? 'در حال ذخیره…' : 'ذخیره همهٔ تغییرات'}
        </button>
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
