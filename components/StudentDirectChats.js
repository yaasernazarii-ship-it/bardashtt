'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import GroupAvatar from './GroupAvatar';

const MAX = 2000;

function timeOf(iso) {
  return new Date(iso).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
}

function dayOf(iso) {
  return new Date(iso).toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function StudentDirectChats({ initialChatId = '' }) {
  const [chats, setChats] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState(initialChatId || null);
  const [head, setHead] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const boxRef = useRef(null);
  const chatRef = useRef(null);
  const lastAtRef = useRef(null);
  const stickRef = useRef(true);
  chatRef.current = selected;

  const loadList = useCallback(async (autoSelect = false) => {
    try {
      const res = await fetch('/api/student/direct-chats');
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'گفت‌وگوهای خصوصی بارگذاری نشد.'); setLoaded(true); return; }
      setChats(data.chats);
      setContacts(data.contacts);
      setLoaded(true);
      if (autoSelect) setSelected((current) => current || data.chats[0]?.id || null);
    } catch { /* شبکه */ }
  }, []);

  const poll = useCallback(async () => {
    const id = chatRef.current;
    if (!id) return;
    const after = lastAtRef.current;
    try {
      const res = await fetch(`/api/student/direct-chats/${id}?seen=1${after ? `&after=${encodeURIComponent(after)}` : ''}`);
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'گفت‌وگو باز نشد.'); return; }
      if (chatRef.current !== id) return;
      setHead(data.chat);
      setError('');
      if (data.reset) setMessages(data.messages);
      else if (data.messages.length) setMessages((current) => {
        const known = new Set(current.map((message) => message.id));
        return [...current, ...data.messages.filter((message) => !known.has(message.id))];
      });
      if (data.messages.length) lastAtRef.current = data.messages[data.messages.length - 1].createdAt;
    } catch { /* شبکه */ }
  }, []);

  useEffect(() => { loadList(true); }, [loadList]);
  useEffect(() => {
    const timer = setInterval(() => loadList(false), 15000);
    return () => clearInterval(timer);
  }, [loadList]);
  useEffect(() => {
    if (!selected) { setHead(null); setMessages([]); return undefined; }
    lastAtRef.current = null;
    setMessages([]);
    poll();
    const timer = setInterval(poll, 4000);
    return () => clearInterval(timer);
  }, [selected, poll]);
  useEffect(() => {
    const box = boxRef.current;
    if (box && stickRef.current) box.scrollTop = box.scrollHeight;
  }, [messages]);

  async function startChat(recipientId) {
    if (busy) return;
    setBusy(true);
    setError('');
    const res = await fetch('/api/student/direct-chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientId }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!data.ok) { setError(data.error || 'گفت‌وگو ساخته نشد.'); return; }
    setSelected(data.chat.id);
    await loadList(false);
  }

  async function send(event) {
    event?.preventDefault();
    const body = text.trim();
    if (!body || !selected || busy || !head?.canSend) return;
    setBusy(true);
    setText('');
    const res = await fetch(`/api/student/direct-chats/${selected}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!data.ok) { setError(data.error || 'پیام ارسال نشد.'); setText(body); return; }
    setMessages((current) => [...current, data.message]);
    lastAtRef.current = data.message.createdAt;
    stickRef.current = true;
    loadList(false);
  }

  async function removeMessage(messageId) {
    if (!window.confirm('این پیام حذف شود؟')) return;
    const res = await fetch(`/api/student/direct-chats/${selected}?message=${encodeURIComponent(messageId)}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!data.ok) { setError(data.error || 'پیام حذف نشد.'); return; }
    setMessages((current) => current.filter((message) => message.id !== messageId));
  }

  const rows = [];
  let lastDay = '';
  for (const message of messages) {
    const day = dayOf(message.createdAt);
    if (day !== lastDay) { rows.push({ type: 'day', id: `day-${message.id}`, label: day }); lastDay = day; }
    rows.push({ type: 'message', ...message });
  }
  const q = search.trim();
  const visibleContacts = contacts.filter((contact) => !q || contact.name.includes(q) || contact.subtitle.includes(q));

  if (loaded && chats.length === 0 && contacts.length === 0) {
    return <div className="dash-card cg-private-empty"><Icon name="chat" size={30} /><h3>هنوز عضو مشترکی ندارید</h3><p>وقتی مدیر شما و هنرجوی دیگری را در یک گروه قرار دهد، امکان گفت‌وگوی خصوصی اینجا فعال می‌شود.</p></div>;
  }

  return (
    <div>
      {error && <div className="alert alert--error" style={{ marginBottom: 12 }}>{error}</div>}
      <div className="cg-privacy-note"><Icon name="lock" size={15} /><span><strong>توجه:</strong> برای حفظ امنیت فضای آموزشی، پیام‌های خصوصی برای مدیریت آموزشگاه قابل مشاهده است.</span></div>
      <div className="staff-chat">
        <aside className="staff-chat__side cg-direct-side">
          <div className="cg-direct-label">گفت‌وگوهای من</div>
          {chats.map((chat) => (
            <button key={chat.id} type="button" className={`staff-chat__peer${selected === chat.id ? ' is-active' : ''}`} onClick={() => setSelected(chat.id)}>
              <GroupAvatar name={chat.other?.name} photoUrl={chat.other?.photoUrl} size={38} />
              <span className="staff-chat__peer-main">
                <span className="staff-chat__peer-name">{chat.other?.name || 'هنرجو'}{chat.unread > 0 && <span className="staff-chat__badge">{chat.unread.toLocaleString('fa-IR')}</span>}</span>
                <span className="staff-chat__peer-last">{chat.preview?.body || 'گفت‌وگوی تازه'}</span>
              </span>
            </button>
          ))}
          <div className="cg-direct-label">شروع گفت‌وگوی جدید</div>
          <div className="cg-direct-search"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="جست‌وجوی هنرجو" /></div>
          {visibleContacts.map((contact) => (
            <button key={contact.id} type="button" className="staff-chat__peer" onClick={() => startChat(contact.id)} disabled={busy}>
              <GroupAvatar name={contact.name} photoUrl={contact.photoUrl} size={34} />
              <span className="staff-chat__peer-main"><span className="staff-chat__peer-name">{contact.name}</span><span className="staff-chat__peer-last">{contact.sharedGroups.join('، ')}</span></span>
              <Icon name="plus" size={15} />
            </button>
          ))}
        </aside>

        <section className="staff-chat__main">
          {head ? (
            <>
              <header className="staff-chat__head">
                <GroupAvatar name={head.other.name} photoUrl={head.other.photoUrl} size={36} />
                <div><strong className="staff-chat__title">{head.other.name}</strong><span className="staff-chat__sub">گفت‌وگوی خصوصی</span></div>
                <span className="tag tag--gold staff-chat__lock">قابل مشاهده برای مدیریت</span>
              </header>
              <div className="staff-chat__msgs" ref={boxRef} onScroll={() => {
                const box = boxRef.current;
                if (box) stickRef.current = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
              }}>
                {rows.length === 0 && <p className="staff-chat__note">هنوز پیامی نیست. اولین پیام را شما بنویسید.</p>}
                {rows.map((row) => row.type === 'day' ? <span key={row.id} className="staff-chat__day">{row.label}</span> : (
                  <div key={row.id} className={`staff-bubble${row.mine ? ' staff-bubble--mine' : ''}`}>
                    {!row.mine && <span className="staff-bubble__who">{row.authorName}</span>}
                    <span className="staff-bubble__body">{row.body}</span>
                    <span className="staff-bubble__meta"><span dir="ltr">{timeOf(row.createdAt)}</span>{row.canDelete && <button type="button" className="staff-bubble__del" onClick={() => removeMessage(row.id)}><Icon name="close" size={12} /></button>}</span>
                  </div>
                ))}
              </div>
              <form className="staff-chat__foot" onSubmit={send}>
                <textarea className="staff-chat__input" rows={1} maxLength={MAX} value={text} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send(); } }} placeholder={head.canSend ? 'پیام خصوصی بنویسید…' : 'برای ارسال پیام باید در یک گروه مشترک عضو باشید'} disabled={!head.canSend} />
                <button type="submit" className="staff-chat__send" disabled={!text.trim() || busy || !head.canSend} aria-label="ارسال"><Icon name="arrowUp" size={18} /></button>
              </form>
            </>
          ) : <p className="staff-chat__note">یک گفت‌وگو را انتخاب کنید یا از فهرست اعضای مشترک، گفت‌وگوی تازه‌ای بسازید.</p>}
        </section>
      </div>
    </div>
  );
}
