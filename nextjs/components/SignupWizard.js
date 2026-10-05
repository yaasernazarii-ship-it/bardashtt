'use client';

import { useEffect, useState } from 'react';
import Icon from './Icon';

const EMPTY = { firstName: '', lastName: '', phone: '', nationalId: '', branch: 'تهران', birthDate: '', idCardImage: '', goal: '' };

// متن‌ها از پنل («متن صفحات» ← «فرم ثبت‌نام») می‌آیند و به‌صورت prop می‌رسند.
// مقادیر زیر فقط پشتیبانِ حالتی هستند که content ارسال نشده باشد.
const FALLBACK = {
  roleTitle: 'ساخت حساب کاربری',
  roleSubtitle: 'ابتدا مشخص کنید به چه عنوانی می‌خواهید عضو شوید.',
  roleStudent: 'هنرجو',
  roleFilmmaker: 'فیلمساز',
  studentTitle: 'ساخت حساب کاربری هنرجو',
  filmmakerTitle: 'ساخت حساب کاربری فیلمساز',
  formSubtitle: 'اطلاعات زیر را کامل کنید تا پس از تأیید، حساب کاربری شما ساخته شود.',
  labelFirstName: 'نام',
  labelLastName: 'نام خانوادگی',
  labelPhone: 'شماره تماس',
  labelBirthDate: 'تاریخ تولد',
  labelBranch: 'شعبه ثبت‌نامی',
  labelIdCard: 'عکس شناسنامه یا کارت ملی',
  labelNationalId: 'کد ملی',
  labelGoal: 'هدفتان از انتخاب خانواده برداشت',
  placeholderGoal: 'کمی درباره‌ی هدف و انگیزه‌تان بنویسید…',
  submit: 'ثبت درخواست',
  submitting: 'در حال ثبت…',
  back: 'بازگشت',
  doneTitle: 'درخواست شما با موفقیت ثبت شد',
  doneText: 'درخواست عضویت شما دریافت شد. لطفاً منتظر صدور نام کاربری و رمز عبور از سوی خانواده برداشت بمانید. پس از بررسی و تأیید، این اطلاعات برای شما ارسال می‌شود و می‌توانید از صفحهٔ ورود وارد حساب خود شوید.',
};

export default function SignupWizard({ content }) {
  const c = { ...FALLBACK, ...(content || {}) };
  const [role, setRole] = useState(''); // '' | 'student' | 'filmmaker'
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [idCardPreview, setIdCardPreview] = useState('');

  useEffect(() => () => {
    if (idCardPreview) URL.revokeObjectURL(idCardPreview);
  }, [idCardPreview]);

  function set(k, v) { setForm((p) => ({ ...p, [k]: v })); setError(''); }

  function reset() { setRole(''); setForm(EMPTY); setIdCardPreview(''); setError(''); }

  async function uploadIdCard(file) {
    if (!file) return;
    setUploading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/signup/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'آپلود عکس ناموفق بود.'); return; }
      setIdCardPreview(URL.createObjectURL(file));
      set('idCardImage', data.ref);
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
          <h2>{c.doneTitle}</h2>
        </div>
        <div className="alert alert--success" style={{ lineHeight: 2 }}>{c.doneText}</div>
      </div>
    );
  }

  // گام ۱: انتخاب نقش
  if (!role) {
    return (
      <div className="form-shell">
        <div className="form-shell__head">
          <h2>{c.roleTitle}</h2>
          <p>{c.roleSubtitle}</p>
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          <button type="button" className="btn btn--dark btn--full" onClick={() => { setForm(EMPTY); setRole('student'); }}>
            <Icon name="graduationCap" size={17} /> {c.roleStudent}
          </button>
          <button type="button" className="btn btn--outline btn--full" onClick={() => { setForm(EMPTY); setRole('filmmaker'); }}>
            <Icon name="clapperboard" size={17} /> {c.roleFilmmaker}
          </button>
        </div>
      </div>
    );
  }

  // نقش فیلمساز: نام، نام خانوادگی، کد ملی
  if (role === 'filmmaker') {
    return (
      <form className="form-shell" onSubmit={(e) => submit(e, {
        role: 'filmmaker', firstName: form.firstName, lastName: form.lastName, nationalId: form.nationalId, goal: form.goal,
      })}>
        <div className="form-shell__head">
          <h2>{c.filmmakerTitle}</h2>
          <p>{c.formSubtitle}</p>
        </div>
        {error && <div className="alert alert--error">{error}</div>}
        <div className="form-group"><label className="form-label">{c.labelFirstName}</label>
          <input className="form-input" required value={form.firstName} onChange={(e) => set('firstName', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">{c.labelLastName}</label>
          <input className="form-input" required value={form.lastName} onChange={(e) => set('lastName', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">{c.labelNationalId}</label>
          <input className="form-input" dir="ltr" inputMode="numeric" maxLength={10} required placeholder="کد ملی ۱۰ رقمی"
            value={form.nationalId} onChange={(e) => set('nationalId', e.target.value.replace(/[^\d]/g, ''))} /></div>
        <div className="form-group"><label className="form-label">{c.labelGoal}</label>
          <textarea className="form-input" rows={4} required placeholder={c.placeholderGoal}
            value={form.goal} onChange={(e) => set('goal', e.target.value)} /></div>
        <button className="btn btn--dark btn--full" disabled={loading}>{loading ? c.submitting : c.submit}</button>
        <button type="button" className="btn btn--ghost btn--full" style={{ marginTop: 8 }} onClick={reset}>{c.back}</button>
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
        <h2>{c.studentTitle}</h2>
        <p>{c.formSubtitle}</p>
      </div>
      {error && <div className="alert alert--error">{error}</div>}
      <div className="form-group"><label className="form-label">{c.labelFirstName}</label>
        <input className="form-input" required value={form.firstName} onChange={(e) => set('firstName', e.target.value)} /></div>
      <div className="form-group"><label className="form-label">{c.labelLastName}</label>
        <input className="form-input" required value={form.lastName} onChange={(e) => set('lastName', e.target.value)} /></div>
      <div className="form-group"><label className="form-label">{c.labelPhone}</label>
        <input className="form-input" dir="ltr" type="tel" inputMode="numeric" required placeholder="09xxxxxxxxx"
          value={form.phone} onChange={(e) => set('phone', e.target.value)} /></div>
      <div className="form-group"><label className="form-label">{c.labelBirthDate}</label>
        <input className="form-input" dir="ltr" required placeholder="مثلاً ۱۳۸۰/۰۵/۱۲"
          value={form.birthDate} onChange={(e) => set('birthDate', e.target.value)} /></div>
      <div className="form-group"><label className="form-label">{c.labelBranch}</label>
        <select className="form-input" value={form.branch} onChange={(e) => set('branch', e.target.value)}>
          <option value="تهران">تهران</option>
          <option value="ساری">ساری</option>
        </select></div>
      <div className="form-group">
        <label className="form-label">{c.labelIdCard}</label>
        <input className="form-input" type="file" accept="image/png,image/jpeg,image/webp"
          onChange={(e) => uploadIdCard(e.target.files?.[0])} />
        {uploading && <p style={{ color: 'var(--muted)', fontSize: '.82rem', marginTop: 6 }}>در حال بارگذاری عکس…</p>}
        {form.idCardImage && !uploading && (
          <div style={{ marginTop: 10 }}>
            <img src={idCardPreview} alt="عکس شناسنامه" style={{ maxWidth: '100%', maxHeight: 180, borderRadius: 10, border: '1px solid var(--border)' }} />
            <p style={{ color: '#16A34A', fontSize: '.82rem', marginTop: 6 }}>عکس بارگذاری شد.</p>
          </div>
        )}
      </div>
      <button className="btn btn--dark btn--full" disabled={loading || uploading}>{loading ? c.submitting : c.submit}</button>
      <button type="button" className="btn btn--ghost btn--full" style={{ marginTop: 8 }} onClick={reset}>{c.back}</button>
    </form>
  );
}
