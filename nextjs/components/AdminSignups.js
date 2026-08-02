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
  const [openId, setOpenId] = useState('');

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
      body: JSON.stringify({ action: 'approve', username, password, graduated: !!c.graduated }),
    });
    const data = await res.json();
    setBusyId('');
    if (data.ok) load();
    else setError(data.error || 'تأیید انجام نشد.');
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

  async function remove(id) {
    if (!window.confirm('این درخواست برای همیشه حذف شود؟')) return;
    setBusyId(id); setError('');
    const res = await fetch(`/api/admin/signups/${id}`, { method: 'DELETE' });
    const data = await res.json();
    setBusyId('');
    if (data.ok) load();
    else setError(data.error || 'حذف انجام نشد.');
  }

  if (loading) return <p style={{ color: 'var(--muted)' }}>در حال بارگذاری…</p>;

  return (
    <div>
      {error && <div className="alert alert--error" style={{ marginBottom: 12 }}>{error}</div>}

      {requests.length === 0 && <p style={{ color: 'var(--muted)' }}>هنوز درخواستی ثبت نشده است.</p>}

      <div className="su-list">
        {requests.map((r) => {
          const open = openId === r.id;
          return (
            <div key={r.id} className={`su-item su-item--${r.status}`}>
              <button type="button" className="su-head" aria-expanded={open}
                onClick={() => setOpenId(open ? '' : r.id)}>
                <span className="su-head__name">{r.firstName} {r.lastName}</span>
                <span className={`su-tag su-tag--${r.status}`}>{ROLE_LABEL[r.role] || r.role} · {STATUS_LABEL[r.status] || r.status}</span>
                <svg className={`su-chev ${open ? 'is-open' : ''}`} width="16" height="16" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {open && (
                <div className="su-body">
                  <div style={{ color: 'var(--muted)', fontSize: '.88rem', lineHeight: 2 }}>
                    <div>نقش: {ROLE_LABEL[r.role] || r.role}</div>
                    {r.phone && <div>شماره تماس: <span dir="ltr">{r.phone}</span></div>}
                    {r.nationalId && <div>کد ملی: <span dir="ltr">{r.nationalId}</span></div>}
                    {r.branch && <div>شعبه ثبت‌نامی: {r.branch}</div>}
                    {r.birthDate && <div>تاریخ تولد: <span dir="ltr">{r.birthDate}</span></div>}
                    {r.goal && <div>هدف از انتخاب خانواده برداشت: {r.goal}</div>}
                    {r.createdAt && <div>تاریخ ثبت درخواست: <span dir="ltr">{new Date(r.createdAt).toLocaleString('fa-IR')}</span></div>}
                  </div>

                  {r.idCardImage && (
                    <div style={{ marginTop: 10 }}>
                      <p style={{ color: 'var(--muted)', fontSize: '.82rem', marginBottom: 6 }}>عکس شناسنامه یا کارت ملی (برای مشاهده کلیک کنید):</p>
                      <a href={r.idCardImage} target="_blank" rel="noopener noreferrer">
                        <img src={r.idCardImage} alt="عکس شناسنامه" style={{ maxWidth: '100%', maxHeight: 160, borderRadius: 10, border: '1px solid var(--border)' }} />
                      </a>
                    </div>
                  )}

                  {/* اطلاعاتِ ورودِ ساخته‌شده؛ ماندگار می‌ماند تا هر وقت لازم شد ببینید. */}
                  {r.status === 'approved' && (
                    <div className="su-creds">
                      <div className="su-creds__title">اطلاعات ورود این حساب</div>
                      <div>نام کاربری: <b dir="ltr">{r.username || '—'}</b></div>
                      <div>رمز عبور: <b dir="ltr">{r.password || '—'}</b></div>
                      <p className="su-creds__note">این اطلاعات همیشه همین‌جا می‌ماند؛ در صورت نیاز می‌توانید دوباره برای کاربر بفرستید.</p>
                    </div>
                  )}

                  {r.status === 'pending' && (
                    <div style={{ marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                      <p style={{ fontWeight: 700, marginBottom: 10 }}>ساخت نام کاربری و رمز عبور <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: '.85rem' }}>(پس از تأیید، این اطلاعات را برای کاربر ارسال کنید)</span></p>
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
                      {r.role === 'student' && (
                        <div className="form-group">
                          <label className="form-label">وضعیت تحصیلی</label>
                          <select className="form-input" value={(creds[r.id]?.graduated) ? 'graduated' : 'enrolled'}
                            onChange={(e) => setCred(r.id, 'graduated', e.target.value === 'graduated')}>
                            <option value="enrolled">در حال تحصیل (تقویم کلاس فعال باشد)</option>
                            <option value="graduated">فارغ‌التحصیل (بدون تقویم کلاس)</option>
                          </select>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                        <button className="btn btn--dark" disabled={busyId === r.id} onClick={() => approve(r.id)}>
                          {busyId === r.id ? 'در حال تأیید…' : 'تأیید و ساخت حساب'}
                        </button>
                        <button className="btn btn--ghost" disabled={busyId === r.id} onClick={() => reject(r.id)}>رد درخواست</button>
                      </div>
                    </div>
                  )}

                  {r.status !== 'pending' && (
                    <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                      <button type="button" className="btn btn--sm btn--danger" disabled={busyId === r.id}
                        onClick={() => remove(r.id)}>{busyId === r.id ? 'در حال حذف…' : 'حذف درخواست'}</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
