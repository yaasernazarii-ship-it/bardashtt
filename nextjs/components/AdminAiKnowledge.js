'use client';

import { useEffect, useRef, useState } from 'react';

const dateFmt = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
const fa = (value) => Number(value || 0).toLocaleString('fa-IR');

export default function AdminAiKnowledge() {
  const [items, setItems] = useState([]);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [removingId, setRemovingId] = useState('');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const fileRef = useRef(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/ai-knowledge');
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'بارگذاری منابع انجام نشد.'); return; }
      setItems(data.items);
      setConfigured(data.aiConfigured);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function checkConnection() {
    setChecking(true); setError(''); setNotice('');
    try {
      const res = await fetch('/api/admin/ai-knowledge', { method: 'PUT' });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'بررسی اتصال ناموفق بود.'); return; }
      setNotice(data.message);
    } finally {
      setChecking(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    if (!file && !text.trim()) { setError('فایل را انتخاب یا متن مطلب را وارد کنید.'); return; }
    setBusy(true); setError(''); setNotice('');
    try {
      const body = new FormData();
      body.append('title', title);
      body.append('text', text);
      if (file) body.append('file', file);
      const res = await fetch('/api/admin/ai-knowledge', { method: 'POST', body });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'ثبت منبع انجام نشد.'); return; }
      setItems((current) => [data.item, ...current]);
      setTitle(''); setText(''); setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      setNotice(`«${data.item.title}» ثبت شد و از این پس در پاسخ‌های هوش مصنوعی استفاده می‌شود.`);
    } finally {
      setBusy(false);
    }
  }

  async function remove(item) {
    if (!confirm(`منبع «${item.title}» از هوش مصنوعی حذف شود؟ پس از حذف دیگر در پاسخ‌ها استفاده نمی‌شود.`)) return;
    setRemovingId(item.id); setError(''); setNotice('');
    try {
      const res = await fetch(`/api/admin/ai-knowledge/${item.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'حذف منبع انجام نشد.'); return; }
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      setNotice(`منبع «${item.title}» از هوش مصنوعی حذف شد.`);
    } finally {
      setRemovingId('');
    }
  }

  return (
    <section className="stack-card" style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ marginBottom: 6, fontSize: '1.08rem' }}>منابع هوش مصنوعی</h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.9, margin: 0 }}>
            مطلب، جزوهٔ PDF یا فایل متنی را اینجا ثبت کنید تا دستیار هنگام پرسش کاربران از آن پاسخ بدهد.
            منابع کتاب «متد پنج سوال طلایی» جدا هستند و از این بخش تغییری نمی‌کنند.
          </p>
        </div>
        <button type="button" className="btn btn--outline" onClick={checkConnection} disabled={checking || !configured}>
          {checking ? 'در حال بررسی…' : 'بررسی اتصال گپ‌جی‌پی‌تی'}
        </button>
      </div>

      <div className={`alert ${configured ? 'alert--success' : 'alert--error'}`} style={{ marginTop: 14 }}>
        {configured
          ? 'اتصال سایت تنظیم شده است. بعد از شارژ حساب گپ‌جی‌پی‌تی، سرویس خودکار و بدون تنظیم یا انتشار مجدد فعال می‌شود.'
          : 'کلید اتصال گپ‌جی‌پی‌تی روی سرور تنظیم نشده است.'}
      </div>
      {error && <div className="alert alert--error" style={{ marginTop: 10 }}>{error}</div>}
      {notice && <div className="alert alert--success" style={{ marginTop: 10 }}>{notice}</div>}

      <form onSubmit={submit} style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        <div className="form-group">
          <label className="form-label">عنوان منبع</label>
          <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={190}
            placeholder="مثلاً جزوهٔ بیان و بدن" required />
        </div>
        <div className="form-group">
          <label className="form-label">بارگذاری جزوه</label>
          <input ref={fileRef} className="form-input" type="file" accept="application/pdf,text/plain,text/markdown,.pdf,.txt,.md"
            onChange={(e) => {
              const selected = e.target.files?.[0] || null;
              setFile(selected);
              if (selected) setText('');
            }} disabled={busy} />
          <p className="form-hint">فرمت‌های PDF، TXT و Markdown تا حجم ۱۰ مگابایت؛ فایل اصلی روی سرور نگهداری نمی‌شود و فقط متن آن ثبت می‌شود.</p>
        </div>
        <div className="form-group">
          <label className="form-label">یا متن مطلب را مستقیم وارد کنید</label>
          <textarea className="form-input" rows={6} value={text} onChange={(e) => setText(e.target.value)}
            placeholder="متن مقاله یا جزوه را اینجا بچسبانید…" disabled={busy || Boolean(file)} />
        </div>
        <button className="btn btn--dark" disabled={busy || !configured || (!file && !text.trim())} style={{ width: 'fit-content' }}>
          {busy ? 'در حال پردازش و ثبت…' : 'ثبت در هوش مصنوعی'}
        </button>
      </form>

      <div style={{ borderTop: '1px solid var(--border)', marginTop: 20, paddingTop: 16 }}>
        <h3 style={{ marginBottom: 12 }}>منابع ثبت‌شده ({fa(items.length)})</h3>
        {loading ? <p style={{ color: 'var(--muted)' }}>در حال بارگذاری…</p> : items.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>هنوز منبع تکمیلی ثبت نشده است.</p>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {items.map((item) => (
              <div key={item.id} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 12, display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                  <strong>{item.title}</strong>
                  <div style={{ color: 'var(--muted)', fontSize: '.82rem', marginTop: 5 }}>
                    {fa(item.chunkCount)} بخش دانشی · {dateFmt.format(new Date(item.createdAt))}
                    {item.fileName ? ` · ${item.fileName}` : ' · متن مستقیم'}
                  </div>
                </div>
                <button type="button" className="btn btn--sm btn--danger" disabled={removingId === item.id} onClick={() => remove(item)}>
                  {removingId === item.id ? 'در حال حذف…' : 'حذف منبع'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
