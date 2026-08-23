'use client';

import { useEffect, useMemo, useState } from 'react';

const ACTIONS = [
  { value: '', label: 'همهٔ رویدادها' },
  { value: 'content.update', label: 'ویرایش متن‌های سایت' },
  { value: 'user.update', label: 'تغییر اطلاعات کاربر' },
  { value: 'user.password', label: 'بازنشانی رمز عبور' },
  { value: 'user.delete', label: 'حذف کامل حساب کاربر' },
  { value: 'chat-group.create', label: 'ساخت گروه گفت‌وگو' },
  { value: 'chat-group.update', label: 'ویرایش گروه گفت‌وگو' },
  { value: 'chat-group.delete', label: 'حذف گروه گفت‌وگو' },
  { value: 'chat-group.members.add', label: 'افزودن اعضای گروه' },
  { value: 'chat-group.members.remove', label: 'حذف عضو گروه' },
  { value: 'chat-group.message.delete', label: 'حذف پیام گروه' },
  { value: 'liveSession.start', label: 'شروع کلاس آنلاین' },
  { value: 'liveSession.finish', label: 'پایان کلاس آنلاین' },
  { value: 'liveSession.reopen', label: 'بازگشایی کلاس آنلاین' },
  { value: 'exam.permit.grant', label: 'صدور مجوز آزمون' },
  { value: 'exam.permit.score', label: 'تغییر نمرهٔ کلاسی' },
  { value: 'exam.permit.revoke', label: 'لغو مجوز آزمون' },
  { value: 'staffReport.create', label: 'ثبت گزارش کار' },
  { value: 'staffReport.update', label: 'ویرایش گزارش کار' },
  { value: 'staffReport.delete', label: 'حذف گزارش کار' },
  { value: 'social.member', label: 'تغییر حساب برداشتگرام' },
  { value: 'social.member.delete', label: 'حذف حساب برداشتگرام' },
  { value: 'social.delete', label: 'حذف محتوای برداشتگرام' },
  { value: 'social.comment.delete', label: 'حذف دیدگاه برداشتگرام' },
  { value: 'social.report.close', label: 'بستن گزارش تخلف' },
];

const ACTION_LABELS = Object.fromEntries(ACTIONS.map((item) => [item.value, item.label]));
const ROLE_LABELS = { admin: 'مدیر اصلی', editor: 'همکار مدیریت' };
const dateFmt = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' });

export default function AdminAuditLog() {
  const [logs, setLogs] = useState([]);
  const [action, setAction] = useState('');
  const [query, setQuery] = useState('');
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

  const visibleLogs = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return logs;
    return logs.filter((log) => [
      log.actorName,
      ROLE_LABELS[log.actorRole],
      ACTION_LABELS[log.action],
      log.summary,
    ].some((value) => (value || '').toLowerCase().includes(needle)));
  }, [logs, query]);

  return (
    <div className="admin-audit">
      <div className="admin-audit__toolbar">
        <label className="admin-search">
          <span aria-hidden="true">⌕</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="جست‌وجوی نام، رویداد یا توضیحات…" />
        </label>
        <select className="form-input admin-audit__filter" aria-label="فیلتر نوع رویداد" value={action} onChange={(e) => setAction(e.target.value)}>
          {ACTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <span className="admin-audit__count">{visibleLogs.length.toLocaleString('fa-IR')} رویداد</span>
      </div>

      {error && <div className="alert alert--error">{error}</div>}
      {loading && <div className="admin-audit__empty">در حال بارگذاری گزارش…</div>}

      {!loading && !error && visibleLogs.length === 0 && (
        <div className="admin-audit__empty">رویدادی مطابق فیلتر یا جست‌وجوی شما پیدا نشد.</div>
      )}

      {!loading && !error && visibleLogs.length > 0 && (
        <div className="admin-audit__table">
          <div className="admin-audit__head" aria-hidden="true">
            <span>زمان</span><span>انجام‌دهنده</span><span>نوع رویداد</span><span>شرح تغییر</span>
          </div>
          <div className="admin-audit__rows">
            {visibleLogs.map((log) => {
              const createdAt = new Date(log.createdAt);
              return (
                <article className="admin-audit__row" key={log.id}>
                  <div className="admin-audit__time" data-label="زمان">
                    <strong>{dateFmt.format(createdAt)}</strong>
                    <span>ساعت {timeFmt.format(createdAt)}</span>
                  </div>
                  <div className="admin-audit__actor" data-label="انجام‌دهنده">
                    <strong>{log.actorName || 'نامشخص'}</strong>
                    <span>{ROLE_LABELS[log.actorRole] || 'مدیریت'}</span>
                  </div>
                  <div className="admin-audit__action" data-label="نوع رویداد">
                    <span>{ACTION_LABELS[log.action] || 'رویداد مدیریتی'}</span>
                  </div>
                  <div className="admin-audit__summary" data-label="شرح تغییر">
                    <p>{log.summary || 'توضیحی ثبت نشده است.'}</p>
                    {log.action === 'content.update' && log.targetId && <small>{log.targetId}</small>}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
