'use client';

import { useEffect, useRef, useState } from 'react';

const SUGGESTIONS = [
  'متد پنج سوال طلایی چیست؟',
  'چطور احساس واقعی در بازیگری خلق کنم؟',
  'پنج سوال طلایی کدام‌اند؟',
];

export default function BardashtAI() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef(null);

  useEffect(() => { if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, busy, open]);

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
    <>
      {open && (
        <div className="bai-panel" role="dialog" aria-label="دستیار هوشمند Bardasht.AI">
          <div className="bai-head">
            <div className="bai-av">🤖</div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: '1rem' }}>Bardasht.AI</h4>
              <p style={{ margin: 0, fontSize: '.75rem', opacity: .8 }}>دستیار هوشمند هنرجو</p>
            </div>
            <button type="button" className="bai-close" onClick={() => setOpen(false)} aria-label="بستن">✕</button>
          </div>

          <div className="bai-thread">
            {messages.length === 0 && (
              <div style={{ color: 'var(--muted)' }}>
                <p style={{ marginBottom: 12 }}>سلام! من Bardasht.AI هستم. پرسش‌های خود دربارهٔ کتاب «متد پنج سوال طلایی» را بپرسید.</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {SUGGESTIONS.map((s) => (
                    <button key={s} type="button" className="btn btn--sm btn--outline" onClick={() => ask(s)}>{s}</button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`bai-msg bai-msg--${m.role}`}>
                <div className="bai-bubble">{m.content}</div>
              </div>
            ))}
            {busy && <div className="bai-msg bai-msg--assistant"><div className="bai-bubble">در حال نوشتن…</div></div>}
            <div ref={endRef} />
          </div>

          {error && <div className="alert alert--error" style={{ margin: '8px 12px' }}>{error}</div>}

          <form onSubmit={onSubmit} className="bai-input">
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="پرسش خود را بنویسید…" disabled={busy} />
            <button type="submit" disabled={busy || !input.trim()} aria-label="ارسال">↑</button>
          </form>
        </div>
      )}

      <button type="button" className="bai-fab" onClick={() => setOpen((o) => !o)} aria-label="Bardasht.AI">
        <span className="bai-fab__icon">{open ? '✕' : '🤖'}</span>
        {!open && <span className="bai-fab__label">Bardasht.AI</span>}
      </button>

      <style>{`
        .bai-fab{position:fixed;bottom:24px;left:24px;z-index:1200;display:flex;align-items:center;gap:8px;
          background:var(--dark,#141414);color:#fff;border:none;border-radius:999px;padding:12px 18px;
          box-shadow:0 8px 26px rgba(0,0,0,.28);cursor:pointer;font-family:inherit;font-weight:700}
        .bai-fab__icon{font-size:1.25rem;line-height:1}
        .bai-fab__label{font-size:.95rem}
        .bai-panel{position:fixed;bottom:88px;left:24px;z-index:1200;width:360px;max-width:calc(100vw - 32px);
          height:520px;max-height:calc(100vh - 130px);background:#fff;border:1px solid var(--border,#e5e5e5);
          border-radius:18px;box-shadow:0 18px 50px rgba(0,0,0,.25);display:flex;flex-direction:column;overflow:hidden}
        .bai-head{display:flex;align-items:center;gap:10px;background:var(--dark,#141414);color:#fff;padding:12px 14px}
        .bai-av{width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.14);display:flex;align-items:center;justify-content:center;font-size:1.2rem}
        .bai-close{background:transparent;border:none;color:#fff;font-size:1.05rem;cursor:pointer;padding:4px}
        .bai-thread{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px}
        .bai-msg{display:flex}
        .bai-msg--user{justify-content:flex-start}
        .bai-msg--assistant{justify-content:flex-end}
        .bai-bubble{max-width:82%;padding:10px 13px;border-radius:14px;line-height:1.9;font-size:.92rem;white-space:pre-line}
        .bai-msg--user .bai-bubble{background:var(--gold,#c9a24b);color:#141414;border-bottom-right-radius:4px}
        .bai-msg--assistant .bai-bubble{background:var(--surface,#f4f4f4);color:var(--text,#222);border-bottom-left-radius:4px}
        .bai-input{display:flex;gap:8px;padding:10px;border-top:1px solid var(--border,#e5e5e5)}
        .bai-input input{flex:1;border:1px solid var(--border,#e5e5e5);border-radius:10px;padding:10px 12px;font-family:inherit;font-size:.92rem}
        .bai-input button{background:var(--dark,#141414);color:#fff;border:none;border-radius:10px;width:44px;font-size:1.1rem;cursor:pointer}
        .bai-input button:disabled{opacity:.5;cursor:default}
      `}</style>
    </>
  );
}
