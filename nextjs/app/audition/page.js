'use client';
import { useState } from 'react';
import PageLayout from '@/components/PageLayout';
import { COURSES, QUESTIONS, VIDEO_FORM_URL } from '@/lib/enrollmentData';

const STEPS = ['دوره و مشخصات', 'تست آنلاین', 'نتیجه هوش مصنوعی', 'ارسال ویدیو', 'پایان'];

export default function AuditionPage() {
  const [step, setStep] = useState(0);
  const [courseKey, setCourseKey] = useState('01');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [answers, setAnswers] = useState({});
  const [analysis, setAnalysis] = useState(null); // { actorType, analysis }
  const [videoConfirmed, setVideoConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const allAnswered = Object.keys(answers).length === QUESTIONS.length;
  const startValid = fullName.trim().length >= 3 && /^09\d{9}$/.test(phone.replace(/[^\d]/g, ''));

  async function runAnalysis() {
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/enrollment/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, answers: QUESTIONS.map((_, i) => answers[i]) }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'تحلیل انجام نشد.'); setBusy(false); return; }
      setAnalysis({ actorType: data.actorType, analysis: data.analysis });
      setStep(2);
    } catch {
      setError('ارتباط برقرار نشد. دوباره تلاش کنید.');
    }
    setBusy(false);
  }

  async function submitAll() {
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/enrollment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseKey, fullName, phone,
          answers: QUESTIONS.map((_, i) => answers[i]),
          actorType: analysis?.actorType,
          aiAnalysis: analysis?.analysis,
          videoConfirmed,
        }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'ثبت انجام نشد.'); setBusy(false); return; }
      setStep(4);
    } catch {
      setError('ارتباط برقرار نشد. دوباره تلاش کنید.');
    }
    setBusy(false);
  }

  return (
    <PageLayout>
      <section style={{ background: 'var(--surface)', paddingTop: 40, paddingBottom: 60 }}>
        <div className="container--sm">
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <span className="tag tag--gold">ثبت‌نام دوره‌ها</span>
            <h1 className="heading" style={{ marginTop: 12 }}>ثبت‌نام در دوره‌های بازیگری</h1>
            <p style={{ color: 'var(--muted)' }}>تست آنلاین، تحلیل هوش مصنوعی، ارسال ویدیو و تأیید نهایی</p>
          </div>

          <ol className="enroll-steps">
            {STEPS.map((s, i) => (
              <li key={s} className={i === step ? 'active' : i < step ? 'done' : undefined}>
                <span className="enroll-steps__num">{i < step ? '✓' : i + 1}</span>
                <span className="enroll-steps__label">{s}</span>
              </li>
            ))}
          </ol>

          {error && <div className="alert alert--error" style={{ marginBottom: 14 }}>{error}</div>}

          <div className="enroll-card">
            {step === 0 && (
              <>
                <h3 className="enroll-card__title">دوره مورد نظر را انتخاب کنید</h3>
                <div className="enroll-courses">
                  {COURSES.map((c) => (
                    <button key={c.key} type="button" className={`enroll-course${courseKey === c.key ? ' active' : ''}`} onClick={() => setCourseKey(c.key)}>
                      <span className="enroll-course__num">{c.key}</span>
                      <span className="enroll-course__title">{c.title}</span>
                      <span className="enroll-course__sub">{c.sub}</span>
                    </button>
                  ))}
                </div>
                <div className="form-group"><label className="form-label">نام و نام خانوادگی</label>
                  <input className="form-input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="مثلاً علی رضایی" /></div>
                <div className="form-group"><label className="form-label">شماره موبایل</label>
                  <input className="form-input" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xxxxxxxxx" /></div>
                <button className="btn btn--dark btn--full" disabled={!startValid} onClick={() => setStep(1)}>شروع تست آنلاین</button>
              </>
            )}

            {step === 1 && (
              <>
                <h3 className="enroll-card__title">تست آنلاین بازیگری</h3>
                {QUESTIONS.map((item, qi) => (
                  <div key={item.q} className="enroll-q">
                    <div className="enroll-q__idx">سؤال {qi + 1}</div>
                    <h4 className="enroll-q__text">{item.q}</h4>
                    <div className="enroll-q__opts">
                      {item.options.map((o, oi) => (
                        <button key={o} type="button" className={`enroll-opt${answers[qi] === oi ? ' active' : ''}`} onClick={() => setAnswers({ ...answers, [qi]: oi })}>{o}</button>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="enroll-actions">
                  <button className="btn btn--outline" onClick={() => setStep(0)}>بازگشت</button>
                  <button className="btn btn--dark" disabled={!allAnswered || busy} onClick={runAnalysis}>{busy ? 'در حال تحلیل…' : 'تحلیل هوش مصنوعی'}</button>
                </div>
              </>
            )}

            {step === 2 && analysis && (
              <div className="enroll-result">
                <div className="enroll-result__emoji">🎬</div>
                <div className="enroll-result__label">تیپ بازیگری شما</div>
                <h2 className="enroll-result__type">{analysis.actorType}</h2>
                <p className="enroll-result__text">{analysis.analysis}</p>
                <div className="enroll-actions">
                  <button className="btn btn--outline" onClick={() => setStep(1)}>بازگشت به تست</button>
                  <button className="btn btn--gold" onClick={() => setStep(3)}>ادامه: ارسال ویدیو</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <>
                <h3 className="enroll-card__title">ارسال ویدیوی معرفی</h3>
                <p style={{ color: 'var(--muted)', lineHeight: 1.9, marginBottom: 16 }}>
                  یک ویدیوی کوتاه از خودتان (معرفی و یک اجرای کوتاه) از طریق فرم زیر ارسال کنید. حتماً همان نام و شماره موبایلی را که در این ثبت‌نام وارد کرده‌اید در فرم بنویسید تا درخواست شما شناسایی شود. پس از بررسی و تأیید مدیر، حساب کاربری شما به‌صورت خودکار ساخته می‌شود.
                </p>
                <a className="btn btn--gold btn--full" href={VIDEO_FORM_URL} target="_blank" rel="noopener noreferrer" style={{ marginBottom: 16 }}>باز کردن فرم ارسال ویدیو ↗</a>
                <label className="enroll-confirm">
                  <input type="checkbox" checked={videoConfirmed} onChange={(e) => setVideoConfirmed(e.target.checked)} />
                  <span>ویدیوی معرفی خود را از طریق فرم ارسال کردم.</span>
                </label>
                <div className="enroll-actions">
                  <button className="btn btn--outline" onClick={() => setStep(2)}>بازگشت</button>
                  <button className="btn btn--dark" disabled={busy || !videoConfirmed} onClick={submitAll}>{busy ? 'در حال ثبت…' : 'ثبت نهایی درخواست'}</button>
                </div>
              </>
            )}

            {step === 4 && (
              <div className="enroll-result">
                <div className="enroll-result__emoji">✅</div>
                <h2 className="enroll-result__type" style={{ color: 'var(--gold)' }}>درخواست شما ثبت شد</h2>
                <p className="enroll-result__text">
                  {fullName} عزیز، درخواست ثبت‌نام شما در دوره «{COURSES.find((c) => c.key === courseKey)?.title}» ثبت شد و ویدیوی شما در انتظار بررسی مدیر است. پس از تأیید، حساب کاربری شما ساخته می‌شود و با شماره موبایل خود می‌توانید وارد پنل هنرجو شوید و روند آموزش را دنبال کنید.
                </p>
                <a className="btn btn--dark" href="/auth">ورود به پنل هنرجو</a>
              </div>
            )}
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
