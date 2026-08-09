'use client';

import { useEffect, useRef, useState } from 'react';

const EMPTY = { title: '', author: '', description: '', price: '', coverImage: '', aparatUrl: '', audioUrl: '', published: true };

const STATUS_LABEL = {
  new: 'جدید',
  contacted: 'تماس گرفته شد',
  paid: 'پرداخت‌شده',
  shipped: 'ارسال‌شده',
  canceled: 'لغوشده',
};
const STATUS_CLASS = {
  new: 'badge-submitted',
  contacted: 'badge-scheduled',
  paid: 'badge-approved',
  shipped: 'badge-approved',
  canceled: 'badge-rejected',
};
const dateFmt = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('fa-IR', {
  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
});
const money = (n) => Number(n || 0).toLocaleString('fa-IR');
const isPaid = (o) => o.status === 'paid' || o.status === 'shipped';

export default function AdminBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [error, setError] = useState('');
  const [ordersFor, setOrdersFor] = useState(null);
  const fileRef = useRef(null);
  const audioRef = useRef(null);

  async function load() {
    const res = await fetch('/api/admin/books');
    const data = await res.json();
    if (data.ok) setBooks(data.books); else setError(data.error || 'خطا در بارگذاری.');
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }
  function resetForm() { setForm(EMPTY); setEditingId(null); setError(''); if (fileRef.current) fileRef.current.value = ''; if (audioRef.current) audioRef.current.value = ''; }

  function editBook(b) {
    setEditingId(b.id);
    setForm({
      title: b.title, author: b.author || '', description: b.description || '',
      price: String(b.price ?? ''), coverImage: b.coverImage || '',
      aparatUrl: b.aparatUrl || '', audioUrl: b.audioUrl || '', published: b.published,
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
    if (!form.title.trim()) { setError('عنوان کتاب الزامی است.'); return; }
    if (form.price === '' || Number.isNaN(parseInt(form.price, 10))) { setError('قیمت را به تومان وارد کنید (برای رایگان: صفر).'); return; }
    setSaving(true); setError('');
    const payload = { ...form, price: parseInt(form.price, 10) };
    const url = editingId ? `/api/admin/books/${editingId}` : '/api/admin/books';
    const method = editingId ? 'PATCH' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    setSaving(false);
    if (!data.ok) { setError(data.error || 'خطا در ذخیره.'); return; }
    if (editingId) setBooks((prev) => prev.map((c) => (c.id === editingId ? data.book : c)));
    else setBooks((prev) => [data.book, ...prev]);
    resetForm();
  }

  async function remove(id) {
    if (!window.confirm('این کتاب و همهٔ سفارش‌هایش حذف شود؟')) return;
    const res = await fetch(`/api/admin/books/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.ok) { setBooks((prev) => prev.filter((c) => c.id !== id)); if (editingId === id) resetForm(); }
  }

  async function togglePublish(b) {
    const res = await fetch(`/api/admin/books/${b.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !b.published }),
    });
    const data = await res.json();
    if (data.ok) setBooks((prev) => prev.map((x) => (x.id === b.id ? data.book : x)));
  }

  return (
    <div>
      <form onSubmit={save} className="form-shell" style={{ marginBottom: 28 }}>
        <h2 className="heading" style={{ fontSize: '1.15rem', marginBottom: 16 }}>
          {editingId ? 'ویرایش کتاب' : 'افزودن کتاب جدید'}
        </h2>
        {error && <div className="alert alert--error" style={{ marginBottom: 12 }}>{error}</div>}

        <div className="cal-form-grid">
          <div className="form-group">
            <label className="form-label">عنوان کتاب *</label>
            <input className="form-input" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="مثلاً: نام کتاب آقای نظری" />
          </div>
          <div className="form-group">
            <label className="form-label">نویسنده</label>
            <input className="form-input" value={form.author} onChange={(e) => set('author', e.target.value)} placeholder="مثلاً: آقای نظری" />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">معرفی کتاب (اختیاری)</label>
          <textarea className="form-input" rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="معرفی و توضیح کتاب. برای پاراگراف جدید یک خط خالی بگذارید." />
        </div>

        <div className="cal-form-grid">
          <div className="form-group">
            <label className="form-label">قیمت (تومان) *</label>
            <input className="form-input" type="number" min="0" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="مثلاً 150000 — برای رایگان: 0" />
          </div>
          <div className="form-group">
            <label className="form-label">عکس جلد (اختیاری)</label>
            <input ref={fileRef} type="file" accept="image/*" className="form-input" onChange={uploadCover} />
            {uploading && <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>در حال آپلود…</span>}
            {form.coverImage && (
              <div style={{ marginTop: 8 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.coverImage} alt="جلد" style={{ width: 90, borderRadius: 8 }} />
                <button type="button" className="btn btn--ghost" style={{ marginInlineStart: 8 }} onClick={() => set('coverImage', '')}>حذف عکس</button>
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">ویدیوی معرفی کتاب (اختیاری)</label>
          <input className="form-input" dir="ltr" value={form.aparatUrl} onChange={(e) => set('aparatUrl', e.target.value)} placeholder="https://www.aparat.com/v/..." />
          <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>لینک تیزر/معرفی ویدیویی کتاب در آپارات؛ کنار معرفی کتاب پخش می‌شود.</span>
        </div>

        <div className="form-group">
          <label className="form-label">نمونهٔ صوتی کتاب (اختیاری)</label>
          <input ref={audioRef} type="file" accept="audio/*" className="form-input" onChange={uploadAudio} />
          {uploadingAudio && <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>در حال آپلود صوت…</span>}
          <input className="form-input" dir="ltr" style={{ marginTop: 8 }} value={form.audioUrl} onChange={(e) => set('audioUrl', e.target.value)} placeholder="یا نشانی فایل صوتی (mp3) را اینجا بچسبانید" />
          {form.audioUrl && (
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <audio src={form.audioUrl} controls style={{ maxWidth: '100%' }} />
              <button type="button" className="btn btn--ghost" onClick={() => set('audioUrl', '')}>حذف صوت</button>
            </div>
          )}
          <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>معرفی صوتی یا نمونهٔ خوانش کتاب را آپلود کنید (تا ۴۰ مگابایت) یا نشانی آن را بچسبانید.</span>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '6px 0 16px' }}>
          <input type="checkbox" checked={form.published} onChange={(e) => set('published', e.target.checked)} />
          <span>روی سایت نمایش داده شود (اگر تیک برداشته شود، پیش‌نویس می‌ماند)</span>
        </label>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn--dark" type="submit" disabled={saving || uploading || uploadingAudio}>
            {saving ? 'در حال ذخیره…' : editingId ? 'ذخیره تغییرات' : 'افزودن کتاب'}
          </button>
          {editingId && <button type="button" className="btn btn--ghost" onClick={resetForm}>انصراف</button>}
        </div>
      </form>

      {loading ? (
        <p style={{ color: 'var(--muted)' }}>در حال بارگذاری…</p>
      ) : books.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>هنوز کتابی ثبت نشده است.</p>
      ) : (
        <div className="enroll-admin-list">
          {books.map((b) => (
            <div key={b.id} className="enroll-admin-item">
              <div className="enroll-admin-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {b.coverImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.coverImage} alt="" style={{ width: 40, height: 56, objectFit: 'cover', borderRadius: 6 }} />
                  )}
                  <strong>{b.title}</strong>
                </div>
                <span className={`enroll-badge ${b.published ? 'badge-approved' : 'badge-submitted'}`}>
                  {b.published ? 'منتشرشده' : 'پیش‌نویس'}
                </span>
              </div>
              <div className="enroll-admin-meta">
                <span>💰 {b.price > 0 ? `${b.price.toLocaleString('fa-IR')} تومان` : 'رایگان'}</span>
                {b.author && <span>✍️ {b.author}</span>}
                <span>🧾 {b.orderCount.toLocaleString('fa-IR')} سفارش</span>
                <span style={{ color: b.paidCount > 0 ? '#137a4a' : undefined }}>
                  ✅ {money(b.paidCount)} پرداخت‌شده
                  {b.paidQuantity > 0 ? ` (${money(b.paidQuantity)} نسخه)` : ''}
                </span>
                <span style={{ color: b.paidAmount > 0 ? '#137a4a' : undefined, fontWeight: b.paidAmount > 0 ? 700 : undefined }}>
                  💵 {money(b.paidAmount)} تومان دریافت‌شده
                </span>
              </div>
              <div className="enroll-actions" style={{ marginTop: 10, gap: 8 }}>
                <button className="btn btn--dark" onClick={() => editBook(b)}>ویرایش</button>
                <button className="btn btn--ghost" onClick={() => setOrdersFor(ordersFor === b.id ? null : b.id)}>
                  {ordersFor === b.id ? 'بستن سفارش‌ها' : 'مشاهدهٔ سفارش‌ها'}
                </button>
                <button className="btn btn--ghost" onClick={() => togglePublish(b)}>{b.published ? 'پنهان کردن' : 'انتشار'}</button>
                <button className="btn btn--danger" onClick={() => remove(b.id)}>حذف</button>
              </div>
              {ordersFor === b.id && <BookOrdersPanel bookId={b.id} onChanged={load} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// پنلِ سفارش‌های یک کتاب: وضعیت پرداخت، تغییر وضعیت و حذف.
function BookOrdersPanel({ bookId, onChanged }) {
  const [rows, setRows] = useState(null);

  async function load() {
    const res = await fetch(`/api/admin/books/${bookId}/orders`);
    const data = await res.json();
    if (data.ok) setRows(data.orders);
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [bookId]);

  async function setStatus(id, status) {
    const res = await fetch(`/api/admin/book-orders/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (data.ok) { setRows((prev) => prev.map((o) => (o.id === id ? data.order : o))); onChanged?.(); }
  }

  async function remove(id) {
    if (!window.confirm('این سفارش حذف شود؟')) return;
    const res = await fetch(`/api/admin/book-orders/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.ok) { setRows((prev) => prev.filter((o) => o.id !== id)); onChanged?.(); }
  }

  const paidRows = (rows || []).filter(isPaid);
  const paidSum = paidRows.reduce((s, o) => s + Number(o.amount || 0), 0);

  return (
    <div style={{ marginTop: 12, padding: 14, background: 'var(--surface)', borderRadius: 10 }}>
      {rows === null ? (
        <span style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>در حال بارگذاری…</span>
      ) : rows.length === 0 ? (
        <span style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>هنوز سفارشی ثبت نشده است.</span>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: '0.85rem', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
            <span>مجموع سفارش‌ها: <strong>{money(rows.length)}</strong></span>
            <span style={{ color: '#137a4a' }}>پرداخت‌شده: <strong>{money(paidRows.length)}</strong></span>
            <span style={{ color: '#137a4a' }}>مبلغ دریافتی: <strong>{money(paidSum)} تومان</strong></span>
          </div>
          {rows.map((o) => (
            <div key={o.id} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <strong>{o.name}</strong>
                <a href={`tel:${o.phone}`} dir="ltr" style={{ color: 'var(--muted)' }}>{o.phone}</a>
                <span style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>× {o.quantity.toLocaleString('fa-IR')}</span>
                <span className={`enroll-badge ${STATUS_CLASS[o.status]}`} style={{ marginInlineStart: 'auto' }}>{STATUS_LABEL[o.status]}</span>
              </div>

              {/* وضعیت مالی: چقدر، کِی، با چه روشی و با چه کد پیگیری‌ای */}
              {isPaid(o) ? (
                <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, background: '#eaf7f0', border: '1px solid #bfe5d0', fontSize: '0.85rem', lineHeight: 1.9 }}>
                  <div style={{ fontWeight: 700, color: '#137a4a' }}>
                    💵 مبلغ پرداخت‌شده: {o.amount ? `${money(o.amount)} تومان` : 'ثبت‌نشده (سفارش قدیمی)'}
                    <span style={{ fontWeight: 400, marginInlineStart: 8 }}>
                      ({o.method === 'online' ? 'پرداخت آنلاین از درگاه' : 'ثبت دستی توسط مدیریت'})
                    </span>
                  </div>
                  {o.paidAt && <div>🕒 زمان پرداخت: {dateTimeFmt.format(new Date(o.paidAt))}</div>}
                  {o.gatewayRefId && <div>🔖 کد پیگیری بانکی: <span dir="ltr">{o.gatewayRefId}</span></div>}
                  {o.gatewayTrackId && <div style={{ color: 'var(--muted)' }}>شناسهٔ تراکنش درگاه: <span dir="ltr">{o.gatewayTrackId}</span></div>}
                  {o.userId && <div style={{ color: 'var(--muted)' }}>👤 خرید از حساب کاربریِ ثبت‌شده در سایت</div>}
                </div>
              ) : (
                <div style={{ marginTop: 8, fontSize: '0.85rem', color: 'var(--muted)' }}>
                  ⏳ هنوز پرداخت نشده{o.amount ? ` — مبلغ سفارش: ${money(o.amount)} تومان` : ''}
                </div>
              )}

              {o.address && <div style={{ fontSize: '0.85rem', marginTop: 6 }}>📮 {o.address}</div>}
              {o.postalCode && <div style={{ fontSize: '0.85rem', marginTop: 4 }}>🏷️ کد پستی: <span dir="ltr">{o.postalCode}</span></div>}
              {o.note && <div style={{ fontSize: '0.85rem', marginTop: 4, color: 'var(--muted)' }}>💬 {o.note}</div>}
              <div style={{ fontSize: '0.75rem', color: 'var(--light)', marginTop: 6 }}>{dateFmt.format(new Date(o.createdAt))}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                <select className="form-input" style={{ margin: 0, maxWidth: 180 }} value={o.status} onChange={(e) => setStatus(o.id, e.target.value)}>
                  {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <button className="btn btn--danger" onClick={() => remove(o.id)}>حذف</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
