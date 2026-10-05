'use client';

import { useEffect, useState } from 'react';

function faDate(value) {
  return value ? new Date(value).toLocaleString('fa-IR') : '—';
}

export default function AdminAccountSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    const response = await fetch('/api/admin/account-sessions', { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) setError(data.error || 'دریافت نشست‌ها ناموفق بود.');
    else setSessions(data.sessions || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function revoke(session) {
    const name = session.user.displayName || session.user.username || session.user.phone;
    if (!window.confirm(`نشست فعال «${name}» باطل شود؟`)) return;
    setBusy(session.id);
    setError('');
    const response = await fetch(`/api/admin/account-sessions/${encodeURIComponent(session.id)}`, { method: 'DELETE' });
    const data = await response.json();
    if (!response.ok) setError(data.error || 'ابطال نشست ناموفق بود.');
    else setSessions((items) => items.filter((item) => item.id !== session.id));
    setBusy('');
  }

  if (loading) return <div className="card">در حال دریافت نشست‌ها…</div>;

  return (
    <div className="card">
      {error && <p className="form-error">{error}</p>}
      {sessions.length === 0 ? <p>نشست فعالی وجود ندارد.</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead><tr><th>کاربر</th><th>نقش</th><th>آخرین فعالیت</th><th>انقضا</th><th>دستگاه / IP</th><th>عملیات</th></tr></thead>
            <tbody>{sessions.map((session) => (
              <tr key={session.id}>
                <td>{session.user.displayName || session.user.username || session.user.phone}</td>
                <td>{session.user.role}</td>
                <td>{faDate(session.lastSeenAt)}</td>
                <td>{faDate(session.expiresAt)}</td>
                <td dir="ltr" style={{ maxWidth: 300, overflowWrap: 'anywhere' }}>{session.userAgent || 'نامشخص'}<br />{session.ipAddress || 'IP نامشخص'}</td>
                <td><button className="btn btn--danger btn--sm" disabled={busy === session.id} onClick={() => revoke(session)}>ابطال نشست</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
