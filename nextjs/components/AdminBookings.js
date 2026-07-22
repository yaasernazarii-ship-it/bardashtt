'use client';

import { useEffect, useState } from 'react';

const STATUS_LABEL = { new: 'جدید', contacted: 'در حال پیگیری', done: 'انجام‌شده', rejected: 'ردشده' };
const STATUS_TAG = { new: 'tag--gold', contacted: 'tag--dark', done: 'tag--dark', rejected: 'tag--dark' };

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  async function load() {
    const res = await fetch('/api/bookings');
    const data = await res.json();
    if (data.ok) setBookings(data.bookings);
    else setError(data.error || 'خطا در بارگذاری.');
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function setStatus(id, status) {
    setBusyId(id); setError('');
    const res = await fetch(`/api/admin/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    setBusyId('');
    if (data.ok) load();
    else setError(data.error || 'عملیات انجام نشد.');
  }

  if (loading) return <p style={{ color: 'var(--muted)' }}>در حال بارگذاری…</p>;

  return (
    <div>
      {error && <div className="alert alert--error" style={{ marginBottom: 12 }}>{error}</div>}
      {bookings.length === 0 && <p style={{ color: 'var(--muted)' }}>هنوز درخواست ست تایمی ثبت نشده است.</p>}

      <div style={{ display: 'grid', gap: 14 }}>
        {bookings.map((b) => (
          <div key={b.id} className="form-shell" style={{ margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              <strong style={{ fontSize: '1.05rem' }}>🎭 {b.actorName}</strong>
              <span className={`tag ${STATUS_TAG[b.status] || 'tag--dark'}`}>{STATUS_LABEL[b.status] || b.status}</span>
            </div>
            <div style={{ color: 'var(--muted)', fontSize: '.9rem', lineHeight: 2 }}>
              <div>نام درخواست‌دهنده: {b.name}</div>
              <div>شماره تماس: <a href={`tel:${b.phone}`} dir="ltr">{b.phone}</a></div>
              {b.createdAt && <div>تاریخ: <span dir="ltr">{new Date(b.createdAt).toLocaleString('fa-IR')}</span></div>}
            </div>
            <div style={{ marginTop: 10, background: 'var(--surface)', borderRadius: 10, padding: 12, whiteSpace: 'pre-line', lineHeight: 2 }}>
              {b.message}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              <a className="btn btn--gold" href={`tel:${b.phone}`}>تماس تلفنی</a>
              <a className="btn btn--outline" href={`https://wa.me/98${String(b.phone).replace(/^0/, '')}`} target="_blank" rel="noopener noreferrer">واتساپ</a>
              {b.status !== 'contacted' && <button className="btn btn--outline" disabled={busyId === b.id} onClick={() => setStatus(b.id, 'contacted')}>در حال پیگیری</button>}
              {b.status !== 'done' && <button className="btn btn--dark" disabled={busyId === b.id} onClick={() => setStatus(b.id, 'done')}>انجام شد</button>}
              {b.status !== 'rejected' && <button className="btn btn--ghost" disabled={busyId === b.id} onClick={() => setStatus(b.id, 'rejected')}>رد</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
