'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import GroupAvatar from './GroupAvatar';
import { uploadFile } from '@/lib/uploadClient';

const MAX = 2000;
const ROLE_TAG = { admin: 'مدیر', editor: 'ادیتور' };

function timeOf(iso) {
  return new Date(iso).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
}

function dayOf(iso) {
  return new Date(iso).toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' });
}

const EMPTY_FORM = { name: '', description: '', photoUrl: '' };

// مدیریت گروه‌های گفت‌وگوی هنرجویان: ساخت گروه، انتخاب اعضا، نام و عکس گروه، و خودِ گفت‌وگو.
// همهٔ بررسی‌های دسترسی در سرور انجام می‌شود؛ این‌جا فقط نمایش است.
export default function AdminChatGroups() {
  const [groups, setGroups] = useState([]);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('chat'); // chat | members | settings | new
  const [detail, setDetail] = useState(null); // { group, members, candidates, classGroups }
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [picked, setPicked] = useState([]);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');

  const boxRef = useRef(null);
  const lastAtRef = useRef(null);
  const groupRef = useRef(null);
  const stickRef = useRef(true);

  groupRef.current = selected;

  const loadList = useCallback(async (autoSelect = false) => {
    try {
      const res = await fetch('/api/admin/chat-groups');
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'خطا در بارگذاری گروه‌ها.'); return; }
      setGroups(data.groups);
      if (autoSelect) setSelected((cur) => cur || data.groups[0]?.id || null);
    } catch { /* شبکه */ }
  }, []);

  const loadDetail = useCallback(async (id) => {
    if (!id) { setDetail(null); return; }
    try {
      const res = await fetch(`/api/admin/chat-groups/${id}`);
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'گروه باز نشد.'); return; }
      if (groupRef.current !== id) return;
      setDetail(data);
      setForm({ name: data.group.name, description: data.group.description || '', photoUrl: data.group.photoUrl || '' });
    } catch { /* شبکه */ }
  }, []);

  useEffect(() => { loadList(true); }, [loadList]);

  const poll = useCallback(async () => {
    const id = groupRef.current;
    if (!id) return;
    const after = lastAtRef.current;
    const url = `/api/admin/chat-groups/${id}/messages?seen=1${after ? `&after=${encodeURIComponent(after)}` : ''}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'گفت‌وگو باز نشد.'); return; }
      if (groupRef.current !== id) return;
      if (data.reset) {
        setMessages(data.messages);
        stickRef.current = true;
      } else if (data.messages.length) {
        setMessages((prev) => {
          const known = new Set(prev.map((m) => m.id));
          const fresh = data.messages.filter((m) => !known.has(m.id));
          return fresh.length ? [...prev, ...fresh] : prev;
        });
      }
      if (data.messages.length) lastAtRef.current = data.messages[data.messages.length - 1].createdAt;
    } catch { /* شبکه */ }
  }, []);

  useEffect(() => {
    if (!selected) return;
    lastAtRef.current = null;
    setMessages([]);
    loadDetail(selected);
    poll();
  }, [selected, poll, loadDetail]);

  // تا وقتی تب «گفت‌وگو» باز است پیام تازه گرفته می‌شود؛ در تب اعضا و تنظیمات هیچ درخواستی نمی‌رود.
  useEffect(() => {
    if (!selected || tab !== 'chat') return undefined;
    const t = setInterval(poll, 5000);
    return () => clearInterval(t);
  }, [selected, tab, poll]);

  useEffect(() => {
    const el = boxRef.current;
    if (el && stickRef.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  function onScroll() {
    const el = boxRef.current;
    if (!el) return;
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  function openGroup(id) {
    setError('');
    setNotice('');
    setPicked([]);
    setSelected(id);
    setTab('chat');
  }

  function startNew() {
    setError('');
    setNotice('');
    setForm(EMPTY_FORM);
    setTab('new');
  }

  async function pickPhoto(file) {
    if (!file) return;
    setBusy(true);
    setError('');
    const res = await uploadFile(file);
    setBusy(false);
    if (!res.ok) { setError(res.error || 'آپلود عکس ناموفق بود.'); return; }
    setForm((f) => ({ ...f, photoUrl: res.url }));
  }

  async function createGroup(e) {
    e.preventDefault();
    if (!form.name.trim() || busy) return;
    setBusy(true);
    setError('');
    const res = await fetch('/api/admin/chat-groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!data.ok) { setError(data.error || 'گروه ساخته نشد.'); return; }
    await loadList(false);
    setSelected(data.group.id);
    setTab('members');
    setNotice('گروه ساخته شد؛ حالا هنرجویان را به آن اضافه کنید.');
  }

  async function saveGroup(e) {
    e.preventDefault();
    if (!selected || busy) return;
    setBusy(true);
    setError('');
    const res = await fetch(`/api/admin/chat-groups/${selected}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, description: form.description, photoUrl: form.photoUrl || null }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!data.ok) { setError(data.error || 'ذخیره نشد.'); return; }
    setNotice('تغییرات گروه ذخیره شد.');
    loadList(false);
    loadDetail(selected);
  }

  async function toggleActive() {
    if (!detail || busy) return;
    setBusy(true);
    const res = await fetch(`/api/admin/chat-groups/${selected}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !detail.group.active }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!data.ok) { setError(data.error || 'تغییر وضعیت انجام نشد.'); return; }
    setNotice(data.group.active ? 'گروه باز شد؛ اعضا می‌توانند پیام بفرستند.' : 'گروه بسته شد؛ اعضا فقط پیام‌های قبلی را می‌بینند.');
    loadDetail(selected);
    loadList(false);
  }

  async function removeGroup() {
    if (!detail) return;
    if (!window.confirm(`گروه «${detail.group.name}» با همهٔ پیام‌هایش برای همیشه حذف شود؟`)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/chat-groups/${selected}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!data.ok) { setError(data.error || 'گروه حذف نشد.'); return; }
    setSelected(null);
    setDetail(null);
    setMessages([]);
    setNotice('گروه حذف شد.');
    loadList(true);
  }

  async function addMembers() {
    if (picked.length === 0 || busy) return;
    setBusy(true);
    setError('');
    const res = await fetch(`/api/admin/chat-groups/${selected}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds: picked }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!data.ok) { setError(data.error || 'افزودن اعضا انجام نشد.'); return; }
    setPicked([]);
    setNotice(`${data.added.toLocaleString('fa-IR')} هنرجو به گروه اضافه شد.`);
    loadDetail(selected);
    loadList(false);
  }

  async function removeMember(person) {
    if (!window.confirm(`${person.name} از گروه حذف شود؟`)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/chat-groups/${selected}/members?user=${encodeURIComponent(person.id)}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!data.ok) { setError(data.error || 'حذف عضو انجام نشد.'); return; }
    setNotice(`${person.name} از گروه حذف شد.`);
    loadDetail(selected);
    loadList(false);
  }

  async function send(e) {
    e?.preventDefault();
    const body = text.trim();
    if (!body || !selected || busy) return;
    setBusy(true);
    setText('');
    stickRef.current = true;
    const res = await fetch(`/api/admin/chat-groups/${selected}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!data.ok) { setError(data.error || 'پیام ارسال نشد.'); setText(body); return; }
    setMessages((prev) => (prev.some((m) => m.id === data.message.id) ? prev : [...prev, data.message]));
    lastAtRef.current = data.message.createdAt;
    loadList(false);
  }

  async function removeMessage(mid) {
    if (!window.confirm('این پیام حذف شود؟')) return;
    const res = await fetch(`/api/admin/chat-groups/${selected}/messages?message=${encodeURIComponent(mid)}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!data.ok) { setError(data.error || 'پیام حذف نشد.'); return; }
    setMessages((prev) => prev.filter((m) => m.id !== mid));
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  const candidates = (detail?.candidates || []).filter((p) => {
    if (classFilter && p.classGroupId !== classFilter) return false;
    if (!search.trim()) return true;
    const q = search.trim();
    return p.name.includes(q) || (p.courseTitle || '').includes(q) || (p.classGroupName || '').includes(q);
  });

  const rows = [];
  let lastDay = '';
  for (const m of messages) {
    const day = dayOf(m.createdAt);
    if (day !== lastDay) { rows.push({ type: 'day', id: `d-${m.id}`, label: day }); lastDay = day; }
    rows.push({ type: 'msg', ...m });
  }

  return (
    <div>
      {error && <div className="alert alert--error" style={{ marginBottom: 12 }}>{error}</div>}
      {notice && <div className="alert alert--success" style={{ marginBottom: 12 }}>{notice}</div>}

      <div className={`staff-chat${tab === 'chat' ? '' : ' staff-chat--panel'}`}>
        <aside className="staff-chat__side">
          <button type="button" className={`cg-new${tab === 'new' ? ' is-active' : ''}`} onClick={startNew}>
            <Icon name="plus" size={16} /> ساخت گروه تازه
          </button>
          {groups.map((g) => (
            <button
              key={g.id}
              type="button"
              className={`staff-chat__peer${selected === g.id && tab !== 'new' ? ' is-active' : ''}`}
              onClick={() => openGroup(g.id)}
            >
              <GroupAvatar name={g.name} photoUrl={g.photoUrl} size={38} />
              <span className="staff-chat__peer-main">
                <span className="staff-chat__peer-name">
                  {g.name}
                  {!g.active && <span className="tag" style={{ fontSize: '.62rem' }}>بسته</span>}
                  {g.unread > 0 && <span className="staff-chat__badge">{g.unread.toLocaleString('fa-IR')}</span>}
                </span>
                <span className="staff-chat__peer-last">
                  {g.memberCount.toLocaleString('fa-IR')} عضو · {g.messageCount.toLocaleString('fa-IR')} پیام
                </span>
              </span>
            </button>
          ))}
          {groups.length === 0 && (
            <p className="staff-chat__empty-side">هنوز گروهی ساخته نشده. با دکمهٔ «ساخت گروه تازه» شروع کنید.</p>
          )}
        </aside>

        <section className="staff-chat__main">
          {tab === 'new' ? (
            <form className="cg-panel" onSubmit={createGroup}>
              <section className="cg-section">
              <div className="cg-section__head"><h4 className="cg-title">ساخت گروه تازه</h4><span className="cg-count">گام ۱ از ۲</span></div>
              <p className="cg-hint">نام و عکس گروه همان چیزی است که هنرجویان می‌بینند. بعد از ساخت، در گام دوم اعضا را انتخاب می‌کنید.</p>
              <label className="cg-field">
                <span>نام گروه</span>
                <input value={form.name} maxLength={60} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="مثلاً دورهٔ بازیگری ۱۴۰۵ — تهران" />
              </label>
              <label className="cg-field">
                <span>معرفی کوتاه (اختیاری)</span>
                <input value={form.description} maxLength={200} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="این گروه برای هماهنگی تمرین‌های دوره است." />
              </label>
              <div className="cg-photo">
                <GroupAvatar name={form.name} photoUrl={form.photoUrl} size={56} />
                <label className="btn btn--ghost btn--sm">
                  انتخاب عکس گروه
                  <input type="file" accept="image/*" hidden onChange={(e) => pickPhoto(e.target.files?.[0])} />
                </label>
                {form.photoUrl && (
                  <button type="button" className="growth-text-button" onClick={() => setForm({ ...form, photoUrl: '' })}>حذف عکس</button>
                )}
              </div>
              <div className="cg-bar">
                <span className="cg-bar__count">{form.name.trim() ? 'آمادهٔ ساخت' : 'اول نام گروه را بنویسید'}</span>
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => setTab('chat')}>انصراف</button>
                <button type="submit" className="btn btn--gold btn--sm" disabled={!form.name.trim() || busy}>ساخت گروه و رفتن به انتخاب اعضا</button>
              </div>
              </section>
            </form>
          ) : !detail ? (
            <p className="staff-chat__note">{groups.length === 0 ? 'اولین گروه را بسازید.' : 'یک گروه را انتخاب کنید.'}</p>
          ) : (
            <>
              <header className="staff-chat__head">
                <GroupAvatar name={detail.group.name} photoUrl={detail.group.photoUrl} size={36} />
                <div style={{ minWidth: 0 }}>
                  <strong className="staff-chat__title">{detail.group.name}</strong>
                  <span className="staff-chat__sub">
                    {detail.members.length.toLocaleString('fa-IR')} عضو {detail.group.active ? '' : '· بسته'}
                  </span>
                </div>
                <div className="cg-tabs">
                  <button type="button" className={`staff-tab${tab === 'chat' ? ' is-active' : ''}`} onClick={() => setTab('chat')}>گفت‌وگو</button>
                  <button type="button" className={`staff-tab${tab === 'members' ? ' is-active' : ''}`} onClick={() => setTab('members')}>اعضا</button>
                  <button type="button" className={`staff-tab${tab === 'settings' ? ' is-active' : ''}`} onClick={() => setTab('settings')}>تنظیمات</button>
                </div>
              </header>

              {tab === 'chat' && (
                <>
                  <div className="staff-chat__msgs" ref={boxRef} onScroll={onScroll}>
                    {rows.length === 0 && <p className="staff-chat__note">هنوز پیامی در این گروه نیست.</p>}
                    {rows.map((r) => (r.type === 'day' ? (
                      <span key={r.id} className="staff-chat__day">{r.label}</span>
                    ) : (
                      <div key={r.id} className={`staff-bubble${r.mine ? ' staff-bubble--mine' : ''}`}>
                        {!r.mine && (
                          <span className="staff-bubble__who">
                            {r.authorName}{ROLE_TAG[r.authorRole] ? ` · ${ROLE_TAG[r.authorRole]}` : ''}
                          </span>
                        )}
                        <span className="staff-bubble__body">{r.body}</span>
                        <span className="staff-bubble__meta">
                          <span dir="ltr">{timeOf(r.createdAt)}</span>
                          {r.canDelete && (
                            <button type="button" className="staff-bubble__del" title="حذف پیام" onClick={() => removeMessage(r.id)}>
                              <Icon name="close" size={12} />
                            </button>
                          )}
                        </span>
                      </div>
                    )))}
                  </div>
                  <form className="staff-chat__foot" onSubmit={send}>
                    <textarea
                      className="staff-chat__input"
                      rows={1}
                      maxLength={MAX}
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onKeyDown={onKeyDown}
                      placeholder="پیام مدیریت به گروه… (Enter ارسال، Shift+Enter خط تازه)"
                    />
                    <button type="submit" className="staff-chat__send" disabled={!text.trim() || busy} aria-label="ارسال">
                      <Icon name="arrowUp" size={18} />
                    </button>
                  </form>
                </>
              )}

              {tab === 'members' && (
                <div className="cg-panel">
                  <section className="cg-section">
                    <div className="cg-section__head">
                      <h4 className="cg-title">اعضای این گروه</h4>
                      <span className="cg-count">{detail.members.length.toLocaleString('fa-IR')} نفر</span>
                    </div>
                    {detail.members.length === 0 ? (
                      <p className="cg-hint">هنوز کسی عضو این گروه نیست. از کادر پایین هنرجو را انتخاب و اضافه کنید.</p>
                    ) : (
                      <div className="cg-list">
                        {detail.members.map((p) => (
                          <div key={p.id} className="cg-row">
                            <GroupAvatar name={p.name} photoUrl={p.photoUrl} size={32} />
                            <span className="cg-row__main">
                              <strong>{p.name}</strong>
                              <small>
                                {p.inactive ? 'دیگر هنرجوی فعال نیست' : [p.courseTitle, p.classGroupName, p.branch].filter(Boolean).join(' · ') || 'هنرجو'}
                              </small>
                            </span>
                            <button type="button" className="cg-remove" onClick={() => removeMember(p)} disabled={busy} title="حذف از گروه">
                              <Icon name="trash" size={15} /> حذف
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="cg-section">
                    <div className="cg-section__head">
                      <h4 className="cg-title">افزودن هنرجو به گروه</h4>
                      <span className="cg-count">{candidates.length.toLocaleString('fa-IR')} هنرجوی قابل افزودن</span>
                    </div>
                    <p className="cg-hint">۱) هنرجویان را در فهرست زیر تیک بزنید. ۲) دکمهٔ «افزودن به گروه» را بزنید. فقط هنرجویان فعال دیده می‌شوند.</p>
                    <div className="cg-filters">
                      <label className="cg-field">
                        <span>جست‌وجو</span>
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="نام هنرجو، دوره یا کلاس" />
                      </label>
                      <label className="cg-field">
                        <span>فیلتر کلاس</span>
                        <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
                          <option value="">همهٔ کلاس‌ها</option>
                          {(detail.classGroups || []).map((c) => (
                            <option key={c.id} value={c.id}>{c.name}{c.branch ? ` — ${c.branch}` : ''}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="cg-list cg-list--pick">
                      {candidates.length === 0 && <p className="cg-hint">هنرجویی با این جست‌وجو پیدا نشد.</p>}
                      {candidates.map((p) => (
                        <label key={p.id} className={`cg-row cg-row--pick${picked.includes(p.id) ? ' is-picked' : ''}`}>
                          <input
                            type="checkbox"
                            checked={picked.includes(p.id)}
                            onChange={(e) => setPicked((cur) => (e.target.checked ? [...cur, p.id] : cur.filter((x) => x !== p.id)))}
                          />
                          <GroupAvatar name={p.name} photoUrl={p.photoUrl} size={32} />
                          <span className="cg-row__main">
                            <strong>{p.name}</strong>
                            <small>{[p.courseTitle, p.classGroupName, p.branch, p.graduated ? 'فارغ‌التحصیل' : null].filter(Boolean).join(' · ') || 'هنرجو'}</small>
                          </span>
                        </label>
                      ))}
                    </div>
                    <div className="cg-bar">
                      <span className="cg-bar__count">
                        {picked.length > 0 ? `${picked.length.toLocaleString('fa-IR')} نفر انتخاب شده` : 'هنوز کسی انتخاب نشده'}
                      </span>
                      <button type="button" className="growth-text-button" onClick={() => setPicked(candidates.map((p) => p.id))} disabled={candidates.length === 0}>
                        انتخاب همه
                      </button>
                      {picked.length > 0 && (
                        <button type="button" className="growth-text-button" onClick={() => setPicked([])}>پاک‌کردن انتخاب</button>
                      )}
                      <button type="button" className="btn btn--gold btn--sm" onClick={addMembers} disabled={picked.length === 0 || busy}>
                        افزودن به گروه
                      </button>
                    </div>
                  </section>
                </div>
              )}

              {tab === 'settings' && (
                <form className="cg-panel" onSubmit={saveGroup}>
                  <section className="cg-section">
                  <div className="cg-section__head"><h4 className="cg-title">پروفایل گروه</h4><span className="cg-count">{detail.group.active ? 'باز' : 'بسته'}</span></div>
                  <label className="cg-field">
                    <span>نام گروه</span>
                    <input value={form.name} maxLength={60} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </label>
                  <label className="cg-field">
                    <span>معرفی کوتاه</span>
                    <input value={form.description} maxLength={200} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </label>
                  <div className="cg-photo">
                    <GroupAvatar name={form.name} photoUrl={form.photoUrl} size={56} />
                    <label className="btn btn--ghost btn--sm">
                      تغییر عکس گروه
                      <input type="file" accept="image/*" hidden onChange={(e) => pickPhoto(e.target.files?.[0])} />
                    </label>
                    {form.photoUrl && (
                      <button type="button" className="growth-text-button" onClick={() => setForm({ ...form, photoUrl: '' })}>حذف عکس</button>
                    )}
                  </div>
                  <div className="cg-actions">
                    <button type="submit" className="btn btn--gold btn--sm" disabled={!form.name.trim() || busy}>ذخیرهٔ تغییرات</button>
                    <button type="button" className="btn btn--ghost btn--sm" onClick={toggleActive} disabled={busy}>
                      {detail.group.active ? 'بستن گروه' : 'باز کردن گروه'}
                    </button>
                    <button type="button" className="growth-text-button" style={{ color: '#DC2626' }} onClick={removeGroup} disabled={busy}>
                      حذف کامل گروه
                    </button>
                  </div>
                  <p className="cg-hint">
                    گروهِ بسته برای اعضا قابل خواندن است ولی پیام تازه پذیرفته نمی‌شود. حذف گروه همهٔ پیام‌ها را برای همیشه پاک می‌کند.
                  </p>
                  </section>
                </form>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
