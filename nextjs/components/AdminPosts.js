'use client';

import { useEffect, useRef, useState } from 'react';
import { SECTIONS, sectionLabel } from '@/lib/sections';
import { BLOG_CATEGORIES, blogCategoryLabel } from '@/lib/blogCategories';

const dateFmt = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('fa-IR', {
  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tehran',
});
const EMPTY = { title: '', section: 'news', category: '', excerpt: '', body: '', coverImage: '', aparatUrl: '', published: true, publishAt: '' };

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
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  async function load() {
    const res = await fetch('/api/admin/posts');
    const data = await res.json();
    if (data.ok) setPosts(data.posts); else setError(data.error || 'خطا در بارگذاری.');
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  function resetForm() { setForm(EMPTY); setEditingId(null); setError(''); if (fileRef.current) fileRef.current.value = ''; }

  function editPost(p) {
    setEditingId(p.id);
    setForm({
      title: p.title, section: p.section || 'news', category: p.category || '', excerpt: p.excerpt || '', body: p.body,
      coverImage: p.coverImage || '', aparatUrl: p.aparatUrl || '', published: p.published,
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

  async function save(e) {
    e.preventDefault();
    const hasMedia = Boolean(form.coverImage.trim() || form.aparatUrl.trim());
    if (!form.title.trim()) { setError('عنوان الزامی است.'); return; }
    if (form.section === 'blog' && !form.category) { setError('دستهٔ وبلاگ را انتخاب کنید.'); return; }
    if (!form.body.trim() && !hasMedia) { setError('یا متن مطلب را بنویسید یا عکس/ویدیو اضافه کنید.'); return; }
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
            <label className="form-label">دستهٔ وبلاگ *</label>
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
                <span>📍 {sectionLabel(p.section)}</span>
                {p.category && <span>🏷️ {blogCategoryLabel(p.category)}</span>}
                <span>{dateFmt.format(new Date(p.createdAt))}</span>
                {p.aparatUrl && <span>🎬 ویدیوی آپارات</span>}
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
