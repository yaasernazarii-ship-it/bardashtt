'use client';

import { useEffect, useMemo, useState } from 'react';
import Icon from './Icon';

const STATUS_LABEL = { submitted: 'در انتظار بررسی', approved: 'تأییدشده', rejected: 'ردشده' };

const DELETE_CONFIRM = 'این درخواست و همهٔ اطلاعات تست و ثبت‌نام آن برای همیشه حذف شود؟ این کار برگشت‌پذیر نیست.';

function requestDate(value) {
  return value ? new Date(value).toLocaleString('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
}

export default function AdminEnrollments() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [openId, setOpenId] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/enrollments');
    const data = await res.json();
    if (data.ok) setRows(data.enrollments);
    else setError(data.error || 'خطا در بارگذاری.');
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const counts = useMemo(() => ({
    all: rows.length,
    submitted: rows.filter((r) => r.status === 'submitted').length,
    approved: rows.filter((r) => r.status === 'approved').length,
    rejected: rows.filter((r) => r.status === 'rejected').length,
  }), [rows]);

  const courses = useMemo(() => [...new Set(rows.map((r) => r.courseTitle).filter(Boolean))], [rows]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('fa');
    return rows.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (courseFilter !== 'all' && r.courseTitle !== courseFilter) return false;
      if (!needle) return true;
      return [r.fullName, r.phone, r.nationalId, r.courseTitle, r.actorType, r.aiAnalysis]
        .filter(Boolean).join(' ').toLocaleLowerCase('fa').includes(needle);
    });
  }, [rows, query, statusFilter, courseFilter]);

  async function act(id, action) {
    if (action === 'delete' && !window.confirm(DELETE_CONFIRM)) return;
    setBusyId(id); setError('');
    const res = await fetch(`/api/admin/enrollments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    setBusyId(null);
    if (!data.ok) { setError(data.error || 'خطا در ثبت.'); return; }
    if (data.status === 'deleted') {
      setRows((previous) => previous.filter((r) => r.id !== id));
      return;
    }
    setRows((previous) => previous.map((r) => (r.id === id ? { ...r, status: data.status } : r)));
  }

  if (loading) return <div className="su-loading">در حال بارگذاری ثبت‌نام‌ها…</div>;

  return (
    <div className="su-panel enrollment-review">
      {error && <div className="alert alert--error su-error">{error}</div>}

      <div className="su-stats">
        {[
          ['all', 'همه ثبت‌نام‌ها'],
          ['submitted', 'در انتظار بررسی'],
          ['approved', 'تأییدشده'],
          ['rejected', 'ردشده'],
        ].map(([key, label]) => (
          <button key={key} type="button"
            className={`su-stat su-stat--${key === 'submitted' ? 'pending' : key} ${statusFilter === key ? 'is-active' : ''}`}
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
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="جست‌وجوی نام، موبایل، کد ملی، دوره یا تیپ…" />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="پاک کردن جست‌وجو">×</button>}
        </label>
        <select className="su-filter" value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} aria-label="فیلتر دوره">
          <option value="all">همه دوره‌ها</option>
          {courses.map((course) => <option key={course} value={course}>{course}</option>)}
        </select>
        <select className="su-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="فیلتر وضعیت">
          <option value="all">همه وضعیت‌ها</option>
          <option value="submitted">در انتظار بررسی</option>
          <option value="approved">تأییدشده</option>
          <option value="rejected">ردشده</option>
        </select>
        <span className="su-result-count">نمایش {filtered.length.toLocaleString('fa-IR')} مورد</span>
      </div>

      {rows.length === 0 ? (
        <div className="su-empty">هنوز درخواست ثبت‌نامی ثبت نشده است.</div>
      ) : filtered.length === 0 ? (
        <div className="su-empty">ثبت‌نامی مطابق جست‌وجو و فیلترهای انتخاب‌شده پیدا نشد.</div>
      ) : (
        <div className="su-table enrollment-review__table">
          <div className="su-table__head" aria-hidden="true">
            <span>ردیف</span><span>نام متقاضی</span><span>دوره</span><span>تیپ بازیگری</span><span>شماره تماس</span><span>تاریخ ثبت</span><span>وضعیت</span><span />
          </div>
          <div className="su-list">
            {filtered.map((r, index) => {
              const open = openId === r.id;
              return (
                <div key={r.id} className={`su-item su-item--${r.status} ${open ? 'is-open' : ''}`}>
                  <button type="button" className="su-row" aria-expanded={open} onClick={() => setOpenId(open ? '' : r.id)}>
                    <span className="su-row__index">{(index + 1).toLocaleString('fa-IR')}</span>
                    <span className="su-person">
                      <span className="su-avatar">{(r.fullName || '?').slice(0, 1)}</span>
                      <span><strong>{r.fullName}</strong><small>{r.nationalId ? `کد ملی: ${r.nationalId}` : 'بدون کد ملی'}</small></span>
                    </span>
                    <span className="su-row__course">{r.courseTitle || '—'}</span>
                    <span className="su-row__actor">{r.actorType || 'تعیین نشده'}</span>
                    <span className="su-row__phone" dir="ltr">{r.phone || '—'}</span>
                    <span className="su-row__date">{requestDate(r.createdAt)}</span>
                    <span><span className={`su-tag su-tag--${r.status === 'submitted' ? 'pending' : r.status}`}>{STATUS_LABEL[r.status] || r.status}</span></span>
                    <svg className={`su-chev ${open ? 'is-open' : ''}`} width="17" height="17" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {open && (
                    <div className="su-body">
                      <div className="su-detail-grid">
                        <div><span>نام و نام خانوادگی</span><strong>{r.fullName}</strong></div>
                        <div><span>شماره تماس</span><a href={r.phone ? `tel:${r.phone}` : undefined} dir="ltr">{r.phone || 'ثبت نشده'}</a></div>
                        <div><span>کد ملی</span><strong dir="ltr">{r.nationalId || 'ثبت نشده'}</strong></div>
                        <div><span>دوره انتخابی</span><strong>{r.courseTitle || 'ثبت نشده'}</strong></div>
                        <div><span>تیپ بازیگری</span><strong>{r.actorType || 'تعیین نشده'}</strong></div>
                        <div><span>تاریخ ثبت درخواست</span><strong>{requestDate(r.createdAt)}</strong></div>
                        <div><span>وضعیت درخواست</span><strong>{STATUS_LABEL[r.status] || r.status}</strong></div>
                        <div><span>ویدیوی معرفی</span><strong>{r.videoUrl ? 'ارسال شده' : 'ارسال نشده'}</strong></div>
                      </div>

                      <div className="su-note enrollment-review__analysis">
                        <span>خلاصهٔ تحلیل تست</span>
                        <p>{r.aiAnalysis || 'تحلیلی برای این تست ثبت نشده است.'}</p>
                        <small>پاسخ‌های کامل تست در گزارش PDF ارسال‌شده به بله موجود است.</small>
                      </div>
                      {r.adminNote && <div className="su-note"><span>یادداشت مدیریت</span><p>{r.adminNote}</p></div>}

                      {r.videoUrl && (
                        <a className="enrollment-review__video" href={r.videoUrl} target="_blank" rel="noopener noreferrer">
                          <span className="enrollment-review__video-icon"><Icon name="clapperboard" size={21} /></span>
                          <span><strong>مشاهدهٔ فرم و ویدیوهای ارسالی</strong><small>کد ملی فرم را با اطلاعات این درخواست مطابقت دهید.</small></span>
                          <span className="enrollment-review__video-open">باز کردن</span>
                        </a>
                      )}

                      {r.status === 'submitted' && (
                        <div className="su-approval enrollment-review__approval">
                          <div className="su-section-title"><strong>تصمیم نهایی درخواست</strong><span>«رد» اطلاعات را نگه می‌دارد؛ «حذف کامل» پس از ارسال PDF به بله، اطلاعات را پاک می‌کند.</span></div>
                          <div className="su-actions enrollment-review__actions">
                            <button type="button" className="btn btn--sm btn--dark" disabled={busyId === r.id} onClick={() => act(r.id, 'approve')}>
                              {busyId === r.id ? 'در حال ثبت…' : 'تأیید و ساخت حساب'}
                            </button>
                            <button type="button" className="btn btn--sm btn--outline" disabled={busyId === r.id} onClick={() => act(r.id, 'reject')}>
                              رد
                            </button>
                            <button type="button" className="btn btn--sm enrollment-review__delete" disabled={busyId === r.id} onClick={() => act(r.id, 'delete')}>
                              حذف کامل اطلاعات
                            </button>
                          </div>
                        </div>
                      )}

                      {r.status === 'rejected' && (
                        <div className="su-approval enrollment-review__approval">
                          <div className="su-section-title"><strong>درخواست ردشده</strong><span>اطلاعات نگه داشته شده است؛ در صورت نیاز می‌توانید آن را کامل حذف کنید.</span></div>
                          <div className="su-actions enrollment-review__actions">
                            <button type="button" className="btn btn--sm enrollment-review__delete" disabled={busyId === r.id} onClick={() => act(r.id, 'delete')}>
                              {busyId === r.id ? 'در حال حذف…' : 'حذف کامل اطلاعات'}
                            </button>
                          </div>
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
