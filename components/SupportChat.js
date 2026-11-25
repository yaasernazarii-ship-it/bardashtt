'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import Icon from './Icon';

const STORAGE_KEY = 'bardasht_support_chat';

function loadStored() {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { return null; }
}

export default function SupportChat({ isOpen, onClose }) {
  const [step, setStep] = useState('name'); // 'name' | 'chat'
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [sending, setSending] = useState(false);
  const msgsRef = useRef(null);
  const nameRef = useRef(null);
  const inputRef = useRef(null);
  const lastAtRef = useRef(null);
  const convIdRef = useRef(null);

  convIdRef.current = conversationId;

  // بازیابی گفتگوی قبلی از localStorage
  useEffect(() => {
    const stored = loadStored();
    if (stored?.conversationId) {
      setUserName(stored.name || '');
      setUserPhone(stored.phone || '');
      setConversationId(stored.conversationId);
      setStep('chat');
    }
  }, []);

  useEffect(() => {
    if (isOpen && step === 'name') setTimeout(() => nameRef.current?.focus(), 100);
    if (isOpen && step === 'chat') setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen, step]);

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [messages]);

  const poll = useCallback(async () => {
    const id = convIdRef.current;
    if (!id) return;
    try {
      const url = `/api/support-chat?conversationId=${encodeURIComponent(id)}${lastAtRef.current ? `&after=${encodeURIComponent(lastAtRef.current)}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.ok && data.messages?.length) {
        setMessages((prev) => {
          const seen = new Set(prev.map((m) => m.id).filter(Boolean));
          const incoming = data.messages.filter((m) => !seen.has(m.id));
          return incoming.length ? [...prev, ...incoming] : prev;
        });
        lastAtRef.current = data.messages[data.messages.length - 1].createdAt;
      }
    } catch { /* silent */ }
  }, []);

  // polling برای پاسخ‌های پشتیبانی
  useEffect(() => {
    if (step !== 'chat' || !conversationId) return;
    poll();
    const t = setInterval(poll, 4000);
    return () => clearInterval(t);
  }, [step, conversationId, poll]);

  function startChat() {
    if (!userName.trim()) { nameRef.current?.focus(); return; }
    setStep('chat');
    setMessages([{ id: 'welcome', role: 'bot', body: `سلام ${userName.trim()} عزیز، خوش آمدید. پیامتون رو بنویسید؛ پشتیبانی همین‌جا پاسخ می‌ده.` }]);
  }

  async function sendMsg() {
    const msg = inputVal.trim();
    if (!msg || sending) return;
    setInputVal('');
    setSending(true);
    const localId = `local-${Date.now()}`;
    setMessages((prev) => [...prev, { id: localId, role: 'visitor', body: msg }]);
    try {
      const res = await fetch('/api/support-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, name: userName, phone: userPhone, message: msg }),
      });
      const data = await res.json();
      if (data.ok && data.conversationId) {
        if (data.conversationId !== conversationId) {
          setConversationId(data.conversationId);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ conversationId: data.conversationId, name: userName, phone: userPhone }));
          } catch { /* ignore */ }
        }
      }
    } catch { /* silent */ }
    setSending(false);
  }

  return (
    <div className={`support-chat-box${isOpen ? ' open' : ''}`}>
      <div className="support-chat-head">
        <div className="av"><Icon name="clapperboard" size={20} /></div>
        <div>
          <h4>پشتیبانی خانواده برداشت</h4>
          <p>● آنلاین</p>
        </div>
        <button className="close-btn" onClick={onClose} aria-label="بستن"><Icon name="close" size={20} /></button>
      </div>

      {step === 'name' ? (
        <>
          <div className="support-chat-msgs" style={{ minHeight: 80 }}>
            <div className="chat-msg chat-msg--bot">سلام! لطفاً اسم و شماره موبایلتون رو بنویسید.</div>
            <div className="chat-msg chat-msg--bot">ساعت پاسخ‌گویی پشتیبانی هر روز از ۹ صبح تا ۹ شب است. خارج از این ساعت هم پیامتون رو بذارید، در اولین فرصت پاسخ می‌دیم.</div>
          </div>
          <div className="support-name-form">
            <input ref={nameRef} type="text" placeholder="نام شما" value={userName} onChange={e => setUserName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && startChat()} />
            <input type="tel" placeholder="شماره موبایل (اختیاری)" dir="ltr" style={{ textAlign: 'center' }}
              value={userPhone} onChange={e => setUserPhone(e.target.value)} />
            <button onClick={startChat}>شروع گفتگو ←</button>
          </div>
        </>
      ) : (
        <>
          <div className="support-chat-msgs" ref={msgsRef}>
            {messages.map((m, i) => (
              <div key={m.id || i} className={`chat-msg chat-msg--${m.role === 'visitor' ? 'user' : 'bot'}`}>{m.body}</div>
            ))}
          </div>
          <div className="support-chat-foot">
            <input ref={inputRef} type="text" placeholder="پیام بنویسید..." value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMsg()} />
            <button onClick={sendMsg} disabled={sending} aria-label="ارسال"><Icon name="arrowUp" size={20} /></button>
          </div>
          <div className="support-phone-note">پاسخ پشتیبانی همین‌جا به‌صورت زنده نمایش داده می‌شود</div>
        </>
      )}
    </div>
  );
}
