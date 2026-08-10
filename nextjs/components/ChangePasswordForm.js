'use client';

import { useState } from 'react';

// تغییر رمز عبور توسط خود کاربر. اگر حساب هنوز رمزی ندارد (ورود با کد پیامکی)
// فیلد «رمز فعلی» نمایش داده نمی‌شود و کاربر برای اولین بار رمز می‌گذارد.
export default function ChangePasswordForm({ hasPassword, username }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [repeat, setRepeat] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  async function save(e) {
    e.preventDefault();
    setMsg(null);
    if (next !== repeat) { setMsg({ type: 'error', text: 'تکرار رمز جدید با خودش یکی نیست.' }); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/profile/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json();
      if (!data.ok) { setMsg({ type: 'error', text: data.error || 'رمز تغییر نکرد.' }); return; }
      setMsg({ type: 'success', text: data.message || 'رمز عبور شما تغییر کرد.' });
      setCurrent(''); setNext(''); setRepeat('');
    } catch {
      setMsg({ type: 'error', text: 'ارتباط با سرور برقرار نشد.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="form-shell" onSubmit={save} style={{ maxWidth: 520, marginTop: 24 }}>
      <div className="form-shell__head">
        <h2>{hasPassword ? 'تغییر رمز عبور' : 'انتخاب رمز عبور'}</h2>
        <p>
          {username
            ? `نام کاربری شما «${username}» است و با همین رمز وارد می‌شوید.`
            : 'برای حساب شما هنوز نام کاربری صادر نشده؛ پس از صدور، با همین رمز وارد می‌شوید.'}
        </p>
      </div>
      {msg && <div className={`alert alert--${msg.type}`}>{msg.text}</div>}
      {hasPassword && (
        <div className="form-group">
          <label className="form-label">رمز فعلی</label>
          <input className="form-input" dir="ltr" type="password" autoComplete="current-password" required
            value={current} onChange={(e) => setCurrent(e.target.value)} />
        </div>
      )}
      <div className="form-group">
        <label className="form-label">رمز جدید</label>
        <input className="form-input" dir="ltr" type="password" autoComplete="new-password" required minLength={8}
          value={next} onChange={(e) => setNext(e.target.value)} />
        <p className="form-hint">حداقل ۸ نویسه.</p>
      </div>
      <div className="form-group">
        <label className="form-label">تکرار رمز جدید</label>
        <input className="form-input" dir="ltr" type="password" autoComplete="new-password" required minLength={8}
          value={repeat} onChange={(e) => setRepeat(e.target.value)} />
      </div>
      <button className="btn btn--dark btn--full" disabled={loading}>
        {loading ? 'در حال ذخیره…' : (hasPassword ? 'تغییر رمز عبور' : 'ثبت رمز عبور')}
      </button>
    </form>
  );
}
