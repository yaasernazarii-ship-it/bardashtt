'use client';

import { useEffect, useState } from 'react';

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
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    setUploadingKey('');
    if (data.ok) set(key, data.url);
    else setError(data.error || 'آپلود ناموفق بود.');
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
