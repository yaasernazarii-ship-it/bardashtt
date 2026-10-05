'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import Icon from './Icon';
import { GROWTH_SKILLS } from '@/lib/growthSkills';

const fa = (n) => Number(n || 0).toLocaleString('fa-IR');
const dateText = (v) => (v ? new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(new Date(v)) : '—');
const STATUS_LABEL = { active: 'فعال', needs_attention: 'نیازمند توجه', inactive: 'غیرفعال' };
const STATUS_TAG = { active: 'tag--green', needs_attention: 'tag--gold', inactive: 'tag--wine' };
const priorityText = { low: 'کم', medium: 'متوسط', high: 'زیاد' };
const goalStatusText = { active: 'فعال', completed: 'تکمیل‌شده', archived: 'آرشیوشده' };
const taskStatusText = { pending: 'باز', done: 'انجام شده' };
const asgStatusText = { assigned: 'باز', submitted: 'ارسال شده', approved: 'تأیید شده', needs_revision: 'نیازمند اصلاح' };
const milestoneStatusText = { pending: 'باز', in_progress: 'در حال انجام', done: 'انجام شده' };

async function api(path, options) {
  const response = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.ok === false) {
    const error = new Error(body.error || 'request_failed');
    error.status = response.status;
    throw error;
  }
  return body.data;
}

function Section({ title, children }) {
  return <section className="growth-section"><div className="growth-section__head"><h2>{title}</h2></div>{children}</section>;
}

export default function AdminGrowthStudent({ studentId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    setNotFound(false);
    api(`/api/admin/growth/students/${studentId}`)
      .then((d) => setData(d))
      .catch((e) => { if (e.status === 404) setNotFound(true); else setError('دریافت اطلاعات هنرجو با مشکل مواجه شد.'); })
      .finally(() => setLoading(false));
  }, [studentId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="growth-state"><Icon name="sparkles" size={24} /><p>در حال بارگذاری…</p></div>;
  if (notFound) return <div className="growth-state"><Icon name="alertTriangle" size={24} /><p>این هنرجو یافت نشد.</p><Link className="btn btn--gold" href="/dashboard/admin/growth">بازگشت به فهرست</Link></div>;
  if (error || !data) return <div className="growth-state growth-state--error"><Icon name="alertTriangle" size={24} /><p>{error || 'خطایی رخ داد.'}</p><button type="button" className="btn btn--gold" onClick={load}>تلاش مجدد</button></div>;

  const { student, status, activityScore, lastActivityAt, goals, habits, tasks, assignments, journalEntries, assessments, notes } = data;

  return (
    <div>
      <div className="growth-page-title">
        <div>
          <Link className="growth-back" href="/dashboard/admin/growth">← فهرست هنرجویان</Link>
          <h1>{student.displayName}</h1>
          <p>{student.courseTitle || 'بدون دوره'}{student.classGroup ? ` · ${student.classGroup.name}` : ''}</p>
        </div>
        <span className={`tag ${STATUS_TAG[status] || 'tag--dark'}`}>{STATUS_LABEL[status] || status}</span>
      </div>

      <div className="growth-grid" style={{ marginBottom: 18 }}>
        <div className="growth-section">
          <div className="growth-detail-progress">
            <strong>{fa(activityScore)}٪</strong>
            <div className="dash-progress"><div className="dash-progress__bar" style={{ width: `${activityScore || 0}%` }} /></div>
          </div>
          <p className="growth-meta">میزان فعالیت (بر اساس پایبندی به عادت‌ها، کارها و تمرین‌ها) · آخرین فعالیت: {dateText(lastActivityAt)}</p>
        </div>
      </div>

      <div className="growth-grid">
        <GoalsSection goals={goals} />
        <HabitsSection habits={habits} />
        <TasksSection tasks={tasks} />
        <AssignmentsSection studentId={studentId} assignments={assignments} onChange={load} />
        <AssessmentsSection studentId={studentId} assessments={assessments} onChange={load} />
        <NotesSection studentId={studentId} notes={notes} onChange={load} />
        <JournalSection entries={journalEntries} />
      </div>
    </div>
  );
}

function GoalsSection({ goals }) {
  return (
    <Section title={`هدف‌ها (${fa(goals.length)})`}>
      {goals.length === 0 && <p className="growth-meta">هنوز هدفی ثبت نکرده است.</p>}
      <div className="growth-list">
        {goals.map((g) => (
          <div className="growth-list-item" key={g.id} style={{ display: 'block' }}>
            <div className="growth-card-top">
              <strong>{g.title}</strong>
              <span className="tag tag--dark">{goalStatusText[g.status] || g.status}</span>
            </div>
            <p className="growth-meta">اولویت {priorityText[g.priority] || g.priority} · {fa(g.progress)}٪ · مهلت: {dateText(g.endDate)}</p>
            {g.milestones.length > 0 && (
              <ul style={{ margin: '6px 0 0', paddingRight: 18, color: 'var(--muted)', fontSize: '.8rem' }}>
                {g.milestones.map((m) => <li key={m.id}>{m.title} — {milestoneStatusText[m.status] || m.status}</li>)}
              </ul>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}

function HabitsSection({ habits }) {
  return (
    <Section title={`عادت‌ها (${fa(habits.length)})`}>
      {habits.length === 0 && <p className="growth-meta">هنوز عادتی ثبت نکرده است.</p>}
      <div className="growth-list">
        {habits.map((h) => (
          <div className="growth-list-item" key={h.id}>
            <div><strong>{h.title}</strong><small>پایبندی {fa(h.stats?.adherence)}٪ · رکورد فعلی {fa(h.stats?.currentStreak)} روز · بهترین رکورد {fa(h.stats?.bestStreak)}</small></div>
            {!h.active && <span className="tag tag--wine">غیرفعال</span>}
          </div>
        ))}
      </div>
    </Section>
  );
}

function TasksSection({ tasks }) {
  return (
    <Section title={`کارها (${fa(tasks.length)})`}>
      {tasks.length === 0 && <p className="growth-meta">هنوز کاری ثبت نکرده است.</p>}
      <div className="growth-list">
        {tasks.slice(0, 12).map((t) => (
          <div className="growth-list-item" key={t.id}>
            <div><strong>{t.title}</strong><small>مهلت: {dateText(t.dueDate)}</small></div>
            <span className="tag tag--dark">{taskStatusText[t.status] || t.status}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}

function AssignmentsSection({ studentId, assignments, onChange }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [reviewing, setReviewing] = useState(null);
  const [feedback, setFeedback] = useState('');

  async function create(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true); setError('');
    try {
      await api('/api/admin/growth/assignments', { method: 'POST', body: JSON.stringify({ userId: studentId, title, description, dueDate: dueDate || null }) });
      setTitle(''); setDescription(''); setDueDate('');
      onChange();
    } catch { setError('ثبت تمرین با مشکل مواجه شد.'); }
    setBusy(false);
  }

  async function review(assignmentId, reviewStatus) {
    setBusy(true); setError('');
    try {
      await api(`/api/admin/growth/assignments/${assignmentId}/review`, { method: 'POST', body: JSON.stringify({ status: reviewStatus, feedback }) });
      setFeedback(''); setReviewing(null);
      onChange();
    } catch { setError('ثبت بررسی با مشکل مواجه شد.'); }
    setBusy(false);
  }

  return (
    <Section title={`تمرین‌ها (${fa(assignments.length)})`}>
      {error && <div className="alert alert--error">{error}</div>}
      <form className="growth-form" onSubmit={create}>
        <input type="text" placeholder="عنوان تمرین جدید" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <textarea placeholder="توضیح تمرین" value={description} onChange={(e) => setDescription(e.target.value)} />
        <div className="growth-form-row">
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <button type="submit" className="btn btn--gold" disabled={busy}>ثبت تمرین</button>
        </div>
      </form>
      <div className="growth-list">
        {assignments.map((a) => {
          const latest = a.submissions[0];
          const pendingReview = latest && latest.status === 'submitted';
          return (
            <div className="growth-list-item" key={a.id} style={{ display: 'block' }}>
              <div className="growth-card-top">
                <strong>{a.title}</strong>
                <span className="tag tag--dark">{asgStatusText[a.status] || a.status}</span>
              </div>
              <p className="growth-meta">مهلت: {dateText(a.dueDate)}</p>
              {latest && <p className="growth-meta">آخرین ارسال: {dateText(latest.submittedAt)} — {latest.content}</p>}
              {latest?.feedback && <div className="alert alert--info" style={{ margin: '8px 0' }}>بازخورد قبلی: {latest.feedback}</div>}
              {pendingReview && (
                reviewing === a.id ? (
                  <div className="growth-inline-form" style={{ display: 'block' }}>
                    <textarea placeholder="بازخورد برای هنرجو…" value={feedback} onChange={(e) => setFeedback(e.target.value)} style={{ width: '100%', marginBottom: 8 }} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" className="btn btn--gold" disabled={busy} onClick={() => review(a.id, 'approved')}>تأیید</button>
                      <button type="button" className="btn btn--dark" disabled={busy} onClick={() => review(a.id, 'needs_revision')}>نیازمند اصلاح</button>
                      <button type="button" className="growth-text-button" onClick={() => setReviewing(null)}>انصراف</button>
                    </div>
                  </div>
                ) : (
                  <button type="button" className="btn btn--gold" onClick={() => setReviewing(a.id)}>بررسی ارسال</button>
                )
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function AssessmentsSection({ studentId, assessments, onChange }) {
  const [scores, setScores] = useState({});
  const [comments, setComments] = useState({});
  const [generalComment, setGeneralComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    const items = GROWTH_SKILLS
      .filter((skill) => scores[skill] !== undefined && scores[skill] !== '')
      .map((skill) => ({ skill, score: Number(scores[skill]), comment: comments[skill] || '' }));
    if (!items.length) { setError('حداقل امتیاز یک مهارت را وارد کنید.'); return; }
    setBusy(true); setError('');
    try {
      await api(`/api/admin/growth/students/${studentId}/assessments`, { method: 'POST', body: JSON.stringify({ items, generalComment }) });
      setScores({}); setComments({}); setGeneralComment('');
      onChange();
    } catch { setError('ثبت ارزیابی با مشکل مواجه شد.'); }
    setBusy(false);
  }

  return (
    <Section title={`ارزیابی مهارت‌ها (${fa(assessments.length)})`}>
      {error && <div className="alert alert--error">{error}</div>}
      <form className="growth-form" onSubmit={submit}>
        {GROWTH_SKILLS.map((skill) => (
          <div className="growth-form-row" key={skill}>
            <span style={{ flex: 2 }}>{skill}</span>
            <input
              type="number" min="0" max="100" placeholder="نمره ۰ تا ۱۰۰" style={{ flex: 1 }}
              value={scores[skill] ?? ''} onChange={(e) => setScores((s) => ({ ...s, [skill]: e.target.value }))}
            />
            <input
              type="text" placeholder="توضیح (اختیاری)" style={{ flex: 2 }}
              value={comments[skill] ?? ''} onChange={(e) => setComments((c) => ({ ...c, [skill]: e.target.value }))}
            />
          </div>
        ))}
        <textarea placeholder="نظر کلی دربارهٔ این ارزیابی…" value={generalComment} onChange={(e) => setGeneralComment(e.target.value)} />
        <button type="submit" className="btn btn--gold" disabled={busy}>ثبت ارزیابی</button>
      </form>
      <div className="growth-list">
        {assessments.map((a) => (
          <div className="growth-list-item" key={a.id} style={{ display: 'block' }}>
            <p className="growth-meta">{dateText(a.createdAt)}</p>
            <ul style={{ margin: '4px 0', paddingRight: 18 }}>
              {a.items.map((it) => <li key={it.id}>{it.skill}: {fa(it.score)}٪{it.comment ? ` — ${it.comment}` : ''}</li>)}
            </ul>
            {a.generalComment && <p>{a.generalComment}</p>}
          </div>
        ))}
      </div>
    </Section>
  );
}

function NotesSection({ studentId, notes, onChange }) {
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    if (!content.trim()) return;
    setBusy(true); setError('');
    try {
      await api(`/api/admin/growth/students/${studentId}/notes`, { method: 'POST', body: JSON.stringify({ content }) });
      setContent('');
      onChange();
    } catch { setError('ثبت یادداشت با مشکل مواجه شد.'); }
    setBusy(false);
  }

  return (
    <Section title={`یادداشت‌های مربی (${fa(notes.length)})`}>
      {error && <div className="alert alert--error">{error}</div>}
      <form className="growth-inline-form" onSubmit={submit}>
        <input type="text" placeholder="یادداشتی برای این هنرجو بنویس…" value={content} onChange={(e) => setContent(e.target.value)} />
        <button type="submit" className="btn btn--gold" disabled={busy}>ثبت</button>
      </form>
      <div className="growth-list">
        {notes.map((n) => (
          <div className="growth-list-item" key={n.id} style={{ display: 'block' }}>
            <p className="growth-meta">{dateText(n.createdAt)}</p>
            <p>{n.content}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function JournalSection({ entries }) {
  return (
    <Section title={`دفترچهٔ یادداشت اشتراک‌گذاشته‌شده (${fa(entries.length)})`}>
      <p className="growth-meta">فقط یادداشت‌هایی که هنرجو با وضعیت «اشتراک‌گذاشته‌شده» ثبت کرده در این‌جا دیده می‌شوند؛ یادداشت‌های خصوصی برای مدیریت قابل مشاهده نیستند.</p>
      {entries.length === 0 && <p className="growth-meta">یادداشت اشتراک‌گذاشته‌شده‌ای وجود ندارد.</p>}
      <div className="growth-list">
        {entries.map((e) => (
          <div className="growth-list-item" key={e.id} style={{ display: 'block' }}>
            <p className="growth-meta">{dateText(e.createdAt)}</p>
            <p>{e.content}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
