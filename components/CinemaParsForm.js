'use client';

import { useMemo, useState } from 'react';

// برچسب‌ها و گزینه‌های این فرم از رجیستری محتوای پنل (کلیدهای cp.form.*) می‌آیند
// تا مدیر بتواند متن‌ها را بدون تغییر کد عوض کند.
const FALLBACK_SUBJECTS = ['تولید فیلم و سریال', 'طراحی و مشاوره', 'خدمات رسانه‌ای', 'فعالیت‌های فرهنگی و هنری', 'سایر'];

const DEFAULTS = {
  name: 'نام و نام خانوادگی',
  phone: 'شمارهٔ تماس',
  email: 'ایمیل',
  emailOptional: 'اختیاری',
  subject: 'موضوع همکاری',
  message: 'شرح درخواست',
  placeholder: 'دربارهٔ پروژه، همکاری یا خدمات مورد نظرتان بنویسید…',
  submit: 'ارسال درخواست',
  sending: 'در حال ارسال…',
  note: 'اطلاعات شما فقط برای بررسی همین درخواست استفاده می‌شود.',
  successTitle: 'درخواست شما ثبت شد',
  successText: 'درخواست همکاری شما در صندوق پیام مدیریت ثبت شد و تیم ما برای بررسی با شما تماس می‌گیرد.',
  successAgain: 'ارسال درخواست دیگر',
};

export default function CinemaParsForm({ labels = {} }) {
  const L = { ...DEFAULTS, ...labels };
  const subjects = useMemo(() => {
    const list = (labels.subjects || []).filter(Boolean);
    return list.length ? list : FALLBACK_SUBJECTS;
  }, [labels.subjects]);

  const [form, setForm] = useState({ name: '', phone: '', email: '', subject: subjects[0], message: '' });
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
      setForm({ name: '', phone: '', email: '', subject: subjects[0], message: '' });
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
        <h3>{L.successTitle}</h3>
        <p>{L.successText}</p>
        <button type="button" className="cp-btn cp-btn--ghost" onClick={() => setSent(false)}>{L.successAgain}</button>
      </div>
    );
  }

  return (
    <form className="cp-form" onSubmit={submit} noValidate>
      <div className="cp-form__row">
        <label className="cp-form__field">
          <span>{L.name}</span>
          <input name="name" value={form.name} onChange={set('name')} maxLength={80} required autoComplete="name" />
        </label>
        <label className="cp-form__field">
          <span>{L.phone}</span>
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
          <span>{L.email} {L.emailOptional ? <em>({L.emailOptional})</em> : null}</span>
          <input name="email" value={form.email} onChange={set('email')} maxLength={120} dir="ltr" type="email" autoComplete="email" />
        </label>
        <label className="cp-form__field">
          <span>{L.subject}</span>
          <select name="subject" value={form.subject} onChange={set('subject')}>
            {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      </div>
      <label className="cp-form__field">
        <span>{L.message}</span>
        <textarea
          name="message"
          value={form.message}
          onChange={set('message')}
          rows={5}
          maxLength={2000}
          required
          placeholder={L.placeholder}
        />
      </label>

      {error && <p className="cp-form__error" role="alert">{error}</p>}

      <div className="cp-form__actions">
        <button type="submit" className="cp-btn" disabled={sending}>
          {sending ? L.sending : L.submit}
        </button>
        <small>{L.note}</small>
      </div>
    </form>
  );
}
