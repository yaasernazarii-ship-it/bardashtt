'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

// آپلود عکس ۳×۴ کاربر؛ فایل روی سرور به نسبت ۳×۴ برش و به WebP فشرده می‌شود.
function PhotoPicker({ initialUrl }) {
  const router = useRouter();
  const [url, setUrl] = useState(initialUrl || '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const fileRef = useRef(null);

  async function pick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setMsg(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/my/photo', { method: 'POST', body: fd });
      const d = await res.json();
      if (!d.ok) { setMsg({ type: 'error', text: d.error || 'آپلود ناموفق بود.' }); return; }
      setUrl(d.url);
      setMsg({ type: 'success', text: 'عکس شما ثبت شد.' });
      router.refresh();
    } catch {
      setMsg({ type: 'error', text: 'ارتباط با سرور برقرار نشد.' });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function remove() {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch('/api/my/photo', { method: 'DELETE' });
      const d = await res.json();
      if (!d.ok) { setMsg({ type: 'error', text: d.error || 'حذف نشد.' }); return; }
      setUrl('');
      setMsg({ type: 'success', text: 'عکس حذف شد.' });
      router.refresh();
    } catch {
      setMsg({ type: 'error', text: 'ارتباط با سرور برقرار نشد.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="form-group">
      <label className="form-label">عکس پرسنلی ۳×۴</label>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
        <div className="user-photo user-photo--lg">
          {url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={url} alt="عکس من" />
            : <span className="user-photo__empty">بدون عکس</span>}
        </div>
        <div style={{ flex: 1, minWidth: 210 }}>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="form-input" onChange={pick} disabled={busy} />
          <p className="form-hint">عکس واضح و رو‌به‌رو با پس‌زمینهٔ ساده؛ jpg، png یا webp تا ۶ مگابایت. عکس خودکار به نسبت ۳×۴ برش داده می‌شود.</p>
          {busy && <span style={{ color: 'var(--muted)', fontSize: '.8rem' }}>در حال پردازش…</span>}
          {url && !busy && (
            <button type="button" className="btn btn--sm btn--outline" onClick={remove}>حذف عکس</button>
          )}
        </div>
      </div>
      {msg && <div className={`alert alert--${msg.type}`} style={{ marginTop: 10 }}>{msg.text}</div>}
    </div>
  );
}

export default function ProfileForm({ initial, role }) {
  const isFilmmaker = role === 'filmmaker';
  const [form, setForm] = useState({
    displayName: initial.displayName || '',
    contactPhone: initial.contactPhone || '',
    city: initial.city || '',
    birthYear: initial.birthYear || '',
    gender: initial.gender || '',
    company: initial.company || '',
    activityField: initial.activityField || '',
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
      <PhotoPicker initialUrl={initial.photoUrl} />
      <div className="form-group">
        <label className="form-label">شماره موبایل</label>
        <input className="form-input" dir="ltr" value={initial.phone} disabled />
      </div>
      <div className="form-group">
        <label className="form-label">نام و نام خانوادگی</label>
        <input className="form-input" value={form.displayName} onChange={(e) => update('displayName', e.target.value)} autoComplete="name" />
      </div>
      <div className="form-group">
        <label className="form-label">جنسیت</label>
        <select className="form-input" value={form.gender} onChange={(e) => update('gender', e.target.value)}>
          <option value="">انتخاب نشده</option>
          <option value="male">آقا</option>
          <option value="female">خانم</option>
        </select>
        <p className="form-hint">روی گواهی‌نامهٔ پایان دوره به‌صورت «آقای …» یا «خانم …» درج می‌شود.</p>
      </div>
      {isFilmmaker && (
        <>
          <div className="form-group">
            <label className="form-label">شماره تماس</label>
            <input className="form-input" dir="ltr" type="tel" inputMode="tel" placeholder="09xxxxxxxxx" autoComplete="tel" value={form.contactPhone} onChange={(e) => update('contactPhone', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">شرکت / گروه تولید</label>
            <input className="form-input" value={form.company} onChange={(e) => update('company', e.target.value)} placeholder="نام شرکت یا گروه فیلم‌سازی" />
            <p className="form-hint">در بررسی درخواست‌های ست تایم به تیم پشتیبانی کمک می‌کند.</p>
          </div>
          <div className="form-group">
            <label className="form-label">زمینهٔ فعالیت</label>
            <input className="form-input" value={form.activityField} onChange={(e) => update('activityField', e.target.value)} placeholder="مثلاً کارگردانی، تیزر تبلیغاتی، سریال شبکه نمایش خانگی" />
          </div>
        </>
      )}
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
