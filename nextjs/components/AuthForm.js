'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

function safeNext() {
  try {
    const n = new URLSearchParams(window.location.search).get('next');
    if (n && n.startsWith('/') && !n.startsWith('//')) return n;
  } catch { /* ignore */ }
  return '/dashboard';
}

export default function AuthForm() {
  const router = useRouter();
  const [step, setStep] = useState('phone'); // phone | code
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const inputsRef = useRef([]);

  async function requestOtp(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'خطا در ارسال کد.'); return; }
      setDevOtp(data.devOtp || '');
      setStep('code');
    } catch {
      setError('ارتباط با سرور برقرار نشد.');
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: code.join('') }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'کد نادرست است.'); return; }
      router.push(safeNext());
      router.refresh();
    } catch {
      setError('ارتباط با سرور برقرار نشد.');
    } finally {
      setLoading(false);
    }
  }

  function onCodeChange(i, val) {
    const digit = val.replace(/[^\d]/g, '').slice(-1);
    const next = [...code];
    next[i] = digit;
    setCode(next);
    if (digit && i < 3) inputsRef.current[i + 1]?.focus();
  }

  return (
    <form className="form-shell" onSubmit={step === 'phone' ? requestOtp : verifyOtp}>
      <div className="form-shell__head">
        <h2>ورود با شماره موبایل</h2>
        <p>{step === 'phone' ? 'شماره موبایل خود را وارد کنید تا کد تأیید برایتان ارسال شود.' : 'کد تأیید ارسال‌شده را وارد کنید.'}</p>
      </div>

      {error && <div className="alert alert--error">{error}</div>}
      {step === 'code' && devOtp && <div className="alert alert--info">کد تأیید (آزمایشی تا فعال‌شدن پیامک): {devOtp}</div>}

      <div className="form-group">
        <label className="form-label">شماره موبایل</label>
        <input
          className="form-input"
          dir="ltr"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          required
          placeholder="09xxxxxxxxx"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={step === 'code'}
        />
      </div>

      {step === 'code' && (
        <div className="otp-wrap" dir="ltr">
          {[0, 1, 2, 3].map((i) => (
            <input
              key={i}
              ref={(el) => (inputsRef.current[i] = el)}
              className="otp-input"
              maxLength="1"
              inputMode="numeric"
              value={code[i]}
              onChange={(e) => onCodeChange(i, e.target.value)}
              required
            />
          ))}
        </div>
      )}

      <button className="btn btn--dark btn--full" disabled={loading}>
        {loading ? 'لطفاً صبر کنید…' : step === 'phone' ? 'دریافت کد' : 'ورود'}
      </button>

      {step === 'code' && (
        <button
          type="button"
          className="btn btn--ghost btn--full"
          style={{ marginTop: 8 }}
          onClick={() => { setStep('phone'); setCode(['', '', '', '']); setError(''); }}
        >
          ویرایش شماره
        </button>
      )}
    </form>
  );
}
