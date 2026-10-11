'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

function safeNext() {
  try {
    const n = new URLSearchParams(window.location.search).get('next');
    if (n && n.startsWith('/') && !n.startsWith('//')) return n;
  } catch { /* ignore */ }
  return '/dashboard';
}

// متن‌ها از پنل («متن صفحات» ← «فرم ورود») می‌آیند و به‌صورت prop می‌رسند.
// مقادیر زیر فقط پشتیبانِ حالتی هستند که content ارسال نشده باشد.
const FALLBACK = {
  pwTitle: 'ورود هنرجویان',
  pwSubtitle: 'با نام کاربری و رمزی که پس از تأیید حساب برایتان ارسال شده وارد شوید.',
  pwUsername: 'نام کاربری',
  pwPassword: 'رمز عبور',
  pwRemember: 'مرا به خاطر بسپار',
  pwSubmit: 'ورود',
  pwForgot: 'ورود با شماره موبایل و کد پیامکی',
  smsTitle: 'ورود با کد پیامکی',
  smsSubtitle: 'شماره موبایلِ ثبت‌شده در حسابتان را وارد کنید تا کد تأیید برایتان پیامک شود.',
  smsPhone: 'شماره موبایل',
  smsSend: 'ارسال کد تأیید',
  smsCode: 'کد تأیید پیامک‌شده',
  smsEditPhone: 'اصلاح شماره موبایل',
  smsBack: 'بازگشت به ورود با نام کاربری و رمز',
  wait: 'لطفاً صبر کنید…',
};

export default function AuthForm({ content }) {
  const c = { ...FALLBACK, ...(content || {}) };
  const router = useRouter();
  // mode: password (ورود عادی) | recover (بازیابی با کد پیامکی برای حساب تأییدشده)
  const [mode, setMode] = useState('password');

  // --- ورود با نام کاربری و رمز ---
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);

  // --- بازیابی با کد پیامکی ---
  const [recoverStep, setRecoverStep] = useState('phone'); // phone | code
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [notice, setNotice] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function switchMode(next) {
    setMode(next);
    setError(''); setNotice('');
    setRecoverStep('phone'); setCode('');
  }

  async function loginPassword(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, remember }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'ورود ناموفق بود.'); return; }
      router.push(safeNext());
      router.refresh();
    } catch {
      setError('ارتباط با سرور برقرار نشد.');
    } finally {
      setLoading(false);
    }
  }

  async function sendCode(e) {
    e.preventDefault();
    setError(''); setNotice(''); setLoading(true);
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'ارسال کد ناموفق بود.'); return; }
      setNotice(data.message || 'اگر این شماره به یک حساب تأییدشده تعلق داشته باشد، کد تأیید پیامک می‌شود.');
      setRecoverStep('code');
    } catch {
      setError('ارتباط با سرور برقرار نشد.');
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'کد تأیید نادرست است.'); return; }
      router.push(safeNext());
      router.refresh();
    } catch {
      setError('ارتباط با سرور برقرار نشد.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="form-shell">
      {error && <div className="alert alert--error">{error}</div>}
      {notice && mode === 'recover' && <div className="alert" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}>{notice}</div>}

      {mode === 'password' && (
        <>
          <form onSubmit={loginPassword}>
            <div className="form-shell__head">
              <h2>{c.pwTitle}</h2>
              <p>{c.pwSubtitle}</p>
            </div>
            <div className="form-group">
              <label className="form-label">{c.pwUsername}</label>
              <input className="form-input" dir="ltr" autoComplete="username" required value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">{c.pwPassword}</label>
              <input className="form-input" dir="ltr" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, cursor: 'pointer', color: 'var(--muted)' }}>
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              <span>{c.pwRemember}</span>
            </label>
            <button className="btn btn--dark btn--full" disabled={loading}>{loading ? c.wait : c.pwSubmit}</button>
          </form>

          <p className="form-hint" style={{ textAlign: 'center', marginTop: 16 }}>
            <button type="button" onClick={() => switchMode('recover')}
              style={{ background: 'none', border: 'none', color: 'var(--dark)', fontWeight: 800, cursor: 'pointer', font: 'inherit' }}>
              {c.pwForgot}
            </button>
          </p>
        </>
      )}

      {mode === 'recover' && (
        <>
          <div className="form-shell__head">
            <h2>{c.smsTitle}</h2>
            <p>{c.smsSubtitle}</p>
          </div>

          {recoverStep === 'phone' ? (
            <form onSubmit={sendCode}>
              <div className="form-group">
                <label className="form-label">{c.smsPhone}</label>
                <input className="form-input" dir="ltr" inputMode="numeric" autoComplete="tel" placeholder="09xxxxxxxxx" required value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <button className="btn btn--dark btn--full" disabled={loading}>{loading ? c.wait : c.smsSend}</button>
            </form>
          ) : (
            <form onSubmit={verifyCode}>
              <div className="form-group">
                <label className="form-label">{c.smsCode}</label>
                <input className="form-input" dir="ltr" inputMode="numeric" autoComplete="one-time-code" placeholder="****" required value={code} onChange={(e) => setCode(e.target.value)} />
              </div>
              <button className="btn btn--dark btn--full" disabled={loading}>{loading ? c.wait : c.pwSubmit}</button>
              <p className="form-hint" style={{ textAlign: 'center', marginTop: 12 }}>
                <button type="button" onClick={() => { setRecoverStep('phone'); setError(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--muted)', fontWeight: 700, cursor: 'pointer', font: 'inherit' }}>
                  {c.smsEditPhone}
                </button>
              </p>
            </form>
          )}

          <p className="form-hint" style={{ textAlign: 'center', marginTop: 16 }}>
            <button type="button" onClick={() => switchMode('password')}
              style={{ background: 'none', border: 'none', color: 'var(--dark)', fontWeight: 800, cursor: 'pointer', font: 'inherit' }}>
              {c.smsBack}
            </button>
          </p>
        </>
      )}
    </div>
  );
}
