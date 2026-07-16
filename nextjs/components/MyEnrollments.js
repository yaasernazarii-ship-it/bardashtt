'use client';

import { useEffect, useState } from 'react';

const dateFmt = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });

const STAGES = [
  { key: 'submitted', label: 'ثبت درخواست و ارسال ویدیو' },
  { key: 'review', label: 'در حال بررسی مدیر' },
  { key: 'approved', label: 'تأیید و فعال‌سازی حساب' },
];

function statusView(status) {
  if (status === 'approved') return { badge: 'تأییدشده', cls: 'badge-approved', reached: 3 };
  if (status === 'rejected') return { badge: 'ردشده', cls: 'badge-rejected', reached: 1 };
  return { badge: 'در انتظار بررسی', cls: 'badge-submitted', reached: 2 };
}

export default function MyEnrollments() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/enrollment/mine');
      const data = await res.json();
      if (data.ok) setRows(data.enrollments);
      setLoading(false);
    })();
  }, []);

  if (loading) return <p style={{ color: 'var(--muted)' }}>در حال بارگذاری…</p>;
  if (rows.length === 0) {
    return (
      <div className="enroll-empty">
        <p>هنوز در دوره‌ای ثبت‌نام نکرده‌اید.</p>
        <a className="btn btn--dark" href="/audition">شروع ثبت‌نام در دوره</a>
      </div>
    );
  }

  return (
    <div className="enroll-mine">
      {rows.map((r) => {
        const sv = statusView(r.status);
        return (
          <div key={r.id} className="enroll-mine-card">
            <div className="enroll-admin-head">
              <strong>دوره {r.courseTitle}</strong>
              <span className={`enroll-badge ${sv.cls}`}>{sv.badge}</span>
            </div>
            {r.actorType && <div className="enroll-mine-type">تیپ بازیگری شما: <b>{r.actorType}</b></div>}
            {r.aiAnalysis && <p className="enroll-admin-ai">{r.aiAnalysis}</p>}

            {r.status !== 'rejected' ? (
              <ol className="enroll-timeline">
                {STAGES.map((st, i) => (
                  <li key={st.key} className={i < sv.reached ? 'done' : undefined}>
                    <span className="enroll-timeline__dot">{i < sv.reached ? '✓' : i + 1}</span>
                    <span>{st.label}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="alert alert--error" style={{ marginTop: 12 }}>
                این درخواست تأیید نشد.{r.adminNote ? ` توضیح مدیر: ${r.adminNote}` : ''}
              </div>
            )}

            {r.status === 'approved' && (
              <p className="enroll-mine-ok">حساب کاربری شما فعال است. به‌زودی برنامه کلاس‌ها در بخش «تقویم کلاس» نمایش داده می‌شود.</p>
            )}
            <div className="enroll-mine-date">تاریخ ثبت: {dateFmt.format(new Date(r.createdAt))}</div>
          </div>
        );
      })}
    </div>
  );
}
