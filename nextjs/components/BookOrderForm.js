'use client';

import { useState } from 'react';

// فرمِ ثبتِ سفارشِ یک کتاب. برای همه باز است (نیازی به ورود نیست).
export default function BookOrderForm({ slug, price }) {
  const [form, setForm] = useState({ name: '', phone: '', address: '', quantity: 1, note: '' });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState('');
  const [error, setError] = useState('');

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError(''); setDone('');
    const res = await fetch(`/api/books/${slug}/order`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!data.ok) { setBusy(false); setError(data.error || 'خطا در ثبت سفارش.'); return; }
    // اگر پرداخت آنلاین فعال باشد، به درگاه منتقل می‌شویم.
    if (data.redirectUrl) { window.location.href = data.redirectUrl; return; }
    setBusy(false);
    setDone(data.message || 'سفارش شما ثبت شد.');
    setForm({ name: '', phone: '', address: '', quantity: 1, note: '' });
  }

  if (done) {
    return <div className="alert alert--success" style={{ marginTop: 12 }}>{done}</div>;
  }

  return (
    <form onSubmit={submit} className="form-shell" style={{ marginTop: 12 }}>
      <h3 className="subheading" style={{ marginBottom: 14 }}>ثبت سفارش</h3>
      {error && <div className="alert alert--error" style={{ marginBottom: 12 }}>{error}</div>}
      <div className="cal-form-grid">
        <div className="form-group">
          <label className="form-label">نام و نام خانوادگی *</label>
          <input className="form-input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="نام کامل" />
        </div>
        <div className="form-group">
          <label className="form-label">شمارهٔ موبایل *</label>
          <input className="form-input" dir="ltr" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="09xxxxxxxxx" />
        </div>
      </div>
      <div className="cal-form-grid">
        <div className="form-group">
          <label className="form-label">تعداد</label>
          <input className="form-input" type="number" min="1" max="100" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">نشانی پستی *</label>
          <input className="form-input" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="نشانی کامل برای ارسال کتاب" />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">توضیح (اختیاری)</label>
        <textarea className="form-input" rows={2} value={form.note} onChange={(e) => set('note', e.target.value)} placeholder="اگر توضیحی دارید بنویسید." />
      </div>
      <button className="btn btn--dark" type="submit" disabled={busy}>
        {busy ? 'در حال اتصال…' : price > 0 ? `پرداخت و ثبت سفارش (${(price * (Number(form.quantity) || 1)).toLocaleString('fa-IR')} تومان)` : 'ثبت سفارش'}
      </button>
      <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginTop: 10 }}>
        {price > 0
          ? 'پس از پرداخت آنلاین، سفارش شما ثبت و کتاب به نشانیِ واردشده ارسال می‌شود.'
          : 'پس از ثبت سفارش، همکاران ما برای هماهنگی پرداخت و ارسال با شما تماس می‌گیرند.'}
      </p>
    </form>
  );
}
