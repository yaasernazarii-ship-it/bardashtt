'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Icon from './Icon';

const dateFmt = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });

export default function MyShortlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/shortlist');
        const d = await res.json();
        if (d.ok) setItems(d.items); else setError(d.error || 'خطا در بارگذاری.');
      } catch {
        setError('خطای ارتباط با سرور.');
      }
      setLoading(false);
    })();
  }, []);

  async function remove(actorId) {
    setBusyId(actorId);
    try {
      const res = await fetch(`/api/shortlist?actorId=${encodeURIComponent(actorId)}`, { method: 'DELETE' });
      const d = await res.json();
      if (d.ok) setItems((list) => list.filter((a) => a.id !== actorId));
      else setError(d.error || 'حذف انجام نشد.');
    } catch {
      setError('خطای ارتباط با سرور.');
    }
    setBusyId('');
  }

  if (loading) return <p style={{ color: 'var(--muted)' }}>در حال بارگذاری…</p>;
  if (error) return <div className="alert alert--error">{error}</div>;

  if (items.length === 0) {
    return (
      <div className="pay-empty">
        <p style={{ margin: '0 0 12px' }}>لیست کوتاه شما خالی است. در بانک بازیگران، هر رزومه‌ای را که پسندیدید نشان کنید تا اینجا ذخیره شود.</p>
        <Link href="/actors" className="btn btn--gold btn--sm">رفتن به بانک بازیگران</Link>
      </div>
    );
  }

  return (
    <div className="responsive-grid-3">
      {items.map((a) => (
        <div key={a.id} className="content-card actor-card">
          <Link href={`/actors/${a.id}`}>
            <div className="actor-photo" style={a.photoUrl ? { backgroundImage: `url(${a.photoUrl})` } : undefined}>
              {!a.photoUrl && <Icon name="masks" size={40} strokeWidth={1.4} />}
            </div>
            <h3 style={{ margin: '12px 0 4px' }}>{a.fullName}</h3>
            {a.headline && <p style={{ color: 'var(--muted)', margin: 0 }}>{a.headline}</p>}
          </Link>
          {a.city && <span className="tag tag--gold" style={{ marginTop: 10, alignSelf: 'flex-start' }}>{a.city}</span>}
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Link href={`/actors/${a.id}`} className="btn btn--gold btn--sm">مشاهده رزومه</Link>
            <button type="button" className="btn btn--ghost btn--sm" disabled={busyId === a.id} onClick={() => remove(a.id)}>
              {busyId === a.id ? 'در حال حذف…' : 'حذف از لیست'}
            </button>
          </div>
          <div style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--muted)' }}>
            افزوده‌شده در {dateFmt.format(new Date(a.addedAt))}
          </div>
        </div>
      ))}
    </div>
  );
}
