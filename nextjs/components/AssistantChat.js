'use client';

import { useEffect, useRef, useState } from 'react';

const SUGGESTIONS = [
  'متد پنج سوال طلایی چیست؟',
  'چطور احساس واقعی در بازیگری خلق کنم؟',
  'پنج سوال طلایی کدام‌اند؟',
];

export default function AssistantChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, busy]);

  async function ask(text) {
    const question = (text ?? input).trim();
    if (!question || busy) return;
    setError('');
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: question }]);
    setBusy(true);
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || 'خطا در دریافت پاسخ.');
        setBusy(false);
        return;
      }
      setMessages((m) => [...m, { role: 'assistant', content: data.answer }]);
    } catch {
      setError('ارتباط برقرار نشد. دوباره تلاش کنید.');
    }
    setBusy(false);
  }

  function onSubmit(e) { e.preventDefault(); ask(); }

  return (
    <div className="chat-shell">
      <div className="chat-thread">
        {messages.length === 0 && (
          <div className="chat-empty">
            <p style={{ color: 'var(--muted)', marginBottom: 14 }}>پرسش خود را دربارهٔ کتاب «متد پنج سوال طلایی» و منابع آموزشی تاییدشده بپرسید. پاسخ‌ها فقط بر اساس همین منابع داده می‌شوند.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" className="btn btn--sm btn--outline" onClick={() => ask(s)}>{s}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg chat-msg--${m.role}`}>
            <div className="chat-bubble">{m.content}</div>
          </div>
        ))}
        {busy && <div className="chat-msg chat-msg--assistant"><div className="chat-bubble chat-bubble--typing">در حال نوشتن…</div></div>}
        <div ref={endRef} />
      </div>

      {error && <div className="alert alert--error" style={{ margin: '10px 0' }}>{error}</div>}

      <form onSubmit={onSubmit} className="chat-input">
        <input
          className="form-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="پرسش خود را بنویسید…"
          disabled={busy}
        />
        <button className="btn btn--dark" type="submit" disabled={busy || !input.trim()}>ارسال</button>
      </form>
    </div>
  );
}
