'use client';

import { useEffect, useState } from 'react';

const dateFmt = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
const fa = (n) => new Intl.NumberFormat('fa-IR', { useGrouping: false }).format(n ?? 0);
const EMPTY = { text: '', options: ['', '', '', ''], correct: 0, topic: '' };

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
  const [permitDays, setPermitDays] = useState('7');
  const [permitNote, setPermitNote] = useState('');
  const [permitScore, setPermitScore] = useState('');
  const [permitSearch, setPermitSearch] = useState('');
  const [editScoreId, setEditScoreId] = useState(null);
  const [editScore, setEditScore] = useState('');

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
          days: permitDays === '' ? null : Number(permitDays),
          note: permitNote,
          classScore: permitScore,
        }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'صدور اجازه ناموفق بود.'); return; }
      setNotice('اجازهٔ آزمون با نمرهٔ کلاسی ثبت شد و به هنرجو اطلاع داده شد.');
      setPermitUser(''); setPermitNote(''); setPermitScore('');
      await loadPermits();
    } finally {
      setBusy(false);
    }
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

  function permitStatus(p) {
    if (p.usedAt) return { label: 'استفاده شده', color: 'var(--muted)' };
    if (p.revoked) return { label: 'باطل شده', color: '#dc2626' };
    if (p.expiresAt && new Date(p.expiresAt) <= new Date()) return { label: 'مهلت گذشته', color: '#dc2626' };
    if (p.classScore === null) return { label: 'نمرهٔ کلاسی ثبت نشده — آزمون باز نمی‌شود', color: '#dc2626' };
    return { label: 'فعال — منتظر شرکت هنرجو', color: '#16a34a' };
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
      setNotice(editingId ? 'سوال ویرایش شد.' : 'سوال افزوده شد.');
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
      setNotice(`${fa(data.created)} سوال افزوده شد.${data.errors?.length ? ` ${fa(data.errors.length)} خط نادیده گرفته شد.` : ''}`);
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
    if (!confirm('این سوال حذف شود؟')) return;
    const res = await fetch(`/api/admin/exam/questions/${q.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!data.ok) { setError(data.error || 'حذف ناموفق بود.'); return; }
    setNotice(data.deactivated ? 'این سوال در آزمون‌های برگزارشده استفاده شده بود، پس فقط غیرفعال شد.' : 'سوال حذف شد.');
    await loadBank(search);
  }

  function editQuestion(q) {
    setEditingId(q.id);
    setForm({ text: q.text, options: [...q.options], correct: q.correct, topic: q.topic || '' });
    setTab('bank');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      {error && <div className="alert alert--error">{error}</div>}
      {notice && <div className="alert alert--success">{notice}</div>}

      <div className="alert alert--info">
        سوال فعال در بانک: <strong>{fa(activeCount)}</strong> — هر آزمون {fa(questionCount)} سوال تصادفی از همین بانک برمی‌دارد.
        {activeCount < questionCount && ' هنوز به تعداد لازم نرسیده‌اید؛ آزمون با همین تعداد موجود برگزار می‌شود.'}
        {' '}مهلت هر سوال: {fa(secondsPerQuestion)} ثانیه — حد نصاب قبولی: {fa(passPercent)} درصد.
        <div style={{ marginTop: 6 }}>
          نمرهٔ نهایی از ۱۰۰: <strong>{fa(examWeight)} نمره از آزمون کتبی</strong> + <strong>{fa(classScoreMax)} نمره تکلیف کلاسی</strong>.
          نمرهٔ کلاسی را هنگام صدور اجازه ثبت می‌کنید و گواهی بر اساس نمرهٔ نهایی صادر می‌شود.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className={`btn ${tab === 'permits' ? 'btn--dark' : ''}`} onClick={() => { setTab('permits'); loadPermits(); }}>اجازهٔ آزمون</button>
        <button className={`btn ${tab === 'bank' ? 'btn--dark' : ''}`} onClick={() => setTab('bank')}>بانک سوالات</button>
        <button className={`btn ${tab === 'results' ? 'btn--dark' : ''}`} onClick={() => { setTab('results'); loadAttempts(); }}>کارنامه‌ها</button>
      </div>

      {tab === 'permits' && (
        <>
          <form className="stack-card" onSubmit={grantPermit}>
            <h3 style={{ marginBottom: 8 }}>صدور اجازهٔ آزمون</h3>
            <p style={{ color: 'var(--muted)', lineHeight: 1.9, marginBottom: 14 }}>
              هیچ هنرجویی بدون اجازهٔ شما نمی‌تواند آزمون بدهد. هر اجازه فقط یک بار مصرف می‌شود؛
              با شروع آزمون خرج می‌شود و برای شرکت دوباره باید اجازهٔ تازه صادر کنید.
              نمرهٔ تکلیف کلاسی هم همین‌جا و پیش از شروع آزمون ثبت می‌شود.
            </p>
            <div className="form-group">
              <label className="form-label">هنرجو</label>
              <select className="form-input" required value={permitUser} onChange={(e) => setPermitUser(e.target.value)}>
                <option value="">— انتخاب کنید —</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id} disabled={passedIds.includes(s.id)}>
                    {(s.displayName || s.username || s.phone)}
                    {s.branch ? ` — ${s.branch}` : ''}
                    {passedIds.includes(s.id) ? ' (قبول شده)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">نمرهٔ تکلیف و فعالیت کلاسی (از {fa(classScoreMax)})</label>
              <input className="form-input" type="number" min={0} max={classScoreMax} step={0.1} required dir="ltr"
                value={permitScore} onChange={(e) => setPermitScore(e.target.value)} placeholder={`عددی بین 0 تا ${classScoreMax} — مثل 18.5`} />
              <span style={{ color: 'var(--muted)', fontSize: '.85rem' }}>
                اعشار تا یک رقم پذیرفته می‌شود (مثل ۱۸٫۵).
                این نمره پیش از آزمون ثبت می‌شود و در پایان به سهم آزمون ({fa(examWeight)} نمره) اضافه می‌شود.
                تا وقتی هنرجو آزمون را شروع نکرده، قابل اصلاح است؛ پس از شروع دیگر تغییر نمی‌کند.
              </span>
            </div>
            <div className="form-group">
              <label className="form-label">مهلت استفاده (روز)</label>
              <input className="form-input" type="number" min={1} max={365} dir="ltr" value={permitDays}
                onChange={(e) => setPermitDays(e.target.value)} placeholder="خالی = بدون مهلت" />
              <span style={{ color: 'var(--muted)', fontSize: '.85rem' }}>
                اگر تا این مهلت آزمون را شروع نکند، اجازه باطل می‌شود. برای بدون‌مهلت، خالی بگذارید.
              </span>
            </div>
            <div className="form-group">
              <label className="form-label">یادداشت (اختیاری)</label>
              <input className="form-input" value={permitNote} onChange={(e) => setPermitNote(e.target.value)} placeholder="مثلاً: تسویهٔ شهریه انجام شد" />
            </div>
            <button className="btn btn--dark" disabled={busy || !permitUser || permitScore === ''}>{busy ? 'در حال صدور…' : 'صدور اجازه و ثبت نمرهٔ کلاسی'}</button>
          </form>

          <div className="stack-card">
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <input className="form-input" placeholder="جست‌وجوی نام یا شماره…" value={permitSearch} onChange={(e) => setPermitSearch(e.target.value)} />
            </div>
            <h3 style={{ marginBottom: 12 }}>اجازه‌های صادرشده</h3>
            {permits.length === 0 ? (
              <p style={{ color: 'var(--muted)' }}>هنوز به کسی اجازهٔ آزمون داده نشده است.</p>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {permits
                  .filter((p) => {
                    const q = permitSearch.trim();
                    if (!q) return true;
                    const hay = `${p.user?.displayName || ''} ${p.user?.username || ''} ${p.user?.phone || ''}`;
                    return hay.includes(q);
                  })
                  .map((p) => {
                    const st = permitStatus(p);
                    return (
                      <div key={p.id} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px' }}>
                        <span>
                          <strong>{p.user?.displayName || p.user?.username || '—'}</strong>{' '}
                          <span dir="ltr" style={{ color: 'var(--muted)' }}>{p.user?.phone}</span>
                        </span>
                        <span style={{ color: 'var(--muted)' }}>صدور: {dateFmt.format(new Date(p.grantedAt))}</span>
                        <span style={{ color: 'var(--muted)' }}>
                          {p.expiresAt ? `مهلت: ${dateFmt.format(new Date(p.expiresAt))}` : 'بدون مهلت'}
                        </span>
                        {editScoreId === p.id ? (
                          <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <input className="form-input" type="number" min={0} max={classScoreMax} step={0.1} dir="ltr"
                              style={{ width: 90 }} value={editScore} onChange={(e) => setEditScore(e.target.value)} />
                            <button className="btn btn--dark" onClick={() => saveScore(p)}>ثبت</button>
                            <button className="btn" onClick={() => { setEditScoreId(null); setEditScore(''); }}>انصراف</button>
                          </span>
                        ) : (
                          <span>
                            نمرهٔ کلاسی: <strong>{p.classScore === null ? '—' : `${fa(p.classScore)} از ${fa(classScoreMax)}`}</strong>
                            {!p.usedAt && !p.revoked && (
                              <button className="btn" style={{ marginRight: 8 }}
                                onClick={() => { setEditScoreId(p.id); setEditScore(p.classScore === null ? '' : String(p.classScore)); }}>
                                {p.classScore === null ? 'ثبت نمره' : 'اصلاح'}
                              </button>
                            )}
                          </span>
                        )}
                        <span style={{ fontWeight: 700, color: st.color }}>{st.label}</span>
                        {!p.usedAt && !p.revoked && (
                          <button className="btn btn--danger" onClick={() => revokePermit(p)}>باطل کن</button>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'bank' && (
        <>
          <form className="stack-card" onSubmit={saveQuestion}>
            <h3 style={{ marginBottom: 14 }}>{editingId ? 'ویرایش سوال' : 'افزودن سوال'}</h3>
            <div className="form-group">
              <label className="form-label">متن سوال</label>
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
              <button className="btn btn--dark" disabled={busy}>{busy ? 'در حال ذخیره…' : editingId ? 'ذخیرهٔ ویرایش' : 'افزودن سوال'}</button>
              {editingId && <button type="button" className="btn" onClick={resetForm}>انصراف</button>}
            </div>
          </form>

          <div className="stack-card">
            <h3 style={{ marginBottom: 8 }}>افزودن گروهی سوال</h3>
            <p style={{ color: 'var(--muted)', lineHeight: 1.9, marginBottom: 12 }}>
              هر خط یک سوال، با علامت <b>|</b> جدا شده:
              <br />
              <code dir="rtl">متن سوال | گزینه۱ | گزینه۲ | گزینه۳ | گزینه۴ | شمارهٔ گزینهٔ درست (۱ تا ۴) | سرفصل (اختیاری)</code>
              <br />
              می‌توانید ستون‌ها را مستقیم از اکسل کپی کنید (جداکننده را به | تبدیل کنید).
            </p>
            <textarea className="form-input" rows={6} dir="rtl" value={bulk} onChange={(e) => setBulk(e.target.value)} placeholder="نقش اول در فیلم چه نامیده می‌شود؟ | پروتاگونیست | آنتاگونیست | فیگوران | نریتور | 1 | مبانی بازیگری" />
            <button type="button" className="btn btn--gold" style={{ marginTop: 12 }} disabled={busy || !bulk.trim()} onClick={importBulk}>
              {busy ? 'در حال افزودن…' : 'افزودن گروهی'}
            </button>
          </div>

          <div className="stack-card">
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <input className="form-input" placeholder="جست‌وجو در متن سوال…" value={search} onChange={(e) => setSearch(e.target.value)} />
              <button className="btn" onClick={() => loadBank(search)}>جست‌وجو</button>
            </div>
            {loading ? <p style={{ color: 'var(--muted)' }}>در حال بارگذاری…</p> : items.length === 0 ? (
              <p style={{ color: 'var(--muted)' }}>هنوز سوالی ثبت نشده است.</p>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {items.map((q, i) => (
                  <div key={q.id} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14, opacity: q.active ? 1 : 0.55 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                      <strong style={{ lineHeight: 1.9 }}>{fa(i + 1)}. {q.text}</strong>
                      {q.topic && <span className="tag tag--dark">{q.topic}</span>}
                    </div>
                    <ol style={{ margin: '10px 0', paddingInlineStart: 20, lineHeight: 1.9, color: 'var(--muted)' }}>
                      {q.options.map((o, oi) => (
                        <li key={oi} style={oi === q.correct ? { color: '#16a34a', fontWeight: 700 } : undefined}>{o}</li>
                      ))}
                    </ol>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn" onClick={() => editQuestion(q)}>ویرایش</button>
                      <button className="btn" onClick={() => toggleActive(q)}>{q.active ? 'غیرفعال کن' : 'فعال کن'}</button>
                      <button className="btn btn--danger" onClick={() => remove(q)}>حذف</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'results' && (
        <div className="stack-card">
          <h3 style={{ marginBottom: 14 }}>کارنامهٔ آزمون‌ها</h3>
          {attempts.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>هنوز کسی در آزمون شرکت نکرده است.</p>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {attempts.map((a) => (
                <div key={a.id} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px' }}>
                  <span><strong>{a.user?.displayName || a.user?.username || '—'}</strong> <span dir="ltr" style={{ color: 'var(--muted)' }}>{a.user?.phone}</span></span>
                  <span style={{ color: 'var(--muted)' }}>{dateFmt.format(new Date(a.submittedAt || a.startedAt))}</span>
                  <span>{a.submittedAt ? `آزمون: ${fa(a.score)} از ${fa(a.total)} (${fa(a.percent)}٪)` : 'در حال برگزاری'}</span>
                  {a.submittedAt && (
                    <span style={{ color: 'var(--muted)' }}>
                      کلاسی: {a.classScore === null ? '—' : `${fa(a.classScore)} از ${fa(classScoreMax)}`}
                    </span>
                  )}
                  {a.submittedAt && (
                    <span><strong>نمرهٔ نهایی: {fa(a.finalPercent ?? a.percent)} از ۱۰۰</strong></span>
                  )}
                  {a.submittedAt && (
                    <span style={{ fontWeight: 700, color: a.passed ? '#16a34a' : '#dc2626' }}>{a.passed ? 'قبول' : 'مردود'}</span>
                  )}
                  {a.certificate && <span dir="ltr" style={{ color: 'var(--muted)' }}>{a.certificate.serial}</span>}
                  <button type="button" className="btn btn--danger" disabled={removingAttemptId === a.id} onClick={() => removeAttempt(a)}>
                    {removingAttemptId === a.id ? 'در حال حذف…' : 'حذف کارنامه'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
