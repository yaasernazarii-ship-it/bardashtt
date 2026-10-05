'use client';

import { useEffect, useState } from 'react';

const dateFmt = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
const money = (n) => Number(n || 0).toLocaleString('fa-IR');

const STATUS = {
  pending: { label: 'در انتظار پرداخت' },
  paid: { label: 'پرداخت‌شده' },
  canceled: { label: 'لغوشده' },
};

// اگر onlyId داده شود فقط همان پرداخت نمایش داده می‌شود (صفحهٔ لینکِ اختصاصی).
export default function MyPayments({ onlyId = null }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [paying, setPaying] = useState('');

  async function load() {
    setLoading(true);
    const res = await fetch('/api/my/payments');
    const d = await res.json();
    if (d.ok) setPayments(onlyId ? d.payments.filter((p) => p.id === onlyId) : d.payments);
    else setError(d.error || 'خطا در بارگذاری.');
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [onlyId]);

  async function pay(id) {
    setError(''); setMsg(''); setPaying(id);
    const res = await fetch(`/api/my/payments/${id}/pay`, { method: 'POST' });
    const d = await res.json();
    setPaying('');
    if (d.ok && d.redirectUrl) { window.location.href = d.redirectUrl; return; }
    // فاز فعلی: درگاه هنوز متصل نیست.
    if (d.pendingGateway) { setMsg(d.error); return; }
    setError(d.error || 'خطا.');
  }

  if (loading) return <p style={{ color: 'var(--muted)' }}>در حال بارگذاری…</p>;

  if (payments.length === 0) {
    return (
      <div className="pay-empty">
        <div className="pay-empty__icon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" />
          </svg>
        </div>
        <p style={{ margin: 0 }}>در حال حاضر پرداختی برای شما ثبت نشده است.</p>
      </div>
    );
  }

  return (
    <div>
      {error && <div className="alert alert--error">{error}</div>}
      {msg && <div className="alert alert--info">{msg}</div>}

      <div className="pay-list">
        {payments.map((p) => {
          const st = STATUS[p.status] || STATUS.pending;
          return (
            <div key={p.id} className={`pay-card pay-card--${p.status}`}>
              <div className="pay-card__top">
                <div className="pay-card__main">
                  <div className="pay-card__title">
                    {p.title}
                    {p.courseTitle ? <span style={{ color: 'var(--muted)', fontWeight: 400 }}> · دورهٔ {p.courseTitle}</span> : null}
                  </div>
                  <div className="pay-card__sub">
                    {p.status === 'paid' && p.paidAt
                      ? `پرداخت‌شده در ${dateFmt.format(new Date(p.paidAt))}`
                      : `ثبت‌شده در ${dateFmt.format(new Date(p.createdAt))}`}
                  </div>
                </div>
                <div className="pay-card__amount">{money(p.amount)}<span>تومان</span></div>
                <span className={`pay-badge pay-badge--${p.status}`}>
                  <span className="pay-badge__dot" aria-hidden="true" />
                  {st.label}
                </span>
              </div>

              {p.status === 'pending' && (
                <div className="pay-card__actions pay-card__actions--full">
                  <button type="button" className="btn btn--dark btn--full" disabled={paying === p.id} onClick={() => pay(p.id)}>
                    {paying === p.id ? 'در حال اتصال…' : 'پرداخت آنلاین'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
