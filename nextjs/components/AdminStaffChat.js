'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import StaffAvatar, { ROLE_LABEL } from './StaffAvatar';

const MAX = 2000;

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

export default function AdminStaffChat({ onUnread, active = true }) {
  const [me, setMe] = useState(null);
  const [group, setGroup] = useState(null);
  const [peers, setPeers] = useState([]);
  const [selected, setSelected] = useState(null); // { threadId, kind, peerId }
  const [head, setHead] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [started, setStarted] = useState(false);

  const boxRef = useRef(null);
  const lastAtRef = useRef(null);
  const threadRef = useRef(null);
  const stickRef = useRef(true); // اگر کاربر بالای گفت‌وگو را می‌خواند، پیام تازه صفحه را نپراند
  const seenRef = useRef(true); // آیا درخواست بعدی باید گفت‌وگو را «خوانده‌شده» علامت بزند

  threadRef.current = selected?.threadId || null;

  // فهرست گفت‌وگوها و شمارندهٔ خوانده‌نشده
  const loadList = useCallback(async (selectGroup = false) => {
    try {
      const res = await fetch('/api/admin/chat');
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'خطا در بارگذاری گفت‌وگوها.'); return; }
      setMe(data.me);
      setGroup(data.group);
      setPeers(data.peers);
      onUnread?.(data.unread);
      if (selectGroup) setSelected({ threadId: data.group.id, kind: 'group', peerId: null });
    } catch { /* شبکه؛ در دور بعدی دوباره تلاش می‌شود */ }
  }, [onUnread]);

  // تا وقتی تب گفت‌وگو باز نشده هیچ درخواستی نمی‌رود؛ سرور بی‌دلیل بار نمی‌گیرد.
  useEffect(() => {
    if (!active || started) return;
    setStarted(true);
    loadList(true);
  }, [active, started, loadList]);

  useEffect(() => {
    if (!active) return undefined;
    const t = setInterval(() => loadList(false), 15000);
    return () => clearInterval(t);
  }, [active, loadList]);

  // پیام‌های گفت‌وگوی باز؛ با after فقط پیام‌های تازه گرفته می‌شود.
  // «خوانده‌شده» را فقط در بار اول و بعد از رسیدنِ پیام تازه ثبت می‌کنیم، نه در هر چهار ثانیه.
  const poll = useCallback(async () => {
    const id = threadRef.current;
    if (!id) return;
    const after = lastAtRef.current;
    const seen = seenRef.current ? '1' : '0';
    const url = `/api/admin/chat/${id}?seen=${seen}${after ? `&after=${encodeURIComponent(after)}` : ''}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'گفت‌وگو باز نشد.'); return; }
      if (threadRef.current !== id) return; // کاربر بین دو درخواست گفت‌وگو را عوض کرده
      seenRef.current = data.messages.length > 0;
      setHead(data.thread);
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
    if (!active || !selected?.threadId) return undefined;
    lastAtRef.current = null;
    seenRef.current = true;
    setMessages([]);
    setLoadingThread(true);
    poll().finally(() => setLoadingThread(false));
    const t = setInterval(poll, 4000);
    return () => clearInterval(t);
  }, [active, selected?.threadId, poll]);

  // با آمدن پیام تازه به پایین می‌رویم، مگر کاربر عمداً بالا رفته باشد.
  useEffect(() => {
    const el = boxRef.current;
    if (el && stickRef.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  function onScroll() {
    const el = boxRef.current;
    if (!el) return;
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  function selectGroupThread() {
    if (!group) return;
    setHead({ id: group.id, kind: 'group', title: 'گفت‌وگوی گروهی تیم', peerRole: null });
    setSelected({ threadId: group.id, kind: 'group', peerId: null });
  }

  async function openPeer(peer) {
    setError('');
    // عنوان را همان لحظه می‌گذاریم تا نام گفت‌وگوی قبلی روی گفت‌وگوی تازه نماند.
    setHead({ id: peer.threadId, kind: 'direct', title: peer.name, peerRole: peer.role });
    if (peer.threadId) { setSelected({ threadId: peer.threadId, kind: 'direct', peerId: peer.id }); return; }
    const res = await fetch('/api/admin/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ peerId: peer.id }),
    });
    const data = await res.json().catch(() => ({}));
    if (!data.ok) { setError(data.error || 'گفت‌وگو باز نشد.'); return; }
    setPeers((list) => list.map((p) => (p.id === peer.id ? { ...p, threadId: data.threadId } : p)));
    setSelected({ threadId: data.threadId, kind: 'direct', peerId: peer.id });
  }

  async function send(e) {
    e?.preventDefault();
    const body = text.trim();
    const id = selected?.threadId;
    if (!body || !id || sending) return;
    setSending(true);
    setError('');
    setText('');
    stickRef.current = true;
    const res = await fetch(`/api/admin/chat/${id}`, {
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
    const res = await fetch(`/api/admin/chat/${selected.threadId}?message=${encodeURIComponent(mid)}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!data.ok) { setError(data.error || 'پیام حذف نشد.'); return; }
    setMessages((prev) => prev.filter((m) => m.id !== mid));
  }

  function onKeyDown(e) {
    // Enter می‌فرستد، Shift+Enter خط تازه — مثل هر پیام‌رسان دیگری.
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

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

      <div className="staff-chat">
        <aside className="staff-chat__side">
          <button
            type="button"
            className={`staff-chat__peer${selected?.kind === 'group' ? ' is-active' : ''}`}
            onClick={selectGroupThread}
          >
            <StaffAvatar name="ت" role="admin" size={38} />
            <span className="staff-chat__peer-main">
              <span className="staff-chat__peer-name">
                گفت‌وگوی گروهی تیم
                {group?.unread > 0 && <span className="staff-chat__badge">{group.unread.toLocaleString('fa-IR')}</span>}
              </span>
              <span className="staff-chat__peer-last">
                {group?.preview ? `${group.preview.mine ? 'شما' : group.preview.authorName}: ${group.preview.body}` : 'همهٔ مدیران و ادیتورها'}
              </span>
            </span>
          </button>

          {peers.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`staff-chat__peer${selected?.peerId === p.id ? ' is-active' : ''}`}
              onClick={() => openPeer(p)}
            >
              <StaffAvatar name={p.name} role={p.role} size={38} />
              <span className="staff-chat__peer-main">
                <span className="staff-chat__peer-name">
                  {p.name}
                  {p.unread > 0 && <span className="staff-chat__badge">{p.unread.toLocaleString('fa-IR')}</span>}
                </span>
                <span className="staff-chat__peer-last">
                  {p.preview ? `${p.preview.mine ? 'شما' : p.preview.authorName}: ${p.preview.body}` : `گفت‌وگوی خصوصی با ${ROLE_LABEL[p.role] || p.role}`}
                </span>
              </span>
              {p.lastMessageAt && <span className="staff-chat__peer-time">{shortWhen(p.lastMessageAt)}</span>}
            </button>
          ))}

          {peers.length === 0 && (
            <p className="staff-chat__empty-side">
              هنوز همکار دیگری در تیم مدیریت نیست. هر ادیتوری که در بخش «کاربران» اضافه شود، خودش همین‌جا می‌آید.
            </p>
          )}
        </aside>

        <section className="staff-chat__main">
          <header className="staff-chat__head">
            <StaffAvatar name={head?.kind === 'group' ? 'ت' : head?.title} role={head?.kind === 'group' ? 'admin' : head?.peerRole} size={36} />
            <div style={{ minWidth: 0 }}>
              <strong className="staff-chat__title">{head?.title || 'گفت‌وگوی تیمی'}</strong>
              <span className="staff-chat__sub">
                {head?.kind === 'group'
                  ? 'همهٔ مدیران و ادیتورهای فعال این گفت‌وگو را می‌بینند'
                  : 'گفت‌وگوی خصوصی — فقط شما و همین همکار آن را می‌بینید'}
              </span>
            </div>
            <span className="tag tag--gold staff-chat__lock" title="این گفت‌وگو فقط برای تیم مدیریت باز است؛ قفل نیست و می‌توانید پیام بفرستید">
              <Icon name="lock" size={13} /> فقط تیم مدیریت
            </span>
          </header>

          <div className="staff-chat__msgs" ref={boxRef} onScroll={onScroll}>
            {loadingThread && <p className="staff-chat__note">در حال بارگذاری…</p>}
            {!loadingThread && rows.length === 0 && (
              <p className="staff-chat__note">
                هنوز پیامی رد و بدل نشده. اولین پیام را بنویسید.
              </p>
            )}
            {rows.map((r) => (r.type === 'day' ? (
              <span key={r.id} className="staff-chat__day">{r.label}</span>
            ) : (
              <div key={r.id} className={`staff-bubble${r.mine ? ' staff-bubble--mine' : ''}`}>
                {!r.mine && head?.kind === 'group' && (
                  <span className="staff-bubble__who">{r.authorName} · {ROLE_LABEL[r.authorRole] || r.authorRole}</span>
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
              placeholder={selected ? 'پیام بنویسید… (Enter ارسال، Shift+Enter خط تازه)' : 'یک گفت‌وگو را انتخاب کنید'}
              disabled={!selected}
            />
            <button type="submit" className="staff-chat__send" disabled={!text.trim() || sending} aria-label="ارسال">
              <Icon name="arrowUp" size={18} />
            </button>
          </form>
        </section>
      </div>

      {me && (
        <p style={{ color: 'var(--muted)', fontSize: '.8rem', marginTop: 12 }}>
          شما با نام «{me.name}» پیام می‌فرستید. گفت‌وگوی خصوصی بین دو همکار برای هیچ‌کس دیگر — حتی مدیر سوم — باز نمی‌شود.
        </p>
      )}
    </div>
  );
}
