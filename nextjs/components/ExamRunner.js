'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const dateFmt = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
const fa = (n) => new Intl.NumberFormat('fa-IR', { useGrouping: false }).format(n ?? 0);

function clock(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${fa(m)}:${String(s).padStart(2, '0').replace(/\d/g, (d) => fa(d))}`;
}

export default function ExamRunner() {
  const [state, setState] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [choice, setChoice] = useState(null);
  const [remaining, setRemaining] = useState(0);
  const [result, setResult] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const submittingRef = useRef(false);
  const movingRef = useRef(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/exam');
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'دریافت اطلاعات آزمون ممکن نشد.'); return; }
      setState(data);
      setChoice(data.current ? data.current.choice : null);
    } catch {
      setError('ارتباط با سرور برقرار نشد.');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = useCallback(async (attemptId, auto = false) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setBusy(true);
    try {
      const res = await fetch('/api/exam/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'ثبت آزمون ناموفق بود.'); return; }
      setResult({ ...data.result, certificate: data.certificate, auto });
      setConfirming(false);
      await load();
    } catch {
      setError('ارتباط با سرور برقرار نشد؛ پاسخ‌های شما ذخیره شده است. دوباره تلاش کنید.');
    } finally {
      submittingRef.current = false;
      setBusy(false);
    }
  }, [load]);

  // آزمونی که مهلتش تمام شده، همان‌جا تصحیح و بسته می‌شود.
  useEffect(() => {
    if (state?.expiredAttemptId) submit(state.expiredAttemptId, true);
  }, [state?.expiredAttemptId, submit]);

  // رفتن به سوال بعدی؛ حرکتی یک‌طرفه که سرور هم آن را تأیید می‌کند.
  const goNext = useCallback(async (attemptId, cursor, auto = false) => {
    if (movingRef.current) return;
    movingRef.current = true;
    if (!auto) setBusy(true);
    try {
      const res = await fetch('/api/exam/next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId, cursor }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'رفتن به سوال بعدی ممکن نشد.'); return; }
      if (data.finished) { await submit(attemptId, auto); return; }
      setConfirming(false);
      await load();
    } catch {
      setError('ارتباط با سرور برقرار نشد؛ اتصال اینترنت را بررسی کنید.');
    } finally {
      movingRef.current = false;
      setBusy(false);
    }
  }, [load, submit]);

  // شمارش معکوسِ همین سوال؛ با رسیدن به صفر خودکار به سوال بعدی می‌رود.
  useEffect(() => {
    const current = state?.current;
    if (!current || !current.questionEndsAt) return undefined;
    const end = new Date(current.questionEndsAt).getTime();
    const tick = () => {
      const left = end - Date.now();
      setRemaining(left);
      if (left <= 0) goNext(current.id, current.cursor, true);
    };
    tick();
    const t = setInterval(tick, 500);
    return () => clearInterval(t);
  }, [state?.current, goNext]);

  // آزمون شروع‌شده وقفه ندارد؛ اگر کاربر بخواهد صفحه را ببندد، مرورگر هشدار می‌دهد.
  useEffect(() => {
    if (!state?.current) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [state?.current]);

  async function start() {
    setBusy(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/exam', { method: 'POST' });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'شروع آزمون ممکن نشد.'); return; }
      await load();
    } catch {
      setError('ارتباط با سرور برقرار نشد.');
    } finally {
      setBusy(false);
    }
  }

  // انتخاب گزینه قطعی است: بعد از ثبت، نه عوض می‌شود و نه برداشته می‌شود.
  async function pick(questionId, index) {
    const current = state?.current;
    if (!current || choice !== null) return;
    setChoice(index);
    try {
      const res = await fetch('/api/exam/answer', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId: current.id, questionId, choice: index }),
      });
      const data = await res.json();
      if (data.ok) {
        setState((s) => (s?.current ? { ...s, current: { ...s.current, choice: index, answeredCount: data.answered } } : s));
      } else if (data.expired) {
        submit(current.id, true);
      } else if (data.locked) {
        setChoice(data.choice);
      } else if (data.moved) {
        await load();
      } else {
        setChoice(null);
        setError(data.error || 'ثبت پاسخ ممکن نشد؛ دوباره تلاش کنید.');
      }
    } catch {
      setChoice(null);
      setError('پاسخ ذخیره نشد؛ اتصال اینترنت را بررسی کنید.');
    }
  }

  if (error && !state) return <div className="alert alert--error">{error}</div>;
  if (!state) return <div className="alert">در حال بارگذاری آزمون…</div>;

  const cfg = state.config;
  const current = state.current;
  const q = current?.question;
  const locked = choice !== null; // گزینه انتخاب شده و دیگر قابل تغییر نیست

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      {error && <div className="alert alert--error">{error}</div>}

      {result && (
        <div className={`alert alert--${result.passed ? 'success' : 'error'}`}>
          <strong>{result.passed ? 'قبول شدید' : 'متأسفانه حد نصاب را کسب نکردید.'}</strong>
          <div style={{ marginTop: 6 }}>
            نمرهٔ شما: {fa(result.score)} از {fa(result.total)} ({fa(result.percent)} درصد)
            {result.auto && ' — آزمون به‌دلیل پایان مهلت خودکار ثبت و تصحیح شد.'}
          </div>
          {result.certificate && (
            <div style={{ marginTop: 6 }}>
              کد استعلام گواهی شما: <strong dir="ltr">{result.certificate.serial}</strong>
            </div>
          )}
        </div>
      )}

      {/* گواهی صادرشده */}
      {state.certificate && (
        <div className="stack-card stack-card--dark">
          <span className="tag tag--gold">گواهی‌نامهٔ پایان دوره</span>
          <h3 style={{ margin: '12px 0 6px' }}>گواهی شما صادر شده است</h3>
          <p style={{ lineHeight: 1.9 }}>
            کد استعلام: <strong dir="ltr">{state.certificate.serial}</strong>
            {' — '}تاریخ صدور: {dateFmt.format(new Date(state.certificate.issuedAt))}
          </p>
          <a
            className="btn btn--gold"
            href={`/api/certificate/${encodeURIComponent(state.certificate.serial)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            دریافت فایل گواهی (PDF)
          </a>
        </div>
      )}

      {/* آزمون باز */}
      {current && q ? (
        <>
          <div className="stack-card" style={{ position: 'sticky', top: 0, zIndex: 5, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <strong>سوال {fa(current.cursor + 1)} از {fa(current.total)}</strong>
              <span style={{ color: 'var(--muted)', marginRight: 12 }}>
                پاسخ‌داده‌شده: {fa(current.answeredCount)}
              </span>
            </div>
            <div style={{ fontWeight: 800, color: remaining <= 10000 ? '#dc2626' : 'var(--dark)' }}>
              مهلت این سوال: {clock(remaining)}
            </div>
          </div>

          <div className="alert alert--info">
            به هر سوال {fa(current.perQuestionSec)} ثانیه فرصت دارید. گزینه‌ای که انتخاب کنید <strong>قطعی است و تغییر نمی‌کند</strong>،
            و با تمام‌شدن زمان یا زدن دکمهٔ «سوال بعدی» <strong>بازگشت به این سوال ممکن نیست</strong>.
          </div>

          <div className="stack-card">
            {q.topic && <span className="tag tag--dark" style={{ marginBottom: 10 }}>{q.topic}</span>}
            <h3 style={{ lineHeight: 1.9, marginBottom: 16 }}>{q.text}</h3>
            <div style={{ display: 'grid', gap: 10 }}>
              {q.options.map((opt, i) => {
                const selected = choice === i;
                const dimmed = locked && !selected;
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={locked}
                    onClick={() => pick(q.id, i)}
                    style={{
                      textAlign: 'right',
                      padding: '12px 14px',
                      borderRadius: 12,
                      border: `1px solid ${selected ? 'var(--dark)' : 'var(--border)'}`,
                      background: selected ? 'var(--dark)' : '#fff',
                      color: selected ? '#fff' : dimmed ? 'var(--muted)' : 'var(--dark)',
                      opacity: dimmed ? 0.6 : 1,
                      cursor: locked ? 'default' : 'pointer',
                      font: 'inherit',
                      lineHeight: 1.8,
                    }}
                  >
                    {fa(i + 1)}) {opt}
                  </button>
                );
              })}
            </div>

            {locked && (
              <p style={{ marginTop: 12, color: 'var(--muted)', lineHeight: 1.9 }}>
                پاسخ شما ثبت شد. نتیجهٔ آزمون در پایان اعلام می‌شود.
              </p>
            )}

            <div style={{ marginTop: 18 }}>
              {confirming ? (
                <>
                  <p style={{ marginBottom: 12, lineHeight: 1.9 }}>
                    {current.isLast
                      ? 'این آخرین سوال است. با تأیید، آزمون ثبت و تصحیح می‌شود.'
                      : 'این سوال بی‌پاسخ می‌ماند و دیگر نمی‌توانید به آن برگردید. مطمئنید؟'}
                  </p>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button className="btn btn--dark" disabled={busy} onClick={() => (current.isLast ? submit(current.id) : goNext(current.id, current.cursor))}>
                      {busy ? 'صبر کنید…' : current.isLast ? 'بله، ثبت نهایی کن' : 'بله، سوال بعدی'}
                    </button>
                    <button className="btn" disabled={busy} onClick={() => setConfirming(false)}>انصراف</button>
                  </div>
                </>
              ) : (
                <button
                  className={`btn ${current.isLast ? 'btn--gold' : 'btn--dark'} btn--full`}
                  disabled={busy}
                  onClick={() => {
                    // وقتی پاسخ ثبت شده، چیزی برای تأیید نمانده؛ مستقیم جلو می‌رویم تا وقت هدر نرود.
                    if (locked && !current.isLast) goNext(current.id, current.cursor);
                    else setConfirming(true);
                  }}
                >
                  {current.isLast ? 'پایان و ثبت نهایی آزمون' : 'سوال بعدی'}
                </button>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="stack-card">
          <h3 style={{ marginBottom: 10 }}>آزمون فارغ‌التحصیلی</h3>
          <ul style={{ lineHeight: 2.1, color: 'var(--muted)', paddingInlineStart: 18, marginBottom: 18 }}>
            <li>تعداد سوال: {fa(cfg.questionCount)} سوال چهارگزینه‌ای</li>
            <li>مهلت هر سوال: {fa(cfg.secondsPerQuestion)} ثانیه</li>
            <li>حد نصاب قبولی: {fa(cfg.passPercent)} درصد</li>
            <li>سوال‌ها یکی‌یکی نمایش داده می‌شوند و <strong>بازگشت به سوال قبلی ممکن نیست</strong>.</li>
            <li>با پایان مهلت هر سوال، خودکار به سوال بعدی می‌روید و سوال قبلی بسته می‌شود.</li>
            <li>انتخاب گزینه قطعی است؛ پس از کلیک روی یک گزینه، امکان تغییر آن وجود ندارد.</li>
            <li>درست یا غلط بودن پاسخ‌ها در حین آزمون نمایش داده نمی‌شود؛ نتیجه فقط در پایان اعلام می‌شود.</li>
            <li>آزمون پس از شروع <strong>وقفه ندارد</strong>؛ زمان روی سرور می‌گذرد و با بستن صفحه یا قطعی اینترنت متوقف نمی‌شود.</li>
            <li>در پایان، آزمون بر اساس پاسخ‌های درست شما تصحیح می‌شود.</li>
          </ul>

          {state.passedBefore ? (
            <div className="alert alert--success">شما در این آزمون قبول شده‌اید و نیازی به شرکت مجدد نیست.</div>
          ) : state.bankSize === 0 ? (
            <div className="alert alert--info">هنوز سوالی در بانک آزمون ثبت نشده است. لطفاً بعداً مراجعه کنید.</div>
          ) : state.permitExempt ? (
            <>
              <div className="alert alert--info" style={{ marginBottom: 14 }}>
                شما مدیر/ادیتور هستید و برای بازبینی آزمون به اجازه نیاز ندارید. این اجرا فقط برای بررسی است و
                گواهی‌نامه‌ای از آن صادر نمی‌شود. قواعد آزمون (زمان هر سوال و قطعی‌بودن پاسخ‌ها) برای شما هم برقرار است.
              </div>
              <button className="btn btn--dark btn--full" disabled={busy} onClick={start}>
                {busy ? 'در حال آماده‌سازی…' : 'شروع آزمون (بازبینی مدیر)'}
              </button>
            </>
          ) : !state.permit ? (
            <div className="alert alert--info">
              برای شرکت در آزمون باید مدیر یا ادیتور آموزشگاه به شما اجازه بدهد.
              پس از صدور اجازه، همین‌جا دکمهٔ «شروع آزمون» را می‌بینید و اعلانی هم برایتان فرستاده می‌شود.
            </div>
          ) : (
            <>
              <div className="alert alert--success" style={{ marginBottom: 14 }}>
                اجازهٔ شرکت در آزمون برای شما صادر شده است
                {state.permit.grantedByName ? ` (توسط ${state.permit.grantedByName})` : ''}
                {state.permit.expiresAt ? ` — تا ${dateFmt.format(new Date(state.permit.expiresAt))} فرصت شروع دارید.` : '.'}
              </div>
              <button className="btn btn--dark btn--full" disabled={busy} onClick={start}>
                {busy ? 'در حال آماده‌سازی…' : 'شروع آزمون'}
              </button>
            </>
          )}
        </div>
      )}

      {state.history.length > 0 && (
        <div className="stack-card">
          <h4 style={{ marginBottom: 12 }}>کارنامهٔ آزمون‌های قبلی</h4>
          <div style={{ display: 'grid', gap: 8 }}>
            {state.history.map((h) => (
              <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 10 }}>
                <span>{dateFmt.format(new Date(h.submittedAt || h.startedAt))}</span>
                <span>{fa(h.score ?? 0)} از {fa(h.total)} — {fa(h.percent ?? 0)}٪</span>
                <span style={{ fontWeight: 700, color: h.passed ? '#16a34a' : '#dc2626' }}>{h.passed ? 'قبول' : 'مردود'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
