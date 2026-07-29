'use client';

import { useEffect, useMemo, useState } from 'react';
import { COURSE_PATH, nextCourseAfterTitle } from '@/lib/courses';

const dateFmt = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
const money = (n) => Number(n || 0).toLocaleString('fa-IR');

const STATUS = {
  pending: { label: 'در انتظار پرداخت', bg: '#FFF7ED', color: '#92400E', border: '#FED7AA' },
  paid: { label: 'پرداخت‌شده', bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' },
  canceled: { label: 'لغوشده', bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
};

const emptyForm = { userId: '', courseKey: '', title: '', amount: '', promote: false };

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [studentQuery, setStudentQuery] = useState('');
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

  const selectedStudent = useMemo(() => students.find((s) => s.id === form.userId) || null, [students, form.userId]);
  const suggestedNext = useMemo(
    () => (selectedStudent ? nextCourseAfterTitle(selectedStudent.courseTitle) : null),
    [selectedStudent]
  );

  const filteredStudents = useMemo(() => {
    const q = studentQuery.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => [s.displayName, s.username, s.phone].some((v) => (v || '').toLowerCase().includes(q)));
  }, [students, studentQuery]);

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
    if (!form.userId) { setError('ابتدا هنرجو را انتخاب کنید.'); return; }
    if (!form.title.trim()) { setError('بابتِ پرداخت (دلیل) را بنویسید.'); return; }
    setSaving(true);
    const res = await fetch('/api/admin/payments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    const d = await res.json();
    setSaving(false);
    if (!d.ok) { setError(d.error || 'خطا.'); return; }
    setMsg('پرداخت ثبت شد و در پنل هنرجو نمایش داده می‌شود ✅');
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
            <label className="form-label">هنرجو *</label>
            <input className="form-input" placeholder="جستجوی نام/موبایل هنرجو…" value={studentQuery}
              onChange={(e) => setStudentQuery(e.target.value)} style={{ marginBottom: 8 }} />
            <select className="form-input" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}>
              <option value="">— انتخاب هنرجو —</option>
              {filteredStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.displayName || s.phone}{s.username ? ` (${s.username})` : ''}{s.courseTitle ? ` — دورهٔ فعلی: ${s.courseTitle}` : ''}
                </option>
              ))}
            </select>
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
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.88rem', marginBottom: 14, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.promote} onChange={(e) => setForm({ ...form, promote: e.target.checked })} />
            هنرجو را هم به همین دوره ارتقا بده (دورهٔ فعلیِ او به‌روزرسانی می‌شود)
          </label>
        )}

        <button className="btn btn--dark" type="submit" disabled={saving}>{saving ? 'در حال ثبت…' : 'ثبت پرداخت'}</button>
      </form>

      {/* فهرست پرداخت‌ها */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {[['all', 'همه'], ['pending', 'در انتظار'], ['paid', 'پرداخت‌شده'], ['canceled', 'لغوشده']].map(([k, l]) => (
          <button key={k} type="button" className={`btn btn--sm ${filter === k ? 'btn--dark' : 'btn--outline'}`} onClick={() => setFilter(k)}>{l}</button>
        ))}
      </div>

      {visiblePayments.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24, textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', margin: 0 }}>موردی نیست.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {visiblePayments.map((p) => {
            const st = STATUS[p.status] || STATUS.pending;
            return (
              <div key={p.id} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontWeight: 800 }}>
                      {p.user?.displayName || p.user?.phone}
                      {p.user?.username && <span style={{ color: 'var(--muted)', fontWeight: 400 }}> · {p.user.username}</span>}
                    </div>
                    <div style={{ fontSize: '.85rem', color: 'var(--muted)' }}>
                      {p.title}{p.courseTitle ? ` · دورهٔ ${p.courseTitle}` : ' · پرداخت جدا'} · {dateFmt.format(new Date(p.createdAt))}
                    </div>
                  </div>
                  <div style={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{money(p.amount)} تومان</div>
                  <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, borderRadius: 999, padding: '3px 12px', fontSize: '.78rem', fontWeight: 700 }}>{st.label}</span>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
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
            );
          })}
        </div>
      )}
    </div>
  );
}
