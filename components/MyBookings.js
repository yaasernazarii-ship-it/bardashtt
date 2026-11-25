'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Icon from './Icon';

const dateFmt = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('fa-IR', {
  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
});

// همان وضعیت‌هایی که ادمین در پنل خودش تغییر می‌دهد، با زبانِ فیلمساز.
const STATUS = {
  new: { label: 'در انتظار بررسی', cls: 'badge-submitted', hint: 'درخواست شما ثبت شد و پشتیبانی در حال بررسی آن است.' },
  contacted: { label: 'در حال هماهنگی', cls: 'badge-scheduled', hint: 'پشتیبانی برای هماهنگی زمان جلسه با بازیگر در ارتباط است.' },
  done: { label: 'انجام‌شده', cls: 'badge-approved', hint: 'هماهنگی این درخواست انجام شده است.' },
  rejected: { label: 'امکان‌پذیر نشد', cls: 'badge-rejected', hint: 'این درخواست بسته شد. برای جزئیات بیشتر با پشتیبانی در تماس باشید.' },
};

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/bookings/mine');
        const d = await res.json();
        if (d.ok) setBookings(d.bookings); else setError(d.error || 'خطا در بارگذاری.');
      } catch {
        setError('خطای ارتباط با سرور.');
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <p style={{ color: 'var(--muted)' }}>در حال بارگذاری…</p>;
  if (error) return <div className="alert alert--error">{error}</div>;

  if (bookings.length === 0) {
    return (
      <div className="pay-empty">
        <p style={{ margin: '0 0 12px' }}>هنوز درخواست ست تایمی ثبت نکرده‌اید.</p>
        <Link href="/actors" className="btn btn--gold btn--sm">رفتن به بانک بازیگران</Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {bookings.map((b) => {
        const st = STATUS[b.status] || STATUS.new;
        return (
          <div key={b.id} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div>
                <Link href={`/actors/${b.actorId}`} style={{ fontWeight: 700 }}>{b.actorName}</Link>
                <div style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>
                  ثبت‌شده در {dateFmt.format(new Date(b.createdAt))}
                </div>
              </div>
              <span className={`enroll-badge ${st.cls}`} style={{ marginInlineStart: 'auto' }}>{st.label}</span>
            </div>

            {b.message && (
              <p style={{ margin: '10px 0 0', whiteSpace: 'pre-line', fontSize: '0.88rem', lineHeight: 2, color: 'var(--text)' }}>
                {b.message}
              </p>
            )}

            {b.reply ? (
              <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 8, background: '#eaf7f0', border: '1px solid #bfe5d0', fontSize: '0.85rem', lineHeight: 2 }}>
                <div style={{ fontWeight: 700, color: '#137a4a' }} className="meta-ico">
                  <Icon name="chat" size={14} /> پاسخ پشتیبانی
                </div>
                <div style={{ whiteSpace: 'pre-line' }}>{b.reply}</div>
                {b.replyAt && (
                  <div style={{ color: 'var(--muted)' }} className="meta-ico">
                    <Icon name="clock" size={14} /> {dateTimeFmt.format(new Date(b.replyAt))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ marginTop: 10, fontSize: '0.85rem', color: 'var(--muted)' }} className="meta-ico">
                <Icon name="clock" size={14} /> {st.hint}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
