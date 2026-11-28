'use client';

import { useState } from 'react';
import Icon from './Icon';

function toLatinDigits(input) {
  return String(input || '')
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
}

export default function BookOrderForm({ slug, title, price }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '', postalCode: '', quantity: 1, note: '' });
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
    if (data.redirectUrl) { window.location.href = data.redirectUrl; return; }
    setBusy(false);
    setDone(data.message || 'سفارش شما ثبت شد.');
    setForm({ name: '', phone: '', address: '', postalCode: '', quantity: 1, note: '' });
  }

  if (!open) {
    return (
      <div className="book-card__buy">
        <div>
          <strong>آمادهٔ سفارش هستید؟</strong>
          <span>اطلاعات ارسال را در مرحلهٔ بعد وارد می‌کنید.</span>
        </div>
        <button type="button" className="btn btn--dark" onClick={() => setOpen(true)}>خرید کتاب</button>
      </div>
    );
  }

  if (done) {
    return <div className="alert alert--success book-order__success">{done}</div>;
  }

  const total = price * (Number(form.quantity) || 1);

  return (
    <form onSubmit={submit} className="form-shell book-order">
      <div className="book-order__head">
        <div>
          <span className="book-card__eyebrow">مرحلهٔ ثبت سفارش</span>
          <h3 className="subheading">خرید «{title}»</h3>
          <p>نشانی ارسال را دقیق وارد کنید تا سفارش شما بدون تأخیر پیگیری شود.</p>
        </div>
        <button type="button" className="book-order__close" onClick={() => setOpen(false)}>بازگشت</button>
      </div>
      {error && <div className="alert alert--error">{error}</div>}
      <div className="cal-form-grid">
        <div className="form-group">
          <label className="form-label" htmlFor={`${slug}-name`}>نام و نام خانوادگی *</label>
          <input id={`${slug}-name`} className="form-input" required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="نام کامل" />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor={`${slug}-phone`}>شمارهٔ موبایل *</label>
          <input id={`${slug}-phone`} className="form-input" dir="ltr" required inputMode="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="09xxxxxxxxx" />
        </div>
      </div>
      <div className="cal-form-grid">
        <div className="form-group">
          <label className="form-label" htmlFor={`${slug}-quantity`}>تعداد</label>
          <input id={`${slug}-quantity`} className="form-input" type="number" min="1" max="100" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor={`${slug}-postal-code`}>کد پستی ۱۰ رقمی *</label>
          <input id={`${slug}-postal-code`} className="form-input" dir="ltr" required inputMode="numeric" maxLength={10} value={form.postalCode} onChange={(e) => set('postalCode', toLatinDigits(e.target.value).replace(/[^\d]/g, '').slice(0, 10))} placeholder="مثال: 1234567890" />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor={`${slug}-address`}>نشانی کامل پستی *</label>
        <textarea id={`${slug}-address`} className="form-input" required rows={3} value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="استان، شهر، خیابان اصلی، خیابان فرعی، کوچه، پلاک و واحد" />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor={`${slug}-note`}>توضیح (اختیاری)</label>
        <textarea id={`${slug}-note`} className="form-input" rows={2} value={form.note} onChange={(e) => set('note', e.target.value)} placeholder="اگر توضیحی دارید بنویسید." />
      </div>
      <div className="book-order__footer">
        <p><Icon name="package" size={15} /> هزینهٔ ارسال پستی هنگام تحویل مرسوله دریافت می‌شود.</p>
        <button className="btn btn--dark" type="submit" disabled={busy}>
          {busy ? 'در حال اتصال…' : price > 0 ? `پرداخت و ثبت سفارش (${total.toLocaleString('fa-IR')} تومان)` : 'ثبت سفارش'}
        </button>
      </div>
      <p className="book-order__notice">
        {price > 0 ? 'پس از پرداخت آنلاین، سفارش ثبت و کتاب به نشانی واردشده ارسال می‌شود.' : 'پس از ثبت سفارش، برای هماهنگی پرداخت و ارسال با شما تماس گرفته می‌شود.'}
      </p>
    </form>
  );
}
