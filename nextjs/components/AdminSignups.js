'use client';

import { useEffect, useMemo, useState } from 'react';

const ROLE_LABEL = { student: 'هنرجو', filmmaker: 'فیلمساز' };
const STATUS_LABEL = { pending: 'در انتظار بررسی', approved: 'تأییدشده', rejected: 'ردشده' };

function randomPassword(len = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function requestDate(value) {
  return value ? new Date(value).toLocaleString('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
}

export default function AdminSignups() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creds, setCreds] = useState({});
  const [busyId, setBusyId] = useState('');
  const [openId, setOpenId] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  async function load() {
    const res = await fetch('/api/admin/signups');
    const data = await res.json();
    if (data.ok) setRequests(data.requests);
    else setError(data.error || 'خطا در بارگذاری.');
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const counts = useMemo(() => ({
    all: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
  }), [requests]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('fa');
    return requests.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (roleFilter !== 'all' && r.role !== roleFilter) return false;
      if (!needle) return true;
      return [r.firstName, r.lastName, r.phone, r.nationalId, r.branch, r.birthDate, r.goal]
        .filter(Boolean).join(' ').toLocaleLowerCase('fa').includes(needle);
    });
  }, [requests, query, statusFilter, roleFilter]);

  function setCred(id, key, value) {
    setCreds((previous) => ({ ...previous, [id]: { ...(previous[id] || {}), [key]: value } }));
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
    if (!window.confirm('این ثبت‌نام رد و برای همیشه از فهرست و سرور حذف شود؟')) return;
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

  if (loading) return <div className="su-loading">در حال بارگذاری درخواست‌ها…</div>;

  return (
    <div className="su-panel">
      {error && <div className="alert alert--error su-error">{error}</div>}

      <div className="su-stats">
        {[
          ['all', 'همه ثبت‌نام‌ها'],
          ['pending', 'در انتظار بررسی'],
          ['approved', 'تأییدشده'],
          ['rejected', 'ردشده'],
        ].map(([key, label]) => (
          <button key={key} type="button" className={`su-stat su-stat--${key} ${statusFilter === key ? 'is-active' : ''}`}
            onClick={() => setStatusFilter(key)}>
            <span className="su-stat__number">{counts[key].toLocaleString('fa-IR')}</span>
            <span className="su-stat__label">{label}</span>
          </button>
        ))}
      </div>

      <div className="su-toolbar">
        <label className="su-search">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="جست‌وجوی نام، موبایل، کد ملی یا شعبه…" />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="پاک کردن جست‌وجو">×</button>}
        </label>
        <select className="su-filter" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} aria-label="فیلتر نقش">
          <option value="all">همه نقش‌ها</option>
          <option value="student">هنرجو</option>
          <option value="filmmaker">فیلمساز</option>
        </select>
        <select className="su-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="فیلتر وضعیت">
          <option value="all">همه وضعیت‌ها</option>
          <option value="pending">در انتظار بررسی</option>
          <option value="approved">تأییدشده</option>
          <option value="rejected">ردشده</option>
        </select>
        <span className="su-result-count">نمایش {filtered.length.toLocaleString('fa-IR')} مورد</span>
      </div>

      {requests.length === 0 ? (
        <div className="su-empty">هنوز درخواستی ثبت نشده است.</div>
      ) : filtered.length === 0 ? (
        <div className="su-empty">درخواستی مطابق جست‌وجو و فیلترهای انتخاب‌شده پیدا نشد.</div>
      ) : (
        <div className="su-table">
          <div className="su-table__head" aria-hidden="true">
            <span>ردیف</span><span>نام و نام خانوادگی</span><span>نقش</span><span>شعبه</span><span>شماره تماس</span><span>تاریخ ثبت</span><span>وضعیت</span><span />
          </div>
          <div className="su-list">
            {filtered.map((r, index) => {
              const open = openId === r.id;
              return (
                <div key={r.id} className={`su-item su-item--${r.status} ${open ? 'is-open' : ''}`}>
                  <button type="button" className="su-row" aria-expanded={open} onClick={() => setOpenId(open ? '' : r.id)}>
                    <span className="su-row__index">{(index + 1).toLocaleString('fa-IR')}</span>
                    <span className="su-person">
                      <span className="su-avatar">{(r.firstName || '?').slice(0, 1)}</span>
                      <span><strong>{r.firstName} {r.lastName}</strong><small>{r.nationalId ? `کد ملی: ${r.nationalId}` : 'بدون کد ملی'}</small></span>
                    </span>
                    <span className="su-row__role">{ROLE_LABEL[r.role] || r.role}</span>
                    <span className="su-row__branch">{r.branch || '—'}</span>
                    <span className="su-row__phone" dir="ltr">{r.phone || '—'}</span>
                    <span className="su-row__date">{requestDate(r.createdAt)}</span>
                    <span><span className={`su-tag su-tag--${r.status}`}>{STATUS_LABEL[r.status] || r.status}</span></span>
                    <svg className={`su-chev ${open ? 'is-open' : ''}`} width="17" height="17" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {open && (
                    <div className="su-body">
                      <div className="su-detail-grid">
                        <div><span>نام و نام خانوادگی</span><strong>{r.firstName} {r.lastName}</strong></div>
                        <div><span>نقش در سامانه</span><strong>{ROLE_LABEL[r.role] || r.role}</strong></div>
                        <div><span>شماره تماس</span><a href={r.phone ? `tel:${r.phone}` : undefined} dir="ltr">{r.phone || 'ثبت نشده'}</a></div>
                        <div><span>کد ملی</span><strong dir="ltr">{r.nationalId || 'ثبت نشده'}</strong></div>
                        <div><span>شعبه ثبت‌نامی</span><strong>{r.branch || 'ثبت نشده'}</strong></div>
                        <div><span>تاریخ تولد</span><strong dir="ltr">{r.birthDate || 'ثبت نشده'}</strong></div>
                        <div><span>تاریخ ثبت درخواست</span><strong>{requestDate(r.createdAt)}</strong></div>
                        <div><span>وضعیت درخواست</span><strong>{STATUS_LABEL[r.status] || r.status}</strong></div>
                      </div>

                      {r.goal && <div className="su-note"><span>هدف از انتخاب خانواده برداشت</span><p>{r.goal}</p></div>}
                      {r.adminNote && <div className="su-note"><span>یادداشت مدیریت</span><p>{r.adminNote}</p></div>}

                      {r.idCardImage && (
                        <div className="su-document">
                          <div><strong>مدرک شناسایی</strong><span>برای مشاهده در اندازهٔ اصلی روی تصویر کلیک کنید.</span></div>
                          <a href={r.idCardImage} target="_blank" rel="noopener noreferrer">
                            <img src={r.idCardImage} alt={`مدرک شناسایی ${r.firstName} ${r.lastName}`} />
                          </a>
                        </div>
                      )}

                      {r.status === 'approved' && (
                        <div className="su-creds">
                          <div className="su-creds__title">اطلاعات ورود این حساب</div>
                          <div className="su-creds__fields">
                            <span>نام کاربری <b dir="ltr">{r.username || '—'}</b></span>
                            <span>رمز عبور <b dir="ltr">{r.password || '—'}</b></span>
                          </div>
                          <p className="su-creds__note">این اطلاعات برای ارسال دوباره به کاربر در همین بخش باقی می‌ماند.</p>
                        </div>
                      )}

                      {r.status === 'pending' && (
                        <div className="su-approval">
                          <div className="su-section-title"><strong>تأیید و ساخت حساب کاربری</strong><span>اطلاعات ورود را بسازید و پس از تأیید برای متقاضی ارسال کنید.</span></div>
                          <div className="su-approval__fields">
                            <div className="form-group">
                              <label className="form-label">نام کاربری</label>
                              <input className="form-input" dir="ltr" placeholder="مثلاً ali1234" value={creds[r.id]?.username || ''}
                                onChange={(e) => setCred(r.id, 'username', e.target.value.replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase())} />
                            </div>
                            <div className="form-group">
                              <label className="form-label">رمز عبور</label>
                              <div className="su-password-field">
                                <input className="form-input" dir="ltr" value={creds[r.id]?.password || ''}
                                  onChange={(e) => setCred(r.id, 'password', e.target.value)} />
                                <button type="button" className="btn btn--outline" onClick={() => setCred(r.id, 'password', randomPassword())}>ساخت رمز</button>
                              </div>
                            </div>
                            {r.role === 'student' && (
                              <div className="form-group">
                                <label className="form-label">وضعیت تحصیلی</label>
                                <select className="form-input" value={creds[r.id]?.graduated ? 'graduated' : 'enrolled'}
                                  onChange={(e) => setCred(r.id, 'graduated', e.target.value === 'graduated')}>
                                  <option value="enrolled">در حال تحصیل</option>
                                  <option value="graduated">فارغ‌التحصیل</option>
                                </select>
                              </div>
                            )}
                          </div>
                          <div className="su-actions">
                            <button className="btn btn--dark" disabled={busyId === r.id} onClick={() => approve(r.id)}>
                              {busyId === r.id ? 'در حال تأیید…' : 'تأیید و ساخت حساب'}
                            </button>
                            <button className="btn btn--ghost" disabled={busyId === r.id} onClick={() => reject(r.id)}>رد درخواست</button>
                          </div>
                        </div>
                      )}

                      {r.status !== 'pending' && (
                        <div className="su-delete-row">
                          <button type="button" className="btn btn--sm btn--danger" disabled={busyId === r.id} onClick={() => remove(r.id)}>
                            {busyId === r.id ? 'در حال حذف…' : 'حذف درخواست'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
