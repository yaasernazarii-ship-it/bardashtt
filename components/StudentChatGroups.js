'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import GroupAvatar from './GroupAvatar';

const MAX = 2000;
const ROLE_TAG = { admin: 'مدیر', editor: 'ادیتور' };

function timeOf(iso) {
  return new Date(iso).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
}

function dayOf(iso) {
  return new Date(iso).toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function shortWhen(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay ? timeOf(iso) : d.toLocaleDateString('fa-IR', { day: 'numeric', month: 'long' });
}

// فضای گفت‌وگوی گروهی هنرجو: فقط گروه‌هایی که مدیر او را در آن‌ها عضو کرده است.
// ساختن گروه، افزودن عضو و تغییر عکس/نام گروه از این‌جا ممکن نیست؛ همه کارِ پنل مدیریت است.
export default function StudentChatGroups({ initialGroupId = '' }) {
  const [groups, setGroups] = useState([]);
  const [selected, setSelected] = useState(initialGroupId || null);
  const [head, setHead] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [loadedList, setLoadedList] = useState(false);

  const boxRef = useRef(null);
  const lastAtRef = useRef(null);
  const groupRef = useRef(null);
  const stickRef = useRef(true); // اگر کاربر بالای گفت‌وگو را می‌خواند، پیام تازه صفحه را نپراند
  const seenRef = useRef(true);

  groupRef.current = selected;

  const loadList = useCallback(async (autoSelect = false) => {
    try {
      const res = await fetch('/api/student/chat-groups');
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'خطا در بارگذاری گروه‌ها.'); setLoadedList(true); return; }
      setGroups(data.groups);
      setLoadedList(true);
      if (autoSelect) {
        setSelected((cur) => {
          if (cur && data.groups.some((g) => g.id === cur)) return cur;
          return data.groups[0]?.id || null;
        });
      }
    } catch { /* شبکه؛ در دور بعدی دوباره تلاش می‌شود */ }
  }, []);

  useEffect(() => { loadList(true); }, [loadList]);

  useEffect(() => {
    const t = setInterval(() => loadList(false), 15000);
    return () => clearInterval(t);
  }, [loadList]);

  // پیام‌های گروه باز؛ با after فقط پیام‌های تازه گرفته می‌شود.
  const poll = useCallback(async () => {
    const id = groupRef.current;
    if (!id) return;
    const after = lastAtRef.current;
    const seen = seenRef.current ? '1' : '0';
    const url = `/api/student/chat-groups/${id}?seen=${seen}${after ? `&after=${encodeURIComponent(after)}` : ''}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'گروه باز نشد.'); return; }
      if (groupRef.current !== id) return; // کاربر بین دو درخواست گروه را عوض کرده
      setError('');
      seenRef.current = data.messages.length > 0;
      setHead(data.group);
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
    if (!selected) return undefined;
    lastAtRef.current = null;
    seenRef.current = true;
    setMessages([]);
    setLoadingThread(true);
    poll().finally(() => setLoadingThread(false));
    const t = setInterval(poll, 4000);
    return () => clearInterval(t);
  }, [selected, poll]);

  useEffect(() => {
    const el = boxRef.current;
    if (el && stickRef.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  function onScroll() {
    const el = boxRef.current;
    if (!el) return;
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  function openGroup(g) {
    setError('');
    setHead(g);
    setSelected(g.id);
    setGroups((list) => list.map((row) => (row.id === g.id ? { ...row, unread: 0 } : row)));
  }

  async function send(e) {
    e?.preventDefault();
    const body = text.trim();
    const id = selected;
    if (!body || !id || sending) return;
    setSending(true);
    setError('');
    setText('');
    stickRef.current = true;
    const res = await fetch(`/api/student/chat-groups/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    });
    const data = await res.json().catch(() => ({}));
    setSending(false);
    if (!data.ok) { setError(data.error || 'پیام ارسال نشد.'); setText(body); return; }
    setMessages((prev) => (prev.some((m) => m.id === data.message.id) ? prev : [...prev, data.message]));
    lastAtRef.current = data.message.createdAt;
    loadList(false);
  }

  async function removeMessage(mid) {
    if (!window.confirm('این پیام حذف شود؟')) return;
    const res = await fetch(`/api/student/chat-groups/${selected}?message=${encodeURIComponent(mid)}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!data.ok) { setError(data.error || 'پیام حذف نشد.'); return; }
    setMessages((prev) => prev.filter((m) => m.id !== mid));
  }

  function onKeyDown(e) {
    // Enter می‌فرستد، Shift+Enter خط تازه.
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  const rows = [];
  let lastDay = '';
  for (const m of messages) {
    const day = dayOf(m.createdAt);
    if (day !== lastDay) { rows.push({ type: 'day', id: `d-${m.id}`, label: day }); lastDay = day; }
    rows.push({ type: 'msg', ...m });
  }

  if (loadedList && groups.length === 0) {
    return (
      <div className="dash-card" style={{ textAlign: 'center', padding: '38px 20px' }}>
        <Icon name="chat" size={30} />
        <h3 className="dash-card__title" style={{ justifyContent: 'center', marginTop: 10 }}>هنوز در گروهی عضو نیستید</h3>
        <p className="dash-card__text">
          گروه‌های گفت‌وگو را مدیر آموزشگاه می‌سازد و اعضایش را خودش انتخاب می‌کند.
          به‌محض اینکه به گروه دوره‌تان اضافه شوید، همین‌جا نمایش داده می‌شود و اعلانش را هم می‌گیرید.
        </p>
      </div>
    );
  }

  const closed = head && head.active === false;

  return (
    <div>
      {error && <div className="alert alert--error" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="staff-chat">
        <aside className="staff-chat__side">
          {groups.map((g) => (
            <button
              key={g.id}
              type="button"
              className={`staff-chat__peer${selected === g.id ? ' is-active' : ''}`}
              onClick={() => openGroup(g)}
            >
              <GroupAvatar name={g.name} photoUrl={g.photoUrl} size={38} />
              <span className="staff-chat__peer-main">
                <span className="staff-chat__peer-name">
                  {g.name}
                  {g.unread > 0 && <span className="staff-chat__badge">{g.unread.toLocaleString('fa-IR')}</span>}
                </span>
                <span className="staff-chat__peer-last">
                  {g.preview
                    ? `${g.preview.mine ? 'شما' : g.preview.authorName}: ${g.preview.body}`
                    : `${g.memberCount.toLocaleString('fa-IR')} عضو`}
                </span>
              </span>
              {g.lastMessageAt && g.preview && <span className="staff-chat__peer-time">{shortWhen(g.lastMessageAt)}</span>}
            </button>
          ))}
          {!loadedList && <p className="staff-chat__empty-side">در حال بارگذاری گروه‌ها…</p>}
        </aside>

        <section className="staff-chat__main">
          <header className="staff-chat__head">
            <GroupAvatar name={head?.name} photoUrl={head?.photoUrl} size={36} />
            <div style={{ minWidth: 0 }}>
              <strong className="staff-chat__title">{head?.name || 'گروه'}</strong>
              <span className="staff-chat__sub">
                {head?.description || (head ? `${head.memberCount.toLocaleString('fa-IR')} عضو` : 'یک گروه را انتخاب کنید')}
              </span>
            </div>
            <span className="tag tag--gold staff-chat__lock" title="فقط هنرجویانی که مدیر انتخاب کرده در این گروه هستند">
              <Icon name="lock" size={13} /> فقط اعضای گروه
            </span>
          </header>

          <div className="staff-chat__msgs" ref={boxRef} onScroll={onScroll}>
            {loadingThread && <p className="staff-chat__note">در حال بارگذاری…</p>}
            {!loadingThread && rows.length === 0 && (
              <p className="staff-chat__note">هنوز پیامی در این گروه نیست. اولین پیام را شما بنویسید.</p>
            )}
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
              placeholder={closed ? 'این گروه بسته شده و پیام تازه پذیرفته نمی‌شود' : 'پیام بنویسید… (Enter ارسال، Shift+Enter خط تازه)'}
              disabled={!selected || closed}
            />
            <button type="submit" className="staff-chat__send" disabled={!text.trim() || sending || closed} aria-label="ارسال">
              <Icon name="arrowUp" size={18} />
            </button>
          </form>
        </section>
      </div>

      <p style={{ color: 'var(--muted)', fontSize: '.8rem', marginTop: 12 }}>
        این گروه‌ها فقط برای هنرجویان است و عضویت در آن‌ها را مدیر آموزشگاه تعیین می‌کند. پیام‌ها را همهٔ اعضای همین گروه می‌بینند.
      </p>
    </div>
  );
}
