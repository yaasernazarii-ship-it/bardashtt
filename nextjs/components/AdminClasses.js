'use client';

import { useEffect, useState } from 'react';

const BRANCHES = ['تهران', 'ساری'];
const dateFmt = new Intl.DateTimeFormat('fa-IR', { weekday: 'long', month: 'long', day: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' });

const emptySession = { title: '', startsAt: '', chartDescription: '', tools: '', homework: '' };

export default function AdminClasses() {
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newGroup, setNewGroup] = useState({ name: '', branch: 'تهران', courseTitle: '' });
  const [openId, setOpenId] = useState(null);

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
    setNewGroup({ name: '', branch: 'تهران', courseTitle: '' });
    load();
  }

  if (loading) return <p style={{ color: 'var(--muted)' }}>در حال بارگذاری…</p>;

  return (
    <div>
      {error && <div className="alert alert--error" style={{ marginBottom: 16 }}>{error}</div>}

      {/* ساخت کلاس جدید */}
      <form onSubmit={createGroup} className="form-shell" style={{ marginBottom: 24 }}>
        <h2 className="heading" style={{ fontSize: '1.1rem', marginBottom: 14 }}>افزودن کلاس جدید</h2>
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
        </div>
        <button className="btn btn--dark" type="submit">افزودن کلاس</button>
      </form>

      {groups.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 28, textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)' }}>هنوز کلاسی ساخته نشده است.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {groups.map((g) => (
            <GroupCard key={g.id} group={g} students={students}
              open={openId === g.id} onToggle={() => setOpenId(openId === g.id ? null : g.id)}
              onChanged={load} />
          ))}
        </div>
      )}
    </div>
  );
}

function GroupCard({ group, students, open, onToggle, onChanged }) {
  const branchStudents = students.filter((s) => !s.branch || s.branch === group.branch);
  const [memberIds, setMemberIds] = useState(group.members.map((m) => m.id));
  const [savingMembers, setSavingMembers] = useState(false);
  const [sessions, setSessions] = useState(null);
  const [sForm, setSForm] = useState(emptySession);
  const [editingSession, setEditingSession] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { setMemberIds(group.members.map((m) => m.id)); }, [group]);

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
    if (d.ok) { setMsg('هنرجویان این کلاس ذخیره شد ✅'); onChanged(); }
    else setMsg(d.error || 'خطا');
  }

  async function deleteGroup() {
    if (!window.confirm('این کلاس و همه‌ی جلساتش حذف شود؟')) return;
    const res = await fetch(`/api/admin/classes/${group.id}`, { method: 'DELETE' });
    const d = await res.json();
    if (d.ok) onChanged();
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
    setSForm(emptySession); setEditingSession(null);
    loadSessions(); onChanged();
  }

  function startEditSession(s) {
    const d = new Date(s.startsAt);
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setSForm({ title: s.title || '', startsAt: local, chartDescription: s.chartDescription || '', tools: s.tools || '', homework: s.homework || '' });
    setEditingSession(s.id);
  }

  async function deleteSession(id) {
    if (!window.confirm('این جلسه حذف شود؟')) return;
    const res = await fetch(`/api/admin/sessions/${id}`, { method: 'DELETE' });
    const d = await res.json();
    if (d.ok) { loadSessions(); onChanged(); }
  }

  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
        <button type="button" onClick={onToggle} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'right' }}>
          <span style={{ fontWeight: 800 }}>{group.name}</span>
          <span style={{ background: 'var(--surface)', borderRadius: 999, padding: '3px 10px', fontSize: '.78rem', color: 'var(--muted)' }}>{group.branch}</span>
          {group.courseTitle && <span style={{ fontSize: '.78rem', color: 'var(--muted)' }}>· {group.courseTitle}</span>}
          <span style={{ fontSize: '.78rem', color: 'var(--muted)' }}>· {group.members.length} هنرجو · {group._count.sessions} جلسه</span>
          <span style={{ marginRight: 'auto', color: 'var(--muted)' }}>{open ? '▲' : '▼'}</span>
        </button>
        <button type="button" className="btn btn--sm btn--danger" onClick={deleteGroup}>حذف</button>
      </div>

      {open && (
        <div style={{ borderTop: '1px dashed var(--border)', padding: 16, display: 'grid', gap: 22 }}>
          {msg && <div className="alert alert--info">{msg}</div>}

          {/* تخصیص هنرجویان */}
          <div>
            <h3 style={{ fontWeight: 800, marginBottom: 8 }}>هنرجویان این کلاس ({group.branch})</h3>
            {branchStudents.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: '.85rem' }}>هنرجوی تأییدشده‌ای در شعبه‌ی {group.branch} وجود ندارد.</p>
            ) : (
              <div style={{ display: 'grid', gap: 6, gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', maxHeight: 220, overflowY: 'auto', padding: 4 }}>
                {branchStudents.map((s) => {
                  const inOther = s.classGroupId && s.classGroupId !== group.id && !memberIds.includes(s.id);
                  return (
                    <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.85rem', padding: '6px 8px', borderRadius: 8, background: 'var(--surface)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={memberIds.includes(s.id)} onChange={() => toggleMember(s.id)} />
                      <span>{s.displayName || s.phone}{s.username ? ` (${s.username})` : ''}</span>
                      {inOther && <span style={{ marginRight: 'auto', fontSize: '.68rem', color: '#B45309' }}>در کلاس دیگر</span>}
                    </label>
                  );
                })}
              </div>
            )}
            <button type="button" className="btn btn--dark btn--sm" style={{ marginTop: 10 }} onClick={saveMembers} disabled={savingMembers}>
              {savingMembers ? 'در حال ذخیره…' : 'ذخیره هنرجویان'}
            </button>
          </div>

          {/* جلسات */}
          <div>
            <h3 style={{ fontWeight: 800, marginBottom: 8 }}>جلسات کلاس</h3>
            <form onSubmit={submitSession} style={{ background: 'var(--surface)', borderRadius: 12, padding: 14, marginBottom: 14, display: 'grid', gap: 10 }}>
              <div style={{ fontWeight: 700, fontSize: '.9rem' }}>{editingSession ? 'ویرایش جلسه' : 'افزودن جلسه جدید'}</div>
              <div className="cal-form-grid">
                <div className="form-group">
                  <label className="form-label">عنوان جلسه *</label>
                  <input className="form-input" value={sForm.title} onChange={(e) => setSForm({ ...sForm, title: e.target.value })} placeholder="جلسه اول: آشنایی" />
                </div>
                <div className="form-group">
                  <label className="form-label">تاریخ و ساعت *</label>
                  <input className="form-input" type="datetime-local" value={sForm.startsAt} onChange={(e) => setSForm({ ...sForm, startsAt: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">چارت درسی این جلسه</label>
                <textarea className="form-input" rows={2} value={sForm.chartDescription} onChange={(e) => setSForm({ ...sForm, chartDescription: e.target.value })} placeholder="سرفصل‌ها و توضیحات درسی این جلسه" />
              </div>
              <div className="form-group">
                <label className="form-label">ابزار لازم</label>
                <textarea className="form-input" rows={2} value={sForm.tools} onChange={(e) => setSForm({ ...sForm, tools: e.target.value })} placeholder="ابزاری که هنرجو باید همراه بیاورد" />
              </div>
              <div className="form-group">
                <label className="form-label">تمرین و اتود</label>
                <textarea className="form-input" rows={2} value={sForm.homework} onChange={(e) => setSForm({ ...sForm, homework: e.target.value })} placeholder="تمرین یا اتودی که باید برای این جلسه آماده باشد" />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn--dark btn--sm" type="submit" disabled={busy}>{busy ? 'در حال ذخیره…' : editingSession ? 'ذخیره تغییرات' : 'افزودن جلسه'}</button>
                {editingSession && <button type="button" className="btn btn--outline btn--sm" onClick={() => { setSForm(emptySession); setEditingSession(null); }}>انصراف</button>}
              </div>
              <p style={{ fontSize: '.75rem', color: 'var(--muted)', margin: 0 }}>پس از ذخیره، به هنرجویان این کلاس نشان «به‌روزرسانی شد» نمایش داده می‌شود.</p>
            </form>

            {sessions === null ? <p style={{ color: 'var(--muted)', fontSize: '.85rem' }}>در حال بارگذاری جلسات…</p>
              : sessions.length === 0 ? <p style={{ color: 'var(--muted)', fontSize: '.85rem' }}>هنوز جلسه‌ای ثبت نشده است.</p>
              : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
                  {sessions.map((s, i) => {
                    const d = new Date(s.startsAt);
                    return (
                      <li key={s.id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontWeight: 800, color: 'var(--muted)' }}>{i + 1}</span>
                        <span style={{ flex: 1 }}>
                          <span style={{ display: 'block', fontWeight: 700 }}>{s.title}</span>
                          <span style={{ display: 'block', color: 'var(--muted)', fontSize: '.78rem' }}>{dateFmt.format(d)} — {timeFmt.format(d)}</span>
                        </span>
                        <button type="button" className="btn btn--sm btn--outline" onClick={() => startEditSession(s)}>ویرایش</button>
                        <button type="button" className="btn btn--sm btn--danger" onClick={() => deleteSession(s.id)}>حذف</button>
                      </li>
                    );
                  })}
                </ul>
              )}
          </div>
        </div>
      )}
    </div>
  );
}
