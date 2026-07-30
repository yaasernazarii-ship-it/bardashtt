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

export default function AuthForm() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <div className="form-shell">
      {error && <div className="alert alert--error">{error}</div>}

      <form onSubmit={loginPassword}>
        <div className="form-shell__head">
          <h2>ورود هنرجویان</h2>
          <p>با نام کاربری و رمزی که پس از تأیید حساب برایتان ارسال شده وارد شوید.</p>
        </div>
        <div className="form-group">
          <label className="form-label">نام کاربری</label>
          <input className="form-input" dir="ltr" autoComplete="username" required value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">رمز عبور</label>
          <input className="form-input" dir="ltr" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, cursor: 'pointer', color: 'var(--muted)' }}>
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          <span>مرا به خاطر بسپار</span>
        </label>
        <button className="btn btn--dark btn--full" disabled={loading}>{loading ? 'لطفاً صبر کنید…' : 'ورود'}</button>
      </form>

      <p className="form-hint" style={{ textAlign: 'center', marginTop: 16, lineHeight: 1.9 }}>
        هنوز نام کاربری ندارید؟ ابتدا «ساخت حساب کاربری» را کامل کنید؛ پس از تأیید خانواده برداشت، نام کاربری و رمز عبور برایتان ارسال می‌شود.
      </p>
    </div>
  );
}
