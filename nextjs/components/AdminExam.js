'use client';

import { useEffect, useState } from 'react';

const dateFmt = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
const fa = (n) => new Intl.NumberFormat('fa-IR', { useGrouping: false }).format(n ?? 0);
const EMPTY = { text: '', options: ['', '', '', ''], correct: 0, topic: '' };

export default function AdminExam({ questionCount, passPercent }) {
  const [tab, setTab] = useState('bank');
  const [items, setItems] = useState([]);
  const [activeCount, setActiveCount] = useState(0);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [bulk, setBulk] = useState('');

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

  useEffect(() => { loadBank(); loadAttempts(); }, []);

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
        {' '}حد نصاب قبولی: {fa(passPercent)} درصد.
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button className={`btn ${tab === 'bank' ? 'btn--dark' : ''}`} onClick={() => setTab('bank')}>بانک سوالات</button>
        <button className={`btn ${tab === 'results' ? 'btn--dark' : ''}`} onClick={() => { setTab('results'); loadAttempts(); }}>کارنامه‌ها</button>
      </div>

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
                  <span>{a.submittedAt ? `${fa(a.score)} از ${fa(a.total)} (${fa(a.percent)}٪)` : 'در حال برگزاری'}</span>
                  {a.submittedAt && (
                    <span style={{ fontWeight: 700, color: a.passed ? '#16a34a' : '#dc2626' }}>{a.passed ? 'قبول' : 'مردود'}</span>
                  )}
                  {a.certificate && <span dir="ltr" style={{ color: 'var(--muted)' }}>{a.certificate.serial}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
