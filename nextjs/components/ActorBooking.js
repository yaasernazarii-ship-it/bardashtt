'use client';

import { useState } from 'react';
import Link from 'next/link';
import Icon from './Icon';

export default function ActorBooking({ actorId, actorName, defaultName = '', defaultPhone = '' }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(defaultName);
  const [phone, setPhone] = useState(defaultPhone);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!name.trim() || !phone.trim() || !message.trim()) {
      setError('لطفاً نام، شماره تماس و پیام را کامل کنید.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorId, name, phone, message }),
      });
      const data = await res.json();
      if (data.ok) {
        setDone(true);
      } else {
        setError(data.error || 'ثبت درخواست انجام نشد.');
      }
    } catch {
      setError('خطای ارتباط با سرور.');
    }
    setBusy(false);
  }

  return (
    <div className="actor-booking" style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
      {done ? (
        <div className="alert alert--success" style={{ lineHeight: 2 }}>
          <Icon name="check" size={16} /> درخواست ست تایم شما برای <b>{actorName}</b> ثبت شد. به‌زودی برای هماهنگی با شما تماس می‌گیریم.{' '}
          <Link href="/dashboard/requests" style={{ fontWeight: 700 }}>پیگیری در داشبورد ←</Link>
        </div>
      ) : !open ? (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
          <h3 style={{ margin: '0 0 6px' }} className="icon-inline"><Icon name="clapperboard" size={18} /> مایل به همکاری با این بازیگر هستید؟</h3>
          <p style={{ color: 'var(--muted)', margin: '0 0 14px' }}>
            اگر از رزومهٔ {actorName} خوشتان آمده، برای هماهنگی زمان جلسه (ست تایم) درخواست بدهید تا با شما در ارتباط باشیم.
          </p>
          <button type="button" className="btn btn--gold" onClick={() => setOpen(true)}>درخواست ست تایم</button>
        </div>
      ) : (
        <form onSubmit={submit} className="form-shell" style={{ margin: 0 }}>
          <h3 style={{ margin: '0 0 12px' }}>درخواست ست تایم با {actorName}</h3>
          {error && <div className="alert alert--error" style={{ marginBottom: 12 }}>{error}</div>}
          <div className="form-group">
            <label className="form-label">نام شما</label>
            <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="نام و نام خانوادگی" />
          </div>
          <div className="form-group">
            <label className="form-label">شماره تماس</label>
            <input className="form-input" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xxxxxxxxx" />
          </div>
          <div className="form-group">
            <label className="form-label">پیام شما</label>
            <textarea className="form-input" rows={4} value={message} onChange={(e) => setMessage(e.target.value)}
              placeholder="دربارهٔ پروژه، زمان پیشنهادی و جزئیات همکاری بنویسید…" />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="btn btn--gold" disabled={busy}>{busy ? 'در حال ارسال…' : 'ارسال درخواست'}</button>
            <button type="button" className="btn btn--ghost" onClick={() => setOpen(false)} disabled={busy}>انصراف</button>
          </div>
        </form>
      )}
    </div>
  );
}
