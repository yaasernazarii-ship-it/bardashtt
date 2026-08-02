'use client';

import { useEffect, useMemo, useState } from 'react';
import { COURSE_PATH, nextCourseAfterTitle } from '@/lib/courses';

const dateFmt = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
const money = (n) => Number(n || 0).toLocaleString('fa-IR');

const STATUS = {
  pending: { label: 'در انتظار پرداخت' },
  paid: { label: 'پرداخت‌شده' },
  canceled: { label: 'لغوشده' },
};

function StatusBadge({ status }) {
  const st = STATUS[status] || STATUS.pending;
  return (
    <span className={`pay-badge pay-badge--${status}`}>
      <span className="pay-badge__dot" aria-hidden="true" />
      {st.label}
    </span>
  );
}

const emptyForm = { userIds: [], courseKey: '', title: '', amount: '', promote: false };

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [studentQuery, setStudentQuery] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [filter, setFilter] = useState('all');

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/payments');
    const d = await res.json();
    if (d.ok) { setPayments(d.payments); setStudents(d.students); }
    else setError(d.error || 'خطا در بارگذاری.');
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  // وقتی فقط یک هنرجو انتخاب شده، دورهٔ بعدیِ پیشنهادی را نشان بده.
  const soleStudent = useMemo(
    () => (form.userIds.length === 1 ? students.find((s) => s.id === form.userIds[0]) || null : null),
    [students, form.userIds]
  );
  const suggestedNext = useMemo(
    () => (soleStudent ? nextCourseAfterTitle(soleStudent.courseTitle) : null),
    [soleStudent]
  );

  const filteredStudents = useMemo(() => {
    const q = studentQuery.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => [s.displayName, s.username, s.phone].some((v) => (v || '').toLowerCase().includes(q)));
  }, [students, studentQuery]);

  function toggleStudent(id) {
    setForm((f) => ({
      ...f,
      userIds: f.userIds.includes(id) ? f.userIds.filter((x) => x !== id) : [...f.userIds, id],
    }));
  }

  // انتخاب/لغوِ همهٔ هنرجویانِ نتیجهٔ جستجوی فعلی.
  const allFilteredSelected = filteredStudents.length > 0 && filteredStudents.every((s) => form.userIds.includes(s.id));
  function toggleAllFiltered() {
    const ids = filteredStudents.map((s) => s.id);
    setForm((f) => ({
      ...f,
      userIds: allFilteredSelected
        ? f.userIds.filter((x) => !ids.includes(x))
        : [...new Set([...f.userIds, ...ids])],
    }));
  }

  function pickCourse(key) {
    const course = COURSE_PATH.find((c) => c.key === key);
    // اگر بابت هنوز خالی است، برای راحتی با نام دوره پیش‌پُر می‌کنیم (قابل ویرایش).
    setForm((f) => ({
      ...f,
      courseKey: key,
      title: f.title || (course ? `شهریهٔ دورهٔ ${course.title}` : ''),
      promote: key ? f.promote : false,
    }));
  }

  async function submit(e) {
    e.preventDefault();
    setError(''); setMsg('');
    if (form.userIds.length === 0) { setError('حداقل یک هنرجو را انتخاب کنید.'); return; }
    if (!form.title.trim()) { setError('بابتِ پرداخت (دلیل) را بنویسید.'); return; }
    setSaving(true);
    const res = await fetch('/api/admin/payments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    const d = await res.json();
    setSaving(false);
    if (!d.ok) { setError(d.error || 'خطا.'); return; }
    setMsg(`پرداخت برای ${money(d.count || form.userIds.length)} هنرجو ثبت شد و در پنلشان نمایش داده می‌شود ✅`);
    setForm(emptyForm); setStudentQuery('');
    load();
  }

  async function act(id, action) {
    setMsg(''); setError('');
    const res = await fetch(`/api/admin/payments/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }),
    });
    const d = await res.json();
    if (!d.ok) { setError(d.error || 'خطا.'); return; }
    if (action === 'markPaid') setMsg('پرداخت «پرداخت‌شده» ثبت شد و گزارش آنی به بله ارسال شد ✅');
    load();
  }

  async function remove(id) {
    if (!window.confirm('این پرداخت حذف شود؟')) return;
    const res = await fetch(`/api/admin/payments/${id}`, { method: 'DELETE' });
    const d = await res.json();
    if (d.ok) load(); else setError(d.error || 'خطا.');
  }

  async function copyLink(id) {
    const url = `${window.location.origin}/dashboard/pay/${id}`;
    try { await navigator.clipboard.writeText(url); setMsg('لینک پرداخت کپی شد؛ برای هنرجو بفرستید ✅'); }
    catch { window.prompt('این لینک را برای هنرجو بفرستید:', url); }
  }

  const visiblePayments = filter === 'all' ? payments : payments.filter((p) => p.status === filter);

  if (loading) return <p style={{ color: 'var(--muted)' }}>در حال بارگذاری…</p>;

  return (
    <div>
      {error && <div className="alert alert--error" style={{ marginBottom: 16 }}>{error}</div>}
      {msg && <div className="alert alert--success" style={{ marginBottom: 16 }}>{msg}</div>}

      {/* فرم ساخت پرداخت / ارتقای دوره */}
      <form onSubmit={submit} className="form-shell" style={{ marginBottom: 24 }}>
        <h2 className="heading" style={{ fontSize: '1.1rem', marginBottom: 6 }}>ثبت پرداخت جدید</h2>
        <p style={{ color: 'var(--muted)', fontSize: '.85rem', marginTop: 0, marginBottom: 16 }}>
          شهریهٔ یک دوره، یا هزینهٔ جدا (بیمه و پلاتو، لوکیشن و تغذیهٔ اردو، یا افیشِ متفرقه). مبلغ و «بابت» را خودتان تعیین می‌کنید.
        </p>

        <div className="cal-form-grid">
          <div className="form-group">
            <label className="form-label">
              هنرجو *{form.userIds.length > 0 && <span style={{ color: 'var(--muted)', fontWeight: 400 }}> — {money(form.userIds.length)} نفر انتخاب شده</span>}
            </label>
            <div className="pay-picker">
              <button type="button" className="pay-picker__toggle" onClick={() => setPickerOpen((v) => !v)}
                aria-expanded={pickerOpen}>
                <span>
                  {form.userIds.length > 0 ? `${money(form.userIds.length)} هنرجو انتخاب شده` : 'انتخاب هنرجو…'}
                </span>
                <svg className={`pay-picker__chev ${pickerOpen ? 'is-open' : ''}`} width="16" height="16" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {pickerOpen && (
                <div className="pay-picker__panel">
                  <input className="form-input" placeholder="جستجوی نام/موبایل هنرجو…" value={studentQuery}
                    onChange={(e) => setStudentQuery(e.target.value)} style={{ margin: '10px 10px 8px', width: 'auto', display: 'block' }} />
                  <label className="pay-picker__all">
                    <input type="checkbox" checked={allFilteredSelected} onChange={toggleAllFiltered}
                      disabled={filteredStudents.length === 0} />
                    انتخاب همه{studentQuery.trim() ? ' (نتیجهٔ جستجو)' : ''}
                  </label>
                  <div className="pay-picker__list">
                    {filteredStudents.length === 0 ? (
                      <p className="pay-picker__empty">هنرجویی یافت نشد.</p>
                    ) : (
                      filteredStudents.map((s) => (
                        <label key={s.id} className={`pay-picker__row ${form.userIds.includes(s.id) ? 'is-checked' : ''}`}>
                          <input type="checkbox" checked={form.userIds.includes(s.id)} onChange={() => toggleStudent(s.id)} />
                          <span className="pay-picker__name">
                            {s.displayName || s.phone}
                            {s.username && <span className="pay-picker__meta"> · {s.username}</span>}
                          </span>
                          {s.courseTitle && <span className="pay-picker__course">دورهٔ {s.courseTitle}</span>}
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">دوره</label>
            <select className="form-input" value={form.courseKey} onChange={(e) => pickCourse(e.target.value)}>
              <option value="">— پرداختِ جدا (بدون دوره / افیش) —</option>
              {COURSE_PATH.map((c) => (
                <option key={c.key} value={c.key}>دورهٔ {c.title}</option>
              ))}
            </select>
            {suggestedNext && (
              <p className="form-hint">
                دورهٔ بعدیِ پیشنهادی برای این هنرجو: <b>{suggestedNext.title}</b>{' '}
                <button type="button" className="btn btn--sm btn--ghost" style={{ padding: '2px 8px' }}
                  onClick={() => pickCourse(suggestedNext.key)}>انتخاب</button>
              </p>
            )}
          </div>
        </div>

        <div className="cal-form-grid">
          <div className="form-group">
            <label className="form-label">بابت / دلیل پرداخت *</label>
            <input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="مثلاً هزینهٔ بیمه و پلاتو، یا لوکیشن و تغذیهٔ اردو" />
          </div>
          <div className="form-group">
            <label className="form-label">مبلغ (تومان) *</label>
            <input className="form-input" type="number" min={1000} step={1000} value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="مثلاً ۵۰۰۰۰۰" />
          </div>
        </div>

        {form.courseKey && (
          <label className="pay-toggle">
            <input type="checkbox" checked={form.promote} onChange={(e) => setForm({ ...form, promote: e.target.checked })} />
            هنرجو را هم به همین دوره ارتقا بده (دورهٔ فعلیِ او به‌روزرسانی می‌شود)
          </label>
        )}

        <button className="btn btn--dark" type="submit" disabled={saving}>{saving ? 'در حال ثبت…' : 'ثبت پرداخت'}</button>
      </form>

      {/* فهرست پرداخت‌ها */}
      <div className="pay-filters" role="tablist" aria-label="فیلتر وضعیت پرداخت">
        {[['all', 'همه'], ['pending', 'در انتظار'], ['paid', 'پرداخت‌شده'], ['canceled', 'لغوشده']].map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={filter === k}
            className={`pay-chip ${filter === k ? 'is-active' : ''}`} onClick={() => setFilter(k)}>{l}</button>
        ))}
      </div>

      {visiblePayments.length === 0 ? (
        <div className="pay-empty">
          <div className="pay-empty__icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" />
            </svg>
          </div>
          <p style={{ margin: 0 }}>موردی برای نمایش نیست.</p>
        </div>
      ) : (
        <div className="pay-list">
          {visiblePayments.map((p) => (
            <div key={p.id} className={`pay-card pay-card--${p.status}`}>
              <div className="pay-card__top">
                <div className="pay-card__main">
                  <div className="pay-card__title">
                    {p.user?.displayName || p.user?.phone}
                    {p.user?.username && <span style={{ color: 'var(--muted)', fontWeight: 400 }}> · {p.user.username}</span>}
                  </div>
                  <div className="pay-card__sub">
                    {p.title}
                    <span className="dot">·</span>{p.courseTitle ? `دورهٔ ${p.courseTitle}` : 'پرداخت جدا'}
                    <span className="dot">·</span>{dateFmt.format(new Date(p.createdAt))}
                  </div>
                </div>
                <div className="pay-card__amount">{money(p.amount)}<span>تومان</span></div>
                <StatusBadge status={p.status} />
              </div>
              <div className="pay-card__actions">
                <button type="button" className="btn btn--sm btn--outline" onClick={() => copyLink(p.id)}>کپی لینک پرداخت</button>
                {p.status === 'pending' && (
                  <>
                    <button type="button" className="btn btn--sm btn--dark" onClick={() => act(p.id, 'markPaid')}>ثبت پرداختِ دستی</button>
                    <button type="button" className="btn btn--sm btn--outline" onClick={() => act(p.id, 'cancel')}>لغو</button>
                  </>
                )}
                {p.status === 'canceled' && (
                  <button type="button" className="btn btn--sm btn--outline" onClick={() => act(p.id, 'reopen')}>بازگردانی</button>
                )}
                <button type="button" className="btn btn--sm btn--danger" onClick={() => remove(p.id)}>حذف</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
