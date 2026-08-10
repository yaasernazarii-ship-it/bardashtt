'use client';

import { useEffect, useState } from 'react';

const ACTIONS = [
  { value: '', label: 'همهٔ رویدادها' },
  { value: 'content.update', label: 'ویرایش متن سایت' },
  { value: 'user.update', label: 'تغییر کاربر (نقش، فعال‌سازی، نام کاربری)' },
  { value: 'user.password', label: 'بازنشانی رمز عبور' },
];

const fmt = new Intl.DateTimeFormat('fa-IR', {
  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
});

export default function AdminAuditLog() {
  const [logs, setLogs] = useState([]);
  const [action, setAction] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`/api/admin/audit?take=200${action ? `&action=${encodeURIComponent(action)}` : ''}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (!d.ok) { setError(d.error || 'دریافت گزارش ناموفق بود.'); return; }
        setError(''); setLogs(d.logs);
      })
      .catch(() => { if (alive) setError('ارتباط با سرور برقرار نشد.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [action]);

  return (
    <div>
      <div className="form-group" style={{ maxWidth: 380 }}>
        <label className="form-label">فیلتر بر اساس نوع رویداد</label>
        <select className="form-input" value={action} onChange={(e) => setAction(e.target.value)}>
          {ACTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
        </select>
      </div>

      {error && <div className="alert alert--error">{error}</div>}
      {loading && <p style={{ color: 'var(--muted)' }}>در حال بارگذاری…</p>}

      {!loading && !error && logs.length === 0 && (
        <div className="alert">هنوز رویدادی ثبت نشده است. از این پس هر تغییر مدیریتی اینجا ثبت می‌شود.</div>
      )}

      {logs.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>زمان</th>
                <th>انجام‌دهنده</th>
                <th>رویداد</th>
                <th>توضیح</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{fmt.format(new Date(l.createdAt))}</td>
                  <td>
                    {l.actorName || '—'}
                    {l.actorRole && <span style={{ color: 'var(--muted)', fontSize: '.8rem' }}> ({l.actorRole})</span>}
                  </td>
                  <td>{ACTIONS.find((a) => a.value === l.action)?.label || l.action}</td>
                  <td style={{ lineHeight: 1.9 }}>
                    {l.summary || '—'}
                    {l.action === 'content.update' && l.targetId && (
                      <div style={{ color: 'var(--muted)', fontSize: '.78rem' }} dir="ltr">{l.targetId}</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
