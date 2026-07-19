'use client';

import { useEffect, useState } from 'react';

const ROLE_LABEL = { student: 'هنرجو', filmmaker: 'فیلمساز' };
const STATUS_LABEL = { pending: 'در انتظار', approved: 'تأییدشده', rejected: 'ردشده' };

function randomPassword(len = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export default function AdminSignups() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creds, setCreds] = useState({}); // id -> {username, password}
  const [busyId, setBusyId] = useState('');
  const [result, setResult] = useState(null); // {id, username, password}

  async function load() {
    const res = await fetch('/api/admin/signups');
    const data = await res.json();
    if (data.ok) setRequests(data.requests);
    else setError(data.error || 'خطا در بارگذاری.');
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function setCred(id, k, v) {
    setCreds((p) => ({ ...p, [id]: { ...(p[id] || {}), [k]: v } }));
  }

  async function approve(id) {
    const c = creds[id] || {};
    const username = (c.username || '').trim();
    const password = c.password || '';
    if (!username || !password) { setError('نام کاربری و رمز را وارد کنید.'); return; }
    setBusyId(id); setError('');
    const res = await fetch(`/api/admin/signups/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve', username, password }),
    });
    const data = await res.json();
    setBusyId('');
    if (data.ok) {
      setResult({ id, username, password });
      load();
    } else {
      setError(data.error || 'تأیید انجام نشد.');
    }
  }

  async function reject(id) {
    setBusyId(id); setError('');
    const res = await fetch(`/api/admin/signups/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject' }),
    });
    const data = await res.json();
    setBusyId('');
    if (data.ok) load();
    else setError(data.error || 'عملیات انجام نشد.');
  }

  if (loading) return <p style={{ color: 'var(--muted)' }}>در حال بارگذاری…</p>;

  return (
    <div>
      {error && <div className="alert alert--error" style={{ marginBottom: 12 }}>{error}</div>}
      {result && (
        <div className="alert alert--success" style={{ marginBottom: 16, lineHeight: 2 }}>
          حساب هنرجو ساخته شد. این اطلاعات را برای او ارسال کنید:<br />
          نام کاربری: <b dir="ltr">{result.username}</b> — رمز عبور: <b dir="ltr">{result.password}</b>
        </div>
      )}

      {requests.length === 0 && <p style={{ color: 'var(--muted)' }}>هنوز درخواستی ثبت نشده است.</p>}

      <div style={{ display: 'grid', gap: 14 }}>
        {requests.map((r) => (
          <div key={r.id} className="form-shell" style={{ margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              <strong style={{ fontSize: '1.05rem' }}>{r.firstName} {r.lastName}</strong>
              <span className={`tag ${r.status === 'approved' ? 'tag--gold' : 'tag--dark'}`}>
                {ROLE_LABEL[r.role] || r.role} · {STATUS_LABEL[r.status] || r.status}
              </span>
            </div>
            <div style={{ color: 'var(--muted)', fontSize: '.9rem', lineHeight: 2 }}>
              <div>شماره تماس: <span dir="ltr">{r.phone}</span></div>
              {r.nationalId && <div>کد ملی: <span dir="ltr">{r.nationalId}</span></div>}
              {r.branch && <div>شعبه: {r.branch}</div>}
              {r.username && <div>نام کاربری: <b dir="ltr">{r.username}</b></div>}
            </div>

            {r.status === 'pending' && (
              <div style={{ marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                <div className="form-group">
                  <label className="form-label">نام کاربری</label>
                  <input className="form-input" dir="ltr" placeholder="مثلاً ali1234"
                    value={(creds[r.id]?.username) || ''} onChange={(e) => setCred(r.id, 'username', e.target.value.replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase())} />
                </div>
                <div className="form-group">
                  <label className="form-label">رمز عبور</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input className="form-input" dir="ltr" value={(creds[r.id]?.password) || ''} onChange={(e) => setCred(r.id, 'password', e.target.value)} />
                    <button type="button" className="btn btn--outline" onClick={() => setCred(r.id, 'password', randomPassword())}>ساخت رمز</button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                  <button className="btn btn--dark" disabled={busyId === r.id} onClick={() => approve(r.id)}>
                    {busyId === r.id ? 'در حال تأیید…' : 'تأیید و ساخت حساب'}
                  </button>
                  <button className="btn btn--ghost" disabled={busyId === r.id} onClick={() => reject(r.id)}>رد درخواست</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
