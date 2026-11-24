'use client';

import { useState } from 'react';

const SUBJECTS = [
  'تولید فیلم و سریال',
  'طراحی و مشاوره',
  'خدمات رسانه‌ای',
  'فعالیت‌های فرهنگی و هنری',
  'سایر',
];

const EMPTY = { name: '', phone: '', email: '', subject: SUBJECTS[0], message: '' };

export default function CinemaParsForm() {
  const [form, setForm] = useState(EMPTY);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (error) setError('');
  };

  async function submit(e) {
    e.preventDefault();
    if (sending) return;
    setError('');
    setSending(true);
    try {
      const res = await fetch('/api/cinema-pars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!data.ok) {
        setError(data.error || 'ارسال درخواست انجام نشد. دوباره تلاش کنید.');
        return;
      }
      setSent(true);
      setForm(EMPTY);
    } catch {
      setError('ارتباط با سرور برقرار نشد؛ اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.');
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="cp-form__done" role="status">
        <span className="cp-form__done-ico" aria-hidden="true">✓</span>
        <h3>درخواست شما ثبت شد</h3>
        <p>درخواست همکاری شما در صندوق پیام مدیریت ثبت شد و تیم ما برای بررسی با شما تماس می‌گیرد.</p>
        <button type="button" className="cp-btn cp-btn--ghost" onClick={() => setSent(false)}>ارسال درخواست دیگر</button>
      </div>
    );
  }

  return (
    <form className="cp-form" onSubmit={submit} noValidate>
      <div className="cp-form__row">
        <label className="cp-form__field">
          <span>نام و نام خانوادگی</span>
          <input name="name" value={form.name} onChange={set('name')} maxLength={80} required autoComplete="name" />
        </label>
        <label className="cp-form__field">
          <span>شمارهٔ تماس</span>
          <input
            name="phone"
            value={form.phone}
            onChange={set('phone')}
            maxLength={30}
            inputMode="tel"
            dir="ltr"
            placeholder="۰۹۱۲۳۴۵۶۷۸۹"
            required
            autoComplete="tel"
          />
        </label>
      </div>
      <div className="cp-form__row">
        <label className="cp-form__field">
          <span>ایمیل <em>(اختیاری)</em></span>
          <input name="email" value={form.email} onChange={set('email')} maxLength={120} dir="ltr" type="email" autoComplete="email" />
        </label>
        <label className="cp-form__field">
          <span>موضوع همکاری</span>
          <select name="subject" value={form.subject} onChange={set('subject')}>
            {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      </div>
      <label className="cp-form__field">
        <span>شرح درخواست</span>
        <textarea
          name="message"
          value={form.message}
          onChange={set('message')}
          rows={5}
          maxLength={2000}
          required
          placeholder="دربارهٔ پروژه، همکاری یا خدمات مورد نظرتان بنویسید…"
        />
      </label>

      {error && <p className="cp-form__error" role="alert">{error}</p>}

      <div className="cp-form__actions">
        <button type="submit" className="cp-btn" disabled={sending}>
          {sending ? 'در حال ارسال…' : 'ارسال درخواست'}
        </button>
        <small>اطلاعات شما فقط برای بررسی همین درخواست استفاده می‌شود.</small>
      </div>
    </form>
  );
}
