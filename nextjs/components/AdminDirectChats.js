'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import GroupAvatar from './GroupAvatar';

function timeOf(iso) {
  return new Date(iso).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
}

function dayOf(iso) {
  return new Date(iso).toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function AdminDirectChats() {
  const [chats, setChats] = useState([]);
  const [selected, setSelected] = useState(null);
  const [head, setHead] = useState(null);
  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const selectedRef = useRef(null);
  const lastAtRef = useRef(null);
  const boxRef = useRef(null);
  selectedRef.current = selected;

  const loadList = useCallback(async (autoSelect = false) => {
    try {
      const res = await fetch('/api/admin/direct-chats');
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'فهرست پیام‌های خصوصی بارگذاری نشد.'); return; }
      setChats(data.chats);
      if (autoSelect) setSelected((current) => current || data.chats[0]?.id || null);
    } catch { /* شبکه */ }
  }, []);

  const poll = useCallback(async () => {
    const id = selectedRef.current;
    if (!id) return;
    const after = lastAtRef.current;
    try {
      const res = await fetch(`/api/admin/direct-chats/${id}${after ? `?after=${encodeURIComponent(after)}` : ''}`);
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'گفت‌وگو باز نشد.'); return; }
      if (selectedRef.current !== id) return;
      setHead(data.chat);
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
    const timer = setInterval(poll, 5000);
    return () => clearInterval(timer);
  }, [selected, poll]);
  useEffect(() => {
    const box = boxRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [messages]);

  async function removeMessage(messageId) {
    if (!window.confirm('این پیام خصوصی حذف شود؟')) return;
    const res = await fetch(`/api/admin/direct-chats/${selected}?message=${encodeURIComponent(messageId)}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!data.ok) { setError(data.error || 'پیام حذف نشد.'); return; }
    setMessages((current) => current.filter((message) => message.id !== messageId));
  }

  const q = search.trim();
  const visible = chats.filter((chat) => !q || chat.first.name.includes(q) || chat.second.name.includes(q) || chat.preview?.body.includes(q));
  const rows = [];
  let lastDay = '';
  for (const message of messages) {
    const day = dayOf(message.createdAt);
    if (day !== lastDay) { rows.push({ type: 'day', id: `day-${message.id}`, label: day }); lastDay = day; }
    rows.push({ type: 'message', ...message });
  }

  return (
    <div>
      {error && <div className="alert alert--error" style={{ marginBottom: 12 }}>{error}</div>}
      <div className="cg-admin-monitor"><strong>نظارت بر پیام‌های خصوصی هنرجویان</strong><span>همهٔ گفت‌وگوهای خصوصی میان اعضای گروه‌ها در این بخش ثبت و برای مدیریت قابل مشاهده است.</span></div>
      <div className="staff-chat">
        <aside className="staff-chat__side cg-direct-side">
          <div className="cg-direct-search"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="جست‌وجوی نام یا متن پیام" /></div>
          {visible.map((chat) => (
            <button key={chat.id} type="button" className={`staff-chat__peer${selected === chat.id ? ' is-active' : ''}`} onClick={() => setSelected(chat.id)}>
              <GroupAvatar name={chat.first.name} photoUrl={chat.first.photoUrl} size={34} />
              <span className="staff-chat__peer-main">
                <span className="staff-chat__peer-name">{chat.first.name} و {chat.second.name}</span>
                <span className="staff-chat__peer-last">{chat.preview ? `${chat.preview.authorName}: ${chat.preview.body}` : 'بدون پیام'}</span>
              </span>
            </button>
          ))}
          {chats.length === 0 && <p className="staff-chat__empty-side">هنوز گفت‌وگوی خصوصی‌ای ساخته نشده است.</p>}
        </aside>
        <section className="staff-chat__main">
          {head ? (
            <>
              <header className="staff-chat__head">
                <div className="cg-admin-pair"><GroupAvatar name={head.first.name} photoUrl={head.first.photoUrl} size={34} /><GroupAvatar name={head.second.name} photoUrl={head.second.photoUrl} size={34} /></div>
                <div><strong className="staff-chat__title">{head.first.name} و {head.second.name}</strong><span className="staff-chat__sub">گفت‌وگوی خصوصی هنرجویان</span></div>
                <span className="tag tag--gold staff-chat__lock">نمایش مدیریت</span>
              </header>
              <div className="staff-chat__msgs" ref={boxRef}>
                {rows.length === 0 && <p className="staff-chat__note">هنوز پیامی در این گفت‌وگو نیست.</p>}
                {rows.map((row) => row.type === 'day' ? <span key={row.id} className="staff-chat__day">{row.label}</span> : (
                  <div key={row.id} className={`staff-bubble${row.authorId === head.first.id ? ' staff-bubble--mine' : ''}`}>
                    <span className="staff-bubble__who">{row.authorName}</span>
                    <span className="staff-bubble__body">{row.body}</span>
                    <span className="staff-bubble__meta"><span dir="ltr">{timeOf(row.createdAt)}</span><button type="button" className="staff-bubble__del" title="حذف پیام" onClick={() => removeMessage(row.id)}><Icon name="close" size={12} /></button></span>
                  </div>
                ))}
              </div>
              <div className="cg-monitor-foot"><Icon name="lock" size={14} />این صفحه فقط برای مشاهده و مدیریت پیام‌هاست؛ مدیریت از طرف هنرجویان پیام ارسال نمی‌کند.</div>
            </>
          ) : <p className="staff-chat__note">یک گفت‌وگوی خصوصی را از فهرست انتخاب کنید.</p>}
        </section>
      </div>
    </div>
  );
}
