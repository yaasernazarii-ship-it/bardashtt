'use client';

import { useEffect, useState } from 'react';
import { parseFieldOptions } from '@/lib/resumeFields';

const LOOKS = { male: [['beard', 'با ریش'], ['cleanShaven', 'بی‌ریش']], female: [['makeup', 'با میکاپ'], ['noMakeup', 'بدون میکاپ']] };
const POSES = [['front', 'تمام‌رخ'], ['profile', 'نیم‌رخ'], ['threeQuarter', 'سه‌رخ']];
const EMPTY = { firstName: '', lastName: '', age: '', heightCm: '', weightKg: '', gender: '', city: '', customValues: {} };

export default function ActorIntroductionForm() {
  const [form, setForm] = useState(EMPTY);
  const [fields, setFields] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [profilePhoto, setProfilePhoto] = useState('');
  const [saved, setSaved] = useState(false);
  const [savedGender, setSavedGender] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [look, setLook] = useState('');
  const [pose, setPose] = useState('');
  const activePhotoCount = photos.filter((photo) => photo.approvalStatus !== 'rejected').length;

  useEffect(() => {
    fetch('/api/my/actor-introduction').then((response) => response.json()).then((data) => {
      if (!data.ok) { setNotice(data.error); return; }
      setFields(data.fields);
      setPhotos(data.resume?.photos || []);
      setProfilePhoto(data.profilePhotoUrl || '');
      setSaved(!!data.resume);
      setSavedGender(data.resume?.gender || '');
      if (data.resume) setForm({ firstName: data.resume.firstName, lastName: data.resume.lastName, age: data.resume.age ?? '', heightCm: data.resume.heightCm ?? '', weightKg: data.resume.weightKg ?? '', gender: data.resume.gender || '', city: data.resume.city || '', customValues: data.resume.customValues || {} });
    }).catch(() => setNotice('دریافت اطلاعات ممکن نشد.'));
  }, []);

  function set(key, value) { setForm((previous) => ({ ...previous, [key]: value })); }
  async function save(event) {
    event.preventDefault(); setBusy(true); setNotice('');
    try {
      const response = await fetch('/api/my/actor-introduction', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!data.ok) setNotice(data.error);
      else { setSaved(true); setSavedGender(form.gender); setNotice('مشخصات معرفی ذخیره شد.'); }
    } catch { setNotice('ذخیرهٔ مشخصات ممکن نشد.'); }
    setBusy(false);
  }
  async function upload(event) {
    const files = [...event.target.files];
    event.target.value = '';
    if (files.length + activePhotoCount > 15) { setNotice('حداکثر ۱۵ عکس تأییدشده یا در انتظار بررسی قابل ثبت است.'); return; }
    setBusy(true); setNotice('');
    for (const file of files) {
      try {
        const body = new FormData(); body.set('file', file); body.set('look', look); body.set('pose', pose);
        const response = await fetch('/api/my/actor-introduction/photos', { method: 'POST', body });
        const data = await response.json();
        if (!data.ok) { setNotice(data.error); break; }
        setPhotos((previous) => [...previous, data.photo]);
      } catch { setNotice('بارگذاری عکس ممکن نشد.'); break; }
    }
    setBusy(false);
    if (files.length) setNotice((previous) => previous || 'عکس‌ها ثبت شدند و پس از تأیید مدیر یا ادیتور نمایش عمومی خواهند داشت.');
  }

  return (
    <div className="rz-editor">
      <section className="rz-card">
        <div className="rz-card__head"><h2>معرفی بازیگر</h2><p>این اطلاعات از پروفایل حساب شما مستقل است. عکس اصلی فقط از عکس حساب کاربری گرفته می‌شود.</p></div>
        <div className="rz-actions">
          {profilePhoto ? <img src={profilePhoto} alt="عکس اصلی حساب کاربری" width="90" height="120" style={{ objectFit: 'cover', borderRadius: 8 }} /> : <p>هنوز عکس حساب کاربری ندارید؛ از بخش پروفایل عکس بگذارید.</p>}
        </div>
        <form onSubmit={save} className="rz-grid">
          {[['firstName', 'نام', 'text'], ['lastName', 'نام خانوادگی', 'text'], ['age', 'سن', 'number'], ['heightCm', 'قد (سانتی‌متر)', 'number'], ['weightKg', 'وزن (کیلوگرم)', 'number'], ['city', 'شهر', 'text']].map(([key, label, type]) => (
            <label className="form-group" key={key}><span className="form-label">{label}</span><input className="form-input" type={type} value={form[key]} required={key === 'firstName' || key === 'lastName'} onChange={(event) => set(key, event.target.value)} /></label>
          ))}
          <label className="form-group"><span className="form-label">جنسیت</span><select className="form-input" value={form.gender} required disabled={photos.length > 0} onChange={(event) => { set('gender', event.target.value); setLook(''); }}><option value="">انتخاب کنید</option><option value="male">آقا</option><option value="female">خانم</option></select></label>
          {fields.map((field) => <label className="form-group" key={field.id}><span className="form-label">{field.label}</span>{field.type === 'select' ? <select className="form-input" value={form.customValues[field.key] ?? ''} required={field.required} onChange={(event) => set('customValues', { ...form.customValues, [field.key]: event.target.value })}><option value="">انتخاب کنید</option>{parseFieldOptions(field.options).map((option) => <option key={option}>{option}</option>)}</select> : field.type === 'textarea' ? <textarea className="form-input" value={form.customValues[field.key] ?? ''} required={field.required} onChange={(event) => set('customValues', { ...form.customValues, [field.key]: event.target.value })} /> : field.type === 'boolean' ? <input type="checkbox" checked={form.customValues[field.key] === true} onChange={(event) => set('customValues', { ...form.customValues, [field.key]: event.target.checked })} /> : <input className="form-input" type={field.type === 'number' ? 'number' : 'text'} value={form.customValues[field.key] ?? ''} required={field.required} onChange={(event) => set('customValues', { ...form.customValues, [field.key]: event.target.value })} />}</label>)}
          <div className="rz-grid__full"><button className="btn btn--dark" disabled={busy}>{busy ? 'در حال ذخیره…' : 'ذخیرهٔ مشخصات'}</button></div>
        </form>
      </section>
      <section className="rz-card"><div className="rz-card__head"><h2>آرشیو عکس‌های معرفی</h2><p>حداکثر ۱۵ عکس جدا از عکس اصلی. عکس‌های جدید پس از تأیید مدیر یا ادیتور در بانک بازیگران نمایش داده می‌شوند؛ تغییر عکس ثبت‌شده فقط در اختیار مدیریت است.</p></div>
        <p>{activePhotoCount.toLocaleString('fa-IR')} از ۱۵ عکس تأییدشده یا در انتظار بررسی؛ {photos.filter((photo) => photo.approvalStatus === 'pending').length.toLocaleString('fa-IR')} عکس در انتظار تأیید</p>
        <div className="rz-actions">
          <label className="form-group"><span className="form-label">حالت چهره</span><select className="form-input" value={look} onChange={(event) => setLook(event.target.value)}><option value="">انتخاب کنید</option>{(LOOKS[form.gender] || []).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="form-group"><span className="form-label">زاویه</span><select className="form-input" value={pose} onChange={(event) => setPose(event.target.value)}><option value="">انتخاب کنید</option>{POSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="form-group"><span className="form-label">بارگذاری عکس</span><input className="form-input" type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={!saved || form.gender !== savedGender || !look || !pose || busy || activePhotoCount >= 15} onChange={upload} /></label>
        </div>
        {!saved && <p>ابتدا مشخصات خود را ذخیره کنید.</p>}
        <div className="rz-photos">{photos.map((photo) => <div className="rz-photo" key={photo.id}><img src={photo.url} alt="عکس معرفی" /><div className="rz-photo__body">{(LOOKS[form.gender] || []).find(([value]) => value === photo.look)?.[1]} — {POSES.find(([value]) => value === photo.pose)?.[1]}<br /><strong>{photo.approvalStatus === 'pending' ? 'در انتظار تأیید' : photo.approvalStatus === 'rejected' ? 'ردشده؛ می‌توانید عکس جایگزین بارگذاری کنید' : 'تأییدشده'}</strong></div></div>)}</div>
      </section>
      {notice && <div className="alert alert--info" role="status">{notice}</div>}
    </div>
  );
}
