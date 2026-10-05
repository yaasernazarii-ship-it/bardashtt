'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

const timeFmt = new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' });
const dateFmt = new Intl.DateTimeFormat('fa-IR', { month: 'long', day: 'numeric' });

function relTime(iso) {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return timeFmt.format(d);
  return dateFmt.format(d);
}

export default function AdminSupport() {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [activeMeta, setActiveMeta] = useState(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const msgsRef = useRef(null);
  const activeIdRef = useRef(null);

  activeIdRef.current = activeId;

  const loadList = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/support');
      const data = await res.json();
      if (data.ok) setConversations(data.conversations);
    } catch { /* silent */ }
  }, []);

  const loadConversation = useCallback(async (id) => {
    try {
      const res = await fetch(`/api/admin/support/${id}`);
      const data = await res.json();
      if (data.ok) {
        setMessages(data.messages);
        setActiveMeta(data.conversation);
        setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, adminUnread: 0 } : c)));
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { loadList(); }, [loadList]);

  // polling فهرست و گفتگوی باز
  useEffect(() => {
    const t = setInterval(() => {
      loadList();
      if (activeIdRef.current) loadConversation(activeIdRef.current);
    }, 4000);
    return () => clearInterval(t);
  }, [loadList, loadConversation]);

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [messages]);

  function openConversation(id) {
    setActiveId(id);
    setMessages([]);
    setActiveMeta(null);
    loadConversation(id);
  }

  async function sendReply() {
    const body = reply.trim();
    if (!body || !activeId) return;
    setSending(true); setError('');
    setReply('');
    try {
      const res = await fetch(`/api/admin/support/${activeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessages((prev) => [...prev, data.message]);
        loadList();
      } else {
        setError(data.error || 'خطا در ارسال.');
      }
    } catch {
      setError('خطا در ارسال.');
    }
    setSending(false);
  }

  return (
    <div className="admin-support">
      <div className="admin-support__list">
        {conversations.length === 0 && <p className="admin-support__empty">هنوز گفتگویی ثبت نشده است.</p>}
        {conversations.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`admin-support__item${activeId === c.id ? ' active' : ''}`}
            onClick={() => openConversation(c.id)}
          >
            <div className="admin-support__item-top">
              <strong>{c.visitorName}</strong>
              <span className="admin-support__time">{relTime(c.lastMessageAt)}</span>
            </div>
            <div className="admin-support__item-bottom">
              {c.visitorPhone && <span dir="ltr" className="admin-support__phone">{c.visitorPhone}</span>}
              {c.status === 'closed' && <span className="admin-support__closed">بسته</span>}
              {c.adminUnread > 0 && <span className="admin-support__badge">{c.adminUnread}</span>}
            </div>
          </button>
        ))}
      </div>

      <div className="admin-support__pane">
        {!activeId ? (
          <div className="admin-support__placeholder">یک گفتگو را از فهرست انتخاب کنید.</div>
        ) : (
          <>
            <div className="admin-support__pane-head">
              <div>
                <strong>{activeMeta?.visitorName || '...'}</strong>
                {activeMeta?.visitorPhone && <span dir="ltr" className="admin-support__phone"> {activeMeta.visitorPhone}</span>}
              </div>
            </div>
            <div className="admin-support__msgs" ref={msgsRef}>
              {messages.map((m) => (
                <div key={m.id} className={`admin-support__msg admin-support__msg--${m.role}`}>
                  <div className="admin-support__bubble">{m.body}</div>
                  <span className="admin-support__msg-time">{relTime(m.createdAt)}</span>
                </div>
              ))}
            </div>
            {error && <div className="alert alert--error" style={{ margin: '8px 0' }}>{error}</div>}
            <div className="admin-support__reply">
              <input
                type="text"
                placeholder="پاسخ خود را بنویسید..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendReply()}
              />
              <button className="btn btn--dark" disabled={sending} onClick={sendReply}>ارسال</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
