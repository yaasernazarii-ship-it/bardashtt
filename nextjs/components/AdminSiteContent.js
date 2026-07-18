'use client';

import { useEffect, useState } from 'react';

export default function AdminSiteContent() {
  const [groups, setGroups] = useState([]);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [okMsg, setOkMsg] = useState('');

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
              {f.type === 'textarea' ? (
                <textarea
                  className="form-input"
                  rows={4}
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
