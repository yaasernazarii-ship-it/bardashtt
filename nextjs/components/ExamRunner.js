'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const dateFmt = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
const fa = (n) => new Intl.NumberFormat('fa-IR', { useGrouping: false }).format(n);

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
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [remaining, setRemaining] = useState(0);
  const [result, setResult] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const submittingRef = useRef(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/exam');
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'دریافت اطلاعات آزمون ممکن نشد.'); return; }
      setState(data);
      setAnswers(data.current ? data.current.answers || {} : {});
      setIndex(0);
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

  // آزمونی که مهلتش در نبودِ کاربر تمام شده، همان‌جا تصحیح و بسته می‌شود.
  useEffect(() => {
    if (state?.expiredAttemptId) submit(state.expiredAttemptId, true);
  }, [state?.expiredAttemptId, submit]);

  // شمارش معکوس؛ با رسیدن به صفر، آزمون خودکار ثبت می‌شود.
  useEffect(() => {
    const current = state?.current;
    if (!current) return undefined;
    const end = new Date(current.expiresAt).getTime();
    const tick = () => {
      const left = end - Date.now();
      setRemaining(left);
      if (left <= 0) submit(current.id, true);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [state?.current, submit]);

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

  async function choose(questionId, choice) {
    const current = state?.current;
    if (!current) return;
    setAnswers((a) => ({ ...a, [questionId]: choice }));
    try {
      const res = await fetch('/api/exam/answer', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId: current.id, questionId, choice }),
      });
      const data = await res.json();
      if (!data.ok && data.expired) submit(current.id, true);
    } catch {
      setError('پاسخ ذخیره نشد؛ اتصال اینترنت را بررسی کنید.');
    }
  }

  if (error && !state) return <div className="alert alert--error">{error}</div>;
  if (!state) return <div className="alert">در حال بارگذاری آزمون…</div>;

  const cfg = state.config;
  const current = state.current;

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      {error && <div className="alert alert--error">{error}</div>}

      {result && (
        <div className={`alert alert--${result.passed ? 'success' : 'error'}`}>
          <strong>{result.passed ? 'قبول شدید' : 'متأسفانه حد نصاب را کسب نکردید.'}</strong>
          <div style={{ marginTop: 6 }}>
            نمرهٔ شما: {fa(result.score)} از {fa(result.total)} ({fa(result.percent)} درصد)
            {result.auto && ' — آزمون به‌دلیل پایان مهلت خودکار ثبت شد.'}
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
      {current ? (
        <>
          <div className="stack-card" style={{ position: 'sticky', top: 0, zIndex: 5, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <strong>سوال {fa(index + 1)} از {fa(current.total)}</strong>
              <span style={{ color: 'var(--muted)', marginRight: 12 }}>
                پاسخ‌داده‌شده: {fa(Object.keys(answers).length)}
              </span>
            </div>
            <div style={{ fontWeight: 800, color: remaining < 5 * 60 * 1000 ? '#dc2626' : 'var(--dark)' }}>
              زمان باقی‌مانده: {clock(remaining)}
            </div>
          </div>

          {current.questions[index] && (
            <div className="stack-card">
              {current.questions[index].topic && (
                <span className="tag tag--dark" style={{ marginBottom: 10 }}>{current.questions[index].topic}</span>
              )}
              <h3 style={{ lineHeight: 1.9, marginBottom: 16 }}>{current.questions[index].text}</h3>
              <div style={{ display: 'grid', gap: 10 }}>
                {current.questions[index].options.map((opt, i) => {
                  const qid = current.questions[index].id;
                  const selected = answers[qid] === i;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => choose(qid, selected ? null : i)}
                      style={{
                        textAlign: 'right',
                        padding: '12px 14px',
                        borderRadius: 12,
                        border: `1px solid ${selected ? 'var(--dark)' : 'var(--border)'}`,
                        background: selected ? 'var(--dark)' : '#fff',
                        color: selected ? '#fff' : 'var(--dark)',
                        cursor: 'pointer',
                        font: 'inherit',
                        lineHeight: 1.8,
                      }}
                    >
                      {fa(i + 1)}) {opt}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'space-between' }}>
                <button className="btn" type="button" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>سوال قبلی</button>
                <button className="btn btn--dark" type="button" disabled={index >= current.questions.length - 1} onClick={() => setIndex((i) => i + 1)}>سوال بعدی</button>
              </div>
            </div>
          )}

          <div className="stack-card">
            <h4 style={{ marginBottom: 12 }}>مرور سوالات</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {current.questions.map((q, i) => {
                const done = answers[q.id] !== undefined;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setIndex(i)}
                    style={{
                      width: 38, height: 38, borderRadius: 10, cursor: 'pointer', font: 'inherit', fontWeight: 700,
                      border: `1px solid ${i === index ? 'var(--dark)' : 'var(--border)'}`,
                      background: done ? '#dcfce7' : '#fff',
                      color: 'var(--dark)',
                    }}
                  >
                    {fa(i + 1)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="stack-card">
            {confirming ? (
              <>
                <p style={{ marginBottom: 12, lineHeight: 1.9 }}>
                  {fa(current.total - Object.keys(answers).length)} سوال بی‌پاسخ مانده است.
                  پس از ثبت نهایی، امکان تغییر پاسخ‌ها وجود ندارد.
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn--dark" disabled={busy} onClick={() => submit(current.id)}>{busy ? 'در حال ثبت…' : 'بله، ثبت نهایی کن'}</button>
                  <button className="btn" onClick={() => setConfirming(false)}>بازگشت به آزمون</button>
                </div>
              </>
            ) : (
              <button className="btn btn--gold btn--full" onClick={() => setConfirming(true)}>ثبت نهایی آزمون</button>
            )}
          </div>
        </>
      ) : (
        <div className="stack-card">
          <h3 style={{ marginBottom: 10 }}>آزمون فارغ‌التحصیلی</h3>
          <ul style={{ lineHeight: 2.1, color: 'var(--muted)', paddingInlineStart: 18, marginBottom: 18 }}>
            <li>تعداد سوال: {fa(cfg.questionCount)} سوال چهارگزینه‌ای</li>
            <li>مدت آزمون: {fa(cfg.durationMin)} دقیقه</li>
            <li>حد نصاب قبولی: {fa(cfg.passPercent)} درصد</li>
            <li>پاسخ‌ها هم‌زمان ذخیره می‌شوند؛ اگر ارتباط قطع شود از همان‌جا ادامه می‌دهید.</li>
            <li>با پایان مهلت، آزمون خودکار ثبت و تصحیح می‌شود.</li>
          </ul>

          {state.passedBefore ? (
            <div className="alert alert--success">شما در این آزمون قبول شده‌اید و نیازی به شرکت مجدد نیست.</div>
          ) : state.bankSize === 0 ? (
            <div className="alert alert--info">هنوز سوالی در بانک آزمون ثبت نشده است. لطفاً بعداً مراجعه کنید.</div>
          ) : (
            <button className="btn btn--dark btn--full" disabled={busy} onClick={start}>
              {busy ? 'در حال آماده‌سازی…' : 'شروع آزمون'}
            </button>
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
