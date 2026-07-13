'use client';
import { useState, useRef, useEffect } from 'react';

export default function SupportChat({ isOpen, onClose }) {
  const [step, setStep] = useState('name'); // 'name' | 'chat'
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const msgsRef = useRef(null);
  const nameRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && step === 'name') setTimeout(() => nameRef.current?.focus(), 100);
    if (isOpen && step === 'chat') setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen, step]);

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [messages]);

  function startChat() {
    if (!userName.trim()) { nameRef.current?.focus(); return; }
    setStep('chat');
    setMessages([{ who: 'bot', text: `سلام ${userName.trim()} عزیز! 😊 چطور می‌تونم کمکت کنم؟` }]);
  }

  function sendMsg() {
    const msg = inputVal.trim();
    if (!msg) return;
    setInputVal('');
    setMessages(prev => [...prev, { who: 'user', text: msg }]);
    fetch('/api/support-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: userName, phone: userPhone, message: msg }),
    }).catch(() => {});
    setTimeout(() => {
      setMessages(prev => [...prev, { who: 'bot', text: 'پیامتون رسید! 🙏 به زودی پاسخ می‌دیم. تماس: 02191090934' }]);
    }, 800);
  }

  return (
    <div className={`support-chat-box${isOpen ? ' open' : ''}`}>
      <div className="support-chat-head">
        <div className="av">🎬</div>
        <div>
          <h4>پشتیبانی خانواده برداشت</h4>
          <p>● آنلاین</p>
        </div>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      {step === 'name' ? (
        <>
          <div className="support-chat-msgs" style={{ minHeight: 80 }}>
            <div className="chat-msg chat-msg--bot">سلام! 👋 لطفاً اسم و شماره موبایلتون رو بنویسید.</div>
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
              <div key={i} className={`chat-msg chat-msg--${m.who === 'user' ? 'user' : 'bot'}`}>{m.text}</div>
            ))}
          </div>
          <div className="support-chat-foot">
            <input ref={inputRef} type="text" placeholder="پیام بنویسید..." value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMsg()} />
            <button onClick={sendMsg}>↑</button>
          </div>
          <div className="support-phone-note">پیام شما مستقیم برای تیم پشتیبانی ارسال می‌شود</div>
        </>
      )}
    </div>
  );
}
