'use client';

import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import { uploadFile } from '@/lib/uploadClient';
import { parseFieldOptions } from '@/lib/resumeFields';

const EMPTY = {
  firstName: '', lastName: '', headline: '', gender: '', city: '', birthYear: '', age: '',
  heightCm: '', weightKg: '', contactPhone: '', skills: '', bio: '', experience: '',
  showreelUrl: '', isPublic: false,
};

function rowKey() {
  return `row-${Math.random().toString(36).slice(2)}`;
}

// افزودن آیتم رسانه از راه لینک: ورودیِ کاربر همان‌طور که هست ذخیره می‌شود و
// اعتبارسنجی نهایی روی سرور انجام می‌گیرد.
function LinkAdder({ placeholder, onAdd, label }) {
  const [value, setValue] = useState('');

  function add() {
    const url = value.trim();
    if (!url) return;
    onAdd(url);
    setValue('');
  }

  return (
    <div className="rz-linkadd">
      <input
        className="form-input"
        dir="ltr"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
      />
      <button type="button" className="btn btn--sm btn--outline" onClick={add} disabled={!value.trim()}>{label}</button>
    </div>
  );
}

export default function AdminResumeEditor({ resumeId, fields, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [custom, setCustom] = useState({});
  const [photos, setPhotos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(!!resumeId);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState('');
  const [error, setError] = useState('');
  const photoInput = useRef(null);
  const videoInput = useRef(null);

  useEffect(() => {
    if (!resumeId) return;
    let alive = true;
    (async () => {
      const res = await fetch(`/api/admin/resumes/${resumeId}`);
      const d = await res.json();
      if (!alive) return;
      if (!d.ok) { setError(d.error || 'خطا در بارگذاری رزومه.'); setLoading(false); return; }
      const r = d.resume;
      setForm({
        firstName: r.firstName || '', lastName: r.lastName || '', headline: r.headline || '',
        gender: r.gender || '', city: r.city || '', birthYear: r.birthYear ?? '', age: r.age ?? '',
        heightCm: r.heightCm ?? '', weightKg: r.weightKg ?? '', contactPhone: r.contactPhone || '',
        skills: r.skills || '', bio: r.bio || '', experience: r.experience || '',
        showreelUrl: r.showreelUrl || '', isPublic: !!r.isPublic,
      });
      setCustom(r.customValues || {});
      setPhotos(r.photos.map((p) => ({ ...p, key: rowKey() })));
      setVideos(r.videos.map((v) => ({ ...v, key: rowKey() })));
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [resumeId]);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }
  function setCustomValue(key, value) { setCustom((c) => ({ ...c, [key]: value })); }

  async function uploadInto(files, kind) {
    const list = Array.from(files || []);
    if (!list.length) return;
    setUploading(kind);
    setError('');
    for (const file of list) {
      const d = await uploadFile(file);
      if (!d.ok) { setError(d.error || 'آپلود ناموفق بود.'); break; }
      if (kind === 'photo') setPhotos((prev) => [...prev, { key: rowKey(), url: d.url, caption: '' }]);
      else setVideos((prev) => [...prev, { key: rowKey(), url: d.url, title: '', description: '' }]);
    }
    setUploading('');
  }

  function move(list, setList, index, delta) {
    const next = [...list];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setList(next);
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!form.firstName.trim()) { setError('نام الزامی است.'); return; }
    if (!form.lastName.trim()) { setError('نام خانوادگی الزامی است.'); return; }

    setBusy(true);
    const payload = {
      ...form,
      customValues: custom,
      photos: photos.map((p) => ({ url: p.url, caption: p.caption })),
      videos: videos.map((v) => ({ url: v.url, title: v.title, description: v.description })),
    };
    const res = await fetch(resumeId ? `/api/admin/resumes/${resumeId}` : '/api/admin/resumes', {
      method: resumeId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const d = await res.json();
    setBusy(false);
    if (!d.ok) { setError(d.error || 'ذخیره نشد.'); return; }
    onSaved(d.resume);
  }

  if (loading) return <p style={{ color: 'var(--muted)' }}>در حال بارگذاری رزومه…</p>;

  const activeFields = fields.filter((f) => f.active);

  return (
    <form onSubmit={submit} className="rz-editor">
      <div className="rz-editor__bar">
        <button type="button" className="btn btn--sm btn--outline" onClick={onClose}>→ بازگشت به فهرست</button>
        <span className="rz-editor__title">{resumeId ? 'ویرایش رزومه' : 'رزومهٔ جدید'}</span>
        <button type="submit" className="btn btn--sm btn--dark" disabled={busy}>{busy ? 'در حال ذخیره…' : 'ذخیره رزومه'}</button>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <section className="rz-card">
        <div className="rz-card__head">
          <h3>اطلاعات فردی</h3>
          <p>این اطلاعات را شما وارد می‌کنید؛ رزومه به هیچ حساب کاربری وصل نیست.</p>
        </div>
        <div className="rz-grid">
          <div className="form-group">
            <label className="form-label">نام *</label>
            <input className="form-input" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">نام خانوادگی *</label>
            <input className="form-input" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">سن</label>
            <input className="form-input" dir="ltr" value={form.age} onChange={(e) => set('age', e.target.value)} placeholder="24" />
          </div>
          <div className="form-group">
            <label className="form-label">سال تولد</label>
            <input className="form-input" dir="ltr" value={form.birthYear} onChange={(e) => set('birthYear', e.target.value)} placeholder="1380" />
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
            <label className="form-label">قد (سانتی‌متر)</label>
            <input className="form-input" dir="ltr" value={form.heightCm} onChange={(e) => set('heightCm', e.target.value)} placeholder="175" />
          </div>
          <div className="form-group">
            <label className="form-label">وزن (کیلوگرم)</label>
            <input className="form-input" dir="ltr" value={form.weightKg} onChange={(e) => set('weightKg', e.target.value)} placeholder="68" />
          </div>
          <div className="form-group">
            <label className="form-label">شهر</label>
            <input className="form-input" value={form.city} onChange={(e) => set('city', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">شمارهٔ تماس</label>
            <input className="form-input" dir="ltr" value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} placeholder="09xxxxxxxxx" />
          </div>
          <div className="form-group rz-grid__full">
            <label className="form-label">عنوان / تخصص</label>
            <input className="form-input" value={form.headline} onChange={(e) => set('headline', e.target.value)} placeholder="بازیگر تئاتر و سینما" />
          </div>
        </div>
      </section>

      {activeFields.length > 0 && (
        <section className="rz-card">
          <div className="rz-card__head">
            <h3>فیلدهای اختصاصی</h3>
            <p>فیلدهایی که خودتان در بخش «فیلدهای رزومه» ساخته‌اید.</p>
          </div>
          <div className="rz-grid">
            {activeFields.map((f) => {
              const value = custom[f.key];
              const full = f.type === 'textarea' ? 'rz-grid__full' : '';
              return (
                <div key={f.id} className={`form-group ${full}`}>
                  <label className="form-label">{f.label}{f.required ? ' *' : ''}</label>
                  {f.type === 'textarea' ? (
                    <textarea className="form-input" rows={3} value={value ?? ''} onChange={(e) => setCustomValue(f.key, e.target.value)} />
                  ) : f.type === 'select' ? (
                    <select className="form-input" value={value ?? ''} onChange={(e) => setCustomValue(f.key, e.target.value)}>
                      <option value="">—</option>
                      {parseFieldOptions(f.options).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : f.type === 'boolean' ? (
                    <label className="rz-check">
                      <input type="checkbox" checked={value === true} onChange={(e) => setCustomValue(f.key, e.target.checked)} />
                      <span>بله</span>
                    </label>
                  ) : (
                    <input
                      className="form-input"
                      dir={f.type === 'number' ? 'ltr' : undefined}
                      value={value ?? ''}
                      onChange={(e) => setCustomValue(f.key, e.target.value)}
                    />
                  )}
                  {f.hint && <span className="rz-hint">{f.hint}</span>}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="rz-card">
        <div className="rz-card__head">
          <h3>عکس‌ها</h3>
          <p>هر تعداد عکس لازم دارید اضافه کنید؛ یا فایل را مستقیم بارگذاری کنید یا نشانی عکس را بچسبانید. عکس اول، عکس اصلی رزومه است.</p>
        </div>

        <div className="rz-actions">
          <input ref={photoInput} type="file" accept="image/*" multiple hidden
            onChange={(e) => { uploadInto(e.target.files, 'photo'); e.target.value = ''; }} />
          <button type="button" className="btn btn--sm btn--dark" disabled={uploading === 'photo'}
            onClick={() => photoInput.current?.click()}>
            {uploading === 'photo' ? 'در حال آپلود…' : 'آپلود مستقیم عکس'}
          </button>
          <LinkAdder
            placeholder="https://… نشانی عکس"
            label="افزودن با لینک"
            onAdd={(url) => setPhotos((prev) => [...prev, { key: rowKey(), url, caption: '' }])}
          />
        </div>

        {photos.length === 0 ? (
          <p className="rz-empty">هنوز عکسی اضافه نشده است.</p>
        ) : (
          <div className="rz-photos">
            {photos.map((p, i) => (
              <div key={p.key} className="rz-photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" />
                <div className="rz-photo__body">
                  {i === 0 && <span className="su-tag su-tag--grad">عکس اصلی</span>}
                  <input className="form-input" placeholder="توضیح عکس (اختیاری)" value={p.caption || ''}
                    onChange={(e) => setPhotos((prev) => prev.map((it) => (it.key === p.key ? { ...it, caption: e.target.value } : it)))} />
                  <div className="rz-photo__actions">
                    <button type="button" className="btn btn--sm btn--ghost" onClick={() => move(photos, setPhotos, i, -1)} disabled={i === 0}>بالا</button>
                    <button type="button" className="btn btn--sm btn--ghost" onClick={() => move(photos, setPhotos, i, 1)} disabled={i === photos.length - 1}>پایین</button>
                    <button type="button" className="btn btn--sm btn--danger" onClick={() => setPhotos((prev) => prev.filter((it) => it.key !== p.key))}>حذف</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rz-card">
        <div className="rz-card__head">
          <h3>ویدیوهای رزومه</h3>
          <p>لینک آپارات یا ویو را بچسبانید، یا ویدیوی کوتاه را مستقیم بارگذاری کنید (تا ۶۰ مگابایت). برای هر ویدیو می‌توانید عنوان و توضیح بنویسید.</p>
        </div>

        <div className="rz-actions">
          <input ref={videoInput} type="file" accept="video/*" multiple hidden
            onChange={(e) => { uploadInto(e.target.files, 'video'); e.target.value = ''; }} />
          <button type="button" className="btn btn--sm btn--dark" disabled={uploading === 'video'}
            onClick={() => videoInput.current?.click()}>
            {uploading === 'video' ? 'در حال آپلود…' : 'آپلود مستقیم ویدیو'}
          </button>
          <LinkAdder
            placeholder="https://aparat.com/v/… یا کد امبد ویو"
            label="افزودن با لینک"
            onAdd={(url) => setVideos((prev) => [...prev, { key: rowKey(), url, title: '', description: '' }])}
          />
        </div>

        {videos.length === 0 ? (
          <p className="rz-empty">هنوز ویدیویی اضافه نشده است.</p>
        ) : (
          <div className="rz-videos">
            {videos.map((v, i) => (
              <div key={v.key} className="rz-video">
                <div className="rz-video__head">
                  <span className="rz-video__index"><Icon name="video" size={15} /> ویدیوی {i + 1}</span>
                  <div className="rz-photo__actions">
                    <button type="button" className="btn btn--sm btn--ghost" onClick={() => move(videos, setVideos, i, -1)} disabled={i === 0}>بالا</button>
                    <button type="button" className="btn btn--sm btn--ghost" onClick={() => move(videos, setVideos, i, 1)} disabled={i === videos.length - 1}>پایین</button>
                    <button type="button" className="btn btn--sm btn--danger" onClick={() => setVideos((prev) => prev.filter((it) => it.key !== v.key))}>حذف</button>
                  </div>
                </div>
                <input className="form-input" dir="ltr" value={v.url}
                  onChange={(e) => setVideos((prev) => prev.map((it) => (it.key === v.key ? { ...it, url: e.target.value } : it)))} />
                <input className="form-input" placeholder="عنوان ویدیو" value={v.title || ''}
                  onChange={(e) => setVideos((prev) => prev.map((it) => (it.key === v.key ? { ...it, title: e.target.value } : it)))} />
                <textarea className="form-input" rows={2} placeholder="توضیح ویدیو" value={v.description || ''}
                  onChange={(e) => setVideos((prev) => prev.map((it) => (it.key === v.key ? { ...it, description: e.target.value } : it)))} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rz-card">
        <div className="rz-card__head">
          <h3>معرفی، مهارت و سوابق</h3>
        </div>
        <div className="rz-grid">
          <div className="form-group rz-grid__full">
            <label className="form-label">مهارت‌ها (با ویرگول جدا کنید)</label>
            <input className="form-input" value={form.skills} onChange={(e) => set('skills', e.target.value)} placeholder="رقص، اسب‌سواری، گویندگی" />
          </div>
          <div className="form-group rz-grid__full">
            <label className="form-label">معرفی کوتاه</label>
            <textarea className="form-input" rows={3} value={form.bio} onChange={(e) => set('bio', e.target.value)} />
          </div>
          <div className="form-group rz-grid__full">
            <label className="form-label">سوابق و تجربه‌ها</label>
            <textarea className="form-input" rows={5} value={form.experience} onChange={(e) => set('experience', e.target.value)} />
          </div>
          <div className="form-group rz-grid__full">
            <label className="form-label">لینک شوریل / نمونه‌کار (اختیاری)</label>
            <input className="form-input" dir="ltr" value={form.showreelUrl} onChange={(e) => set('showreelUrl', e.target.value)} placeholder="https://…" />
          </div>
        </div>
      </section>

      <section className="rz-card rz-card--foot">
        <label className="rz-check">
          <input type="checkbox" checked={form.isPublic} onChange={(e) => set('isPublic', e.target.checked)} />
          <span>این رزومه در بانک بازیگران (ویژهٔ فیلم‌سازان) نمایش داده شود</span>
        </label>
        <div className="rz-foot__actions">
          <button type="button" className="btn btn--outline" onClick={onClose}>انصراف</button>
          <button type="submit" className="btn btn--dark" disabled={busy}>{busy ? 'در حال ذخیره…' : 'ذخیره رزومه'}</button>
        </div>
      </section>
    </form>
  );
}
