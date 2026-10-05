'use client';

import { useEffect, useState } from 'react';
import ShamsiDateTimeField from './ShamsiDateTimeField';

const dateFmt = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('fa-IR', {
  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tehran',
});
const fa = (n) => new Intl.NumberFormat('fa-IR', { useGrouping: false }).format(n ?? 0);
const EMPTY = { text: '', options: ['', '', '', ''], correct: 0, topic: '' };

// مقدار ورودی تاریخ («YYYY-MM-DDTHH:mm» به وقت محلی) را به ISO برای سرور تبدیل می‌کند.
const localToIso = (v) => (v ? new Date(v).toISOString() : null);

// تبدیل زمان ذخیره‌شده به مقدار همان ورودی، برای ویرایش بازهٔ یک اجازهٔ صادرشده.
function isoToLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

// پایان بازه = شروع (یا همین حالا) + مدت به ساعت. فقط برای پیش‌نمایش در فرم؛
// محاسبهٔ معتبر همان چیزی است که سرور انجام می‌دهد.
function windowEnd(startLocal, hours) {
  const h = Number(hours);
  if (!Number.isFinite(h) || h <= 0) return null;
  const from = startLocal ? new Date(startLocal) : new Date();
  if (Number.isNaN(from.getTime())) return null;
  return new Date(from.getTime() + Math.round(h * 60) * 60000);
}

export default function AdminExam({ questionCount, passPercent, secondsPerQuestion, classScoreMax, examWeight }) {
  const [tab, setTab] = useState('permits');
  const [items, setItems] = useState([]);
  const [activeCount, setActiveCount] = useState(0);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [removingAttemptId, setRemovingAttemptId] = useState('');
  const [search, setSearch] = useState('');

  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [bulk, setBulk] = useState('');

  // اجازهٔ شرکت در آزمون
  const [permits, setPermits] = useState([]);
  const [students, setStudents] = useState([]);
  const [passedIds, setPassedIds] = useState([]);
  const [permitUser, setPermitUser] = useState('');
  // بازهٔ باز بودن صفحهٔ آزمون: زمان شروع (خالی = همین حالا) و مدت آن به ساعت.
  const [permitStart, setPermitStart] = useState('');
  const [permitHours, setPermitHours] = useState('3');
  const [permitNote, setPermitNote] = useState('');
  const [permitScore, setPermitScore] = useState('');
  const [permitSearch, setPermitSearch] = useState('');
  const [bulkUsers, setBulkUsers] = useState([]);
  const [bulkScores, setBulkScores] = useState({});
  const [bulkBusy, setBulkBusy] = useState(false);
  const [grantMode, setGrantMode] = useState('bulk');
  const [editScoreId, setEditScoreId] = useState(null);
  const [editScore, setEditScore] = useState('');
  const [editWindowId, setEditWindowId] = useState(null);
  const [editStart, setEditStart] = useState('');
  const [editHours, setEditHours] = useState('');

  async function loadBank(q = '') {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/exam/questions${q ? `?q=${encodeURIComponent(q)}` : ''}`);
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'خطا در بارگذاری.'); return; }
      setItems(data.items);
      setActiveCount(data.activeCount);
    } finally {
      setLoading(false);
    }
  }

  async function loadAttempts() {
    const res = await fetch('/api/admin/exam/attempts');
    const data = await res.json();
    if (data.ok) setAttempts(data.items); else setError(data.error || 'خطا در بارگذاری.');
  }

  async function removeAttempt(attempt) {
    const who = attempt.user?.displayName || attempt.user?.username || attempt.user?.phone || 'این هنرجو';
    const certificateNote = attempt.certificate
      ? `\nگواهی ${attempt.certificate.serial} حذف نمی‌شود و تصمیم ابطال یا اعتبار آن در بخش گواهی‌نامه‌ها با شماست.`
      : '';
    if (!confirm(`کارنامهٔ آزمون «${who}» برای همیشه حذف شود؟ این کار قابل بازگشت نیست.${certificateNote}`)) return;

    setRemovingAttemptId(attempt.id);
    setError('');
    setNotice('');
    try {
      const res = await fetch(`/api/admin/exam/attempts?id=${encodeURIComponent(attempt.id)}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || 'حذف کارنامه ناموفق بود.');
        return;
      }
      setAttempts((current) => current.filter((item) => item.id !== attempt.id));
      setNotice(data.certificatePreserved
        ? 'کارنامه حذف شد؛ گواهی صادرشده محفوظ و معتبر باقی ماند.'
        : 'کارنامهٔ آزمون حذف شد.');
    } finally {
      setRemovingAttemptId('');
    }
  }

  async function loadPermits() {
    const res = await fetch('/api/admin/exam/permits');
    const data = await res.json();
    if (!data.ok) { setError(data.error || 'خطا در بارگذاری.'); return; }
    setPermits(data.items);
    setStudents(data.students);
    setPassedIds(data.passedUserIds || []);
  }

  useEffect(() => { loadBank(); loadAttempts(); loadPermits(); }, []);

  async function grantPermit(e) {
    e.preventDefault();
    setBusy(true); setError(''); setNotice('');
    try {
      const res = await fetch('/api/admin/exam/permits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: permitUser,
          startsAt: localToIso(permitStart),
          hours: permitHours === '' ? null : Number(permitHours),
          note: permitNote,
          classScore: permitScore,
        }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'صدور اجازه ناموفق بود.'); return; }
      setNotice('اجازهٔ آزمون با نمرهٔ کلاسی و بازهٔ زمانی ثبت شد و به هنرجو اطلاع داده شد.');
      setPermitUser(''); setPermitNote(''); setPermitScore('');
      await loadPermits();
    } finally {
      setBusy(false);
    }
  }

  async function grantBulkPermits(e) {
    e.preventDefault();
    setBulkBusy(true); setError(''); setNotice('');
    try {
      const res = await fetch('/api/admin/exam/permits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: bulkUsers,
          scores: bulkScores,
          startsAt: localToIso(permitStart),
          hours: permitHours === '' ? null : Number(permitHours),
          note: permitNote,
        }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'صدور گروهی اجازه ناموفق بود.'); return; }
      setNotice(`برای ${data.items.length} نفر اجازهٔ آزمون صادر شد${data.skipped ? `؛ ${data.skipped} نفر قبلاً اجازه داشتند یا قبول شده بودند.` : '.'}`);
      setBulkUsers([]); setBulkScores({}); await loadPermits();
    } finally {
      setBulkBusy(false);
    }
  }

  function toggleBulkUser(id) {
    setBulkUsers((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function toggleAllBulkUsers() {
    const available = students.filter((s) => !passedIds.includes(s.id)).map((s) => s.id);
    setBulkUsers((current) => current.length === available.length ? [] : available);
  }

  async function revokePermit(p) {
    const who = p.user?.displayName || p.user?.username || p.user?.phone || 'این هنرجو';
    if (!confirm(`اجازهٔ آزمون ${who} باطل شود؟`)) return;
    setError(''); setNotice('');
    const res = await fetch('/api/admin/exam/permits', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: p.id }),
    });
    const data = await res.json();
    if (!data.ok) { setError(data.error || 'باطل‌کردن ناموفق بود.'); return; }
    setNotice('اجازه باطل شد.');
    await loadPermits();
  }

  // اصلاح نمرهٔ کلاسی فقط تا پیش از شروع آزمون ممکن است؛ سرور هم همین را کنترل می‌کند.
  async function saveScore(p) {
    setError(''); setNotice('');
    const res = await fetch('/api/admin/exam/permits', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: p.id, classScore: editScore }),
    });
    const data = await res.json();
    if (!data.ok) { setError(data.error || 'ثبت نمرهٔ کلاسی ناموفق بود.'); return; }
    setNotice('نمرهٔ کلاسی به‌روز شد.');
    setEditScoreId(null); setEditScore('');
    await loadPermits();
  }

  // جابه‌جایی بازهٔ زمانی یک اجازهٔ استفاده‌نشده، بدون نیاز به باطل‌کردن و صدور دوباره.
  async function saveWindow(p) {
    setError(''); setNotice('');
    const res = await fetch('/api/admin/exam/permits', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: p.id,
        startsAt: localToIso(editStart),
        hours: editHours === '' ? null : Number(editHours),
      }),
    });
    const data = await res.json();
    if (!data.ok) { setError(data.error || 'تغییر بازهٔ آزمون ناموفق بود.'); return; }
    setNotice('بازهٔ باز بودن آزمون تغییر کرد و به هنرجو اطلاع داده شد.');
    setEditWindowId(null); setEditStart(''); setEditHours('');
    await loadPermits();
  }

  // بازهٔ فعلی را برای ویرایش باز می‌کند؛ مدت از فاصلهٔ شروع تا پایان بازسازی می‌شود.
  function openWindowEditor(p) {
    setEditWindowId(p.id);
    setEditStart(isoToLocalInput(p.startsAt));
    if (p.expiresAt) {
      const from = p.startsAt ? new Date(p.startsAt) : new Date(p.grantedAt);
      const hours = (new Date(p.expiresAt).getTime() - from.getTime()) / 3600000;
      setEditHours(hours > 0 ? String(Math.round(hours * 100) / 100) : '');
    } else {
      setEditHours('');
    }
  }

  function permitStatus(p) {
    if (p.usedAt) return { label: 'استفاده شده', color: 'var(--muted)' };
    if (p.revoked) return { label: 'باطل شده', color: '#dc2626' };
    if (p.expiresAt && new Date(p.expiresAt) <= new Date()) return { label: 'بازه تمام شده', color: '#dc2626' };
    if (p.classScore === null) return { label: 'نمرهٔ کلاسی ثبت نشده — آزمون باز نمی‌شود', color: '#dc2626' };
    if (p.startsAt && new Date(p.startsAt) > new Date()) {
      return { label: `زمان‌بندی‌شده — از ${dateTimeFmt.format(new Date(p.startsAt))}`, color: '#b45309' };
    }
    return { label: 'باز — منتظر شرکت هنرجو', color: '#16a34a' };
  }

  // شرح بازهٔ هر اجازه در فهرست.
  function windowText(p) {
    if (p.startsAt && p.expiresAt) {
      return `${dateTimeFmt.format(new Date(p.startsAt))} تا ${dateTimeFmt.format(new Date(p.expiresAt))}`;
    }
    if (p.startsAt) return `از ${dateTimeFmt.format(new Date(p.startsAt))} — بدون پایان`;
    if (p.expiresAt) return `از لحظهٔ صدور تا ${dateTimeFmt.format(new Date(p.expiresAt))}`;
    return 'بدون محدودیت زمانی';
  }

  function resetForm() { setForm(EMPTY); setEditingId(null); }

  async function saveQuestion(e) {
    e.preventDefault();
    setBusy(true); setError(''); setNotice('');
    try {
      const url = editingId ? `/api/admin/exam/questions/${editingId}` : '/api/admin/exam/questions';
      const res = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'ذخیره نشد.'); return; }
      setNotice(editingId ? 'سؤال ویرایش شد.' : 'سؤال افزوده شد.');
      resetForm();
      await loadBank(search);
    } finally {
      setBusy(false);
    }
  }

  async function importBulk() {
    setBusy(true); setError(''); setNotice('');
    try {
      const res = await fetch('/api/admin/exam/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulk }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError([data.error, ...(data.errors || []).slice(0, 8)].filter(Boolean).join(' • '));
        return;
      }
      setNotice(`${fa(data.created)} سؤال افزوده شد.${data.errors?.length ? ` ${fa(data.errors.length)} خط نادیده گرفته شد.` : ''}`);
      setBulk('');
      await loadBank(search);
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(q) {
    const res = await fetch(`/api/admin/exam/questions/${q.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !q.active }),
    });
    const data = await res.json();
    if (data.ok) await loadBank(search); else setError(data.error || 'تغییر وضعیت ناموفق بود.');
  }

  async function remove(q) {
    if (!confirm('این سؤال حذف شود؟')) return;
    const res = await fetch(`/api/admin/exam/questions/${q.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!data.ok) { setError(data.error || 'حذف ناموفق بود.'); return; }
    setNotice(data.deactivated ? 'این سؤال در آزمون‌های برگزارشده استفاده شده بود، پس فقط غیرفعال شد.' : 'سؤال حذف شد.');
    await loadBank(search);
  }

  function PermitWindowFields() {
    return (
      <div className="exam-window-fields">
        <div className="form-group"><label className="form-label">شروع دسترسی</label><ShamsiDateTimeField value={permitStart} onChange={setPermitStart} label="از همین لحظه" /></div>
        <div className="form-group"><label className="form-label">مدت بازبودن (ساعت)</label><input className="form-input" type="number" min={0.25} step={0.25} dir="ltr" value={permitHours} onChange={(e) => setPermitHours(e.target.value)} placeholder="خالی = بدون محدودیت" /></div>
        <div className="form-group exam-window-fields__note"><label className="form-label">یادداشت (اختیاری)</label><input className="form-input" value={permitNote} onChange={(e) => setPermitNote(e.target.value)} placeholder="مثلاً: تسویهٔ شهریه انجام شد" />{windowEnd(permitStart, permitHours) && <small>پایان بازه: {dateTimeFmt.format(windowEnd(permitStart, permitHours))}</small>}</div>
      </div>
    );
  }

  return (
    <div className="exam-admin">
      {error && <div className="alert alert--error">{error}</div>}
      {notice && <div className="alert alert--success">{notice}</div>}

      <div className="alert alert--info exam-admin__guide">
        سؤال فعال در بانک: <strong>{fa(activeCount)}</strong> — هر آزمون {fa(questionCount)} سؤال تصادفی از همین بانک برمی‌دارد.
        {activeCount < questionCount && ' هنوز به تعداد لازم نرسیده‌اید؛ آزمون با همین تعداد موجود برگزار می‌شود.'}
        {' '}مهلت هر سؤال: {fa(secondsPerQuestion)} ثانیه — حد نصاب قبولی: {fa(passPercent)} درصد.
        <div style={{ marginTop: 6 }}>
          نمرهٔ نهایی از ۱۰۰: <strong>{fa(examWeight)} نمره از آزمون کتبی</strong> + <strong>{fa(classScoreMax)} نمره تکلیف کلاسی</strong>.
          نمرهٔ کلاسی را هنگام صدور اجازه ثبت می‌کنید و گواهی بر اساس نمرهٔ نهایی صادر می‌شود.
        </div>
      </div>

      <div className="exam-admin__tabs" role="tablist">
        <button className={`exam-admin__tab ${tab === 'permits' ? 'is-active' : ''}`} onClick={() => { setTab('permits'); loadPermits(); }}>اجازهٔ آزمون</button>
        <button className={`exam-admin__tab ${tab === 'bank' ? 'is-active' : ''}`} onClick={() => setTab('bank')}>بانک سؤالات</button>
        <button className={`exam-admin__tab ${tab === 'results' ? 'is-active' : ''}`} onClick={() => { setTab('results'); loadAttempts(); }}>کارنامه‌ها</button>
      </div>

      {tab === 'permits' && (
        <div className="exam-permits">
          <section className="stack-card exam-permits__grant">
            <div className="exam-section-head">
              <div><span className="exam-eyebrow">صدور اجازه</span><h2>آزمون را برای چه کسی باز می‌کنید؟</h2></div>
              <span className="exam-count">{fa(bulkUsers.length)} انتخاب</span>
            </div>
            <div className="cm-kind exam-mode">
              <button type="button" className={grantMode === 'bulk' ? 'active' : undefined} onClick={() => setGrantMode('bulk')}>گروهی</button>
              <button type="button" className={grantMode === 'single' ? 'active' : undefined} onClick={() => setGrantMode('single')}>تکی</button>
            </div>

            {grantMode === 'bulk' ? (
              <form onSubmit={grantBulkPermits}>
                <div className="exam-picker-tools">
                  <input className="form-input" placeholder="جست‌وجوی نام یا شماره…" value={permitSearch} onChange={(e) => setPermitSearch(e.target.value)} />
                  <button type="button" className="btn btn--outline" onClick={toggleAllBulkUsers}>
                    {bulkUsers.length > 0 && bulkUsers.length === students.filter((s) => !passedIds.includes(s.id)).length ? 'لغو همه' : 'انتخاب همه'}
                  </button>
                </div>
                <div className="exam-student-picker">
                  {students.filter((s) => {
                    const q = permitSearch.trim();
                    return !q || `${s.displayName || ''} ${s.username || ''} ${s.phone || ''}`.includes(q);
                  }).map((s) => {
                    const disabled = passedIds.includes(s.id);
                    const selected = bulkUsers.includes(s.id);
                    return (
                      <label key={s.id} className={`exam-student ${selected ? 'is-selected' : ''} ${disabled ? 'is-disabled' : ''}`}>
                        <input type="checkbox" checked={selected} disabled={disabled} onChange={() => toggleBulkUser(s.id)} />
                        <span className="exam-student__name">{s.displayName || s.username || s.phone}<small>{s.branch || s.phone || ''}</small></span>
                        {disabled ? <span className="exam-student__passed">قبول شده</span> : selected && <input className="form-input exam-score-input" type="number" min={0} max={classScoreMax} step={0.1} required dir="ltr" placeholder="نمره" value={bulkScores[s.id] || ''} onChange={(e) => setBulkScores((current) => ({ ...current, [s.id]: e.target.value }))} />}
                      </label>
                    );
                  })}
                </div>
                <PermitWindowFields />
                <button className="btn btn--dark exam-submit" disabled={bulkBusy || bulkUsers.length === 0}>{bulkBusy ? 'در حال صدور…' : `صدور اجازه برای ${fa(bulkUsers.length)} نفر`}</button>
              </form>
            ) : (
              <form onSubmit={grantPermit}>
                <div className="form-group"><label className="form-label">هنرجو</label><select className="form-input" required value={permitUser} onChange={(e) => setPermitUser(e.target.value)}><option value="">— انتخاب کنید —</option>{students.map((s) => <option key={s.id} value={s.id} disabled={passedIds.includes(s.id)}>{s.displayName || s.username || s.phone}{s.branch ? ` — ${s.branch}` : ''}{passedIds.includes(s.id) ? ' (قبول شده)' : ''}</option>)}</select></div>
                <div className="form-group"><label className="form-label">نمرهٔ کلاسی از {fa(classScoreMax)}</label><input className="form-input" type="number" min={0} max={classScoreMax} step={0.1} required dir="ltr" value={permitScore} onChange={(e) => setPermitScore(e.target.value)} placeholder="مثلاً 18.5" /></div>
                <PermitWindowFields />
                <button className="btn btn--dark exam-submit" disabled={busy || !permitUser || permitScore === ''}>{busy ? 'در حال صدور…' : 'صدور اجازهٔ آزمون'}</button>
              </form>
            )}
          </section>

          <section className="stack-card exam-permits__list">
            <div className="exam-section-head">
              <div><span className="exam-eyebrow">پیگیری</span><h2>اجازه‌های صادرشده</h2></div>
              <span className="exam-count">{fa(permits.length)} مورد</span>
            </div>
            <input className="form-input exam-permit-search" placeholder="جست‌وجوی نام یا شماره…" value={permitSearch} onChange={(e) => setPermitSearch(e.target.value)} />
            {permits.length === 0 ? <p className="exam-empty">هنوز اجازه‌ای صادر نشده است.</p> : (
              <div className="exam-permit-list">
                {permits.filter((p) => { const q = permitSearch.trim(); return !q || `${p.user?.displayName || ''} ${p.user?.username || ''} ${p.user?.phone || ''}`.includes(q); }).map((p) => {
                  const st = permitStatus(p);
                  return <article key={p.id} className={`exam-permit ${p.revoked ? 'is-revoked' : ''}`}>
                    <div className="exam-permit__identity"><strong>{p.user?.displayName || p.user?.username || '—'}</strong><span dir="ltr">{p.user?.phone}</span><small>صدور: {dateFmt.format(new Date(p.grantedAt))}</small></div>
                    <div className="exam-permit__meta"><span>نمرهٔ کلاسی <b>{p.classScore === null ? '—' : `${fa(p.classScore)} از ${fa(classScoreMax)}`}</b></span><span>{windowText(p)}</span></div>
                    <span className="exam-status" style={{ color: st.color }}>{st.label}</span>
                    {!p.usedAt && !p.revoked && <div className="exam-permit__actions">
                      <button className="btn btn--sm btn--outline" onClick={() => openWindowEditor(p)}>زمان</button>
                      <button className="btn btn--sm btn--outline" onClick={() => { setEditScoreId(p.id); setEditScore(p.classScore === null ? '' : String(p.classScore)); }}>نمره</button>
                      <button className="btn btn--sm btn--danger" onClick={() => revokePermit(p)}>ابطال</button>
                    </div>}
                    {editWindowId === p.id && <div className="exam-inline-editor"><ShamsiDateTimeField value={editStart} onChange={setEditStart} label="از همین لحظه" /><input className="form-input" type="number" min={0.25} step={0.25} dir="ltr" placeholder="ساعت" value={editHours} onChange={(e) => setEditHours(e.target.value)} /><button className="btn btn--sm btn--dark" onClick={() => saveWindow(p)}>ثبت</button><button className="btn btn--sm" onClick={() => { setEditWindowId(null); setEditStart(''); setEditHours(''); }}>انصراف</button></div>}
                    {editScoreId === p.id && <div className="exam-inline-editor"><input className="form-input" type="number" min={0} max={classScoreMax} step={0.1} dir="ltr" placeholder="نمره" value={editScore} onChange={(e) => setEditScore(e.target.value)} /><button className="btn btn--sm btn--dark" onClick={() => saveScore(p)}>ثبت</button><button className="btn btn--sm" onClick={() => { setEditScoreId(null); setEditScore(''); }}>انصراف</button></div>}
                  </article>;
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {tab === 'bank' && (
        <div className="exam-bank">
          <form className="stack-card" onSubmit={saveQuestion}>
            <div className="exam-section-head">
              <div><span className="exam-eyebrow">بانک سؤالات</span><h2>{editingId ? 'ویرایش سؤال' : 'افزودن سؤال'}</h2></div>
            </div>
            <div className="form-group">
              <label className="form-label">متن سؤال</label>
              <textarea className="form-input" rows={2} required value={form.text} onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))} />
            </div>
            {form.options.map((opt, i) => (
              <div className="form-group" key={i}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="radio" name="correct" checked={form.correct === i} onChange={() => setForm((f) => ({ ...f, correct: i }))} />
                  گزینهٔ {fa(i + 1)} {form.correct === i && <span style={{ color: '#16a34a' }}>(پاسخ درست)</span>}
                </label>
                <input className="form-input" required value={opt} onChange={(e) => setForm((f) => {
                  const options = [...f.options];
                  options[i] = e.target.value;
                  return { ...f, options };
                })} />
              </div>
            ))}
            <div className="form-group">
              <label className="form-label">سرفصل (اختیاری)</label>
              <input className="form-input" value={form.topic} onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn--dark" disabled={busy}>{busy ? 'در حال ذخیره…' : editingId ? 'ذخیرهٔ ویرایش' : 'افزودن سؤال'}</button>
              {editingId && <button type="button" className="btn" onClick={resetForm}>انصراف</button>}
            </div>
          </form>

          <div className="stack-card exam-bulk-import">
            <div className="exam-section-head"><div><span className="exam-eyebrow">ورود سریع</span><h2>افزودن گروهی سؤال</h2></div></div>
            <p style={{ color: 'var(--muted)', lineHeight: 1.9, marginBottom: 12 }}>
              هر خط یک سؤال، با علامت <b>|</b> جدا شده:
              <br />
              <code dir="rtl">متن سؤال | گزینه۱ | گزینه۲ | گزینه۳ | گزینه۴ | شمارهٔ گزینهٔ درست (۱ تا ۴) | سرفصل (اختیاری)</code>
              <br />
              می‌توانید ستون‌ها را مستقیم از اکسل کپی کنید (جداکننده را به | تبدیل کنید).
            </p>
            <textarea className="form-input" rows={6} dir="rtl" value={bulk} onChange={(e) => setBulk(e.target.value)} placeholder="نقش اول در فیلم چه نامیده می‌شود؟ | پروتاگونیست | آنتاگونیست | فیگوران | نریتور | 1 | مبانی بازیگری" />
            <button type="button" className="btn btn--gold" style={{ marginTop: 12 }} disabled={busy || !bulk.trim()} onClick={importBulk}>
              {busy ? 'در حال افزودن…' : 'افزودن گروهی'}
            </button>
          </div>

          <div className="stack-card">
            <div className="exam-section-head">
              <div><span className="exam-eyebrow">فهرست</span><h2>سؤالات ثبت‌شده</h2></div>
              <span className="exam-count">{fa(items.length)} سؤال</span>
            </div>
            <div className="exam-bank__search">
              <input className="form-input" placeholder="جست‌وجو در متن سؤال…" value={search} onChange={(e) => setSearch(e.target.value)} />
              <button className="btn btn--outline" onClick={() => loadBank(search)}>جست‌وجو</button>
            </div>
            {loading ? <p className="exam-empty">در حال بارگذاری…</p> : items.length === 0 ? (
              <p className="exam-empty">هنوز سؤالی ثبت نشده است.</p>
            ) : (
              <div className="exam-question-list">
                {items.map((q, i) => (
                  <article key={q.id} className={`exam-question ${q.active ? '' : 'is-inactive'}`}>
                    <div className="exam-question__head">
                      <strong>{fa(i + 1)}. {q.text}</strong>
                      {q.topic && <span className="tag tag--dark">{q.topic}</span>}
                    </div>
                    <ol className="exam-question__options">
                      {q.options.map((o, oi) => (
                        <li key={oi} className={oi === q.correct ? 'is-correct' : undefined}>{o}</li>
                      ))}
                    </ol>
                    <div className="exam-question__actions">
                      <button className="btn btn--sm btn--outline" onClick={() => editQuestion(q)}>ویرایش</button>
                      <button className="btn btn--sm btn--outline" onClick={() => toggleActive(q)}>{q.active ? 'غیرفعال کن' : 'فعال کن'}</button>
                      <button className="btn btn--sm btn--danger" onClick={() => remove(q)}>حذف</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'results' && (
        <section className="stack-card exam-results">
          <div className="exam-section-head"><div><span className="exam-eyebrow">نتایج</span><h2>کارنامهٔ آزمون‌ها</h2></div><span className="exam-count">{fa(attempts.length)} کارنامه</span></div>
          {attempts.length === 0 ? <p className="exam-empty">هنوز کسی در آزمون شرکت نکرده است.</p> : (
            <div className="exam-results__list">
              {attempts.map((a) => (
                <article key={a.id} className="exam-result">
                  <div className="exam-result__identity"><strong>{a.user?.displayName || a.user?.username || '—'}</strong><span dir="ltr">{a.user?.phone}</span><small>{dateFmt.format(new Date(a.submittedAt || a.startedAt))}</small></div>
                  <div className="exam-result__scores"><span>آزمون <b>{a.submittedAt ? `${fa(a.score)} از ${fa(a.total)} (${fa(a.percent)}٪)` : 'در حال برگزاری'}</b></span>{a.submittedAt && <span>کلاسی <b>{a.classScore === null ? '—' : `${fa(a.classScore)} از ${fa(classScoreMax)}`}</b></span>}</div>
                  {a.submittedAt && <strong className="exam-result__final">نهایی: {fa(a.finalPercent ?? a.percent)} از ۱۰۰</strong>}
                  {a.submittedAt && <span className={`exam-result__status ${a.passed ? 'is-passed' : 'is-failed'}`}>{a.passed ? 'قبول' : 'مردود'}</span>}
                  <div className="exam-result__actions">{a.certificate && <span className="exam-certificate" dir="ltr">{a.certificate.serial}</span>}<button type="button" className="btn btn--sm btn--danger" disabled={removingAttemptId === a.id} onClick={() => removeAttempt(a)}>{removingAttemptId === a.id ? 'در حال حذف…' : 'حذف'}</button></div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
