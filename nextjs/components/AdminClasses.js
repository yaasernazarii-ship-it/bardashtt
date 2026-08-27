'use client';

import { useEffect, useRef, useState } from 'react';
import ShamsiCalendar from '@/components/ShamsiCalendar';
import ShamsiDateTimeField from '@/components/ShamsiDateTimeField';
import UserPhotoThumb from '@/components/UserPhotoThumb';
import { uploadFile } from '@/lib/uploadClient';

const BRANCHES = ['تهران', 'ساری'];
const dateFmt = new Intl.DateTimeFormat('fa-IR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' });

// نتیجهٔ پیامکِ ثبت/ویرایش جلسه باید دیده شود؛ وگرنه «هیچ پیامکی نرفت» بی‌صدا می‌ماند.
function smsSummary(result) {
  if (result.timeChanged === false) return 'تغییرات جلسه ذخیره شد. چون زمان جلسه عوض نشد، پیامکی برای هنرجویان ارسال نشد.';
  if (!result.memberCount) return 'جلسه ذخیره شد، اما این کلاس هنوز هنرجویی ندارد و پیامکی ارسال نشد. ابتدا از تب «هنرجویان» اعضای کلاس را انتخاب کنید.';
  if (!result.smsQueued) return 'جلسه ذخیره شد، اما پیامکی ارسال نشد؛ شماره موبایل معتبری برای هنرجویان این کلاس ثبت نشده است.';
  return `جلسه ذخیره شد و پیامک اطلاع‌رسانی برای ${Number(result.smsQueued).toLocaleString('fa-IR')} هنرجوی این کلاس ارسال شد.`;
}

const emptySession = { title: '', startsAt: '', chartDescription: '', tools: '', homework: '' };
const emptyGroup = { name: '', branch: 'تهران', courseTitle: '', teacherName: '', coverImage: '', totalSessions: '8' };

// انتخاب و آپلودِ عکس کلاس؛ مقدارِ ذخیره‌شده آدرسِ /media/… است.
function ClassCoverPicker({ value, onChange, label = 'عکس کلاس (اختیاری)' }) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');
  const fileRef = useRef(null);

  async function pick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setErr('');
    const d = await uploadFile(file);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
    if (d.ok) onChange(d.url);
    else setErr(d.error || 'آپلود ناموفق بود.');
  }

  return (
    <div className="class-cover-field">
      {label && <label className="form-label">{label}</label>}
      <input ref={fileRef} type="file" accept="image/*" onChange={pick} disabled={uploading} hidden />
      <div className="class-cover-field__body">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="عکس کلاس" />
        ) : <div className="class-cover-field__empty">بدون تصویر</div>}
        <div className="class-cover-field__actions">
          <button type="button" className="btn btn--sm btn--outline" onClick={() => fileRef.current?.click()} disabled={uploading}>{uploading ? 'در حال آپلود…' : value ? 'تغییر تصویر' : 'انتخاب تصویر'}</button>
          {value && <button type="button" className="btn btn--sm btn--ghost" onClick={() => onChange('')}>حذف تصویر</button>}
        </div>
      </div>
      {err && <span className="class-cover-field__error">{err}</span>}
    </div>
  );
}

export default function AdminClasses() {
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newGroup, setNewGroup] = useState(emptyGroup);
  const [openId, setOpenId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [rosterOpen, setRosterOpen] = useState(false);
  const [query, setQuery] = useState('');

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/classes');
    const d = await res.json();
    if (d.ok) { setGroups(d.groups); setStudents(d.students); }
    else setError(d.error || 'خطا در بارگذاری.');
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function createGroup(e) {
    e.preventDefault();
    setError('');
    if (!newGroup.name.trim()) { setError('نام کلاس الزامی است.'); return; }
    const res = await fetch('/api/admin/classes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newGroup),
    });
    const d = await res.json();
    if (!d.ok) { setError(d.error || 'خطا.'); return; }
    setNewGroup(emptyGroup);
    setCreateOpen(false);
    load();
  }

  if (loading) return <p style={{ color: 'var(--muted)' }}>در حال بارگذاری…</p>;

  const needle = query.trim().toLowerCase();
  const visibleGroups = groups.filter((group) => !needle || [group.name, group.branch, group.courseTitle, group.teacherName]
    .filter(Boolean).join(' ').toLowerCase().includes(needle));
  const totalSessions = groups.reduce((sum, group) => sum + Number(group._count?.sessions || 0), 0);
  const totalMembers = groups.reduce((sum, group) => sum + Number(group.members?.length || 0), 0);
  const selectedGroup = groups.find((group) => group.id === openId);

  if (selectedGroup) {
    return (
      <div className="admin-class-workspace">
        {error && <div className="alert alert--error">{error}</div>}
        <GroupCard group={selectedGroup} students={students} open onBack={() => setOpenId(null)} onChanged={load} />
      </div>
    );
  }

  return (
    <div className="admin-operation-page admin-classes">
      {error && <div className="alert alert--error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="admin-stat-grid admin-stat-grid--classes">
        <div className="admin-stat"><strong>{groups.length.toLocaleString('fa-IR')}</strong><span>کلاس فعال</span></div>
        <div className="admin-stat admin-stat--success"><strong>{totalMembers.toLocaleString('fa-IR')}</strong><span>عضویت در کلاس‌ها</span></div>
        <div className="admin-stat admin-stat--warning"><strong>{totalSessions.toLocaleString('fa-IR')}</strong><span>جلسه ثبت‌شده</span></div>
        <div className="admin-stat"><strong>{students.length.toLocaleString('fa-IR')}</strong><span>هنرجوی در حال تحصیل</span></div>
      </div>

      <div className="admin-list-toolbar">
        <label className="admin-search"><span aria-hidden="true">⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="جست‌وجوی کلاس، شعبه، دوره یا استاد…" /></label>
        <span className="admin-list-toolbar__count">{visibleGroups.length.toLocaleString('fa-IR')} کلاس</span>
        <button type="button" className="btn btn--outline btn--sm" onClick={() => setRosterOpen((value) => !value)}>{rosterOpen ? 'بستن هنرجویان' : 'فهرست هنرجویان'}</button>
        <button type="button" className="btn btn--dark btn--sm" onClick={() => setCreateOpen((value) => !value)}>{createOpen ? 'بستن فرم' : '+ کلاس جدید'}</button>
      </div>

      {/* ساخت کلاس جدید */}
      {createOpen && <form onSubmit={createGroup} className="form-shell admin-create-panel" style={{ marginBottom: 16 }}>
        <div className="admin-create-panel__head"><div><h2>افزودن کلاس جدید</h2><p>مشخصات اصلی کلاس را ثبت کنید؛ جلسات پس از ساخت کلاس اضافه می‌شوند.</p></div><button type="button" className="btn btn--ghost btn--sm" onClick={() => setCreateOpen(false)}>بستن</button></div>
        <div className="cal-form-grid">
          <div className="form-group">
            <label className="form-label">نام کلاس *</label>
            <input className="form-input" value={newGroup.name} onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })} placeholder="مثلاً بازیگری الف" />
          </div>
          <div className="form-group">
            <label className="form-label">شعبه *</label>
            <select className="form-input" value={newGroup.branch} onChange={(e) => setNewGroup({ ...newGroup, branch: e.target.value })}>
              {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">دوره</label>
            <input className="form-input" value={newGroup.courseTitle} onChange={(e) => setNewGroup({ ...newGroup, courseTitle: e.target.value })} placeholder="مثلاً دوره مقدماتی بازیگری" />
          </div>
          <div className="form-group">
            <label className="form-label">نام استاد</label>
            <input className="form-input" value={newGroup.teacherName} onChange={(e) => setNewGroup({ ...newGroup, teacherName: e.target.value })} placeholder="مثلاً علی محمدی" />
          </div>
          <div className="form-group">
            <label className="form-label">تعداد کل جلسات دوره</label>
            <input className="form-input" type="number" min={1} max={100} value={newGroup.totalSessions}
              onChange={(e) => setNewGroup({ ...newGroup, totalSessions: e.target.value })} placeholder="۸" />
          </div>
          <ClassCoverPicker value={newGroup.coverImage} onChange={(url) => setNewGroup({ ...newGroup, coverImage: url })} />
        </div>
        <button className="btn btn--dark" type="submit">افزودن کلاس</button>
      </form>}

      {/* فهرست اسامیِ هنرجویانِ در حال تحصیل، جدا به تفکیک شعبه */}
      {rosterOpen && <StudentRoster students={students} />}

      {groups.length === 0 ? (
        <div className="su-empty">هنوز کلاسی ساخته نشده است.</div>
      ) : visibleGroups.length === 0 ? (
        <div className="su-empty">کلاسی مطابق جست‌وجوی شما پیدا نشد.</div>
      ) : (
        <div className="admin-class-list">
          {visibleGroups.map((g) => (
            <GroupCard key={g.id} group={g} students={students} open={false} onToggle={() => setOpenId(g.id)} onChanged={load} />
          ))}
        </div>
      )}
    </div>
  );
}

function StudentRoster({ students }) {
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  const match = (s) => !query || [s.displayName, s.username, s.phone].some((v) => (v || '').toLowerCase().includes(query));

  const columns = BRANCHES.map((branch) => ({
    branch,
    list: students.filter((s) => (s.branch === branch) && match(s)),
  }));
  // هنرجوی بدون شعبه‌ی مشخص
  const others = students.filter((s) => !s.branch && match(s));

  return (
    <div className="form-shell admin-roster" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <h2 className="heading" style={{ fontSize: '1.1rem', margin: 0 }}>فهرست هنرجویان (به تفکیک شعبه)</h2>
        <input className="form-input" placeholder="جستجوی نام هنرجو…" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 280 }} />
      </div>
      <p style={{ fontSize: '.78rem', color: 'var(--muted)', marginTop: 0, marginBottom: 14 }}>فقط هنرجویانِ در حال تحصیل نمایش داده می‌شوند؛ فارغ‌التحصیل‌ها در این فهرست نمی‌آیند.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 14 }}>
        {columns.map((col) => (
          <div key={col.branch} style={{ background: 'var(--surface)', borderRadius: 12, padding: 14 }}>
            <div style={{ fontWeight: 800, marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
              <span>شعبه {col.branch}</span>
              <span style={{ color: 'var(--muted)', fontSize: '.82rem' }}>{col.list.length.toLocaleString('fa-IR')} نفر</span>
            </div>
            {col.list.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: '.82rem', margin: 0 }}>موردی نیست.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 6, maxHeight: 260, overflowY: 'auto' }}>
                {col.list.map((s) => (
                  <li key={s.id} style={{ fontSize: '.85rem', padding: '6px 8px', background: '#fff', borderRadius: 8, border: '1px solid var(--border)' }}>
                    {s.displayName || s.phone}
                    {s.username && <span style={{ color: 'var(--muted)' }}> · {s.username}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
        {others.length > 0 && (
          <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 14 }}>
            <div style={{ fontWeight: 800, marginBottom: 10 }}>بدون شعبه</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 6, maxHeight: 260, overflowY: 'auto' }}>
              {others.map((s) => (
                <li key={s.id} style={{ fontSize: '.85rem', padding: '6px 8px', background: '#fff', borderRadius: 8, border: '1px solid var(--border)' }}>
                  {s.displayName || s.phone}{s.username && <span style={{ color: 'var(--muted)' }}> · {s.username}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

const TABS = [
  { id: 'sessions', label: 'جلسات، ابزار و تمرین' },
  { id: 'members', label: 'هنرجویان' },
  { id: 'attendance', label: 'حضور و غیاب' },
  { id: 'progress', label: 'پیشرفت هنرجویان' },
  { id: 'settings', label: 'تنظیمات کلاس' },
];

function GroupCard({ group, students, open, onToggle, onBack, onChanged }) {
  const branchStudents = students.filter((s) => !s.branch || s.branch === group.branch);
  const [tab, setTab] = useState('sessions');
  const [memberQuery, setMemberQuery] = useState('');
  const [memberIds, setMemberIds] = useState(group.members.map((m) => m.id));
  const [savingMembers, setSavingMembers] = useState(false);
  const [sessions, setSessions] = useState(null);
  const [sForm, setSForm] = useState(emptySession);
  const [editingSession, setEditingSession] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [totalSessions, setTotalSessions] = useState(String(group.totalSessions || 8));
  const [cover, setCover] = useState(group.coverImage || '');
  const [groupName, setGroupName] = useState(group.name || '');
  const [branch, setBranch] = useState(group.branch || BRANCHES[0]);
  const [courseTitle, setCourseTitle] = useState(group.courseTitle || '');
  const [teacherName, setTeacherName] = useState(group.teacherName || '');
  const [attendanceSessionId, setAttendanceSessionId] = useState(null);
  const [sessionFormOpen, setSessionFormOpen] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(false);

  useEffect(() => { setMemberIds(group.members.map((m) => m.id)); }, [group]);
  useEffect(() => { setTotalSessions(String(group.totalSessions || 8)); }, [group.totalSessions]);
  useEffect(() => { setCover(group.coverImage || ''); }, [group.coverImage]);
  useEffect(() => { setGroupName(group.name || ''); setBranch(group.branch || BRANCHES[0]); setCourseTitle(group.courseTitle || ''); }, [group.name, group.branch, group.courseTitle]);
  useEffect(() => { setTeacherName(group.teacherName || ''); }, [group.teacherName]);

  async function saveSettings() {
    if (!groupName.trim()) { setMsg('نام کلاس الزامی است.'); return; }
    setSettingsSaving(true); setMsg('');
    const res = await fetch(`/api/admin/classes/${group.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: groupName, branch, courseTitle, teacherName, coverImage: cover, totalSessions }),
    });
    const d = await res.json();
    setSettingsSaving(false);
    if (d.ok) { setMsg('تنظیمات کلاس ذخیره شد.'); onChanged(); }
    else setMsg(d.error || 'خطا');
  }

  async function loadSessions() {
    const res = await fetch(`/api/admin/sessions?groupId=${group.id}`);
    const d = await res.json();
    if (d.ok) setSessions(d.sessions);
  }
  useEffect(() => { if (open && sessions === null) loadSessions(); }, [open]);

  function toggleMember(id) {
    setMemberIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  async function saveMembers() {
    setSavingMembers(true); setMsg('');
    const res = await fetch(`/api/admin/classes/${group.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ memberIds }),
    });
    const d = await res.json();
    setSavingMembers(false);
    if (d.ok) { setMsg('هنرجویان این کلاس ذخیره شد.'); onChanged(); }
    else setMsg(d.error || 'خطا');
  }

  async function deleteGroup() {
    if (!window.confirm(`کلاس «${group.name}» همراه با همه جلسات و حضور و غیاب‌های آن برای همیشه حذف شود؟ هنرجویان از کلاس خارج می‌شوند اما حساب آن‌ها حذف نمی‌شود.`)) return;
    setDeletingGroup(true); setMsg('');
    try {
      const res = await fetch(`/api/admin/classes/${group.id}`, { method: 'DELETE' });
      const d = await res.json();
      if (d.ok) onChanged();
      else setMsg(d.error || 'حذف کلاس انجام نشد.');
    } catch {
      setMsg('ارتباط با سرور برقرار نشد؛ کلاس حذف نشده است.');
    } finally {
      setDeletingGroup(false);
    }
  }

  async function submitSession(e) {
    e.preventDefault();
    if (!sForm.title.trim() || !sForm.startsAt) { setMsg('عنوان و تاریخ جلسه الزامی است.'); return; }
    setBusy(true); setMsg('');
    const payload = { ...sForm, groupId: group.id, startsAt: new Date(sForm.startsAt).toISOString() };
    const url = editingSession ? `/api/admin/sessions/${editingSession}` : '/api/admin/sessions';
    const method = editingSession ? 'PATCH' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const d = await res.json();
    setBusy(false);
    if (!d.ok) { setMsg(d.error || 'خطا در ذخیره جلسه.'); return; }
    setMsg(smsSummary(d));
    setSForm(emptySession); setEditingSession(null); setSessionFormOpen(false);
    loadSessions(); onChanged();
  }

  function startEditSession(s) {
    const d = new Date(s.startsAt);
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setSForm({ title: s.title || '', startsAt: local, chartDescription: s.chartDescription || '', tools: s.tools || '', homework: s.homework || '' });
    setEditingSession(s.id);
    setSessionFormOpen(true);
  }

  async function deleteSession(id) {
    if (!window.confirm('این جلسه حذف شود؟')) return;
    const res = await fetch(`/api/admin/sessions/${id}`, { method: 'DELETE' });
    const d = await res.json();
    if (d.ok) { loadSessions(); onChanged(); }
  }

  return (
    <div className={`admin-class-card${open ? ' is-open admin-class-card--workspace' : ''}`}>
      <div className="admin-class-card__head">
        {open && <button type="button" className="admin-class-back" onClick={onBack}>بازگشت به کلاس‌ها</button>}
        <button type="button" onClick={open ? undefined : onToggle} className="admin-class-card__toggle" aria-expanded={open}>
          {group.coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={group.coverImage} alt="" className="admin-class-card__cover" />
          )}
          <span className="admin-class-card__identity"><strong>{group.name}</strong><small>{group.courseTitle || 'بدون عنوان دوره'}{group.teacherName ? ` · استاد ${group.teacherName}` : ''}</small></span>
          <span className="admin-class-card__branch">{group.branch}</span>
          <span className="admin-class-card__metric"><strong>{group.members.length.toLocaleString('fa-IR')}</strong><small>هنرجو</small></span>
          <span className="admin-class-card__metric"><strong>{group._count.sessions.toLocaleString('fa-IR')}</strong><small>جلسه</small></span>
          {!open && <span className="admin-class-card__open-label">مدیریت کلاس</span>}
        </button>
      </div>

      {open && (
        <div className="admin-class-card__body">
          {msg && <div className="alert alert--info">{msg}</div>}

          <div className="tab-list" role="tablist">
            {TABS.map((t) => (
              <button key={t.id} type="button" role="tab" aria-selected={tab === t.id}
                className={`tab-btn${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          {/* تنظیمات کم‌استفاده در یک فرم فشرده و با یک دکمه ذخیره می‌شوند. */}
          <div className={`tab-panel${tab === 'settings' ? ' active' : ''}`}>
            <div className="admin-class-settings">
              <div className="admin-class-settings__fields">
                <div className="form-group"><label className="form-label">نام کلاس *</label><input className="form-input" value={groupName} onChange={(e) => setGroupName(e.target.value)} /></div>
                <div className="form-group"><label className="form-label">شعبه *</label><select className="form-input" value={branch} onChange={(e) => setBranch(e.target.value)}>{BRANCHES.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
                <div className="form-group"><label className="form-label">عنوان دوره</label><input className="form-input" value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} placeholder="مثلاً مقدماتی بازیگری" /></div>
                <div className="form-group"><label className="form-label">نام استاد</label><input className="form-input" value={teacherName} onChange={(e) => setTeacherName(e.target.value)} placeholder="مثلاً علی محمدی" /></div>
                <div className="form-group"><label className="form-label">تعداد کل جلسات دوره</label><input className="form-input" type="number" min={1} max={100} value={totalSessions} onChange={(e) => setTotalSessions(e.target.value)} /><p className="form-hint">مبنای محاسبه خودکار پیشرفت است.</p></div>
              </div>
              <div className="admin-class-settings__cover">
                <ClassCoverPicker value={cover} onChange={setCover} label="تصویر کلاس" />
              </div>
              <div className="admin-class-settings__actions">
                <button type="button" className="btn btn--dark btn--sm" onClick={saveSettings} disabled={settingsSaving}>
                  {settingsSaving ? 'در حال ذخیره…' : 'ذخیره تغییرات کلاس'}
                </button>
                <button type="button" className="btn btn--danger btn--sm" onClick={deleteGroup} disabled={deletingGroup}>{deletingGroup ? 'در حال حذف…' : 'حذف کامل کلاس'}</button>
              </div>
            </div>
          </div>

          {/* انتخاب هنرجویان در تب مستقل قرار دارد تا تنظیمات روزمره شلوغ نشود. */}
          <div className={`tab-panel${tab === 'members' ? ' active' : ''}`}>
            <div className="admin-class-members">
              <div className="admin-class-section-head"><div><h3>هنرجویان این کلاس</h3><p>هنرجویان شعبه {group.branch} را جست‌وجو و انتخاب کنید.</p></div><strong>{memberIds.length.toLocaleString('fa-IR')} نفر انتخاب‌شده</strong></div>
              {branchStudents.length === 0 ? (
                <p className="su-empty">هنرجوی تأییدشده‌ای در شعبه {group.branch} وجود ندارد.</p>
              ) : (
                <>
                  <input className="form-input admin-class-members__search" placeholder="جست‌وجوی نام، نام کاربری یا موبایل…" value={memberQuery} onChange={(e) => setMemberQuery(e.target.value)} />
                  <div className="admin-class-members__table">
                    <div className="admin-class-members__head" aria-hidden="true"><span>انتخاب</span><span>هنرجو</span><span>نام کاربری / موبایل</span><span>وضعیت</span></div>
                    {branchStudents.filter((s) => {
                      const mq = memberQuery.trim().toLowerCase();
                      return !mq || [s.displayName, s.username, s.phone].some((v) => (v || '').toLowerCase().includes(mq));
                    }).map((s) => {
                      const inOther = s.classGroupId && s.classGroupId !== group.id && !memberIds.includes(s.id);
                      return (
                        <label key={s.id} className={`admin-class-member${memberIds.includes(s.id) ? ' is-selected' : ''}`}>
                          <input type="checkbox" checked={memberIds.includes(s.id)} onChange={() => toggleMember(s.id)} />
                          <strong>{s.displayName || s.phone}</strong>
                          <span>{s.username || s.phone}</span>
                          <em>{memberIds.includes(s.id) ? 'عضو این کلاس' : inOther ? 'عضو کلاس دیگر' : 'آزاد'}</em>
                        </label>
                      );
                    })}
                  </div>
                </>
              )}
              <button type="button" className="btn btn--dark btn--sm" onClick={saveMembers} disabled={savingMembers}>{savingMembers ? 'در حال ذخیره…' : 'ذخیره هنرجویان کلاس'}</button>
            </div>
          </div>

          {/* جلسات، تقویم و ثبت جلسه در فضای عملیاتی واحد */}
          <div className={`tab-panel${tab === 'sessions' ? ' active' : ''}`}>
            <div className="admin-class-section-head">
              <div><h3>جلسات، ابزار و تمرین</h3><p>برای هر جلسه زمان، محتوای آموزشی، ابزار موردنیاز و تمرین یا اتود را همین‌جا ثبت کنید.</p></div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" className="btn btn--danger btn--sm" onClick={deleteGroup} disabled={deletingGroup}>{deletingGroup ? 'در حال حذف…' : 'حذف کامل کلاس پایان‌یافته'}</button>
                <button type="button" className="btn btn--dark btn--sm" onClick={() => { setSForm(emptySession); setEditingSession(null); setSessionFormOpen((value) => !value); }}>{sessionFormOpen && !editingSession ? 'بستن فرم ثبت جلسه' : '+ ثبت جلسه و برنامه آن'}</button>
              </div>
            </div>

            {!sessionFormOpen && (
              <button type="button" className="admin-session-program-callout" onClick={() => { setSForm(emptySession); setEditingSession(null); setSessionFormOpen(true); }}>
                <strong>ثبت ابزار، تمرین و اتود برای جلسه</strong>
                <span>برای واردکردن نیازهای هر جلسه، فرم ثبت برنامه جلسه را باز کنید.</span>
              </button>
            )}

            {sessionFormOpen && <form onSubmit={submitSession} className="admin-session-editor">
              <div className="admin-session-editor__head"><strong>{editingSession ? 'ویرایش زمان و برنامه جلسه' : 'ثبت زمان و برنامه جلسه جدید'}</strong><span>اطلاعات این فرم پس از ذخیره در برنامه هنرجویان نمایش داده می‌شود.</span></div>
              <div className="cal-form-grid">
                <div className="form-group"><label className="form-label">عنوان جلسه *</label><input className="form-input" value={sForm.title} onChange={(e) => setSForm({ ...sForm, title: e.target.value })} placeholder="مثلاً جلسه سوم: بیان و بدن" /></div>
                <div className="form-group"><label className="form-label">تاریخ و ساعت *</label><ShamsiDateTimeField value={sForm.startsAt} onChange={(v) => setSForm({ ...sForm, startsAt: v })} /></div>
              </div>
              <div className="admin-session-fields-title"><strong>برنامه و نیازهای جلسه</strong><span>این اطلاعات در برنامه هنرجو نمایش داده می‌شود.</span></div>
              <div className="admin-session-options__grid">
                <div className="form-group"><label className="form-label">چارت و محتوای آموزشی</label><textarea className="form-input" rows={3} value={sForm.chartDescription} onChange={(e) => setSForm({ ...sForm, chartDescription: e.target.value })} placeholder="سرفصل‌ها و مباحثی که در این جلسه آموزش داده می‌شود" /></div>
                <div className="form-group"><label className="form-label">ابزار و وسایل موردنیاز</label><textarea className="form-input" rows={3} value={sForm.tools} onChange={(e) => setSForm({ ...sForm, tools: e.target.value })} placeholder="وسایلی که هنرجو باید همراه داشته باشد" /></div>
                <div className="form-group"><label className="form-label">تمرین و اتود</label><textarea className="form-input" rows={3} value={sForm.homework} onChange={(e) => setSForm({ ...sForm, homework: e.target.value })} placeholder="تمرین یا اتود موردنظر برای این جلسه" /></div>
              </div>
              <div className="admin-session-editor__actions">
                <button className="btn btn--dark btn--sm" type="submit" disabled={busy}>{busy ? 'در حال ذخیره…' : editingSession ? 'ذخیره تغییرات' : 'ثبت جلسه'}</button>
                <button type="button" className="btn btn--outline btn--sm" onClick={() => { setSForm(emptySession); setEditingSession(null); setSessionFormOpen(false); }}>انصراف</button>
              </div>
            </form>}

            <div className="admin-calendar-workspace">
              <div className="admin-calendar-workspace__calendar">
                {sessions && sessions.length > 0 ? <ShamsiCalendar sessions={sessions} selectedId={editingSession} onSelectDay={(list) => startEditSession(list[0])} /> : <div className="su-empty">پس از ثبت اولین جلسه، تقویم کلاس اینجا نمایش داده می‌شود.</div>}
              </div>
              <div className="admin-calendar-workspace__list">
                <div className="admin-calendar-workspace__list-head"><strong>جلسات ثبت‌شده</strong><span>{(sessions?.length || 0).toLocaleString('fa-IR')} جلسه</span></div>
                {sessions === null ? <p className="admin-calendar-empty">در حال بارگذاری جلسات…</p> : sessions.length === 0 ? <p className="admin-calendar-empty">هنوز جلسه‌ای ثبت نشده است.</p> : (
                  <ul className="admin-session-list">
                    {sessions.map((s, i) => {
                      const d = new Date(s.startsAt);
                      return <li key={s.id} className={editingSession === s.id ? 'is-editing' : ''}>
                        <span className="admin-session-list__number">{(i + 1).toLocaleString('fa-IR')}</span>
                        <button type="button" className="admin-session-list__main" onClick={() => startEditSession(s)}>
                          <strong>{s.title}</strong>
                          <small>{dateFmt.format(d)} · {timeFmt.format(d)}</small>
                          <span className="admin-session-list__program">
                            <em className={s.tools ? 'is-complete' : ''}>{s.tools ? 'ابزار ثبت شده' : 'ابزار ثبت نشده'}</em>
                            <em className={s.homework ? 'is-complete' : ''}>{s.homework ? 'تمرین و اتود ثبت شده' : 'تمرین و اتود ثبت نشده'}</em>
                          </span>
                        </button>
                        <button type="button" className="admin-session-list__delete" onClick={() => deleteSession(s.id)} aria-label={`حذف ${s.title}`}>حذف</button>
                      </li>;
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* تب ۳: حضور و غیاب */}
          <div className={`tab-panel${tab === 'attendance' ? ' active' : ''}`}>
            {sessions === null ? (
              <p style={{ color: 'var(--muted)', fontSize: '.85rem' }}>در حال بارگذاری جلسات…</p>
            ) : sessions.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: '.85rem' }}>ابتدا از تب «جلسات و تقویم» یک جلسه بسازید تا بتوانید حضور و غیاب ثبت کنید.</p>
            ) : (
              <>
                <div className="form-group" style={{ maxWidth: 360 }}>
                  <label className="form-label">انتخاب جلسه</label>
                  <select className="form-input" value={attendanceSessionId || ''}
                    onChange={(e) => setAttendanceSessionId(e.target.value || null)}>
                    <option value="">— یک جلسه را انتخاب کنید —</option>
                    {sessions.map((s, i) => {
                      const d = new Date(s.startsAt);
                      return <option key={s.id} value={s.id}>جلسه {i + 1}: {s.title} — {dateFmt.format(d)}</option>;
                    })}
                  </select>
                </div>
                {attendanceSessionId && (
                  <SessionAttendance sessionId={attendanceSessionId} onChanged={onChanged} />
                )}
              </>
            )}
          </div>

          {/* تب ۴: پیشرفت دستیِ هنرجویان */}
          <div className={`tab-panel${tab === 'progress' ? ' active' : ''}`}>
            <ProgressOverrides members={group.members} students={students} onChanged={onChanged} />
          </div>
        </div>
      )}
    </div>
  );
}

function SessionAttendance({ sessionId, onChanged }) {
  const [members, setMembers] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  async function load() {
    setMembers(null);
    const res = await fetch(`/api/admin/attendance?sessionId=${sessionId}`);
    const d = await res.json();
    if (d.ok) setMembers(d.members);
  }
  useEffect(() => { load(); }, [sessionId]);

  function setStatus(userId, status) {
    setMembers((prev) => prev.map((m) => (m.id === userId ? { ...m, status } : m)));
  }

  async function save() {
    setSaving(true); setMsg('');
    const records = members.map((m) => ({ userId: m.id, status: m.status }));
    const res = await fetch('/api/admin/attendance', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, records }),
    });
    const d = await res.json();
    setSaving(false);
    if (d.ok) { setMsg('حضور و غیاب ذخیره شد.'); onChanged(); }
    else setMsg(d.error || 'خطا');
  }

  return (
    <div style={{ marginTop: 12, background: 'var(--surface)', borderRadius: 12, padding: 14 }}>
      <h4 style={{ fontWeight: 800, marginBottom: 8, fontSize: '.92rem' }}>حضور و غیاب این جلسه</h4>
      {msg && <div className="alert alert--info" style={{ marginBottom: 8 }}>{msg}</div>}
      {members === null ? (
        <p style={{ color: 'var(--muted)', fontSize: '.85rem' }}>در حال بارگذاری…</p>
      ) : members.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: '.85rem' }}>این کلاس هنرجویی ندارد.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 6, maxHeight: 260, overflowY: 'auto' }}>
          {members.map((m) => (
            <li key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', borderRadius: 8, padding: '6px 10px', border: '1px solid var(--border)' }}>
              <UserPhotoThumb src={m.photoUrl} name={m.displayName || m.phone} size={28} />
              <span style={{ flex: 1, fontSize: '.85rem' }}>{m.displayName || m.phone}{m.username && <span style={{ color: 'var(--muted)' }}> · {m.username}</span>}</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '.8rem', cursor: 'pointer' }}>
                <input type="radio" name={`att-${m.id}`} checked={m.status === 'present'} onChange={() => setStatus(m.id, 'present')} />
                حاضر
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '.8rem', cursor: 'pointer' }}>
                <input type="radio" name={`att-${m.id}`} checked={m.status === 'absent'} onChange={() => setStatus(m.id, 'absent')} />
                غایب
              </label>
            </li>
          ))}
        </ul>
      )}
      <button type="button" className="btn btn--dark btn--sm" style={{ marginTop: 10 }} onClick={save} disabled={saving || members === null}>
        {saving ? 'در حال ذخیره…' : 'ذخیره حضور و غیاب'}
      </button>
    </div>
  );
}

function ProgressOverrides({ members, students, onChanged }) {
  const byId = Object.fromEntries(students.map((s) => [s.id, s]));
  const [values, setValues] = useState(() => Object.fromEntries(members.map((m) => [m.id, byId[m.id]?.progressOverride ?? ''])));
  const [comments, setComments] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    setValues(Object.fromEntries(members.map((m) => [m.id, byId[m.id]?.progressOverride ?? ''])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members, students]);

  async function saveProgress(userId) {
    setSavingId(`progress-${userId}`); setMsg('');
    const value = values[userId];
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ progressOverride: value === '' ? null : value }),
    });
    const data = await res.json();
    setSavingId(null);
    if (data.ok) { setMsg('درصد پیشرفت ذخیره شد.'); onChanged(); }
    else setMsg(data.error || 'خطا در ذخیره درصد پیشرفت.');
  }

  async function saveComment(userId) {
    const content = (comments[userId] || '').trim();
    if (!content) { setMsg('ابتدا متن نظر استاد را وارد کنید.'); return; }
    setSavingId(`comment-${userId}`); setMsg('');
    const res = await fetch(`/api/admin/growth/students/${userId}/progress-comments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }),
    });
    const data = await res.json();
    setSavingId(null);
    if (res.ok && data.ok) {
      setComments((current) => ({ ...current, [userId]: '' }));
      setMsg('نظر استاد ثبت شد و اکنون در پنل هنرجو نمایش داده می‌شود.');
      onChanged();
    } else setMsg(data.error || 'خطا در ثبت نظر استاد.');
  }

  if (members.length === 0) return null;

  return (
    <div className="admin-progress-students">
      <div className="admin-class-section-head">
        <div><h3>پیشرفت و نظر استاد</h3><p>درصد دستی اختیاری است. نظر استاد فقط پس از ثبت در پنل همان هنرجو نمایش داده می‌شود.</p></div>
      </div>
      {msg && <div className="alert alert--info">{msg}</div>}
      <div className="admin-progress-students__list">
        {members.map((member) => {
          const student = byId[member.id];
          const latestComment = student?.latestProgressComment;
          return (
            <section key={member.id} className="admin-progress-student">
              <div className="admin-progress-student__identity">
                <UserPhotoThumb src={member.photoUrl} name={member.displayName || member.phone} size={34} />
                <div><strong>{member.displayName || member.phone}</strong><span>{latestComment ? 'آخرین نظر ثبت‌شده در پنل هنرجو نمایش داده می‌شود.' : 'هنوز نظری برای نمایش ثبت نشده است.'}</span></div>
              </div>
              <div className="admin-progress-student__percent">
                <label className="form-label">درصد پیشرفت</label>
                <div><input type="number" min={0} max={100} className="form-input" placeholder="خودکار" value={values[member.id]} onChange={(e) => setValues({ ...values, [member.id]: e.target.value })} />
                  <button type="button" className="btn btn--sm btn--outline" onClick={() => saveProgress(member.id)} disabled={savingId === `progress-${member.id}`}>{savingId === `progress-${member.id}` ? '...' : 'ذخیره درصد'}</button></div>
              </div>
              {latestComment && <div className="admin-progress-student__latest"><strong>آخرین نظر استاد</strong><p>{latestComment.content}</p><small>{dateFmt.format(new Date(latestComment.createdAt))}</small></div>}
              <div className="admin-progress-student__comment">
                <label className="form-label">نظر جدید استاد برای هنرجو</label>
                <textarea className="form-input" rows={2} value={comments[member.id] || ''} onChange={(e) => setComments({ ...comments, [member.id]: e.target.value })} placeholder="نظر یا بازخورد استاد را بنویسید…" />
                <button type="button" className="btn btn--sm btn--dark" onClick={() => saveComment(member.id)} disabled={savingId === `comment-${member.id}`}>{savingId === `comment-${member.id}` ? 'در حال ثبت…' : 'ثبت و نمایش در پنل هنرجو'}</button>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
