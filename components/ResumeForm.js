'use client';

import { useEffect, useState } from 'react';

const empty = {
  fullName: '', headline: '', bio: '', gender: '', city: '', birthYear: '',
  heightCm: '', skills: '', experience: '', photoUrl: '', showreelUrl: '', isPublic: false,
};

export default function ResumeForm() {
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/resume');
      const data = await res.json();
      if (data.ok && data.resume) {
        setForm({ ...empty, ...Object.fromEntries(Object.entries(data.resume).map(([k, v]) => [k, v ?? (k === 'isPublic' ? false : '')])) });
      }
      setLoading(false);
    })();
  }, []);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); setSaved(false); }

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!form.fullName.trim()) { setError('نام و نام خانوادگی الزامی است.'); return; }
    setBusy(true);
    const res = await fetch('/api/resume', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setBusy(false);
    if (!data.ok) { setError(data.error || 'خطا در ذخیره.'); return; }
    setSaved(true);
  }

  if (loading) return <p style={{ color: 'var(--muted)' }}>در حال بارگذاری…</p>;

  return (
    <form onSubmit={submit} className="form-shell">
      {error && <div className="alert alert--error" style={{ marginBottom: 12 }}>{error}</div>}
      {saved && <div className="alert alert--success" style={{ marginBottom: 12 }}>رزومه ذخیره شد.</div>}
      <div className="cal-form-grid">
        <div className="form-group">
          <label className="form-label">نام و نام خانوادگی *</label>
          <input className="form-input" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">عنوان / تخصص</label>
          <input className="form-input" value={form.headline} onChange={(e) => set('headline', e.target.value)} placeholder="بازیگر تئاتر و سینما" />
        </div>
        <div className="form-group">
          <label className="form-label">جنسیت</label>
          <select className="form-input" value={form.gender} onChange={(e) => set('gender', e.target.value)}>
            <option value="">—</option>
            <option value="male">آقا</option>
            <option value="female">خانم</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">شهر</label>
          <input className="form-input" value={form.city} onChange={(e) => set('city', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">سال تولد</label>
          <input className="form-input" type="number" value={form.birthYear} onChange={(e) => set('birthYear', e.target.value)} placeholder="۱۳۷۵" />
        </div>
        <div className="form-group">
          <label className="form-label">قد (سانتی‌متر)</label>
          <input className="form-input" type="number" value={form.heightCm} onChange={(e) => set('heightCm', e.target.value)} placeholder="۱۷۵" />
        </div>
        <div className="form-group cal-form-full">
          <label className="form-label">مهارت‌ها (با ویرگول جدا کنید)</label>
          <input className="form-input" value={form.skills} onChange={(e) => set('skills', e.target.value)} placeholder="رقص، اسب‌سواری، گویندگی" />
        </div>
        <div className="form-group cal-form-full">
          <label className="form-label">معرفی کوتاه</label>
          <textarea className="form-input" rows={3} value={form.bio} onChange={(e) => set('bio', e.target.value)} />
        </div>
        <div className="form-group cal-form-full">
          <label className="form-label">سوابق و تجربه‌ها</label>
          <textarea className="form-input" rows={4} value={form.experience} onChange={(e) => set('experience', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">نشانی عکس (URL)</label>
          <input className="form-input" dir="ltr" value={form.photoUrl} onChange={(e) => set('photoUrl', e.target.value)} placeholder="https://…" />
        </div>
        <div className="form-group">
          <label className="form-label">نشانی نمونه‌کار / شوریل (URL)</label>
          <input className="form-input" dir="ltr" value={form.showreelUrl} onChange={(e) => set('showreelUrl', e.target.value)} placeholder="https://…" />
        </div>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 16px', cursor: 'pointer' }}>
        <input type="checkbox" checked={form.isPublic} onChange={(e) => set('isPublic', e.target.checked)} />
        <span>رزومه‌ام برای فیلم‌سازان و بازدیدکنندگان نمایش داده شود</span>
      </label>
      <button className="btn btn--dark" type="submit" disabled={busy}>{busy ? 'در حال ذخیره…' : 'ذخیره رزومه'}</button>
    </form>
  );
}
