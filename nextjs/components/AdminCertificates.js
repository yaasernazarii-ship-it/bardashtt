'use client';

import { useEffect, useState } from 'react';

const dateFmt = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
const fa = (n) => new Intl.NumberFormat('fa-IR', { useGrouping: false }).format(n ?? 0);

export default function AdminCertificates() {
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [userId, setUserId] = useState('');
  const [percent, setPercent] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [cRes, uRes] = await Promise.all([fetch('/api/admin/certificates'), fetch('/api/admin/users')]);
      const cData = await cRes.json();
      const uData = await uRes.json();
      if (cData.ok) setItems(cData.items); else setError(cData.error || 'خطا در بارگذاری.');
      if (uData.ok) setUsers(uData.users.filter((u) => u.role === 'student'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function issue(e) {
    e.preventDefault();
    setBusy(true); setError(''); setNotice('');
    try {
      const res = await fetch('/api/admin/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, percent }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'صدور ناموفق بود.'); return; }
      setNotice(`گواهی با کد ${data.item.serial} صادر شد.`);
      setUserId(''); setPercent('');
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function toggleRevoke(c) {
    const next = !c.revoked;
    if (next && !confirm(`گواهی ${c.serial} باطل شود؟ در استعلام عمومی «باطل» نشان داده می‌شود.`)) return;
    const res = await fetch(`/api/admin/certificates/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ revoked: next }),
    });
    const data = await res.json();
    if (!data.ok) { setError(data.error || 'تغییر وضعیت ناموفق بود.'); return; }
    setItems((prev) => prev.map((it) => (it.id === c.id ? { ...it, revoked: next } : it)));
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      {error && <div className="alert alert--error">{error}</div>}
      {notice && <div className="alert alert--success">{notice}</div>}

      <form className="stack-card" onSubmit={issue}>
        <h3 style={{ marginBottom: 6 }}>صدور دستی گواهی</h3>
        <p style={{ color: 'var(--muted)', lineHeight: 1.9, marginBottom: 14 }}>
          گواهی هنرجویانی که در آزمون سامانه قبول شوند خودکار صادر می‌شود. این فرم برای هنرجویان دوره‌های قبلی است.
          نام، جنسیت و دورهٔ ثبت‌شده در پروفایل هنرجو روی گواهی درج می‌شود.
        </p>
        <div className="form-group">
          <label className="form-label">هنرجو</label>
          <select className="form-input" required value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">انتخاب کنید…</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.displayName || u.username || u.phone} — {u.phone}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">نمره (اختیاری، از ۱۰۰)</label>
          <input className="form-input" dir="ltr" inputMode="numeric" value={percent} onChange={(e) => setPercent(e.target.value)} />
        </div>
        <button className="btn btn--dark" disabled={busy || !userId}>{busy ? 'در حال صدور…' : 'صدور گواهی'}</button>
      </form>

      <div className="stack-card">
        <h3 style={{ marginBottom: 14 }}>گواهی‌های صادرشده ({fa(items.length)})</h3>
        {loading ? <p style={{ color: 'var(--muted)' }}>در حال بارگذاری…</p> : items.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>هنوز گواهی‌ای صادر نشده است.</p>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {items.map((c) => (
              <div key={c.id} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14, opacity: c.revoked ? 0.6 : 1 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' }}>
                  <strong>{c.fullName}</strong>
                  <span dir="ltr" style={{ fontWeight: 700 }}>{c.serial}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, color: 'var(--muted)', marginTop: 6 }}>
                  {c.courseTitle && <span>دوره: {c.courseTitle}</span>}
                  {c.branch && <span>شعبه: {c.branch}</span>}
                  {Number.isInteger(c.percent) && <span>نمره: {fa(c.percent)}</span>}
                  <span>{dateFmt.format(new Date(c.issuedAt))}</span>
                  {c.revoked && <span style={{ color: '#dc2626', fontWeight: 700 }}>باطل‌شده</span>}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <a className="btn" href={`/api/certificate/${encodeURIComponent(c.serial)}`} target="_blank" rel="noopener noreferrer">مشاهدهٔ PDF</a>
                  <button className={`btn ${c.revoked ? '' : 'btn--danger'}`} onClick={() => toggleRevoke(c)}>
                    {c.revoked ? 'اعادهٔ اعتبار' : 'ابطال'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
