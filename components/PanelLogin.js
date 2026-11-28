'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// مقصد بعد از ورود: فقط مسیرهای داخلیِ پنل پذیرفته می‌شوند.
function safeNext() {
  try {
    const n = new URLSearchParams(window.location.search).get('next');
    if (n && n.startsWith('/dashboard')) return n;
  } catch { /* ignore */ }
  return '/dashboard';
}

export default function PanelLogin() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // panel: true ← سرور فقط به ادمین و ادیتور اجازهٔ ورود از این صفحه را می‌دهد.
        body: JSON.stringify({ username, password, remember: true, panel: true }),
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
    <form onSubmit={submit}>
      {error && <div className="alert alert--error">{error}</div>}
      <div className="form-group">
        <label className="form-label">نام کاربری</label>
        <input className="form-input" dir="ltr" autoComplete="username" autoFocus required
          value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">رمز عبور</label>
        <input className="form-input" dir="ltr" type="password" autoComplete="current-password" required
          value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <button className="btn btn--dark btn--full" disabled={loading}>
        {loading ? 'لطفاً صبر کنید…' : 'ورود به پنل مدیریت'}
      </button>
    </form>
  );
}
