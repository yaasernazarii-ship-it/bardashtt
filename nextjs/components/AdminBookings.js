'use client';

import { useEffect, useMemo, useState } from 'react';

const STATUS = {
  new: { label: 'جدید', className: 'booking-status--new' },
  contacted: { label: 'در حال پیگیری', className: 'booking-status--contacted' },
  done: { label: 'انجام‌شده', className: 'booking-status--done' },
  rejected: { label: 'ردشده', className: 'booking-status--rejected' },
};

const dateFmt = new Intl.DateTimeFormat('fa-IR', {
  year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
});

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [drafts, setDrafts] = useState({});
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState('');

  async function load() {
    const res = await fetch('/api/bookings');
    const data = await res.json();
    if (data.ok) setBookings(data.bookings);
    else setError(data.error || 'خطا در بارگذاری.');
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function patch(id, body) {
    setBusyId(id); setError('');
    const res = await fetch(`/api/admin/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setBusyId('');
    if (data.ok) await load();
    else setError(data.error || 'عملیات انجام نشد.');
    return data.ok;
  }

  async function sendReply(id) {
    const reply = (drafts[id] || '').trim();
    if (!reply) return;
    if (await patch(id, { reply })) setDrafts((current) => ({ ...current, [id]: '' }));
  }

  const counts = useMemo(() => ({
    all: bookings.length,
    new: bookings.filter((item) => item.status === 'new').length,
    contacted: bookings.filter((item) => item.status === 'contacted').length,
    done: bookings.filter((item) => item.status === 'done').length,
  }), [bookings]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return bookings.filter((item) => {
      if (filter !== 'all' && item.status !== filter) return false;
      if (!needle) return true;
      return [item.actorName, item.name, item.phone, item.message, item.reply]
        .filter(Boolean).join(' ').toLowerCase().includes(needle);
    });
  }, [bookings, filter, query]);

  if (loading) return <p style={{ color: 'var(--muted)' }}>در حال بارگذاری…</p>;

  return (
    <div className="admin-operation-page admin-bookings">
      {error && <div className="alert alert--error">{error}</div>}

      <div className="admin-stat-grid">
        <button type="button" className={`admin-stat ${filter === 'all' ? 'is-active' : ''}`} onClick={() => setFilter('all')}><strong>{counts.all.toLocaleString('fa-IR')}</strong><span>همه درخواست‌ها</span></button>
        <button type="button" className={`admin-stat admin-stat--warning ${filter === 'new' ? 'is-active' : ''}`} onClick={() => setFilter('new')}><strong>{counts.new.toLocaleString('fa-IR')}</strong><span>درخواست جدید</span></button>
        <button type="button" className={`admin-stat ${filter === 'contacted' ? 'is-active' : ''}`} onClick={() => setFilter('contacted')}><strong>{counts.contacted.toLocaleString('fa-IR')}</strong><span>در حال پیگیری</span></button>
        <button type="button" className={`admin-stat admin-stat--success ${filter === 'done' ? 'is-active' : ''}`} onClick={() => setFilter('done')}><strong>{counts.done.toLocaleString('fa-IR')}</strong><span>انجام‌شده</span></button>
      </div>

      <div className="admin-list-toolbar">
        <label className="admin-search"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="جست‌وجوی بازیگر، درخواست‌دهنده، موبایل یا متن…" /></label>
        <span className="admin-list-toolbar__count">{visible.length.toLocaleString('fa-IR')} درخواست</span>
        <select className="form-input booking-filter" value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="فیلتر وضعیت">
          <option value="all">همه وضعیت‌ها</option>
          <option value="new">جدید</option>
          <option value="contacted">در حال پیگیری</option>
          <option value="done">انجام‌شده</option>
          <option value="rejected">ردشده</option>
        </select>
      </div>

      {visible.length === 0 ? <div className="su-empty">درخواستی مطابق فیلتر فعلی وجود ندارد.</div> : (
        <div className="booking-table">
          <div className="booking-table__head" aria-hidden="true"><span>بازیگر و درخواست‌دهنده</span><span>تماس</span><span>تاریخ ثبت</span><span>وضعیت</span><span>جزئیات</span></div>
          {visible.map((booking) => {
            const open = openId === booking.id;
            const status = STATUS[booking.status] || STATUS.new;
            return (
              <article key={booking.id} className={`booking-row${open ? ' is-open' : ''}`}>
                <div className="booking-row__summary">
                  <button type="button" className="booking-row__identity" onClick={() => setOpenId(open ? '' : booking.id)} aria-expanded={open}>
                    <strong>{booking.actorName}</strong><small>درخواست از {booking.name}</small>
                  </button>
                  <a className="booking-row__phone" href={`tel:${booking.phone}`} dir="ltr">{booking.phone}</a>
                  <time className="booking-row__date" dateTime={booking.createdAt}>{booking.createdAt ? dateFmt.format(new Date(booking.createdAt)) : '—'}</time>
                  <span className={`booking-status ${status.className}`}>{status.label}</span>
                  <button type="button" className="booking-row__expand" onClick={() => setOpenId(open ? '' : booking.id)} aria-expanded={open} aria-label={open ? 'بستن جزئیات' : 'نمایش جزئیات'}>⌄</button>
                </div>

                {open && <div className="booking-detail">
                  <section className="booking-detail__message"><span>متن درخواست</span><p>{booking.message}</p></section>
                  <section className="booking-detail__reply">
                    {booking.reply && <div className="booking-current-reply"><span>پاسخ فعلی</span><p>{booking.reply}</p></div>}
                    <label className="form-label" htmlFor={`reply-${booking.id}`}>{booking.reply ? 'ویرایش پاسخ به فیلمساز' : 'پاسخ به فیلمساز'}</label>
                    <textarea id={`reply-${booking.id}`} className="form-input" rows={2} value={drafts[booking.id] ?? ''} onChange={(event) => setDrafts((current) => ({ ...current, [booking.id]: event.target.value }))} placeholder="نتیجه هماهنگی یا زمان پیشنهادی را بنویسید…" />
                    <button type="button" className="btn btn--dark btn--sm" disabled={busyId === booking.id || !(drafts[booking.id] || '').trim()} onClick={() => sendReply(booking.id)}>ارسال پاسخ و اعلان</button>
                  </section>
                  <div className="booking-detail__actions">
                    <a className="btn btn--outline btn--sm" href={`tel:${booking.phone}`}>تماس</a>
                    <a className="btn btn--outline btn--sm" href={`https://wa.me/98${String(booking.phone).replace(/^0/, '')}`} target="_blank" rel="noopener noreferrer">واتساپ</a>
                    {booking.status !== 'contacted' && <button type="button" className="btn btn--outline btn--sm" disabled={busyId === booking.id} onClick={() => patch(booking.id, { status: 'contacted' })}>در حال پیگیری</button>}
                    {booking.status !== 'done' && <button type="button" className="btn btn--dark btn--sm" disabled={busyId === booking.id} onClick={() => patch(booking.id, { status: 'done' })}>انجام شد</button>}
                    {booking.status !== 'rejected' && <button type="button" className="btn btn--ghost btn--sm" disabled={busyId === booking.id} onClick={() => patch(booking.id, { status: 'rejected' })}>رد درخواست</button>}
                  </div>
                </div>}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
