'use client';

import { useState } from 'react';

export default function SignupWizard() {
  const [role, setRole] = useState(''); // '' | 'student' | 'filmmaker'
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', nationalId: '', branch: 'تهران' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  function set(k, v) { setForm((p) => ({ ...p, [k]: v })); setError(''); }

  async function submitStudent(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'student', ...form }),
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
          <h2>درخواست شما ثبت شد</h2>
        </div>
        <div className="alert alert--success" style={{ lineHeight: 1.9 }}>
          منتظر تأییدیه خانواده برداشت برای ساخت حساب کاربری باشید. پس از تأیید، نام کاربری و رمز عبور برای شما ارسال می‌شود و می‌توانید از صفحهٔ ورود با آن وارد شوید.
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
          <button type="button" className="btn btn--dark btn--full" onClick={() => setRole('student')}>
            🎓 هنرجو
          </button>
          <button type="button" className="btn btn--outline btn--full" onClick={() => setRole('filmmaker')}>
            🎬 فیلمساز
          </button>
        </div>
      </div>
    );
  }

  // نقش فیلمساز: فعلاً در دست تکمیل
  if (role === 'filmmaker') {
    return (
      <div className="form-shell">
        <div className="form-shell__head">
          <h2>عضویت فیلمسازان</h2>
        </div>
        <div className="alert alert--info" style={{ lineHeight: 1.9 }}>
          بخش ثبت‌نام فیلمسازان به‌زودی فعال می‌شود.
        </div>
        <button type="button" className="btn btn--ghost btn--full" style={{ marginTop: 8 }} onClick={() => setRole('')}>
          بازگشت
        </button>
      </div>
    );
  }

  // گام ۲: فرم هنرجو
  return (
    <form className="form-shell" onSubmit={submitStudent}>
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
        <input className="form-input" dir="ltr" type="tel" inputMode="numeric" required placeholder="09xxxxxxxxx" value={form.phone} onChange={(e) => set('phone', e.target.value)} /></div>
      <div className="form-group"><label className="form-label">کد ملی</label>
        <input className="form-input" dir="ltr" inputMode="numeric" maxLength={10} required placeholder="کد ملی ۱۰ رقمی" value={form.nationalId} onChange={(e) => set('nationalId', e.target.value.replace(/[^\d]/g, ''))} /></div>
      <div className="form-group"><label className="form-label">شعبه محل تحصیل</label>
        <select className="form-input" value={form.branch} onChange={(e) => set('branch', e.target.value)}>
          <option value="تهران">تهران</option>
          <option value="مازندران">مازندران</option>
        </select></div>
      <button className="btn btn--dark btn--full" disabled={loading}>{loading ? 'در حال ثبت…' : 'ثبت درخواست'}</button>
      <button type="button" className="btn btn--ghost btn--full" style={{ marginTop: 8 }} onClick={() => setRole('')}>بازگشت</button>
    </form>
  );
}
