'use client';

import { useEffect, useState } from 'react';

const dateFmt = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
const money = (n) => Number(n || 0).toLocaleString('fa-IR');

const STATUS = {
  pending: { label: 'در انتظار پرداخت', bg: '#FFF7ED', color: '#92400E', border: '#FED7AA' },
  paid: { label: 'پرداخت‌شده', bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' },
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
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24, textAlign: 'center' }}>
        <p style={{ color: 'var(--muted)', margin: 0 }}>در حال حاضر پرداختی برای شما ثبت نشده است.</p>
      </div>
    );
  }

  return (
    <div>
      {error && <div className="alert alert--error" style={{ marginBottom: 16 }}>{error}</div>}
      {msg && <div className="alert alert--success" style={{ marginBottom: 16 }}>{msg}</div>}

      <div style={{ display: 'grid', gap: 12 }}>
        {payments.map((p) => {
          const st = STATUS[p.status] || STATUS.pending;
          return (
            <div key={p.id} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                <div style={{ flex: 1, minWidth: 180, fontWeight: 800 }}>
                  {p.title}
                  {p.courseTitle ? <span style={{ color: 'var(--muted)', fontWeight: 400 }}> · دورهٔ {p.courseTitle}</span> : null}
                </div>
                <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, borderRadius: 999, padding: '3px 12px', fontSize: '.78rem', fontWeight: 700 }}>{st.label}</span>
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 4 }}>{money(p.amount)} <span style={{ fontSize: '.9rem', fontWeight: 600 }}>تومان</span></div>
              <div style={{ fontSize: '.82rem', color: 'var(--muted)' }}>
                {p.status === 'paid' && p.paidAt
                  ? `پرداخت‌شده در ${dateFmt.format(new Date(p.paidAt))}`
                  : `ثبت‌شده در ${dateFmt.format(new Date(p.createdAt))}`}
              </div>

              {p.status === 'pending' && (
                <div style={{ marginTop: 14 }}>
                  <button type="button" className="btn btn--dark" disabled={paying === p.id} onClick={() => pay(p.id)}>
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
