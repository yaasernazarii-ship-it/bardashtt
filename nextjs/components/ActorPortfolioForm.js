'use client';

import { useEffect, useState } from 'react';

export default function ActorPortfolioForm() {
  const [items, setItems] = useState([]);
  const [type, setType] = useState('image');
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    fetch('/api/my/actor-portfolio').then((response) => response.json()).then((data) => {
      if (data.ok) setItems(data.items);
      else setNotice(data.error || 'دریافت نمونه‌کارها ممکن نشد.');
    }).catch(() => setNotice('دریافت نمونه‌کارها ممکن نشد.'));
  }, []);

  async function submit(event) {
    event.preventDefault();
    if (!file) { setNotice('فایل نمونه‌کار را انتخاب کنید.'); return; }
    setBusy(true); setNotice('');
    const body = new FormData();
    body.set('file', file); body.set('type', type); body.set('title', title); body.set('description', description);
    try {
      const response = await fetch('/api/my/actor-portfolio', { method: 'POST', body });
      const data = await response.json();
      if (!data.ok) setNotice(data.error || 'ثبت نمونه‌کار ممکن نشد.');
      else {
        setItems((previous) => [...previous, data.item]);
        setFile(null); setTitle(''); setDescription('');
        document.getElementById('portfolio-file-input').value = '';
        setNotice('نمونه‌کار برای بررسی مدیریت ثبت شد.');
      }
    } catch { setNotice('ثبت نمونه‌کار ممکن نشد.'); }
    setBusy(false);
  }

  const label = (status) => status === 'approved' ? 'تأییدشده و منتشرشده' : status === 'rejected' ? 'نیاز به اصلاح' : 'در انتظار بررسی';
  return <section className="rz-card">
    <div className="rz-card__head"><h2>نمونه‌کارها</h2><p>عکس پس از تأیید منتشر می‌شود. فایل ویدئو فقط برای تیم مدیریت قابل دریافت است و پس از انتشار در آپارات، لینک آن در رزومه قرار می‌گیرد.</p></div>
    <form onSubmit={submit} className="rz-grid">
      <label className="form-group"><span className="form-label">نوع نمونه‌کار</span><select className="form-input" value={type} disabled={busy} onChange={(event) => setType(event.target.value)}><option value="image">عکس نمونه‌کار</option><option value="video">ویدئوی نمونه‌کار</option></select></label>
      <label className="form-group"><span className="form-label">فایل</span><input id="portfolio-file-input" className="form-input" type="file" required accept={type === 'image' ? 'image/jpeg,image/png,image/webp' : 'video/mp4,video/webm,video/quicktime'} disabled={busy} onChange={(event) => setFile(event.target.files?.[0] || null)} /></label>
      <label className="form-group"><span className="form-label">عنوان (اختیاری)</span><input className="form-input" value={title} disabled={busy} onChange={(event) => setTitle(event.target.value)} /></label>
      <label className="form-group rz-grid__full"><span className="form-label">توضیح (اختیاری)</span><textarea className="form-input" rows={2} value={description} disabled={busy} onChange={(event) => setDescription(event.target.value)} /></label>
      <div className="rz-grid__full"><button className="btn btn--dark" disabled={busy}>{busy ? 'در حال ارسال…' : 'ارسال برای بررسی'}</button></div>
    </form>
    {items.length > 0 && <div className="rz-videos" style={{ marginTop: 20 }}>{items.map((item) => <div className="rz-video" key={item.id}><div className="rz-video__head"><strong>{item.type === 'image' ? 'عکس نمونه‌کار' : 'ویدئوی نمونه‌کار'}{item.title ? `: ${item.title}` : ''}</strong><span className={`su-tag ${item.status === 'approved' ? 'su-tag--ok' : item.status === 'rejected' ? 'su-tag--muted' : 'su-tag--grad'}`}>{label(item.status)}</span></div>{item.type === 'image' ? <img src={item.sourceUrl} alt={item.title || 'نمونه‌کار'} style={{ width: 120, maxHeight: 150, objectFit: 'cover', borderRadius: 8 }} /> : <a className="btn btn--sm btn--outline" href={item.sourceUrl}>دریافت فایل ویدئو</a>}{item.description && <p>{item.description}</p>}</div>)}</div>}
    {notice && <div className="alert alert--info" role="status" style={{ marginTop: 16 }}>{notice}</div>}
  </section>;
}
