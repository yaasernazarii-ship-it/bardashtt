'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Icon from './Icon';

const fa = (n) => Number(n || 0).toLocaleString('fa-IR');
const dateText = (value) => value ? new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(new Date(value)) : '—';
const tehranKey = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran' }).format(new Date());
const priorityText = { low: 'کم', medium: 'متوسط', high: 'زیاد' };
const statusText = { todo: 'در انتظار', in_progress: 'در حال انجام', done: 'انجام شده', pending: 'باز', submitted: 'ارسال شده', needs_revision: 'نیازمند اصلاح', approved: 'تأیید شده' };

async function api(path, options) {
  const response = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.ok === false) throw new Error(body.error || 'request_failed');
  return body.data;
}

function ErrorState({ retry }) {
  return <div className="growth-state growth-state--error"><Icon name="alertTriangle" size={24} /><p>دریافت اطلاعات مسیر رشد با مشکل مواجه شد.</p>{retry && <button type="button" className="btn btn--gold" onClick={retry}>تلاش مجدد</button>}</div>;
}

function EmptyState({ text, href, label }) {
  return <div className="growth-state"><Icon name="sparkles" size={25} /><p>{text}</p>{href && <Link className="btn btn--gold" href={href}>{label}</Link>}</div>;
}

function Section({ title, action, children, className = '' }) {
  return <section className={`growth-section ${className}`}><div className="growth-section__head"><h2>{title}</h2>{action}</div>{children}</section>;
}

function GoalCard({ goal }) {
  return <article className="dash-card growth-goal-card">
    <div className="growth-card-top"><span className={`tag tag--${goal.priority === 'high' ? 'danger' : goal.priority === 'low' ? 'green' : 'gold'}`}>{priorityText[goal.priority] || goal.priority}</span><span className="growth-card-status">{statusText[goal.status] || goal.status}</span></div>
    <h3 className="dash-card__title">{goal.title}</h3>
    {goal.description && <p className="dash-card__text">{goal.description}</p>}
    <div className="growth-progress-line"><strong>{fa(goal.progress)}٪</strong><div className="dash-progress"><div className="dash-progress__bar" style={{ width: `${goal.progress || 0}%` }} /></div></div>
    <p className="growth-meta">{goal.endDate ? `مهلت: ${dateText(goal.endDate)}` : 'بدون تاریخ پایان'} · {fa(goal.milestoneCount)} گام · {fa(goal.taskCount)} کار</p>
    <Link href={`/dashboard/growth/goals/${goal.id}`} className="dash-card__link">مشاهده هدف ←</Link>
  </article>;
}

function TaskList({ tasks, onToggle }) {
  if (!tasks.length) return <EmptyState text="برای امروز کاری ثبت نشده است." href="/dashboard/growth/goals" label="مدیریت هدف‌ها" />;
  return <div className="growth-list">{tasks.map((task) => <div className={`growth-list-item ${task.status === 'done' ? 'is-done' : ''}`} key={task.id}>
    <button type="button" className="growth-check" aria-label={task.status === 'done' ? 'بازگرداندن کار' : 'انجام کار'} onClick={() => onToggle(task)}><Icon name={task.status === 'done' ? 'checkMark' : 'check'} size={18} /></button>
    <div><strong>{task.title}</strong><small>{task.dueTime || ''} {task.priority ? ` · اولویت ${priorityText[task.priority] || task.priority}` : ''}</small></div>
  </div>)}</div>;
}

function HabitList({ habits, onToggle }) {
  if (!habits.length) return <EmptyState text="هنوز عادتی برای امروز نساخته‌ای." href="/dashboard/growth/habits" label="ساخت عادت" />;
  return <div className="growth-list">{habits.map((habit) => <div className={`growth-list-item ${habit.stats?.todayLogged ? 'is-done' : ''}`} key={habit.id}>
    <button type="button" className="growth-check" aria-label="ثبت عادت امروز" onClick={() => onToggle(habit)}><Icon name={habit.stats?.todayLogged ? 'checkMark' : 'check'} size={18} /></button>
    <div><strong>{habit.title}</strong><small>{fa(habit.stats?.streak)} روز استمرار {habit.goalId ? ' · متصل به هدف' : ''}</small></div>
  </div>)}</div>;
}

function Heatmap({ habits }) {
  const days = useMemo(() => Array.from({ length: 35 }, (_, index) => { const d = new Date(); d.setDate(d.getDate() - 34 + index); const key = d.toISOString().slice(0, 10); return { key, count: habits.reduce((sum, h) => sum + (h.stats?.recentActivity?.[key] || 0), 0) }; }), [habits]);
  return <div className="growth-heatmap" aria-label="تقویم استمرار">{days.map((day) => <span key={day.key} title={`${day.count} فعالیت در ${dateText(day.key)}`} className={`growth-heatmap__cell growth-heatmap__cell--${Math.min(day.count, 4)}`} />)}</div>;
}

export default function GrowthClient({ mode = 'dashboard', goalId = null }) {
  const [data, setData] = useState({ goals: [], tasks: [], habits: [], assignments: [], entries: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      if (mode === 'goal') {
        const result = await api(`/api/growth/goals/${goalId}`); setData({ goal: result.goal });
      } else {
        const [goals, tasks, habits, assignments, journal] = await Promise.all([
          api('/api/growth/goals'), api('/api/growth/tasks?today=1'), api('/api/growth/habits?active=1'), api('/api/growth/assignments'), api('/api/growth/journal'),
        ]);
        setData({ goals: goals.goals, tasks: tasks.tasks, habits: habits.habits, assignments: assignments.assignments, entries: journal.entries });
      }
    } catch { setError(true); } finally { setLoading(false); }
  }, [mode, goalId]);
  useEffect(() => { load(); }, [load]);

  const action = async (fn, message) => { try { await fn(); setNotice(message); await load(); } catch { setNotice('عملیات انجام نشد. دوباره تلاش کن.'); } };
  const toggleTask = (task) => action(() => api(`/api/growth/tasks/${task.id}`, { method: 'PATCH', body: JSON.stringify({ status: task.status === 'done' ? 'todo' : 'done' }) }), 'وضعیت کار به‌روزرسانی شد.');
  const toggleHabit = (habit) => action(() => api(`/api/growth/habits/${habit.id}/log${habit.stats?.todayLogged ? `?logDate=${tehranKey()}` : ''}`, { method: habit.stats?.todayLogged ? 'DELETE' : 'POST', ...(habit.stats?.todayLogged ? {} : { body: '{}' }) }), habit.stats?.todayLogged ? 'ثبت امروز لغو شد.' : 'عادت امروز ثبت شد.');

  if (loading) return <div className="growth-state">در حال آماده‌سازی مسیر رشد…</div>;
  if (error) return <ErrorState retry={load} />;

  if (mode === 'goal') return <GoalDetail goal={data.goal} refresh={load} action={action} />;
  if (mode === 'goals') return <GoalsPage goals={data.goals} refresh={load} action={action} />;
  if (mode === 'habits') return <HabitsPage habits={data.habits} goals={data.goals} refresh={load} action={action} />;
  if (mode === 'journal') return <JournalPage entries={data.entries} refresh={load} />;
  if (mode === 'assignments') return <AssignmentsPage assignments={data.assignments} />;
  if (mode === 'calendar') return <CalendarPage habits={data.habits} />;

  const activeGoals = data.goals.filter((goal) => goal.status !== 'archived' && goal.status !== 'completed');
  return <>
    {notice && <div className="alert alert--success growth-notice">{notice}</div>}
    <div className="dash-head growth-head"><div><h1 className="dash-head__title">مسیر رشد من</h1><p className="dash-head__sub">قدم‌های کوچک، استمرار بزرگ.</p></div><Link className="btn btn--gold" href="/dashboard/growth/goals">مدیریت مسیر</Link></div>
    <div className="dash-stats"><div className="dash-stat"><div className="dash-stat__head"><span className="dash-stat__ico dash-stat__ico--gold"><Icon name="flag" size={20} /></span><span className="dash-stat__label">اهداف فعال</span></div><div className="dash-stat__value">{fa(activeGoals.length)}</div><p className="dash-stat__hint">هدف در مسیر تو</p></div><div className="dash-stat"><div className="dash-stat__head"><span className="dash-stat__ico dash-stat__ico--green"><Icon name="check" size={20} /></span><span className="dash-stat__label">عادت‌های امروز</span></div><div className="dash-stat__value">{fa(data.habits.filter((h) => h.stats?.todayLogged).length)} / {fa(data.habits.length)}</div><p className="dash-stat__hint">ثبت‌شده امروز</p></div><div className="dash-stat"><div className="dash-stat__head"><span className="dash-stat__ico dash-stat__ico--amber"><Icon name="sparkles" size={20} /></span><span className="dash-stat__label">میزان پایبندی</span></div><div className="dash-stat__value">{fa(data.habits.length ? Math.round(data.habits.filter((h) => h.stats?.todayLogged).length * 100 / data.habits.length) : 0)}٪</div><p className="dash-stat__hint">برای امروز</p></div><div className="dash-stat"><div className="dash-stat__head"><span className="dash-stat__ico dash-stat__ico--blue"><Icon name="calendar" size={20} /></span><span className="dash-stat__label">روزهای استمرار</span></div><div className="dash-stat__value">{fa(Math.max(0, ...data.habits.map((h) => h.stats?.streak || 0)))}</div><p className="dash-stat__hint">بیشترین streak</p></div></div>
    <div className="growth-grid"><Section title="هدف‌های من" action={<Link className="dash-card__link" href="/dashboard/growth/goals">+ هدف جدید</Link>}>{activeGoals.length ? <div className="dash-cards">{activeGoals.slice(0, 3).map((goal) => <GoalCard goal={goal} key={goal.id} />)}</div> : <EmptyState text="هنوز هدفی برای مسیر رشدت تعریف نکرده‌ای." href="/dashboard/growth/goals" label="اولین هدفم را بساز" />}</Section><Section title="امروز"><TaskList tasks={data.tasks} onToggle={toggleTask} /></Section><Section title="عادت‌های امروز"><HabitList habits={data.habits} onToggle={toggleHabit} /></Section><Section title="تقویم استمرار"><Heatmap habits={data.habits} /><Link className="dash-card__link" href="/dashboard/growth/calendar">مشاهده تقویم کامل ←</Link></Section><Section title="تمرین‌های من" action={<Link className="dash-card__link" href="/dashboard/growth/assignments">همه تمرین‌ها ←</Link>}>{data.assignments.length ? <div className="growth-list">{data.assignments.slice(0, 3).map((a) => <Link className="growth-list-item" href={`/dashboard/growth/assignments/${a.id}`} key={a.id}><div><strong>{a.title}</strong><small>{statusText[a.status] || a.status} · مهلت {dateText(a.dueDate)}</small></div></Link>)}</div> : <EmptyState text="تمرینی از استاد برایت ثبت نشده است." />}</Section><Section title="یادداشت روزانه" action={<Link className="dash-card__link" href="/dashboard/growth/journal">مشاهده دفترچه ←</Link>}>{data.entries.length ? <div className="growth-journal-preview"><p>{data.entries[0].content}</p><small>{dateText(data.entries[0].createdAt)}</small></div> : <EmptyState text="هنوز یادداشتی در دفترچه رشدت نداری." href="/dashboard/growth/journal" label="یادداشت جدید" />}</Section></div>
  </>;
}

function GoalsPage({ goals, refresh, action }) { const [form, setForm] = useState({ title: '', description: '', priority: 'medium', endDate: '' }); const create = async (e) => { e.preventDefault(); if (!form.title.trim()) return; await action(() => api('/api/growth/goals', { method: 'POST', body: JSON.stringify(form) }), 'هدف ساخته شد.'); setForm({ title: '', description: '', priority: 'medium', endDate: '' }); }; const archive = (goal) => action(() => api(`/api/growth/goals/${goal.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'archived' }) }), 'هدف آرشیو شد.'); return <><div className="growth-page-title"><div><h1>هدف‌های من</h1><p>مسیرت را به قدم‌های روشن و قابل انجام تقسیم کن.</p></div></div><form className="growth-form dash-card" onSubmit={create}><input placeholder="عنوان هدف جدید" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /><textarea placeholder="توضیح کوتاه (اختیاری)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /><div className="growth-form-row"><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option value="low">اولویت کم</option><option value="medium">اولویت متوسط</option><option value="high">اولویت زیاد</option></select><input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /><button className="btn btn--gold">+ ساخت هدف</button></div></form><div className="dash-cards growth-goals-grid">{goals.length ? goals.map((goal) => <div key={goal.id}><GoalCard goal={goal} /><button type="button" className="growth-text-button" onClick={() => archive(goal)}>آرشیو هدف</button></div>) : <EmptyState text="هنوز هدفی برای مسیر رشدت تعریف نکرده‌ای." />}</div></>; }

function GoalDetail({ goal, action }) { const [title, setTitle] = useState(''); const addMilestone = async (e) => { e.preventDefault(); if (!title.trim()) return; await action(() => api(`/api/growth/goals/${goal.id}/milestones`, { method: 'POST', body: JSON.stringify({ title }) }), 'گام اضافه شد.'); setTitle(''); }; const updateMilestone = (m) => action(() => api(`/api/growth/milestones/${m.id}`, { method: 'PATCH', body: JSON.stringify({ status: m.status === 'done' ? 'pending' : 'done', progress: m.status === 'done' ? 0 : 100 }) }), 'گام هدف به‌روزرسانی شد.'); return <><div className="growth-page-title"><div><Link className="growth-back" href="/dashboard/growth/goals">← هدف‌های من</Link><h1>{goal.title}</h1><p>{goal.description || 'هر قدم تو را جلوتر می‌برد.'}</p></div><span className="tag tag--gold">{fa(goal.progress)}٪ پیشرفت</span></div><div className="growth-detail-progress dash-card"><strong>{fa(goal.progress)}٪</strong><div className="dash-progress"><div className="dash-progress__bar" style={{ width: `${goal.progress}%` }} /></div></div><Section title="گام‌های هدف"><div className="growth-list">{goal.milestones.length ? goal.milestones.map((m) => <div className={`growth-list-item ${m.status === 'done' ? 'is-done' : ''}`} key={m.id}><button type="button" className="growth-check" onClick={() => updateMilestone(m)}><Icon name={m.status === 'done' ? 'checkMark' : 'check'} size={18} /></button><div><strong>{m.title}</strong><small>{statusText[m.status] || m.status}</small></div></div>) : <EmptyState text="هنوز گامی برای این هدف تعریف نکرده‌ای." />}</div><form className="growth-inline-form" onSubmit={addMilestone}><input placeholder="عنوان گام جدید" value={title} onChange={(e) => setTitle(e.target.value)} /><button className="btn btn--gold">افزودن گام</button></form></Section><Section title="کارهای مرتبط"><div className="growth-list">{goal.tasks.map((task) => <div className={`growth-list-item ${task.status === 'done' ? 'is-done' : ''}`} key={task.id}><span className="growth-dot" /><div><strong>{task.title}</strong><small>{statusText[task.status] || task.status} · {dateText(task.dueDate)}</small></div></div>)}</div></Section><Section title="عادت‌های مرتبط"><div className="growth-list">{goal.habits.map((habit) => <div className="growth-list-item" key={habit.id}><Icon name="flag" size={18} /><strong>{habit.title}</strong></div>)}</div></Section></>; }

function HabitsPage({ habits, goals, action }) { const [form, setForm] = useState({ title: '', frequencyType: 'daily', frequencyConfig: {}, goalId: '' }); const create = async (e) => { e.preventDefault(); if (!form.title.trim()) return; await action(() => api('/api/growth/habits', { method: 'POST', body: JSON.stringify({ ...form, goalId: form.goalId || null }) }), 'عادت ساخته شد.'); setForm({ title: '', frequencyType: 'daily', frequencyConfig: {}, goalId: '' }); }; return <><div className="growth-page-title"><div><h1>عادت‌های من</h1><p>استمرار، مسیر کوتاه را به نتیجه‌ای بزرگ تبدیل می‌کند.</p></div></div><form className="growth-form dash-card" onSubmit={create}><input placeholder="عنوان عادت جدید" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /><div className="growth-form-row"><select value={form.frequencyType} onChange={(e) => setForm({ ...form, frequencyType: e.target.value, frequencyConfig: e.target.value === 'weekly_days' ? { days: [0, 2, 4] } : e.target.value.includes('count') ? { count: 3 } : {} })}><option value="daily">هر روز</option><option value="weekly_days">روزهای مشخص هفته</option><option value="weekly_count">تعداد در هفته</option><option value="monthly_count">تعداد در ماه</option></select><select value={form.goalId} onChange={(e) => setForm({ ...form, goalId: e.target.value })}><option value="">بدون هدف مرتبط</option>{goals.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}</select><button className="btn btn--gold">+ ساخت عادت</button></div></form><div className="dash-cards">{habits.length ? habits.map((h) => <article className="dash-card" key={h.id}><h3 className="dash-card__title">{h.title}</h3><p className="dash-card__text">{h.frequencyType} · {fa(h.stats?.streak)} روز استمرار</p><span className={`tag ${h.active ? 'tag--green' : ''}`}>{h.active ? 'فعال' : 'آرشیو'}</span></article>) : <EmptyState text="هنوز عادتی نساخته‌ای." />}</div></>; }

function JournalPage({ entries, refresh }) { const [content, setContent] = useState(''); const save = async (e) => { e.preventDefault(); if (!content.trim()) return; await api('/api/growth/journal', { method: 'POST', body: JSON.stringify({ content, visibility: 'private' }) }); setContent(''); refresh(); }; const remove = async (id) => { await api(`/api/growth/journal/${id}`, { method: 'DELETE' }); refresh(); }; return <><div className="growth-page-title"><div><h1>دفترچه رشد</h1><p>جایی خصوصی برای ثبت فکرها و قدم‌های امروزت.</p></div></div><form className="growth-form dash-card" onSubmit={save}><textarea placeholder="امروز چه چیزی یاد گرفتی؟" value={content} onChange={(e) => setContent(e.target.value)} /><button className="btn btn--gold">یادداشت جدید</button></form><div className="growth-journal-list">{entries.map((entry) => <article className="dash-card" key={entry.id}><div className="growth-card-top"><span className="tag tag--green">خصوصی</span><small>{dateText(entry.createdAt)}</small></div><p>{entry.content}</p><button className="growth-text-button" onClick={() => remove(entry.id)}>حذف یادداشت</button></article>)}</div></>; }

function AssignmentsPage({ assignments }) { return <><div className="growth-page-title"><div><h1>تمرین‌های من</h1><p>تمرین‌های استاد را ببین، انجام بده و ارسال کن.</p></div></div><div className="growth-journal-list">{assignments.length ? assignments.map((a) => <Link className="dash-card growth-assignment" href={`/dashboard/growth/assignments/${a.id}`} key={a.id}><h3 className="dash-card__title">{a.title}</h3><p className="dash-card__text">{a.description || 'بدون توضیح'}<br />مهلت: {dateText(a.dueDate)}</p><span className="tag tag--gold">{statusText[a.status] || a.status}</span></Link>) : <EmptyState text="تمرینی از استاد برایت ثبت نشده است." />}</div></>; }

function CalendarPage({ habits }) { return <><div className="growth-page-title"><div><h1>تقویم فعالیت</h1><p>روند استمرار و فعالیت‌های اخیرت.</p></div></div><Section title="فعالیت ۳۵ روز اخیر"><Heatmap habits={habits} /><p className="growth-meta">فعالیت‌های عادت‌ها در این تقویم نمایش داده می‌شوند.</p></Section></>; }
