'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function CafeLogin({ configured }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!password.trim()) { setError('رمز عبور را وارد کنید.'); return; }
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/cafe-admin/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) { setError(data.error || 'ورود انجام نشد.'); return; }
      setPassword('');
      router.refresh();
    } catch { setError('ارتباط با سرور برقرار نشد.'); }
    finally { setBusy(false); }
  };

  return <div className="cafe-login">
    <form className="cafe-login__card" onSubmit={submit}>
      <span className="cafe-login__mark">ک</span>
      <h1>پنل مدیریت کافه کتاب</h1>
      <p>برای مدیریت منو، دسته‌ها و حسابداری، رمز اختصاصی کافه را وارد کنید.</p>
      <label>
        رمز عبور کافه
        <span className="cafe-login__field">
          <input type={visible ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" autoFocus disabled={busy || configured === false} />
          <button type="button" onClick={() => setVisible((current) => !current)} aria-label={visible ? 'پنهان کردن رمز' : 'نمایش رمز'}>{visible ? 'پنهان' : 'نمایش'}</button>
        </span>
      </label>
      {error && <div className="cafe-login__error" role="alert">{error}</div>}
      {configured === false && <div className="cafe-login__error" role="alert">رمز پنل هنوز روی سرور تنظیم نشده است.</div>}
      <button type="submit" className="button button--primary" disabled={busy || configured === false}>{busy ? 'در حال ورود…' : 'ورود به پنل'}</button>
    </form>
  </div>;
}
