'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import StaffAvatar, { ROLE_LABEL } from './StaffAvatar';

const CATEGORIES = {
  report: { label: 'گزارش کار', icon: 'clipboard' },
  issue: { label: 'مشکل و اشکال', icon: 'alertTriangle' },
  request: { label: 'درخواست و یادآوری', icon: 'megaphone' },
};

const FILTERS = [
  { key: '', label: 'همه' },
  { key: 'open', label: 'باز' },
  { key: 'done', label: 'انجام‌شده' },
];

const LIMITS = { title: 120, body: 4000, comment: 2000 };

function when(iso) {
  const d = new Date(iso);
  return `${d.toLocaleDateString('fa-IR')} — ${d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`;
}

const Avatar = StaffAvatar;

export default function AdminStaffReports() {
  const [reports, setReports] = useState([]);
  const [me, setMe] = useState(null);
  const [colleagues, setColleagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const [status, setStatus] = useState('');
  const [mine, setMine] = useState(false);
  const [forMe, setForMe] = useState(false);
  const [q, setQ] = useState('');

  const [form, setForm] = useState({ title: '', body: '', category: 'report', targetId: '' });
  const [replies, setReplies] = useState({});
  const [editing, setEditing] = useState(null); // { id, title, body, category }
  const seenSent = useRef(false);

  const load = useCallback(async () => {
    setError('');
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (mine) params.set('mine', '1');
    if (forMe) params.set('to', 'me');
    if (q.trim()) params.set('q', q.trim());
    const res = await fetch(`/api/admin/reports?${params.toString()}`);
    const data = await res.json().catch(() => ({}));
    if (data.ok) { setReports(data.reports); setMe(data.me); setColleagues(data.colleagues || []); }
    else setError(data.error || 'خطا در بارگذاری گزارش‌ها.');
    setLoading(false);
  }, [status, mine, forMe, q]);

  useEffect(() => { load(); }, [load]);

  // یک‌بار پس از باز شدن صفحه، تابلو را «دیده‌شده» علامت می‌زنیم تا شمارندهٔ خانهٔ مدیریت صفر شود.
  useEffect(() => {
    if (seenSent.current) return;
    seenSent.current = true;
    fetch('/api/admin/reports', { method: 'PATCH' }).catch(() => {});
  }, []);

  async function send(url, options, okMessage) {
    setBusy(url); setError('');
    const res = await fetch(url, options);
    const data = await res.json().catch(() => ({}));
    setBusy('');
    if (!data.ok) { setError(data.error || 'عملیات انجام نشد.'); return false; }
    await load();
    if (okMessage) setError('');
    return true;
  }

  async function createReport(e) {
    e.preventDefault();
    if (form.title.trim().length < 3 || !form.body.trim()) {
      setError('عنوان و متن گزارش را کامل کنید.');
      return;
    }
    const ok = await send('/api/admin/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (ok) setForm({ title: '', body: '', category: 'report', targetId: '' });
  }

  const setStatusOf = (id, next) => send(`/api/admin/reports/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: next }),
  });

  async function saveEdit() {
    if (!editing) return;
    const ok = await send(`/api/admin/reports/${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editing.title, body: editing.body, category: editing.category, targetId: editing.targetId }),
    });
    if (ok) setEditing(null);
  }

  async function removeReport(r) {
    if (!window.confirm(`گزارش «${r.title}» و همهٔ پاسخ‌هایش حذف شود؟ این کار برگشت‌پذیر نیست.`)) return;
    await send(`/api/admin/reports/${r.id}`, { method: 'DELETE' });
  }

  async function removeComment(reportId, commentId) {
    if (!window.confirm('این پاسخ حذف شود؟')) return;
    await send(`/api/admin/reports/${reportId}?comment=${encodeURIComponent(commentId)}`, { method: 'DELETE' });
  }

  async function sendReply(id) {
    const body = (replies[id] || '').trim();
    if (!body) return;
    const ok = await send(`/api/admin/reports/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    });
    if (ok) setReplies((d) => ({ ...d, [id]: '' }));
  }

  return (
    <div>
      {/* ثبت گزارش تازه */}
      <form className="form-shell" style={{ margin: '0 0 18px' }} onSubmit={createReport}>
        <h2 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 800 }} className="icon-inline">
          <Icon name="plus" size={17} /> ثبت گزارش کار تازه
        </h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div className="form-group" style={{ margin: 0, flex: '1 1 260px' }}>
            <label className="form-label">عنوان</label>
            <input
              className="form-input"
              maxLength={LIMITS.title}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="مثلاً: تماس با هنرجویان لیست انتظار ساری"
            />
          </div>
          <div className="form-group" style={{ margin: 0, flex: '0 0 190px' }}>
            <label className="form-label">نوع</label>
            <select className="form-input" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0, flex: '0 0 210px' }}>
            <label className="form-label">گیرنده</label>
            <select className="form-input" value={form.targetId} onChange={(e) => setForm((f) => ({ ...f, targetId: e.target.value }))}>
              <option value="">همهٔ تیم</option>
              {colleagues.map((c) => <option key={c.id} value={c.id}>{c.name} ({ROLE_LABEL[c.role] || c.role})</option>)}
            </select>
          </div>
        </div>
        <div className="form-group" style={{ marginTop: 12, marginBottom: 0 }}>
          <label className="form-label">متن گزارش</label>
          <textarea
            className="form-input"
            rows={4}
            maxLength={LIMITS.body}
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            placeholder="چه کاری انجام شد، چه چیزی مانده، و همکار بعدی باید چه کند؟"
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
          <button className="btn btn--gold" type="submit" disabled={busy === '/api/admin/reports'}>
            {form.targetId
              ? `ثبت و اطلاع به ${colleagues.find((c) => c.id === form.targetId)?.name || 'همکار'}`
              : 'ثبت و اطلاع به همهٔ تیم'}
          </button>
          <span style={{ color: 'var(--muted)', fontSize: '.82rem' }}>
            <Icon name="lock" size={13} /> این تابلو فقط برای مدیر و ادیتور است؛ هنرجو، فیلم‌ساز و بازدیدکنندهٔ سایت آن را نمی‌بینند.
            اعلانِ گزارشِ ارجاع‌شده فقط برای گیرنده می‌رود، ولی خودِ گزارش روی تابلوی مشترک تیم می‌ماند —
            برای حرفِ کاملاً خصوصی از تب «گفت‌وگو» استفاده کنید.
          </span>
        </div>
      </form>

      {/* فیلترها */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
        {FILTERS.map((f) => (
          <button
            key={f.key || 'all'}
            type="button"
            className={`btn btn--sm ${status === f.key ? 'btn--dark' : 'btn--outline'}`}
            onClick={() => setStatus(f.key)}
          >
            {f.label}
          </button>
        ))}
        <button type="button" className={`btn btn--sm ${mine ? 'btn--gold' : 'btn--outline'}`} onClick={() => setMine((v) => !v)}>
          <Icon name="user" size={14} /> فقط گزارش‌های من
        </button>
        <button type="button" className={`btn btn--sm ${forMe ? 'btn--gold' : 'btn--outline'}`} onClick={() => setForMe((v) => !v)}>
          <Icon name="bell" size={14} /> ارجاع‌شده به من
        </button>
        <input
          className="form-input"
          style={{ width: 'auto', minWidth: 200, flex: '1 1 200px' }}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="جست‌وجو در عنوان، متن یا نام همکار…"
        />
      </div>

      {error && <div className="alert alert--error" style={{ marginBottom: 12 }}>{error}</div>}
      {loading && <p style={{ color: 'var(--muted)' }}>در حال بارگذاری…</p>}
      {!loading && reports.length === 0 && (
        <div className="form-shell" style={{ margin: 0, textAlign: 'center', color: 'var(--muted)' }}>
          هنوز گزارشی با این فیلترها ثبت نشده است.
        </div>
      )}

      <div style={{ display: 'grid', gap: 14 }}>
        {reports.map((r) => {
          const cat = CATEGORIES[r.category] || CATEGORIES.report;
          const isEditing = editing?.id === r.id;
          return (
            <article
              key={r.id}
              className="form-shell"
              style={{ margin: 0, borderRight: `4px solid ${r.status === 'done' ? '#3fa06a' : 'var(--gold)'}` }}
            >
              <header style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <Avatar name={r.authorName} role={r.authorRole} />
                <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                  <h3 style={{ margin: 0, fontSize: '1.02rem', wordBreak: 'break-word' }}>{r.title}</h3>
                  <p style={{ margin: '2px 0 0', color: 'var(--muted)', fontSize: '.82rem' }}>
                    {r.authorName} ({ROLE_LABEL[r.authorRole] || r.authorRole}) · <span dir="ltr">{when(r.createdAt)}</span>
                    {r.edited ? ' · ویرایش‌شده' : ''}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span className="tag"><Icon name={cat.icon} size={13} /> {cat.label}</span>
                  <span className={`tag ${r.targetId ? (r.targetId === me?.id ? 'tag--gold' : 'tag--wine') : ''}`}>
                    <Icon name="users" size={13} /> برای: {r.targetId === me?.id ? 'شما' : (r.targetName || 'همهٔ تیم')}
                  </span>
                  <span className={`tag ${r.status === 'done' ? 'tag--dark' : 'tag--gold'}`}>
                    {r.status === 'done' ? `انجام‌شده${r.doneByName ? ` — ${r.doneByName}` : ''}` : 'باز'}
                  </span>
                </div>
              </header>

              {isEditing ? (
                <div style={{ marginTop: 12 }}>
                  <input
                    className="form-input"
                    maxLength={LIMITS.title}
                    value={editing.title}
                    onChange={(e) => setEditing((d) => ({ ...d, title: e.target.value }))}
                  />
                  <textarea
                    className="form-input"
                    style={{ marginTop: 8 }}
                    rows={4}
                    maxLength={LIMITS.body}
                    value={editing.body}
                    onChange={(e) => setEditing((d) => ({ ...d, body: e.target.value }))}
                  />
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <select
                      className="form-input"
                      style={{ width: 'auto', marginTop: 8 }}
                      value={editing.category}
                      onChange={(e) => setEditing((d) => ({ ...d, category: e.target.value }))}
                    >
                      {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                    <select
                      className="form-input"
                      style={{ width: 'auto', marginTop: 8 }}
                      value={editing.targetId}
                      onChange={(e) => setEditing((d) => ({ ...d, targetId: e.target.value }))}
                    >
                      <option value="">برای همهٔ تیم</option>
                      {colleagues.map((c) => <option key={c.id} value={c.id}>برای {c.name}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button type="button" className="btn btn--gold btn--sm" onClick={saveEdit}>ذخیره</button>
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => setEditing(null)}>انصراف</button>
                  </div>
                </div>
              ) : (
                <p style={{ margin: '12px 0 0', whiteSpace: 'pre-wrap', lineHeight: 2, wordBreak: 'break-word' }}>{r.body}</p>
              )}

              {r.comments.length > 0 && (
                <div style={{ marginTop: 14, display: 'grid', gap: 8 }}>
                  {r.comments.map((c) => (
                    <div key={c.id} style={{ display: 'flex', gap: 8, background: 'var(--surface)', borderRadius: 10, padding: '10px 12px' }}>
                      <Avatar name={c.authorName} role={c.authorRole} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: 'var(--muted)', fontSize: '.78rem' }}>
                          {c.authorName} · <span dir="ltr">{when(c.createdAt)}</span>
                        </div>
                        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.9, wordBreak: 'break-word' }}>{c.body}</div>
                      </div>
                      {c.canDelete && (
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          title="حذف پاسخ"
                          onClick={() => removeComment(r.id, c.id)}
                        >
                          <Icon name="close" size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: 12 }}>
                <textarea
                  className="form-input"
                  rows={2}
                  maxLength={LIMITS.comment}
                  value={replies[r.id] ?? ''}
                  onChange={(e) => setReplies((d) => ({ ...d, [r.id]: e.target.value }))}
                  placeholder="پاسخ یا تکمیل گزارش…"
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn--outline btn--sm"
                    disabled={!(replies[r.id] || '').trim()}
                    onClick={() => sendReply(r.id)}
                  >
                    <Icon name="chat" size={14} /> ثبت پاسخ
                  </button>
                  {r.status === 'open' ? (
                    <button type="button" className="btn btn--dark btn--sm" onClick={() => setStatusOf(r.id, 'done')}>
                      <Icon name="check" size={14} /> انجام شد
                    </button>
                  ) : (
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => setStatusOf(r.id, 'open')}>بازگشایی</button>
                  )}
                  {r.canEdit && !isEditing && (
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => setEditing({ id: r.id, title: r.title, body: r.body, category: r.category, targetId: r.targetId || '' })}
                    >
                      <Icon name="pencil" size={14} /> ویرایش
                    </button>
                  )}
                  {r.canDelete && (
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => removeReport(r)}>
                      <Icon name="xCircle" size={14} /> حذف
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {me && (
        <p style={{ color: 'var(--muted)', fontSize: '.8rem', marginTop: 16 }}>
          شما با نام «{me.name}» و نقش «{ROLE_LABEL[me.role] || me.role}» گزارش ثبت می‌کنید؛ نام نویسنده روی هر گزارش ثابت می‌ماند.
        </p>
      )}
    </div>
  );
}
