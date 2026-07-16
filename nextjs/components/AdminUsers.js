'use client';

import { useEffect, useState } from 'react';

const ROLE_LABEL = { member: 'هنرجو', editor: 'ادیتور', admin: 'ادمین' };
const dateFmt = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/users');
    const data = await res.json();
    if (data.ok) {
      setUsers(data.users);
      setCurrentUserId(data.currentUserId);
    } else {
      setError(data.error || 'خطا در بارگذاری.');
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function changeRole(id, role) {
    setSavingId(id);
    setError('');
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    const data = await res.json();
    setSavingId(null);
    if (!data.ok) { setError(data.error || 'خطا در ذخیره.'); return; }
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
  }

  if (loading) return <p style={{ color: 'var(--muted)' }}>در حال بارگذاری…</p>;

  return (
    <div>
      {error && <div className="alert alert--error" style={{ marginBottom: 14 }}>{error}</div>}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>موبایل</th>
              <th>نام</th>
              <th>شهر</th>
              <th>عضویت</th>
              <th>نقش</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td dir="ltr" style={{ textAlign: 'right' }}>{u.phone}</td>
                <td>{u.displayName || '—'}</td>
                <td>{u.city || '—'}</td>
                <td>{dateFmt.format(new Date(u.createdAt))}</td>
                <td>
                  {u.id === currentUserId ? (
                    <span className="role-tag">{ROLE_LABEL[u.role] || u.role} (شما)</span>
                  ) : (
                    <select
                      className="form-input role-select"
                      value={u.role}
                      disabled={savingId === u.id}
                      onChange={(e) => changeRole(u.id, e.target.value)}
                    >
                      <option value="member">هنرجو</option>
                      <option value="editor">ادیتور</option>
                      <option value="admin">ادمین</option>
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
