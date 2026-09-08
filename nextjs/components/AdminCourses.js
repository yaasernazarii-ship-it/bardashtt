'use client';

import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import { uploadFile } from '@/lib/uploadClient';

const EMPTY ={ title: '', description: '', price: '', coverImage: '', teaserUrl: '', published: true, lessons: [] };

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [accessFor, setAccessFor] = useState(null); // شناسهٔ دوره‌ای که پنلِ دسترسی‌اش باز است
  const fileRef = useRef(null);

  async function load() {
    const res = await fetch('/api/admin/courses');
    const data = await res.json();
    if (data.ok) setCourses(data.courses); else setError(data.error || 'خطا در بارگذاری.');
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }
  function resetForm() { setForm(EMPTY); setEditingId(null); setError(''); if (fileRef.current) fileRef.current.value = ''; }

  function editCourse(c) {
    setEditingId(c.id);
    setForm({
      title: c.title, description: c.description || '', price: String(c.price ?? ''),
      coverImage: c.coverImage || '', teaserUrl: c.teaserUrl || '', published: c.published,
      lessons: (c.lessons || []).map((l) => ({ title: l.title, videoUrl: l.videoUrl })),
    });
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── ویدیوهای دوره ──
  function addLesson() { setForm((f) => ({ ...f, lessons: [...f.lessons, { title: '', videoUrl: '' }] })); }
  function setLesson(i, k, v) {
    setForm((f) => ({ ...f, lessons: f.lessons.map((l, idx) => (idx === i ? { ...l, [k]: v } : l)) }));
  }
  function removeLesson(i) { setForm((f) => ({ ...f, lessons: f.lessons.filter((_, idx) => idx !== i) })); }
  function moveLesson(i, dir) {
    setForm((f) => {
      const arr = [...f.lessons];
      const j = i + dir;
      if (j < 0 || j >= arr.length) return f;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...f, lessons: arr };
    });
  }

  async function uploadCover(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError('');
    const data = await uploadFile(file);
    setUploading(false);
    if (data.ok) set('coverImage', data.url);
    else setError(data.error || 'آپلود ناموفق بود.');
  }

  async function save(e) {
    e.preventDefault();
    if (!form.title.trim()) { setError('عنوان دوره الزامی است.'); return; }
    if (form.price === '' || Number.isNaN(parseInt(form.price, 10))) { setError('قیمت را به تومان وارد کنید (برای رایگان: صفر).'); return; }
    setSaving(true); setError('');
    const payload = {
      ...form,
      price: parseInt(form.price, 10),
      lessons: form.lessons.filter((l) => l.title.trim() && l.videoUrl.trim()),
    };
    const url = editingId ? `/api/admin/courses/${editingId}` : '/api/admin/courses';
    const method = editingId ? 'PATCH' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    setSaving(false);
    if (!data.ok) { setError(data.error || 'خطا در ذخیره.'); return; }
    if (editingId) setCourses((prev) => prev.map((c) => (c.id === editingId ? data.course : c)));
    else setCourses((prev) => [data.course, ...prev]);
    resetForm();
  }

  async function remove(id) {
    if (!window.confirm('این دوره و همهٔ ویدیوها و دسترسی‌هایش حذف شود؟')) return;
    const res = await fetch(`/api/admin/courses/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.ok) { setCourses((prev) => prev.filter((c) => c.id !== id)); if (editingId === id) resetForm(); }
  }

  async function togglePublish(c) {
    const res = await fetch(`/api/admin/courses/${c.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !c.published }),
    });
    const data = await res.json();
    if (data.ok) setCourses((prev) => prev.map((x) => (x.id === c.id ? data.course : x)));
  }

  return (
    <div>
      <form onSubmit={save} className="form-shell" style={{ marginBottom: 28 }}>
        <h2 className="heading" style={{ fontSize: '1.15rem', marginBottom: 16 }}>
          {editingId ? 'ویرایش دوره' : 'افزودن دورهٔ جدید'}
        </h2>
        {error && <div className="alert alert--error" style={{ marginBottom: 12 }}>{error}</div>}

        <div className="form-group">
          <label className="form-label">عنوان دوره *</label>
          <input className="form-input" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="مثلاً: دورهٔ بازیگری مقابل دوربین" />
        </div>

        <div className="form-group">
          <label className="form-label">توضیح / سرفصل‌ها (اختیاری)</label>
          <textarea className="form-input" rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="معرفی دوره و سرفصل‌ها. برای پاراگراف جدید یک خط خالی بگذارید." />
        </div>

        <div className="cal-form-grid">
          <div className="form-group">
            <label className="form-label">قیمت (تومان) *</label>
            <input className="form-input" type="number" min="0" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="مثلاً 500000 — برای رایگان: 0" />
          </div>
          <div className="form-group">
            <label className="form-label">عکس کاور (اختیاری)</label>
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
        </div>

        <div className="form-group">
          <label className="form-label">تیزر رایگان (کد امبد یا لینک)</label>
          <textarea className="form-input" dir="ltr" rows={2} value={form.teaserUrl} onChange={(e) => set('teaserUrl', e.target.value)} placeholder="لینک آپارات یا کد امبدِ سرویسِ محدودسازی دامنه (ویدپروتکت/نگاوید)" />
          <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>این ویدیو برای همه (حتی قبل از خرید) نمایش داده می‌شود.</span>
        </div>

        <div className="form-group">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <label className="form-label" style={{ margin: 0 }}>ویدیوهای دوره (قفل تا خرید)</label>
            <button type="button" className="btn btn--ghost" onClick={addLesson}>+ افزودن ویدیو</button>
          </div>
          {form.lessons.length === 0 && (
            <span style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>هنوز ویدیویی اضافه نشده. می‌توانید بعداً هم ویدیوها را اضافه کنید.</span>
          )}
          <div style={{ display: 'grid', gap: 12 }}>
            {form.lessons.map((l, i) => (
              <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <strong style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>ویدیو {i + 1}</strong>
                  <div style={{ marginInlineStart: 'auto', display: 'flex', gap: 4 }}>
                    <button type="button" className="btn btn--ghost" onClick={() => moveLesson(i, -1)} disabled={i === 0}>↑</button>
                    <button type="button" className="btn btn--ghost" onClick={() => moveLesson(i, 1)} disabled={i === form.lessons.length - 1}>↓</button>
                    <button type="button" className="btn btn--danger" onClick={() => removeLesson(i)}>حذف</button>
                  </div>
                </div>
                <input className="form-input" style={{ marginBottom: 8 }} value={l.title} onChange={(e) => setLesson(i, 'title', e.target.value)} placeholder="عنوان ویدیو (مثلاً: جلسهٔ ۱ — آشنایی با قاب)" />
                <textarea className="form-input" dir="ltr" rows={2} value={l.videoUrl} onChange={(e) => setLesson(i, 'videoUrl', e.target.value)} placeholder="کد امبد یا لینک ویدیو (آپارات یا سرویس محدودسازی دامنه)" />
              </div>
            ))}
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '6px 0 16px' }}>
          <input type="checkbox" checked={form.published} onChange={(e) => set('published', e.target.checked)} />
          <span>روی سایت نمایش داده شود (اگر تیک برداشته شود، پیش‌نویس می‌ماند)</span>
        </label>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn--dark" type="submit" disabled={saving || uploading}>
            {saving ? 'در حال ذخیره…' : editingId ? 'ذخیره تغییرات' : 'افزودن دوره'}
          </button>
          {editingId && <button type="button" className="btn btn--ghost" onClick={resetForm}>انصراف</button>}
        </div>
      </form>

      {loading ? (
        <p style={{ color: 'var(--muted)' }}>در حال بارگذاری…</p>
      ) : courses.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>هنوز دوره‌ای ثبت نشده است.</p>
      ) : (
        <div className="enroll-admin-list">
          {courses.map((c) => (
            <div key={c.id} className="enroll-admin-item">
              <div className="enroll-admin-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {c.coverImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.coverImage} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }} />
                  )}
                  <strong>{c.title}</strong>
                </div>
                <span className={`enroll-badge ${c.published ? 'badge-approved' : 'badge-submitted'}`}>
                  {c.published ? 'منتشرشده' : 'پیش‌نویس'}
                </span>
              </div>
              <div className="enroll-admin-meta">
                <span className="meta-ico"><Icon name="banknote" size={14} /> {c.price > 0 ? `${c.price.toLocaleString('fa-IR')} تومان` : 'رایگان'}</span>
                <span className="meta-ico"><Icon name="clapperboard" size={14} /> {c.lessonCount.toLocaleString('fa-IR')} ویدیو</span>
                <span className="meta-ico"><Icon name="users" size={14} /> {c.buyerCount.toLocaleString('fa-IR')} خریدار</span>
              </div>
              <div className="enroll-actions" style={{ marginTop: 10, gap: 8 }}>
                <button className="btn btn--dark" onClick={() => editCourse(c)}>ویرایش</button>
                <button className="btn btn--ghost" onClick={() => setAccessFor(accessFor === c.id ? null : c.id)}>
                  {accessFor === c.id ? 'بستن دسترسی‌ها' : 'مدیریت دسترسی'}
                </button>
                <button className="btn btn--ghost" onClick={() => togglePublish(c)}>{c.published ? 'پنهان کردن' : 'انتشار'}</button>
                <button className="btn btn--danger" onClick={() => remove(c.id)}>حذف</button>
              </div>
              {accessFor === c.id && <CourseAccessPanel courseId={c.id} onCountChange={(n) => setCourses((prev) => prev.map((x) => (x.id === c.id ? { ...x, buyerCount: n } : x)))} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// پنلِ مدیریتِ دسترسی‌های یک دوره: اعطای دستی و لغو.
function CourseAccessPanel({ courseId, onCountChange }) {
  const [rows, setRows] = useState(null);
  const [identifier, setIdentifier] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function load() {
    const res = await fetch(`/api/admin/courses/${courseId}/access`);
    const data = await res.json();
    if (data.ok) { setRows(data.accesses); onCountChange?.(data.accesses.length); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [courseId]);

  async function grant(e) {
    e.preventDefault();
    if (!identifier.trim()) return;
    setBusy(true); setMsg('');
    const res = await fetch(`/api/admin/courses/${courseId}/access`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: identifier.trim() }),
    });
    const data = await res.json();
    setBusy(false);
    if (!data.ok) { setMsg(data.error || 'خطا.'); return; }
    setIdentifier(''); setMsg('دسترسی داده شد.');
    load();
  }

  async function revoke(userId) {
    if (!window.confirm('دسترسیِ این کاربر لغو شود؟')) return;
    const res = await fetch(`/api/admin/courses/${courseId}/access`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    if (data.ok) load();
  }

  return (
    <div style={{ marginTop: 12, padding: 14, background: 'var(--surface)', borderRadius: 10 }}>
      <form onSubmit={grant} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <input className="form-input" style={{ flex: '1 1 200px', margin: 0 }} value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="شمارهٔ موبایل یا نام کاربریِ خریدار" />
        <button className="btn btn--dark" type="submit" disabled={busy}>{busy ? '…' : 'اعطای دسترسی'}</button>
      </form>
      {msg && <div style={{ color: 'var(--muted)', fontSize: '0.82rem', marginBottom: 8 }}>{msg}</div>}
      {rows === null ? (
        <span style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>در حال بارگذاری…</span>
      ) : rows.length === 0 ? (
        <span style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>هنوز کسی به این دوره دسترسی ندارد.</span>
      ) : (
        <div style={{ display: 'grid', gap: 6 }}>
          {rows.map((a) => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
              <span>{a.user?.displayName || a.user?.username || a.user?.phone || 'کاربر'}</span>
              <span style={{ color: 'var(--muted)' }}>{a.user?.phone}</span>
              <span style={{ color: 'var(--light)', fontSize: '0.75rem' }}>
                {a.source === 'manual' ? 'اعطای دستی' : a.source === 'payment' ? 'پرداخت' : 'درگاه'}
              </span>
              <button className="btn btn--danger" style={{ marginInlineStart: 'auto' }} onClick={() => revoke(a.userId)}>لغو</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
