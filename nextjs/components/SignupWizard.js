'use client';

import { useState } from 'react';

const EMPTY = { firstName: '', lastName: '', phone: '', nationalId: '', branch: 'تهران', birthDate: '', idCardImage: '' };

export default function SignupWizard() {
  const [role, setRole] = useState(''); // '' | 'student' | 'filmmaker'
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  function set(k, v) { setForm((p) => ({ ...p, [k]: v })); setError(''); }

  function reset() { setRole(''); setForm(EMPTY); setError(''); }

  async function uploadIdCard(file) {
    if (!file) return;
    setUploading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/signup/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'آپلود عکس ناموفق بود.'); return; }
      set('idCardImage', data.url);
    } catch {
      setError('آپلود عکس ناموفق بود.');
    } finally {
      setUploading(false);
    }
  }

  async function submit(e, payload) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'ثبت درخواست انجام نشد.'); return; }
      setDone(true);
    } catch {
      setError('ارتباط با سرور برقرار نشد.');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="form-shell">
        <div className="form-shell__head">
          <h2>درخواست شما با موفقیت ثبت شد ✅</h2>
        </div>
        <div className="alert alert--success" style={{ lineHeight: 2 }}>
          درخواست عضویت شما دریافت شد. لطفاً منتظر <b>صدور نام کاربری و رمز عبور</b> از سوی خانواده برداشت بمانید.
          پس از بررسی و تأیید، این اطلاعات برای شما ارسال می‌شود و می‌توانید از صفحهٔ <b>ورود</b> وارد حساب خود شوید.
        </div>
      </div>
    );
  }

  // گام ۱: انتخاب نقش
  if (!role) {
    return (
      <div className="form-shell">
        <div className="form-shell__head">
          <h2>ساخت حساب کاربری</h2>
          <p>ابتدا مشخص کنید به چه عنوانی می‌خواهید عضو شوید.</p>
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          <button type="button" className="btn btn--dark btn--full" onClick={() => { setForm(EMPTY); setRole('student'); }}>
            🎓 هنرجو
          </button>
          <button type="button" className="btn btn--outline btn--full" onClick={() => { setForm(EMPTY); setRole('filmmaker'); }}>
            🎬 فیلمساز
          </button>
        </div>
      </div>
    );
  }

  // نقش فیلمساز: نام، نام خانوادگی، کد ملی
  if (role === 'filmmaker') {
    return (
      <form className="form-shell" onSubmit={(e) => submit(e, {
        role: 'filmmaker', firstName: form.firstName, lastName: form.lastName, nationalId: form.nationalId,
      })}>
        <div className="form-shell__head">
          <h2>ثبت‌نام فیلمساز</h2>
          <p>اطلاعات زیر را کامل کنید تا پس از تأیید، حساب کاربری شما ساخته شود.</p>
        </div>
        {error && <div className="alert alert--error">{error}</div>}
        <div className="form-group"><label className="form-label">نام</label>
          <input className="form-input" required value={form.firstName} onChange={(e) => set('firstName', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">نام خانوادگی</label>
          <input className="form-input" required value={form.lastName} onChange={(e) => set('lastName', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">کد ملی</label>
          <input className="form-input" dir="ltr" inputMode="numeric" maxLength={10} required placeholder="کد ملی ۱۰ رقمی"
            value={form.nationalId} onChange={(e) => set('nationalId', e.target.value.replace(/[^\d]/g, ''))} /></div>
        <button className="btn btn--dark btn--full" disabled={loading}>{loading ? 'در حال ثبت…' : 'ثبت درخواست'}</button>
        <button type="button" className="btn btn--ghost btn--full" style={{ marginTop: 8 }} onClick={reset}>بازگشت</button>
      </form>
    );
  }

  // نقش هنرجو: نام، نام خانوادگی، عکس شناسنامه/کارت ملی، شماره تماس، شعبه (تهران/ساری)، تاریخ تولد
  return (
    <form className="form-shell" onSubmit={(e) => submit(e, {
      role: 'student', firstName: form.firstName, lastName: form.lastName, phone: form.phone,
      branch: form.branch, birthDate: form.birthDate, idCardImage: form.idCardImage,
    })}>
      <div className="form-shell__head">
        <h2>ثبت‌نام هنرجو</h2>
        <p>اطلاعات زیر را کامل کنید تا پس از تأیید، حساب کاربری شما ساخته شود.</p>
      </div>
      {error && <div className="alert alert--error">{error}</div>}
      <div className="form-group"><label className="form-label">نام</label>
        <input className="form-input" required value={form.firstName} onChange={(e) => set('firstName', e.target.value)} /></div>
      <div className="form-group"><label className="form-label">نام خانوادگی</label>
        <input className="form-input" required value={form.lastName} onChange={(e) => set('lastName', e.target.value)} /></div>
      <div className="form-group"><label className="form-label">شماره تماس</label>
        <input className="form-input" dir="ltr" type="tel" inputMode="numeric" required placeholder="09xxxxxxxxx"
          value={form.phone} onChange={(e) => set('phone', e.target.value)} /></div>
      <div className="form-group"><label className="form-label">تاریخ تولد</label>
        <input className="form-input" dir="ltr" required placeholder="مثلاً ۱۳۸۰/۰۵/۱۲"
          value={form.birthDate} onChange={(e) => set('birthDate', e.target.value)} /></div>
      <div className="form-group"><label className="form-label">شعبه ثبت‌نامی</label>
        <select className="form-input" value={form.branch} onChange={(e) => set('branch', e.target.value)}>
          <option value="تهران">تهران</option>
          <option value="ساری">ساری</option>
        </select></div>
      <div className="form-group">
        <label className="form-label">عکس شناسنامه یا کارت ملی</label>
        <input className="form-input" type="file" accept="image/png,image/jpeg,image/webp"
          onChange={(e) => uploadIdCard(e.target.files?.[0])} />
        {uploading && <p style={{ color: 'var(--muted)', fontSize: '.82rem', marginTop: 6 }}>در حال بارگذاری عکس…</p>}
        {form.idCardImage && !uploading && (
          <div style={{ marginTop: 10 }}>
            <img src={form.idCardImage} alt="عکس شناسنامه" style={{ maxWidth: '100%', maxHeight: 180, borderRadius: 10, border: '1px solid var(--border)' }} />
            <p style={{ color: '#16A34A', fontSize: '.82rem', marginTop: 6 }}>عکس بارگذاری شد ✅</p>
          </div>
        )}
      </div>
      <button className="btn btn--dark btn--full" disabled={loading || uploading}>{loading ? 'در حال ثبت…' : 'ثبت درخواست'}</button>
      <button type="button" className="btn btn--ghost btn--full" style={{ marginTop: 8 }} onClick={reset}>بازگشت</button>
    </form>
  );
}
