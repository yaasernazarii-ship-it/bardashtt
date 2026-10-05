'use client';

import { useState } from 'react';

export default function SocialAuth({ returnTo = '/community' }) {
  const [purpose, setPurpose] = useState('signup');
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ phone: '', code: '', displayName: '', username: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (key) => (e) => setForm((v) => ({ ...v, [key]: e.target.value }));

  async function send(e) {
    e.preventDefault(); setBusy(true); setError('');
    const res = await fetch('/api/social/auth/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: form.phone, purpose }) });
    const data = await res.json(); setBusy(false);
    if (!data.ok) return setError(data.error || 'ارسال کد ناموفق بود.');
    if (data.devOtp) setForm((v) => ({ ...v, code: data.devOtp }));
    setStep(2);
  }

  async function verify(e) {
    e.preventDefault(); setBusy(true); setError('');
    const res = await fetch('/api/social/auth/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, purpose }) });
    const data = await res.json(); setBusy(false);
    if (!data.ok) return setError(data.error || 'تأیید ناموفق بود.');
    window.location.href = returnTo;
  }

  return <div className="form-shell" style={{ marginBottom: 24 }}>
    <div className="cm-kind">
      <button type="button" className={purpose === 'signup' ? 'active' : undefined} onClick={() => { setPurpose('signup'); setStep(1); }}>ثبت‌نام برداشتگرام</button>
      <button type="button" className={purpose === 'login' ? 'active' : undefined} onClick={() => { setPurpose('login'); setStep(1); }}>ورود</button>
    </div>
    {error && <div className="alert alert--error" role="alert" style={{ marginBottom: 12 }}>{error}</div>}
    {step === 1 ? <form onSubmit={send}>
      <label className="form-label" htmlFor="social-phone">شماره موبایل</label>
      <input id="social-phone" className="form-input" inputMode="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} placeholder="09xxxxxxxxx" required />
      <button className="btn btn--dark" disabled={busy} style={{ marginTop: 12 }}>{busy ? 'در حال ارسال…' : 'دریافت کد تأیید'}</button>
    </form> : <form onSubmit={verify}>
      {purpose === 'signup' && <>
        <label className="form-label" htmlFor="social-name">نام نمایشی</label>
        <input id="social-name" className="form-input" value={form.displayName} onChange={set('displayName')} maxLength={60} required />
        <label className="form-label" htmlFor="social-user" style={{ marginTop: 10 }}>نام کاربری</label>
        <input id="social-user" className="form-input" dir="ltr" value={form.username} onChange={set('username')} placeholder="your_name" maxLength={24} required />
      </>}
      <label className="form-label" htmlFor="social-code" style={{ marginTop: 10 }}>کد پیامک‌شده</label>
      <input id="social-code" className="form-input" inputMode="numeric" autoComplete="one-time-code" value={form.code} onChange={set('code')} maxLength={4} required />
      <button className="btn btn--dark" disabled={busy} style={{ marginTop: 12 }}>{busy ? 'در حال تأیید…' : purpose === 'signup' ? 'ساخت حساب' : 'ورود'}</button>
    </form>}
  </div>;
}
