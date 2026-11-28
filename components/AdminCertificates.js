'use client';

import { useEffect, useRef, useState } from 'react';
import UserPhotoThumb from './UserPhotoThumb';

const dateFmt = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
const fa = (n) => new Intl.NumberFormat('fa-IR', { useGrouping: false }).format(n ?? 0);

const emptyForm = {
  userId: '',
  fullName: '',
  gender: '',
  nationalId: '',
  courseTitle: '',
  branch: '',
  percent: '',
  issuedAt: '',
  markGraduated: false,
};

export default function AdminCertificates() {
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(emptyForm);
  // عکسِ پروفایلِ هنرجو صرفاً پیش‌فرض است؛ photoUrl عکسی است که مدیر جدا آپلود کرده و بر آن مقدم است.
  const [profilePhoto, setProfilePhoto] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoBusy, setPhotoBusy] = useState(false);
  // شناسهٔ گواهی‌ای که همین حالا عکسش در حال تغییر است؛ فقط دکمه‌های همان ردیف قفل می‌شوند.
  const [rowBusy, setRowBusy] = useState('');
  const fileRef = useRef(null);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  // با انتخاب هنرجو، اطلاعات پروفایلش پیشنهاد می‌شود. همه‌شان قابل ویرایش‌اند چون
  // نامِ روی گواهی باید شناسنامه‌ای باشد و پروفایلِ هنرجویان قدیمی اغلب ناقص است.
  function pickUser(id) {
    const u = users.find((x) => x.id === id);
    setForm({
      ...emptyForm,
      userId: id,
      fullName: u?.displayName || '',
      gender: u?.gender || '',
      nationalId: u?.nationalId || '',
      courseTitle: u?.courseTitle || '',
      branch: u?.branch || '',
    });
    setProfilePhoto(u?.photoUrl || '');
    setPhotoUrl('');
    if (fileRef.current) fileRef.current.value = '';
  }

  function resetForm() {
    setForm(emptyForm);
    setProfilePhoto('');
    setPhotoUrl('');
    if (fileRef.current) fileRef.current.value = '';
  }

  async function load() {
    setLoading(true);
    try {
      const [cRes, uRes] = await Promise.all([fetch('/api/admin/certificates'), fetch('/api/admin/users')]);
      const cData = await cRes.json();
      const uData = await uRes.json();
      if (cData.ok) setItems(cData.items); else setError(cData.error || 'خطا در بارگذاری.');
      if (uData.ok) setUsers(uData.users.filter((u) => u.role === 'student'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function uploadPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoBusy(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/certificates/photo', { method: 'POST', body: fd });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'آپلود عکس ناموفق بود.'); return; }
      setPhotoUrl(data.url);
    } finally {
      setPhotoBusy(false);
    }
  }

  function clearPhoto() {
    setPhotoUrl('');
    if (fileRef.current) fileRef.current.value = '';
  }

  async function issue(e) {
    e.preventDefault();
    setBusy(true); setError(''); setNotice('');
    try {
      const res = await fetch('/api/admin/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, photoUrl }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'صدور ناموفق بود.'); return; }
      setNotice(`گواهی «${data.item.fullName}» با کد استعلام ${data.item.serial} صادر شد.`);
      resetForm();
      await load();
    } finally {
      setBusy(false);
    }
  }

  // تغییر عکسِ گواهیِ صادرشده. فایل تازه اول آپلود می‌شود و بعد روی همان گواهی می‌نشیند؛
  // مقدار خالی یعنی عکس برداشته شود. PDF در لحظهٔ دانلود ساخته می‌شود، پس تغییر فوری است.
  async function changePhoto(c, source) {
    setRowBusy(c.id); setError(''); setNotice('');
    try {
      const res = await fetch(`/api/admin/certificates/${c.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrl: source }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'تغییر عکس ناموفق بود.'); return; }
      setItems((prev) => prev.map((it) => (it.id === c.id ? { ...it, photoUrl: data.item.photoUrl } : it)));
      setNotice(`عکس گواهی ${c.serial} به‌روز شد.`);
    } finally {
      setRowBusy('');
    }
  }

  async function uploadRowPhoto(c, e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setRowBusy(c.id); setError('');
    let url = '';
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/certificates/photo', { method: 'POST', body: fd });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'آپلود عکس ناموفق بود.'); return; }
      url = data.url;
    } finally {
      setRowBusy('');
    }
    if (url) await changePhoto(c, url);
  }

  async function toggleRevoke(c) {
    const next = !c.revoked;
    if (next && !confirm(`گواهی ${c.serial} باطل شود؟ در استعلام عمومی «باطل» نشان داده می‌شود.`)) return;
    const res = await fetch(`/api/admin/certificates/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ revoked: next }),
    });
    const data = await res.json();
    if (!data.ok) { setError(data.error || 'تغییر وضعیت ناموفق بود.'); return; }
    setItems((prev) => prev.map((it) => (it.id === c.id ? { ...it, revoked: next } : it)));
  }

  async function removeCertificate(c) {
    if (!confirm(`گواهی ${c.serial} برای همیشه از سایت و سرور حذف شود؟ این کار قابل بازگشت نیست.`)) return;
    setRowBusy(c.id); setError(''); setNotice('');
    const res = await fetch(`/api/admin/certificates/${c.id}`, { method: 'DELETE' });
    const data = await res.json();
    setRowBusy('');
    if (!data.ok) { setError(data.error || 'حذف گواهی ناموفق بود.'); return; }
    setItems((current) => current.filter((item) => item.id !== c.id));
    setNotice(`گواهی ${c.serial} از سایت و سرور حذف شد.`);
  }

  async function repairSerial(c) {
    const nationalId = window.prompt(`کد ملی معتبرِ ${c.fullName} را وارد کنید تا کد استعلام اصلاح شود.`);
    if (nationalId === null) return;
    setRowBusy(c.id); setError(''); setNotice('');
    try {
      const res = await fetch(`/api/admin/certificates/${c.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nationalId }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'اصلاح کد استعلام ناموفق بود.'); return; }
      setItems((prev) => prev.map((item) => (item.id === c.id ? { ...item, serial: data.item.serial, nationalId: data.item.nationalId } : item)));
      setNotice(`کد استعلام گواهی به ${data.item.serial} اصلاح شد.`);
    } finally {
      setRowBusy('');
    }
  }

  const shownPhoto = photoUrl || profilePhoto;
  const today = new Date().toISOString().slice(0, 10);
  const ready = form.userId && form.fullName.trim().length >= 3 && form.gender && form.nationalId.length === 10;

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      {error && <div className="alert alert--error">{error}</div>}
      {notice && <div className="alert alert--success">{notice}</div>}

      <form className="stack-card" onSubmit={issue}>
        <h3 style={{ marginBottom: 6 }}>صدور دستی گواهی</h3>
        <p style={{ color: 'var(--muted)', lineHeight: 1.9, marginBottom: 14 }}>
          این فرم کاملاً مستقل از آزمون سامانه است: هیچ آزمونی ساخته یا مصرف نمی‌شود و در روند آزمونِ
          هنرجو دخالتی ندارد. گواهیِ صادرشده دقیقاً مثل گواهیِ پس از آزمون است — همان کد استعلام،
          همان QR و همان فایل PDF قابل استعلام.
        </p>

        <div className="form-group">
          <label className="form-label">هنرجو</label>
          <select className="form-input" required value={form.userId} onChange={(e) => pickUser(e.target.value)}>
            <option value="">انتخاب کنید…</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.displayName || u.username || u.phone} — {u.phone}</option>
            ))}
          </select>
          <p className="form-hint">اطلاعات پروفایلِ هنرجو پیشنهاد می‌شود و همه‌جا قابل ویرایش است.</p>
        </div>

        <div className="form-group">
          <label className="form-label">نام و نام خانوادگی روی گواهی</label>
          <input
            className="form-input" required maxLength={120}
            placeholder="دقیقاً مطابق شناسنامه"
            value={form.fullName}
            onChange={(e) => set({ fullName: e.target.value })}
          />
          <p className="form-hint">نامِ نمایشیِ پروفایل همیشه شناسنامه‌ای نیست؛ همین مقدار روی گواهی چاپ می‌شود.</p>
        </div>

        <div className="form-group">
          <label className="form-label">عنوان روی گواهی</label>
          <select className="form-input" required value={form.gender} onChange={(e) => set({ gender: e.target.value })}>
            <option value="">انتخاب کنید…</option>
            <option value="male">آقای …</option>
            <option value="female">خانم …</option>
          </select>
          <p className="form-hint">در پروفایل هنرجو هم ذخیره می‌شود تا صدور بعدی دوباره نپرسد.</p>
        </div>

        <div className="form-group">
          <label className="form-label">کد ملی</label>
          <input
            className="form-input" dir="ltr" inputMode="numeric" maxLength={10} required
            placeholder="کد ملی ۱۰ رقمی"
            value={form.nationalId}
            onChange={(e) => set({ nationalId: e.target.value.replace(/[^\d]/g, '') })}
          />
          <p className="form-hint">کد استعلام گواهی از روی آن ساخته می‌شود.</p>
        </div>

        <div className="form-group">
          <label className="form-label">عنوان دوره (اختیاری)</label>
          <input
            className="form-input" maxLength={120} placeholder="مثلاً دورهٔ مقدماتی بازیگری"
            value={form.courseTitle}
            onChange={(e) => set({ courseTitle: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">شعبه (اختیاری)</label>
          <input
            className="form-input" maxLength={120} placeholder="مثلاً تهران"
            value={form.branch}
            onChange={(e) => set({ branch: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">نمرهٔ نهایی (اختیاری، از ۱۰۰ — شامل نمرهٔ کلاسی)</label>
          <input
            className="form-input" dir="ltr" inputMode="decimal" placeholder="مثل 82.5"
            value={form.percent}
            onChange={(e) => set({ percent: e.target.value })}
          />
          <p className="form-hint">خالی بگذارید تا گواهی بدون درج نمره صادر شود.</p>
        </div>

        <div className="form-group">
          <label className="form-label">تاریخ صدور (اختیاری)</label>
          <input
            className="form-input" type="date" dir="ltr" max={today}
            value={form.issuedAt}
            onChange={(e) => set({ issuedAt: e.target.value })}
          />
          <p className="form-hint">برای گواهیِ دوره‌های گذشته. خالی یعنی همین امروز؛ تاریخ آینده پذیرفته نمی‌شود.</p>
        </div>

        <div className="form-group">
          <label className="form-label">عکس پرسنلی ۳×۴ (اختیاری)</label>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
            <div className="user-photo user-photo--lg">
              {shownPhoto
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={shownPhoto} alt="عکس گواهی" />
                : <span className="user-photo__empty">بدون عکس</span>}
            </div>
            <div style={{ flex: 1, minWidth: 210 }}>
              <input
                ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
                className="form-input" onChange={uploadPhoto} disabled={photoBusy || !form.userId}
              />
              <p className="form-hint">
                {photoUrl
                  ? 'عکس آپلودشده روی گواهی چاپ می‌شود.'
                  : profilePhoto
                    ? 'عکس پروفایل هنرجو استفاده می‌شود؛ برای جایگزینی فایل تازه انتخاب کنید.'
                    : 'این هنرجو در پروفایلش عکس ندارد. بدون عکس هم گواهی سالم صادر می‌شود.'}
              </p>
              {photoBusy && <span style={{ color: 'var(--muted)', fontSize: '.8rem' }}>در حال پردازش…</span>}
              {photoUrl && !photoBusy && (
                <button type="button" className="btn btn--sm btn--outline" onClick={clearPhoto}>
                  {profilePhoto ? 'بازگشت به عکس پروفایل' : 'حذف عکس'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="form-group">
          <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', cursor: 'pointer' }}>
            <input
              type="checkbox" checked={form.markGraduated}
              onChange={(e) => set({ markGraduated: e.target.checked })}
            />
            <span>
              هنرجو فارغ‌التحصیل شود
              <span style={{ display: 'block', color: 'var(--muted)', fontSize: '.85rem', marginTop: 2 }}>
                تقویم کلاس و کلاس آنلاین از داشبورد او برداشته می‌شود؛ اگر هنوز کلاس دارد این را نزنید.
              </span>
            </span>
          </label>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn--dark" disabled={busy || photoBusy || !ready}>
            {busy ? 'در حال صدور…' : 'صدور گواهی'}
          </button>
          {form.userId && (
            <button type="button" className="btn btn--outline" onClick={resetForm} disabled={busy}>انصراف</button>
          )}
        </div>
      </form>

      <div className="stack-card">
        <h3 style={{ marginBottom: 14 }}>گواهی‌های صادرشده ({fa(items.length)})</h3>
        {loading ? <p style={{ color: 'var(--muted)' }}>در حال بارگذاری…</p> : items.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>هنوز گواهی‌ای صادر نشده است.</p>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {items.map((c) => (
              <div key={c.id} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14, opacity: c.revoked ? 0.6 : 1 }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <UserPhotoThumb src={c.photoUrl} name={c.fullName} size={54} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' }}>
                      <strong>{c.fullName}</strong>
                      <span dir="ltr" style={{ fontWeight: 700 }}>{c.serial}</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, color: 'var(--muted)', marginTop: 6 }}>
                      {c.courseTitle && <span>دوره: {c.courseTitle}</span>}
                      {c.branch && <span>شعبه: {c.branch}</span>}
                      {Number.isFinite(c.percent) && <span>نمرهٔ نهایی: {fa(c.percent)} از ۱۰۰</span>}
                      <span>{dateFmt.format(new Date(c.issuedAt))}</span>
                      {c.revoked && <span style={{ color: '#dc2626', fontWeight: 700 }}>باطل‌شده</span>}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  <a className="btn" href={`/api/certificate/${encodeURIComponent(c.serial)}`} target="_blank" rel="noopener noreferrer">مشاهدهٔ PDF</a>
                  <button className="btn btn--outline" disabled={rowBusy === c.id} onClick={() => repairSerial(c)}>
                    اصلاح کد ملی و کد استعلام
                  </button>
                  <label
                    className="btn btn--outline"
                    style={{ cursor: rowBusy === c.id ? 'default' : 'pointer', opacity: rowBusy === c.id ? 0.55 : 1 }}
                  >
                    {rowBusy === c.id ? 'در حال ثبت…' : c.photoUrl ? 'تغییر عکس' : 'افزودن عکس'}
                    <input
                      type="file" accept="image/jpeg,image/png,image/webp" hidden
                      disabled={rowBusy === c.id}
                      onChange={(e) => uploadRowPhoto(c, e)}
                    />
                  </label>
                  {c.user?.photoUrl && c.user.photoUrl !== c.photoUrl && (
                    <button className="btn btn--outline" disabled={rowBusy === c.id} onClick={() => changePhoto(c, c.user.photoUrl)}>
                      عکس پروفایل هنرجو
                    </button>
                  )}
                  {c.photoUrl && (
                    <button className="btn btn--outline" disabled={rowBusy === c.id} onClick={() => changePhoto(c, null)}>
                      حذف عکس
                    </button>
                  )}
                  <button className={`btn ${c.revoked ? '' : 'btn--danger'}`} disabled={rowBusy === c.id} onClick={() => toggleRevoke(c)}>
                    {c.revoked ? 'اعادهٔ اعتبار' : 'ابطال'}
                  </button>
                  <button className="btn btn--danger" disabled={rowBusy === c.id} onClick={() => removeCertificate(c)}>
                    {rowBusy === c.id ? 'در حال حذف…' : 'حذف کامل از سرور'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
