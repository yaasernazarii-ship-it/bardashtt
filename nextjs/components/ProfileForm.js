'use client';

import { useState } from 'react';

export default function ProfileForm({ initial }) {
  const [form, setForm] = useState({
    displayName: initial.displayName || '',
    city: initial.city || '',
    birthYear: initial.birthYear || '',
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save(e) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.ok) { setMsg({ type: 'error', text: data.error || 'ذخیره نشد.' }); return; }
      setMsg({ type: 'success', text: 'پروفایل با موفقیت ذخیره شد.' });
    } catch {
      setMsg({ type: 'error', text: 'ارتباط با سرور برقرار نشد.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="form-shell" onSubmit={save} style={{ maxWidth: 520 }}>
      {msg && <div className={`alert alert--${msg.type}`}>{msg.text}</div>}
      <div className="form-group">
        <label className="form-label">شماره موبایل</label>
        <input className="form-input" dir="ltr" value={initial.phone} disabled />
      </div>
      <div className="form-group">
        <label className="form-label">نام و نام خانوادگی</label>
        <input className="form-input" value={form.displayName} onChange={(e) => update('displayName', e.target.value)} autoComplete="name" />
      </div>
      <div className="form-group">
        <label className="form-label">شهر</label>
        <input className="form-input" value={form.city} onChange={(e) => update('city', e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">سال تولد</label>
        <input className="form-input" dir="ltr" inputMode="numeric" placeholder="مثلاً ۱۳۸۵" value={form.birthYear} onChange={(e) => update('birthYear', e.target.value)} />
      </div>
      <button className="btn btn--dark btn--full" disabled={loading}>{loading ? 'در حال ذخیره…' : 'ذخیره تغییرات'}</button>
    </form>
  );
}
