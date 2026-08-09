'use client';

import { useEffect, useState } from 'react';

const dateFmt = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('fa-IR', {
  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
});
const money = (n) => Number(n || 0).toLocaleString('fa-IR');

const STATUS = {
  new: { label: 'در انتظار پرداخت', cls: 'badge-submitted' },
  contacted: { label: 'در حال هماهنگی', cls: 'badge-scheduled' },
  paid: { label: 'پرداخت‌شده', cls: 'badge-approved' },
  shipped: { label: 'ارسال‌شده', cls: 'badge-approved' },
  canceled: { label: 'لغوشده', cls: 'badge-rejected' },
};

export default function MyBookOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/my/book-orders');
      const d = await res.json();
      if (d.ok) setOrders(d.orders); else setError(d.error || 'خطا در بارگذاری.');
      setLoading(false);
    })();
  }, []);

  if (loading) return <p style={{ color: 'var(--muted)' }}>در حال بارگذاری…</p>;
  if (error) return <div className="alert alert--error">{error}</div>;

  if (orders.length === 0) {
    return (
      <div className="pay-empty">
        <p style={{ margin: 0 }}>هنوز سفارش کتابی برای شما ثبت نشده است.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {orders.map((o) => {
        const st = STATUS[o.status] || STATUS.new;
        const paid = o.status === 'paid' || o.status === 'shipped';
        return (
          <div key={o.id} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {o.coverImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={o.coverImage} alt="" style={{ width: 38, height: 52, objectFit: 'cover', borderRadius: 6 }} />
              )}
              <div>
                <strong>{o.title}</strong>
                <div style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>
                  {money(o.quantity)} نسخه · ثبت‌شده در {dateFmt.format(new Date(o.createdAt))}
                </div>
              </div>
              <span className={`enroll-badge ${st.cls}`} style={{ marginInlineStart: 'auto' }}>{st.label}</span>
            </div>

            {paid ? (
              <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 8, background: '#eaf7f0', border: '1px solid #bfe5d0', fontSize: '0.85rem', lineHeight: 1.9 }}>
                <div style={{ fontWeight: 700, color: '#137a4a' }}>
                  {o.amount ? `💵 مبلغ پرداخت‌شده: ${money(o.amount)} تومان` : '✅ پرداخت این سفارش ثبت شده است'}
                </div>
                {o.paidAt && <div>🕒 {dateTimeFmt.format(new Date(o.paidAt))}</div>}
                {o.refId && <div>🔖 کد پیگیری: <span dir="ltr">{o.refId}</span></div>}
                {o.status === 'shipped' && <div>📦 سفارش شما ارسال شده است.</div>}
              </div>
            ) : o.status === 'canceled' ? (
              <div style={{ marginTop: 10, fontSize: '0.85rem', color: 'var(--muted)' }}>این سفارش لغو شده است.</div>
            ) : (
              <div style={{ marginTop: 10, fontSize: '0.85rem', color: 'var(--muted)' }}>
                ⏳ پرداخت این سفارش هنوز ثبت نشده است
                {o.amount ? ` — مبلغ: ${money(o.amount)} تومان` : ''}. همکاران ما برای هماهنگی با شما تماس می‌گیرند.
              </div>
            )}

            {o.address && (
              <div style={{ marginTop: 8, fontSize: '0.82rem', color: 'var(--muted)' }}>
                📮 {o.address}{o.postalCode ? ` — کد پستی ${o.postalCode}` : ''}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
