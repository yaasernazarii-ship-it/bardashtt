'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Icon from './Icon';

const fa = (n) => Number(n || 0).toLocaleString('fa-IR');
const dateText = (value) => (value ? new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(new Date(value)) : '—');
// کلید روز به وقت تهران — باید همیشه با tehranDateKey سمت سرور (lib/growth.js) هم‌شکل بماند؛ هرگز از toISOString/timezone مرورگر استفاده نمی‌شود.
const tehranKey = (date = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran' }).format(date);
const priorityText = { low: 'کم', medium: 'متوسط', high: 'زیاد' };
const statusText = {
  pending: 'باز', in_progress: 'در حال انجام', done: 'انجام شده',
  assigned: 'باز', submitted: 'ارسال شده', needs_revision: 'نیازمند اصلاح', approved: 'تأیید شده',
  active: 'فعال', completed: 'تکمیل‌شده', archived: 'آرشیوشده',
};
const WEEKDAYS = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];

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
    <div><strong>{task.title}</strong><small>{task.dueTime || ''}{task.priority ? ` · اولویت ${priorityText[task.priority] || task.priority}` : ''}</small></div>
  </div>)}</div>;
}

function HabitList({ habits, onToggle }) {
  if (!habits.length) return <EmptyState text="هنوز عادتی برای امروز نساخته‌ای." href="/dashboard/growth/habits" label="ساخت عادت" />;
  return <div className="growth-list">{habits.map((habit) => <div className={`growth-list-item ${habit.stats?.todayLogged ? 'is-done' : ''}`} key={habit.id}>
    <button type="button" className="growth-check" aria-label="ثبت عادت امروز" onClick={() => onToggle(habit)}><Icon name={habit.stats?.todayLogged ? 'checkMark' : 'check'} size={18} /></button>
    <div><strong>{habit.title}</strong><small>{fa(habit.stats?.currentStreak)} روز استمرار{habit.goalId ? ' · متصل به هدف' : ''}</small></div>
  </div>)}</div>;
}

function Heatmap({ habits }) {
  const days = useMemo(() => {
    const now = Date.now();
    return Array.from({ length: 35 }, (_, index) => {
      const key = tehranKey(new Date(now - (34 - index) * 86400000));
      const count = habits.reduce((sum, h) => sum + (h.stats?.recentActivity?.[key] || 0), 0);
      return { key, count };
    });
  }, [habits]);
  return <div className="growth-heatmap" aria-label="تقویم استمرار">{days.map((day) => <span key={day.key} title={`${fa(day.count)} فعالیت در ${dateText(day.key)}`} className={`growth-heatmap__cell growth-heatmap__cell--${Math.min(day.count, 4)}`} />)}</div>;
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
        const result = await api(`/api/growth/goals/${goalId}`);
        setData({ goal: result.goal });
      } else if (mode === 'calendar') {
        // برای تقویم کامل به کارهای انجام‌شده در کل بازه نیاز داریم، نه فقط کارهای امروز؛ برای همین بدون فیلتر today واکشی می‌شود.
        const [habits, tasks, assignments, journal] = await Promise.all([
          api('/api/growth/habits?active=1'), api('/api/growth/tasks'), api('/api/growth/assignments'), api('/api/growth/journal?pageSize=100'),
        ]);
        setData({ goals: [], habits: habits.habits, tasks: tasks.tasks, assignments: assignments.assignments, entries: journal.entries });
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
  const toggleTask = (task) => action(() => api(`/api/growth/tasks/${task.id}`, { method: 'PATCH', body: JSON.stringify({ status: task.status === 'done' ? 'pending' : 'done' }) }), 'وضعیت کار به‌روزرسانی شد.');
  const toggleHabit = (habit) => action(() => api(`/api/growth/habits/${habit.id}/log${habit.stats?.todayLogged ? `?logDate=${tehranKey()}` : ''}`, { method: habit.stats?.todayLogged ? 'DELETE' : 'POST', ...(habit.stats?.todayLogged ? {} : { body: '{}' }) }), habit.stats?.todayLogged ? 'ثبت امروز لغو شد.' : 'عادت امروز ثبت شد.');

  if (loading) return <div className="growth-state">در حال آماده‌سازی مسیر رشد…</div>;
  if (error) return <ErrorState retry={load} />;

  if (mode === 'goal') return <GoalDetail goal={data.goal} action={action} />;
  if (mode === 'goals') return <GoalsPage goals={data.goals} action={action} />;
  if (mode === 'habits') return <HabitsPage habits={data.habits} goals={data.goals} action={action} />;
  if (mode === 'journal') return <JournalPage entries={data.entries} refresh={load} />;
  if (mode === 'assignments') return <AssignmentsPage assignments={data.assignments} />;
  if (mode === 'calendar') return <CalendarPage habits={data.habits} tasks={data.tasks} assignments={data.assignments} entries={data.entries} />;

  const activeGoals = data.goals.filter((goal) => goal.status !== 'archived' && goal.status !== 'completed');
  return <>
    {notice && <div className="alert alert--success growth-notice">{notice}</div>}
    <div className="dash-head growth-head"><div><h1 className="dash-head__title">مسیر رشد من</h1><p className="dash-head__sub">قدم‌های کوچک، استمرار بزرگ.</p></div><Link className="btn btn--gold" href="/dashboard/growth/goals">مدیریت مسیر</Link></div>
    <div className="dash-stats">
      <div className="dash-stat"><div className="dash-stat__head"><span className="dash-stat__ico dash-stat__ico--gold"><Icon name="flag" size={20} /></span><span className="dash-stat__label">اهداف فعال</span></div><div className="dash-stat__value">{fa(activeGoals.length)}</div><p className="dash-stat__hint">هدف در مسیر تو</p></div>
      <div className="dash-stat"><div className="dash-stat__head"><span className="dash-stat__ico dash-stat__ico--green"><Icon name="check" size={20} /></span><span className="dash-stat__label">عادت‌های امروز</span></div><div className="dash-stat__value">{fa(data.habits.filter((h) => h.stats?.todayLogged).length)} / {fa(data.habits.length)}</div><p className="dash-stat__hint">ثبت‌شده امروز</p></div>
      <div className="dash-stat"><div className="dash-stat__head"><span className="dash-stat__ico dash-stat__ico--amber"><Icon name="sparkles" size={20} /></span><span className="dash-stat__label">میزان پایبندی</span></div><div className="dash-stat__value">{fa(data.habits.length ? Math.round(data.habits.filter((h) => h.stats?.todayLogged).length * 100 / data.habits.length) : 0)}٪</div><p className="dash-stat__hint">برای امروز</p></div>
      <div className="dash-stat"><div className="dash-stat__head"><span className="dash-stat__ico dash-stat__ico--blue"><Icon name="calendar" size={20} /></span><span className="dash-stat__label">روزهای استمرار</span></div><div className="dash-stat__value">{fa(Math.max(0, ...data.habits.map((h) => h.stats?.currentStreak || 0)))}</div><p className="dash-stat__hint">بیشترین streak</p></div>
    </div>
    <div className="growth-grid">
      <Section title="هدف‌های من" action={<Link className="dash-card__link" href="/dashboard/growth/goals">+ هدف جدید</Link>}>{activeGoals.length ? <div className="dash-cards">{activeGoals.slice(0, 3).map((goal) => <GoalCard goal={goal} key={goal.id} />)}</div> : <EmptyState text="هنوز هدفی برای مسیر رشدت تعریف نکرده‌ای." href="/dashboard/growth/goals" label="اولین هدفم را بساز" />}</Section>
      <Section title="امروز"><TaskList tasks={data.tasks} onToggle={toggleTask} /></Section>
      <Section title="عادت‌های امروز"><HabitList habits={data.habits} onToggle={toggleHabit} /></Section>
      <Section title="تقویم استمرار"><Heatmap habits={data.habits} /><Link className="dash-card__link" href="/dashboard/growth/calendar">مشاهده تقویم کامل ←</Link></Section>
      <Section title="تمرین‌های من" action={<Link className="dash-card__link" href="/dashboard/growth/assignments">همه تمرین‌ها ←</Link>}>{data.assignments.length ? <div className="growth-list">{data.assignments.slice(0, 3).map((a) => <Link className="growth-list-item" href={`/dashboard/growth/assignments/${a.id}`} key={a.id}><div><strong>{a.title}</strong><small>{statusText[a.status] || a.status} · مهلت {dateText(a.dueDate)}</small></div></Link>)}</div> : <EmptyState text="تمرینی از استاد برایت ثبت نشده است." />}</Section>
      <Section title="یادداشت روزانه" action={<Link className="dash-card__link" href="/dashboard/growth/journal">مشاهده دفترچه ←</Link>}>{data.entries.length ? <div className="growth-journal-preview"><p>{data.entries[0].content}</p><small>{dateText(data.entries[0].createdAt)}</small></div> : <EmptyState text="هنوز یادداشتی در دفترچه رشدت نداری." href="/dashboard/growth/journal" label="یادداشت جدید" />}</Section>
    </div>
  </>;
}

// ===================== اهداف =====================

function GoalsPage({ goals, action }) {
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', endDate: '' });
  const [editingId, setEditingId] = useState(null);

  const create = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    await action(() => api('/api/growth/goals', { method: 'POST', body: JSON.stringify(form) }), 'هدف ساخته شد.');
    setForm({ title: '', description: '', priority: 'medium', endDate: '' });
  };
  const archive = (goal) => action(() => api(`/api/growth/goals/${goal.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'archived' }) }), 'هدف آرشیو شد.');
  const reactivate = (goal) => action(() => api(`/api/growth/goals/${goal.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'active' }) }), 'هدف دوباره فعال شد.');

  return <>
    <div className="growth-page-title"><div><h1>هدف‌های من</h1><p>مسیرت را به قدم‌های روشن و قابل انجام تقسیم کن.</p></div></div>
    <form className="growth-form dash-card" onSubmit={create}>
      <input placeholder="عنوان هدف جدید" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <textarea placeholder="توضیح کوتاه (اختیاری)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <div className="growth-form-row">
        <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option value="low">اولویت کم</option><option value="medium">اولویت متوسط</option><option value="high">اولویت زیاد</option></select>
        <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
        <button className="btn btn--gold">+ ساخت هدف</button>
      </div>
    </form>
    <div className="dash-cards growth-goals-grid">
      {goals.length ? goals.map((goal) => (
        <div key={goal.id}>
          <GoalCard goal={goal} />
          <div className="growth-form-row" style={{ marginTop: 8 }}>
            <button type="button" className="growth-text-button" onClick={() => setEditingId(editingId === goal.id ? null : goal.id)}>{editingId === goal.id ? 'بستن ویرایش' : 'ویرایش هدف'}</button>
            {goal.status === 'archived'
              ? <button type="button" className="growth-text-button" onClick={() => reactivate(goal)}>فعال‌سازی مجدد</button>
              : <button type="button" className="growth-text-button" onClick={() => archive(goal)}>آرشیو هدف</button>}
          </div>
          {editingId === goal.id && <GoalEditForm goal={goal} action={action} onDone={() => setEditingId(null)} />}
        </div>
      )) : <EmptyState text="هنوز هدفی برای مسیر رشدت تعریف نکرده‌ای." />}
    </div>
  </>;
}

function GoalEditForm({ goal, action, onDone }) {
  const [form, setForm] = useState({
    title: goal.title || '', description: goal.description || '', priority: goal.priority || 'medium',
    startDate: goal.startDate ? goal.startDate.slice(0, 10) : '', endDate: goal.endDate ? goal.endDate.slice(0, 10) : '',
  });
  const save = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    await action(() => api(`/api/growth/goals/${goal.id}`, { method: 'PATCH', body: JSON.stringify(form) }), 'هدف به‌روزرسانی شد.');
    onDone();
  };
  return <form className="growth-form dash-card" onSubmit={save}>
    <input placeholder="عنوان هدف" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
    <textarea placeholder="توضیح" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
    <div className="growth-form-row">
      <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option value="low">اولویت کم</option><option value="medium">اولویت متوسط</option><option value="high">اولویت زیاد</option></select>
      <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} title="تاریخ شروع" />
      <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} title="تاریخ پایان" />
    </div>
    <button className="btn btn--gold">ذخیرهٔ تغییرات</button>
  </form>;
}

function GoalDetail({ goal, action }) {
  const [title, setTitle] = useState('');
  const [taskForm, setTaskForm] = useState({ title: '', dueDate: '', priority: 'medium' });
  const [editingMilestoneId, setEditingMilestoneId] = useState(null);

  const addMilestone = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    await action(() => api(`/api/growth/goals/${goal.id}/milestones`, { method: 'POST', body: JSON.stringify({ title }) }), 'گام اضافه شد.');
    setTitle('');
  };
  const toggleMilestone = (m) => action(() => api(`/api/growth/milestones/${m.id}`, { method: 'PATCH', body: JSON.stringify({ status: m.status === 'done' ? 'pending' : 'done', progress: m.status === 'done' ? 0 : 100 }) }), 'گام هدف به‌روزرسانی شد.');
  const deleteMilestone = (m) => { if (!confirm('این گام حذف شود؟')) return; action(() => api(`/api/growth/milestones/${m.id}`, { method: 'DELETE' }), 'گام حذف شد.'); };
  const addTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;
    await action(() => api('/api/growth/tasks', { method: 'POST', body: JSON.stringify({ ...taskForm, goalId: goal.id }) }), 'کار جدید اضافه شد.');
    setTaskForm({ title: '', dueDate: '', priority: 'medium' });
  };
  const toggleTask = (task) => action(() => api(`/api/growth/tasks/${task.id}`, { method: 'PATCH', body: JSON.stringify({ status: task.status === 'done' ? 'pending' : 'done' }) }), 'وضعیت کار به‌روزرسانی شد.');

  return <>
    <div className="growth-page-title">
      <div><Link className="growth-back" href="/dashboard/growth/goals">← هدف‌های من</Link><h1>{goal.title}</h1><p>{goal.description || 'هر قدم تو را جلوتر می‌برد.'}</p></div>
      <span className="tag tag--gold">{fa(goal.progress)}٪ پیشرفت</span>
    </div>
    <div className="growth-detail-progress dash-card"><strong>{fa(goal.progress)}٪</strong><div className="dash-progress"><div className="dash-progress__bar" style={{ width: `${goal.progress}%` }} /></div></div>

    <Section title="گام‌های هدف">
      <div className="growth-list">
        {goal.milestones.length ? goal.milestones.map((m) => <div key={m.id}>
          <div className={`growth-list-item ${m.status === 'done' ? 'is-done' : ''}`}>
            <button type="button" className="growth-check" onClick={() => toggleMilestone(m)}><Icon name={m.status === 'done' ? 'checkMark' : 'check'} size={18} /></button>
            <div><strong>{m.title}</strong><small>{statusText[m.status] || m.status}{m.dueDate ? ` · مهلت ${dateText(m.dueDate)}` : ''}</small></div>
            <div className="growth-form-row" style={{ flex: 'none', gap: 6 }}>
              <button type="button" className="growth-text-button" onClick={() => setEditingMilestoneId(editingMilestoneId === m.id ? null : m.id)}>ویرایش</button>
              <button type="button" className="growth-text-button" onClick={() => deleteMilestone(m)}>حذف</button>
            </div>
          </div>
          {editingMilestoneId === m.id && <MilestoneEditForm milestone={m} action={action} onDone={() => setEditingMilestoneId(null)} />}
        </div>) : <EmptyState text="هنوز گامی برای این هدف تعریف نکرده‌ای." />}
      </div>
      <form className="growth-inline-form" onSubmit={addMilestone}><input placeholder="عنوان گام جدید" value={title} onChange={(e) => setTitle(e.target.value)} /><button className="btn btn--gold">افزودن گام</button></form>
    </Section>

    <Section title="کارهای مرتبط">
      <div className="growth-list">
        {goal.tasks.length ? goal.tasks.map((task) => <div className={`growth-list-item ${task.status === 'done' ? 'is-done' : ''}`} key={task.id}>
          <button type="button" className="growth-check" onClick={() => toggleTask(task)}><Icon name={task.status === 'done' ? 'checkMark' : 'check'} size={18} /></button>
          <div><strong>{task.title}</strong><small>{statusText[task.status] || task.status} · {dateText(task.dueDate)}</small></div>
        </div>) : <EmptyState text="هنوز کاری برای این هدف تعریف نشده است." />}
      </div>
      <form className="growth-form-row growth-inline-form" onSubmit={addTask}>
        <input placeholder="عنوان کار جدید" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} />
        <input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
        <button className="btn btn--gold">افزودن کار</button>
      </form>
    </Section>

    <Section title="عادت‌های مرتبط">
      <div className="growth-list">{goal.habits.length ? goal.habits.map((habit) => <div className="growth-list-item" key={habit.id}><Icon name="flag" size={18} /><strong>{habit.title}</strong></div>) : <EmptyState text="عادتی به این هدف متصل نیست." />}</div>
    </Section>
  </>;
}

function MilestoneEditForm({ milestone, action, onDone }) {
  const [form, setForm] = useState({ title: milestone.title || '', description: milestone.description || '', dueDate: milestone.dueDate ? milestone.dueDate.slice(0, 10) : '', status: milestone.status, progress: milestone.progress || 0 });
  const save = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    await action(() => api(`/api/growth/milestones/${milestone.id}`, { method: 'PATCH', body: JSON.stringify(form) }), 'گام به‌روزرسانی شد.');
    onDone();
  };
  return <form className="growth-form dash-card" onSubmit={save} style={{ marginTop: 8 }}>
    <input placeholder="عنوان گام" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
    <textarea placeholder="توضیح" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
    <div className="growth-form-row">
      <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="pending">در انتظار</option><option value="in_progress">در حال انجام</option><option value="done">انجام شده</option></select>
      <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
      <input type="number" min="0" max="100" value={form.progress} onChange={(e) => setForm({ ...form, progress: e.target.value })} title="درصد پیشرفت" />
      <button className="btn btn--gold">ذخیره</button>
    </div>
  </form>;
}

// ===================== عادت‌ها =====================

function HabitFrequencyFields({ frequencyType, frequencyConfig, onChange }) {
  if (frequencyType === 'weekly_days') {
    const days = frequencyConfig.days || [];
    const toggle = (d) => onChange({ days: days.includes(d) ? days.filter((x) => x !== d) : [...days, d].sort() });
    return <div className="growth-form-row" style={{ flexWrap: 'wrap' }}>{WEEKDAYS.map((label, index) => <label key={index} style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 'none' }}><input type="checkbox" checked={days.includes(index)} onChange={() => toggle(index)} />{label}</label>)}</div>;
  }
  if (frequencyType === 'weekly_count' || frequencyType === 'monthly_count') {
    return <input type="number" min="1" placeholder="تعداد دفعات" value={frequencyConfig.count || ''} onChange={(e) => onChange({ count: parseInt(e.target.value, 10) || 1 })} />;
  }
  return null;
}

function HabitsPage({ habits, goals, action }) {
  const [form, setForm] = useState({ title: '', frequencyType: 'daily', frequencyConfig: {}, goalId: '' });
  const [editingId, setEditingId] = useState(null);

  const create = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    await action(() => api('/api/growth/habits', { method: 'POST', body: JSON.stringify({ ...form, goalId: form.goalId || null }) }), 'عادت ساخته شد.');
    setForm({ title: '', frequencyType: 'daily', frequencyConfig: {}, goalId: '' });
  };
  const toggleActive = (h) => action(() => api(`/api/growth/habits/${h.id}`, { method: 'PATCH', body: JSON.stringify({ active: !h.active }) }), h.active ? 'عادت غیرفعال شد.' : 'عادت دوباره فعال شد.');

  return <>
    <div className="growth-page-title"><div><h1>عادت‌های من</h1><p>استمرار، مسیر کوتاه را به نتیجه‌ای بزرگ تبدیل می‌کند.</p></div></div>
    <form className="growth-form dash-card" onSubmit={create}>
      <input placeholder="عنوان عادت جدید" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <div className="growth-form-row">
        <select value={form.frequencyType} onChange={(e) => setForm({ ...form, frequencyType: e.target.value, frequencyConfig: e.target.value === 'weekly_days' ? { days: [0, 2, 4] } : e.target.value.includes('count') ? { count: 3 } : {} })}>
          <option value="daily">هر روز</option><option value="weekly_days">روزهای مشخص هفته</option><option value="weekly_count">تعداد در هفته</option><option value="monthly_count">تعداد در ماه</option>
        </select>
        <select value={form.goalId} onChange={(e) => setForm({ ...form, goalId: e.target.value })}><option value="">بدون هدف مرتبط</option>{goals.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}</select>
        <button className="btn btn--gold">+ ساخت عادت</button>
      </div>
      <HabitFrequencyFields frequencyType={form.frequencyType} frequencyConfig={form.frequencyConfig} onChange={(c) => setForm({ ...form, frequencyConfig: c })} />
    </form>
    <div className="dash-cards">
      {habits.length ? habits.map((h) => <div key={h.id}>
        <article className="dash-card">
          <div className="growth-card-top"><span className={`tag ${h.active ? 'tag--green' : ''}`}>{h.active ? 'فعال' : 'غیرفعال'}</span><span className="growth-card-status">{fa(h.stats?.adherence)}٪ پایبندی</span></div>
          <h3 className="dash-card__title">{h.title}</h3>
          <p className="dash-card__text">{fa(h.stats?.currentStreak)} روز استمرار جاری · بهترین استمرار {fa(h.stats?.bestStreak)} روز</p>
          <div className="growth-form-row" style={{ marginTop: 8 }}>
            <button type="button" className="growth-text-button" onClick={() => setEditingId(editingId === h.id ? null : h.id)}>{editingId === h.id ? 'بستن ویرایش' : 'ویرایش'}</button>
            <button type="button" className="growth-text-button" onClick={() => toggleActive(h)}>{h.active ? 'غیرفعال کردن' : 'فعال کردن'}</button>
          </div>
        </article>
        {editingId === h.id && <HabitEditForm habit={h} action={action} goals={goals} onDone={() => setEditingId(null)} />}
      </div>) : <EmptyState text="هنوز عادتی نساخته‌ای." />}
    </div>
  </>;
}

function HabitEditForm({ habit, goals, action, onDone }) {
  const [form, setForm] = useState({ title: habit.title, description: habit.description || '', frequencyType: habit.frequencyType, frequencyConfig: habit.frequencyConfig || {}, goalId: habit.goalId || '' });
  const save = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    await action(() => api(`/api/growth/habits/${habit.id}`, { method: 'PATCH', body: JSON.stringify({ ...form, goalId: form.goalId || null }) }), 'عادت به‌روزرسانی شد.');
    onDone();
  };
  return <form className="growth-form dash-card" onSubmit={save}>
    <input placeholder="عنوان عادت" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
    <textarea placeholder="توضیح" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
    <div className="growth-form-row">
      <select value={form.frequencyType} onChange={(e) => setForm({ ...form, frequencyType: e.target.value, frequencyConfig: e.target.value === 'weekly_days' ? { days: [] } : e.target.value.includes('count') ? { count: 1 } : {} })}>
        <option value="daily">هر روز</option><option value="weekly_days">روزهای مشخص هفته</option><option value="weekly_count">تعداد در هفته</option><option value="monthly_count">تعداد در ماه</option>
      </select>
      <select value={form.goalId} onChange={(e) => setForm({ ...form, goalId: e.target.value })}><option value="">بدون هدف مرتبط</option>{goals.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}</select>
    </div>
    <HabitFrequencyFields frequencyType={form.frequencyType} frequencyConfig={form.frequencyConfig} onChange={(c) => setForm({ ...form, frequencyConfig: c })} />
    <button className="btn btn--gold">ذخیرهٔ تغییرات</button>
  </form>;
}

// ===================== دفترچه رشد =====================

function JournalPage({ entries, refresh }) {
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('private');
  const [editingId, setEditingId] = useState(null);

  const save = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    await api('/api/growth/journal', { method: 'POST', body: JSON.stringify({ content, visibility }) });
    setContent(''); setVisibility('private'); refresh();
  };
  const remove = async (id) => { if (!confirm('این یادداشت حذف شود؟')) return; await api(`/api/growth/journal/${id}`, { method: 'DELETE' }); refresh(); };

  return <>
    <div className="growth-page-title"><div><h1>دفترچه رشد</h1><p>یادداشت خصوصی فقط برای خودت می‌ماند؛ یادداشت مشترک را استاد هم می‌بیند.</p></div></div>
    <form className="growth-form dash-card" onSubmit={save}>
      <textarea placeholder="امروز چه چیزی یاد گرفتی؟" value={content} onChange={(e) => setContent(e.target.value)} />
      <div className="growth-form-row">
        <select value={visibility} onChange={(e) => setVisibility(e.target.value)}><option value="private">خصوصی (فقط خودم)</option><option value="shared">مشترک (استاد هم ببیند)</option></select>
        <button className="btn btn--gold">یادداشت جدید</button>
      </div>
    </form>
    <div className="growth-journal-list">
      {entries.length ? entries.map((entry) => <article className="dash-card" key={entry.id}>
        <div className="growth-card-top"><span className={`tag ${entry.visibility === 'shared' ? 'tag--gold' : 'tag--green'}`}>{entry.visibility === 'shared' ? 'مشترک با استاد' : 'خصوصی'}</span><small>{dateText(entry.createdAt)}</small></div>
        {editingId === entry.id
          ? <JournalEditForm entry={entry} refresh={refresh} onDone={() => setEditingId(null)} />
          : <>
            <p>{entry.content}</p>
            <div className="growth-form-row">
              <button type="button" className="growth-text-button" onClick={() => setEditingId(entry.id)}>ویرایش</button>
              <button type="button" className="growth-text-button" onClick={() => remove(entry.id)}>حذف یادداشت</button>
            </div>
          </>}
      </article>) : <EmptyState text="هنوز یادداشتی در دفترچه رشدت نداری." />}
    </div>
  </>;
}

function JournalEditForm({ entry, refresh, onDone }) {
  const [content, setContent] = useState(entry.content);
  const [visibility, setVisibility] = useState(entry.visibility);
  const save = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    await api(`/api/growth/journal/${entry.id}`, { method: 'PATCH', body: JSON.stringify({ content, visibility }) });
    onDone(); refresh();
  };
  return <form className="growth-form" onSubmit={save}>
    <textarea value={content} onChange={(e) => setContent(e.target.value)} />
    <div className="growth-form-row">
      <select value={visibility} onChange={(e) => setVisibility(e.target.value)}><option value="private">خصوصی (فقط خودم)</option><option value="shared">مشترک (استاد هم ببیند)</option></select>
      <button className="btn btn--gold">ذخیره</button>
      <button type="button" className="growth-text-button" onClick={onDone}>انصراف</button>
    </div>
  </form>;
}

// ===================== تمرین‌ها =====================

function AssignmentsPage({ assignments }) {
  return <>
    <div className="growth-page-title"><div><h1>تمرین‌های من</h1><p>تمرین‌های استاد را ببین، انجام بده و ارسال کن.</p></div></div>
    <div className="growth-journal-list">
      {assignments.length ? assignments.map((a) => <Link className="dash-card growth-assignment" href={`/dashboard/growth/assignments/${a.id}`} key={a.id}>
        <h3 className="dash-card__title">{a.title}</h3>
        <p className="dash-card__text">{a.description || 'بدون توضیح'}<br />مهلت: {dateText(a.dueDate)}</p>
        <span className="tag tag--gold">{statusText[a.status] || a.status}</span>
      </Link>) : <EmptyState text="تمرینی از استاد برایت ثبت نشده است." />}
    </div>
  </>;
}

// ===================== تقویم فعالیت =====================

function CalendarPage({ habits, tasks, assignments, entries }) {
  const days = useMemo(() => {
    const now = Date.now();
    const keys = Array.from({ length: 35 }, (_, index) => tehranKey(new Date(now - (34 - index) * 86400000)));
    const map = Object.fromEntries(keys.map((k) => [k, { habit: 0, task: 0, journal: 0, assignment: 0 }]));

    for (const h of habits || []) {
      for (const [key, count] of Object.entries(h.stats?.recentActivity || {})) {
        if (map[key]) map[key].habit += count;
      }
    }
    for (const t of tasks || []) {
      if (t.status === 'done' && t.completedAt) {
        const key = tehranKey(new Date(t.completedAt));
        if (map[key]) map[key].task += 1;
      }
    }
    for (const e of entries || []) {
      const key = tehranKey(new Date(e.createdAt));
      if (map[key]) map[key].journal += 1;
    }
    for (const a of assignments || []) {
      for (const s of a.submissions || []) {
        const key = tehranKey(new Date(s.submittedAt));
        if (map[key]) map[key].assignment += 1;
      }
    }

    return keys.map((key) => ({ key, ...map[key], total: map[key].habit + map[key].task + map[key].journal + map[key].assignment }));
  }, [habits, tasks, assignments, entries]);

  return <>
    <div className="growth-page-title"><div><h1>تقویم فعالیت</h1><p>روند استمرار و فعالیت‌های ۳۵ روز اخیرت — عادت، کار، یادداشت و تمرین.</p></div></div>
    <Section title="فعالیت ۳۵ روز اخیر">
      <div className="growth-heatmap" aria-label="تقویم فعالیت">
        {days.map((day) => <span key={day.key} title={`${dateText(day.key)} — عادت ${fa(day.habit)}، کار ${fa(day.task)}، یادداشت ${fa(day.journal)}، تمرین ${fa(day.assignment)}`} className={`growth-heatmap__cell growth-heatmap__cell--${Math.min(day.total, 4)}`} />)}
      </div>
      <p className="growth-meta">هر خانه یک روز (به وقت تهران) است؛ برای دیدن جزئیات نشانگر را روی خانه نگه دار.</p>
    </Section>
  </>;
}
