'use client';

import { useState } from 'react';

const dateFmt = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
const fa = (n) => new Intl.NumberFormat('fa-IR', { useGrouping: false }).format(n ?? 0);

export default function VerifyForm() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cert, setCert] = useState(null);

  async function check(e) {
    e.preventDefault();
    setLoading(true); setError(''); setCert(null);
    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serial: code }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'استعلام ناموفق بود.'); return; }
      setCert(data.certificate);
    } catch {
      setError('ارتباط با سرور برقرار نشد.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header__inner">
          <h1>استعلام گواهی‌نامه</h1>
          <p>اصالت گواهی‌نامهٔ پایان دورهٔ آموزشگاه سینمایی تک برداشت را با کد درج‌شده روی گواهی بررسی کنید.</p>
        </div>
      </div>
      <section style={{ background: 'var(--bg)' }}>
        <div className="container--sm">
          <form onSubmit={check} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: 32, boxShadow: 'var(--shadow-md)' }}>
            <h3 style={{ marginBottom: 16 }}>کد گواهی‌نامه را وارد کنید</h3>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input
                className="form-input"
                style={{ flex: '1 1 220px' }}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="مثلاً TB-1404-0001"
                dir="ltr"
                required
              />
              <button className="btn btn--dark" disabled={loading}>{loading ? 'در حال بررسی…' : 'استعلام'}</button>
            </div>
          </form>

          {error && <div className="alert alert--error" style={{ marginTop: 20 }}>{error}</div>}

          {cert && (
            <div
              className="stack-card"
              style={{ marginTop: 20, borderTop: `4px solid ${cert.revoked ? '#dc2626' : '#16a34a'}` }}
            >
              {cert.revoked ? (
                <div className="alert alert--error">این گواهی‌نامه توسط آموزشگاه <strong>باطل</strong> شده و معتبر نیست.</div>
              ) : (
                <div className="alert alert--success">این گواهی‌نامه <strong>معتبر</strong> است.</div>
              )}
              <div style={{ display: 'grid', gap: 8, marginTop: 14, lineHeight: 2 }}>
                <div>دارندهٔ گواهی: <strong>{cert.holder}</strong></div>
                {cert.courseTitle && <div>دوره: <strong>{cert.courseTitle}</strong></div>}
                {cert.branch && <div>شعبه: <strong>{cert.branch}</strong></div>}
                {Number.isInteger(cert.percent) && <div>نمرهٔ آزمون پایان دوره: <strong>{fa(cert.percent)} از ۱۰۰</strong></div>}
                <div>تاریخ صدور: <strong>{dateFmt.format(new Date(cert.issuedAt))}</strong></div>
                <div>کد گواهی: <strong dir="ltr">{cert.serial}</strong></div>
                <div style={{ color: 'var(--muted)' }}>صادرکننده: {cert.school}</div>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
