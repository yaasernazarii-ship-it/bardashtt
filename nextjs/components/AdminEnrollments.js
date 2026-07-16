'use client';

import { useEffect, useState } from 'react';

const STATUS_LABEL = { submitted: 'در انتظار بررسی', approved: 'تأییدشده', rejected: 'ردشده' };
const dateFmt = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });

export default function AdminEnrollments() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/enrollments');
    const data = await res.json();
    if (data.ok) setRows(data.enrollments); else setError(data.error || 'خطا در بارگذاری.');
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function act(id, action) {
    if (action === 'reject' && !confirm('این درخواست رد شود؟')) return;
    setBusyId(id); setError('');
    const res = await fetch(`/api/admin/enrollments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    setBusyId(null);
    if (!data.ok) { setError(data.error || 'خطا در ثبت.'); return; }
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: data.status } : r)));
  }

  if (loading) return <p style={{ color: 'var(--muted)' }}>در حال بارگذاری…</p>;
  if (rows.length === 0) return <p style={{ color: 'var(--muted)' }}>هنوز درخواست ثبت‌نامی ثبت نشده است.</p>;

  return (
    <div>
      {error && <div className="alert alert--error" style={{ marginBottom: 14 }}>{error}</div>}
      <div className="enroll-admin-list">
        {rows.map((r) => (
          <div key={r.id} className={`enroll-admin-item status-${r.status}`}>
            <div className="enroll-admin-head">
              <div>
                <strong>{r.fullName}</strong>
                <span dir="ltr" className="enroll-admin-phone">{r.phone}</span>
              </div>
              <span className={`enroll-badge badge-${r.status}`}>{STATUS_LABEL[r.status] || r.status}</span>
            </div>
            <div className="enroll-admin-meta">
              <span>دوره: <b>{r.courseTitle}</b></span>
              {r.actorType && <span>تیپ: <b>{r.actorType}</b></span>}
              <span>{dateFmt.format(new Date(r.createdAt))}</span>
            </div>
            {r.aiAnalysis && <p className="enroll-admin-ai">{r.aiAnalysis}</p>}
            {r.videoRef && <div className="enroll-admin-ref">کد پیگیری فرم: <b dir="ltr">{r.videoRef}</b></div>}
            {r.videoUrl && <a className="enroll-admin-video" href={r.videoUrl} target="_blank" rel="noopener noreferrer">🎬 باز کردن فرم ویدیوها (با کد پیگیری بالا مطابقت دهید)</a>}
            {r.status === 'submitted' && (
              <div className="enroll-actions" style={{ marginTop: 12 }}>
                <button className="btn btn--dark" disabled={busyId === r.id} onClick={() => act(r.id, 'approve')}>تأیید و ساخت حساب</button>
                <button className="btn btn--danger" disabled={busyId === r.id} onClick={() => act(r.id, 'reject')}>رد</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
