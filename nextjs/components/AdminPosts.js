'use client';

import { useEffect, useRef, useState } from 'react';
import { SECTIONS, sectionLabel } from '@/lib/sections';
import { BLOG_CATEGORIES, blogCategoryLabel } from '@/lib/blogCategories';
import Icon from './Icon';

const dateFmt = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('fa-IR', {
  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tehran',
});
const EMPTY = { title: '', section: 'news', category: '', excerpt: '', body: '', coverImage: '', sourceUrl: '', aparatUrl: '', audioUrl: '', published: true, publishAt: '' };

// تبدیل زمان ذخیره‌شده (ISO/UTC) به مقدار ورودی datetime-local در ساعت محلی مرورگر.
function isoToLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

// وضعیت نمایشی هر مطلب: پیش‌نویس / زمان‌بندی‌شده / منتشرشده.
function statusOf(p) {
  if (!p.published) return { label: 'پیش‌نویس', cls: 'badge-submitted' };
  if (p.publishAt && new Date(p.publishAt) > new Date()) {
    return { label: `زمان‌بندی‌شده: ${dateTimeFmt.format(new Date(p.publishAt))}`, cls: 'badge-scheduled' };
  }
  return { label: 'منتشرشده', cls: 'badge-approved' };
}

export default function AdminPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [error, setError] = useState('');
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const fileRef = useRef(null);
  const audioRef = useRef(null);

  async function load() {
    const res = await fetch('/api/admin/posts');
    const data = await res.json();
    if (data.ok) setPosts(data.posts); else setError(data.error || 'خطا در بارگذاری.');
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  function resetForm() { setForm(EMPTY); setEditingId(null); setError(''); setImportUrl(''); setImportMsg(''); if (fileRef.current) fileRef.current.value = ''; if (audioRef.current) audioRef.current.value = ''; }

  // دریافت محتوای مطلب از روی لینک یک سایت دیگر و پرکردن خودکار فرم.
  async function importFromUrl() {
    const u = importUrl.trim();
    if (!u) { setImportMsg('ابتدا لینک مطلب را وارد کنید.'); return; }
    setImporting(true); setImportMsg(''); setError('');
    try {
      const res = await fetch('/api/admin/posts/import', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: u }),
      });
      const data = await res.json();
      if (!data.ok) { setImportMsg(data.error || 'دریافت محتوا ممکن نشد.'); return; }
      setForm((f) => ({
        ...f,
        title: data.title || f.title,
        excerpt: data.excerpt || f.excerpt,
        body: data.body || f.body,
        coverImage: data.coverImage || f.coverImage,
        sourceUrl: data.sourceUrl || u,
      }));
      const parts = [data.title && 'عنوان', data.body && 'متن', data.excerpt && 'خلاصه', data.coverImage && 'عکس کاور'].filter(Boolean);
      const coverNote = data.coverImage ? '' : ' سایت مبدأ عکس کاور نداشت؛ در بخش «عکس کاور» دستی انتخاب کنید.';
      setImportMsg(`محتوا دریافت شد (${parts.join('، ')}). لینک منبع هم ثبت شد، پس کارت این مطلب مستقیم به سایت مبدأ می‌رود.${coverNote}`);
    } catch {
      setImportMsg('دریافت محتوا ممکن نشد؛ کمی بعد دوباره امتحان کنید.');
    } finally {
      setImporting(false);
    }
  }

  function editPost(p) {
    setEditingId(p.id);
    setForm({
      title: p.title, section: p.section || 'news', category: p.category || '', excerpt: p.excerpt || '', body: p.body,
      coverImage: p.coverImage || '', sourceUrl: p.sourceUrl || '', aparatUrl: p.aparatUrl || '', audioUrl: p.audioUrl || '', published: p.published,
      publishAt: isoToLocalInput(p.publishAt),
    });
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function uploadCover(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError('');
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    setUploading(false);
    if (data.ok) set('coverImage', data.url);
    else setError(data.error || 'آپلود ناموفق بود.');
  }

  async function uploadAudio(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAudio(true); setError('');
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    setUploadingAudio(false);
    if (data.ok) set('audioUrl', data.url);
    else setError(data.error || 'آپلود صوت ناموفق بود.');
  }

  async function save(e) {
    e.preventDefault();
    const hasMedia = Boolean(form.coverImage.trim() || form.aparatUrl.trim() || form.audioUrl.trim());
    if (!form.title.trim()) { setError('عنوان الزامی است.'); return; }
    if (form.section === 'blog' && !form.category) { setError('دستهٔ مقاله را انتخاب کنید.'); return; }
    if (!form.body.trim() && !hasMedia) { setError('یا متن مطلب را بنویسید یا عکس/ویدیو/صوت اضافه کنید.'); return; }
    setSaving(true); setError('');
    const url = editingId ? `/api/admin/posts/${editingId}` : '/api/admin/posts';
    const method = editingId ? 'PATCH' : 'POST';
    // زمان انتشار در ساعت محلی مرورگر وارد می‌شود؛ به لحظهٔ دقیق (ISO/UTC) تبدیل می‌شود تا مستقل از سرور درست باشد.
    const payload = { ...form, publishAt: form.publishAt ? new Date(form.publishAt).toISOString() : null };
    const res = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (!data.ok) { setError(data.error || 'خطا در ذخیره.'); return; }
    if (editingId) setPosts((prev) => prev.map((p) => (p.id === editingId ? data.post : p)));
    else setPosts((prev) => [data.post, ...prev]);
    resetForm();
  }

  async function remove(id) {
    if (!window.confirm('این مطلب حذف شود؟')) return;
    const res = await fetch(`/api/admin/posts/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.ok) { setPosts((prev) => prev.filter((p) => p.id !== id)); if (editingId === id) resetForm(); }
  }

  async function togglePublish(p) {
    const res = await fetch(`/api/admin/posts/${p.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !p.published }),
    });
    const data = await res.json();
    if (data.ok) setPosts((prev) => prev.map((x) => (x.id === p.id ? data.post : x)));
  }

  return (
    <div>
      <form onSubmit={save} className="form-shell" style={{ marginBottom: 28 }}>
        <h2 className="heading" style={{ fontSize: '1.15rem', marginBottom: 16 }}>
          {editingId ? 'ویرایش مطلب' : 'افزودن مطلب جدید'}
        </h2>
        {error && <div className="alert alert--error" style={{ marginBottom: 12 }}>{error}</div>}

        <div className="import-box">
          <label className="form-label">دریافت خودکار از لینک یک سایت دیگر (اختیاری)</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input className="form-input" dir="ltr" style={{ flex: 1, minWidth: 220 }} value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)} placeholder="https://example.com/news/article-title" />
            <button type="button" className="btn btn--outline" disabled={importing} onClick={importFromUrl}>
              {importing ? 'در حال دریافت…' : 'دریافت محتوا'}
            </button>
          </div>
          {importMsg && <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginTop: 6 }}>{importMsg}</p>}
          <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
            لینک خبر یا مطلب را از هر سایتی بچسبانید؛ عنوان، خلاصه، متن و عکس کاور به‌صورت خودکار در فرم زیر پر می‌شود. لینک منبع هم ثبت می‌شود تا کلیک روی مطلب مستقیم به همان سایت برود.
          </span>
        </div>

        <div className="form-group">
          <label className="form-label">بخش مقصد *</label>
          <select className="form-input" value={form.section} onChange={(e) => set('section', e.target.value)}>
            {SECTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>این محتوا در همین بخش سایت نمایش داده می‌شود.</span>
        </div>

        {form.section === 'blog' && (
          <div className="form-group">
            <label className="form-label">دستهٔ مقاله *</label>
            <select className="form-input" value={form.category} onChange={(e) => set('category', e.target.value)}>
              <option value="">— انتخاب کنید —</option>
              {BLOG_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>مطلب در صفحهٔ اختصاصی همین دسته هم نمایش داده می‌شود.</span>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">عنوان *</label>
          <input className="form-input" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="مثلاً: گزارش اردوی تابستان" />
        </div>

        <div className="form-group">
          <label className="form-label">خلاصهٔ کوتاه (اختیاری)</label>
          <input className="form-input" value={form.excerpt} onChange={(e) => set('excerpt', e.target.value)} placeholder="یک جملهٔ کوتاه برای فهرست" />
        </div>

        <div className="form-group">
          <label className="form-label">متن مطلب</label>
          <textarea className="form-input" rows={7} value={form.body} onChange={(e) => set('body', e.target.value)} placeholder="متن کامل را اینجا بنویسید. برای پاراگراف جدید یک خط خالی بگذارید. (برای محتوای فقط عکس/ویدیو می‌تواند خالی بماند)" />
        </div>

        <div className="cal-form-grid">
          <div className="form-group">
            <label className="form-label">عکس کاور</label>
            <input ref={fileRef} type="file" accept="image/*" className="form-input" onChange={uploadCover} />
            {uploading && <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>در حال آپلود…</span>}
            {form.coverImage && (
              <div style={{ marginTop: 8 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.coverImage} alt="کاور" style={{ width: 120, borderRadius: 8 }} />
                <button type="button" className="btn btn--ghost" style={{ marginInlineStart: 8 }} onClick={() => set('coverImage', '')}>حذف عکس</button>
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">لینک ویدیوی آپارات (اختیاری)</label>
            <input className="form-input" dir="ltr" value={form.aparatUrl} onChange={(e) => set('aparatUrl', e.target.value)} placeholder="https://www.aparat.com/v/..." />
            <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>لینک تماشای ویدیو در آپارات را کپی کنید؛ ویدیو داخل مطلب پخش می‌شود.</span>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">لینک مطلب در سایت منبع (اختیاری)</label>
          <input className="form-input" dir="ltr" value={form.sourceUrl} onChange={(e) => set('sourceUrl', e.target.value)} placeholder="https://example.com/news/article-title" />
          <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
            اگر پر باشد، با کلیک روی این مطلب کاربر مستقیم به همان سایت منبع (در تبِ جدید) می‌رود و صفحهٔ داخلی سایت ما باز نمی‌شود. با «دریافت خودکار از لینک» خودبه‌خود پر می‌شود؛ برای بازگرداندن به حالت عادی خالی‌اش کنید.
          </span>
        </div>

        <div className="form-group">
          <label className="form-label">فایل صوتی (اختیاری)</label>
          <input ref={audioRef} type="file" accept="audio/*" className="form-input" onChange={uploadAudio} />
          {uploadingAudio && <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>در حال آپلود صوت…</span>}
          <input className="form-input" dir="ltr" style={{ marginTop: 8 }} value={form.audioUrl} onChange={(e) => set('audioUrl', e.target.value)} placeholder="یا نشانی فایل صوتی (mp3) را اینجا بچسبانید" />
          {form.audioUrl && (
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <audio src={form.audioUrl} controls style={{ maxWidth: '100%' }} />
              <button type="button" className="btn btn--ghost" onClick={() => set('audioUrl', '')}>حذف صوت</button>
            </div>
          )}
          <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>فایل صوتی را آپلود کنید (تا ۴۰ مگابایت) یا نشانی آن را بچسبانید؛ پخش‌کننده داخل مطلب نمایش داده می‌شود.</span>
        </div>

        <div className="form-group">
          <label className="form-label">زمان انتشار (اختیاری)</label>
          <input type="datetime-local" className="form-input" value={form.publishAt} onChange={(e) => set('publishAt', e.target.value)} />
          <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
            تاریخ و ساعت را انتخاب کنید تا محتوا دقیقاً همان لحظه خودکار منتشر شود. خالی بگذارید تا همین حالا منتشر شود.
          </span>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '6px 0 16px' }}>
          <input type="checkbox" checked={form.published} onChange={(e) => set('published', e.target.checked)} />
          <span>فعال باشد (اگر تیک برداشته شود، پیش‌نویس می‌ماند و هرگز منتشر نمی‌شود)</span>
        </label>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn--dark" type="submit" disabled={saving || uploading}>
            {saving ? 'در حال ذخیره…' : editingId ? 'ذخیره تغییرات' : 'افزودن مطلب'}
          </button>
          {editingId && <button type="button" className="btn btn--ghost" onClick={resetForm}>انصراف</button>}
        </div>
      </form>

      {loading ? (
        <p style={{ color: 'var(--muted)' }}>در حال بارگذاری…</p>
      ) : posts.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>هنوز مطلبی ثبت نشده است.</p>
      ) : (
        <div className="enroll-admin-list">
          {posts.map((p) => (
            <div key={p.id} className="enroll-admin-item">
              <div className="enroll-admin-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {p.coverImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.coverImage} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }} />
                  )}
                  <strong>{p.title}</strong>
                </div>
                {(() => { const s = statusOf(p); return <span className={`enroll-badge ${s.cls}`}>{s.label}</span>; })()}
              </div>
              <div className="enroll-admin-meta">
                <span className="meta-ico"><Icon name="mapPin" size={14} /> {sectionLabel(p.section)}</span>
                {p.category && <span className="meta-ico"><Icon name="tag" size={14} /> {blogCategoryLabel(p.category)}</span>}
                <span>{dateFmt.format(new Date(p.createdAt))}</span>
                {p.aparatUrl && <span className="meta-ico"><Icon name="clapperboard" size={14} /> ویدیوی آپارات</span>}
                {p.sourceUrl && <span className="meta-ico"><Icon name="link" size={14} /> لینک به سایت منبع</span>}
              </div>
              <div className="enroll-actions" style={{ marginTop: 10, gap: 8 }}>
                <button className="btn btn--dark" onClick={() => editPost(p)}>ویرایش</button>
                <button className="btn btn--ghost" onClick={() => togglePublish(p)}>{p.published ? 'پنهان کردن' : 'انتشار'}</button>
                <button className="btn btn--danger" onClick={() => remove(p.id)}>حذف</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
