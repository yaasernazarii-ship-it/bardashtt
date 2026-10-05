'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';

async function uploadSocialImage(file, kind) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('kind', kind);
  let res;
  try {
    res = await fetch('/api/social/upload', { method: 'POST', body: fd });
  } catch {
    return { ok: false, error: 'ارتباط با سرور برقرار نشد.' };
  }
  try {
    return await res.json();
  } catch {
    return { ok: false, error: res.status === 413 ? 'حجم عکس بیشتر از حد مجاز است.' : `آپلود ناموفق بود (${res.status}).` };
  }
}

export default function SocialComposer({ initialKind = 'post' }) {
  const [kind, setKind] = useState(initialKind);
  const currentKind = useRef(initialKind);
  const uploadVersion = useRef(0);
  const [imageUrl, setImageUrl] = useState('');
  const [imageKind, setImageKind] = useState('');
  const [aparatUrl, setAparatUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [uploadError, setUploadError] = useState(false);
  const [okMsg, setOkMsg] = useState('');
  const [items, setItems] = useState([]);
  const [canPost, setCanPost] = useState(true);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch('/api/social/posts?scope=mine');
    const data = await res.json();
    if (data.ok) {
      setItems(data.items);
      setCanPost(data.canPost);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function changeKind(nextKind) {
    if (nextKind === currentKind.current) return;
    uploadVersion.current += 1;
    currentKind.current = nextKind;
    setKind(nextKind);
    setError('');
    setUploadError(false);
    if (uploading) {
      setUploading(false);
      setUploadError(true);
      setError('نوع محتوا هنگام آپلود تغییر کرد؛ لطفاً عکس را دوباره انتخاب کنید.');
    }
    if (imageUrl && imageKind && imageKind !== nextKind) {
      setImageUrl('');
      setImageKind('');
      setError('نوع محتوا تغییر کرد؛ لطفاً عکس را دوباره انتخاب کنید.');
    }
  }

  async function pick(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const selectedKind = kind;
    const version = ++uploadVersion.current;
    setImageUrl(''); setImageKind('');
    setUploading(true); setError(''); setUploadError(false);
    const data = await uploadSocialImage(file, selectedKind);
    if (version !== uploadVersion.current) return;
    setUploading(false);
    if (selectedKind !== currentKind.current) {
      setUploadError(true);
      setError('نوع محتوا هنگام آپلود تغییر کرد؛ لطفاً عکس را دوباره انتخاب کنید.');
      return;
    }
    if (data.ok) {
      setImageUrl(data.url);
      setImageKind(selectedKind);
    } else {
      setUploadError(true);
      setError(data.error || 'آپلود ناموفق بود؛ عکس روی سرور ثبت نشده است.');
    }
  }

  async function submit(e) {
    e.preventDefault();
    setOkMsg('');
    if (!imageUrl && uploadError) return;
    setError('');
    if (kind === 'story' && !imageUrl) { setError('ابتدا عکس استوری را آپلود کنید و منتظر نمایش پیش‌نمایش بمانید.'); return; }
    if (kind === 'story' && imageKind !== 'story') { setError('عکس استوری آماده نیست؛ لطفاً دوباره انتخاب کنید.'); return; }
    if (kind === 'post' && imageUrl && imageKind !== 'post') { setError('عکس برای نوع دیگری آماده شده؛ لطفاً دوباره انتخاب کنید.'); return; }
    if (kind === 'post' && !imageUrl && !aparatUrl.trim()) { setError('یک عکس بگذارید یا لینک ویدیوی آپارات را وارد کنید.'); return; }
    setBusy(true);
    const res = await fetch('/api/social/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, imageUrl: imageUrl || null, aparatUrl: kind === 'post' ? aparatUrl : '', caption }),
    });
    const data = await res.json();
    setBusy(false);
    if (!data.ok) { setError(data.error || 'ثبت ناموفق بود.'); return; }
    setImageUrl(''); setImageKind(''); setAparatUrl(''); setCaption('');
    setItems((prev) => [data.item, ...prev]);
    setOkMsg('منتشر شد.');
  }

  async function remove(id) {
    if (!window.confirm('این مطلب حذف شود؟')) return;
    const res = await fetch(`/api/social/posts/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.ok) setItems((prev) => prev.filter((p) => p.id !== id));
  }

  if (!loading && !canPost) {
    return (
      <div className="alert alert--error">
        حساب شما در حال حاضر اجازهٔ انتشار در برداشتگرام ندارد. اگر فکر می‌کنید اشتباهی رخ داده، با پشتیبانی تماس بگیرید.
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={submit} className="form-shell" style={{ marginBottom: 26 }}>
        <div className="cm-kind">
          <button type="button" className={kind === 'post' ? 'active' : undefined} onClick={() => changeKind('post')}>
            <Icon name="image" size={16} /> پست
          </button>
          <button type="button" className={kind === 'story' ? 'active' : undefined} onClick={() => changeKind('story')}>
            <Icon name="sparkles" size={16} /> استوری ۲۴ ساعته
          </button>
        </div>

        <p className="cm-hint">
          {kind === 'post'
            ? 'پست همین لحظه روی برداشتگرام منتشر می‌شود. می‌توانید عکس بگذارید، لینک ویدیوی آپارات بدهید، یا هر دو.'
            : 'استوری همین لحظه منتشر می‌شود، از آن پس ۲۴ ساعت دیده می‌شود و سپس عکس و اطلاعات آن خودکار از سرور پاک می‌شود.'}
        </p>

        {error && <div className="alert alert--error" style={{ marginBottom: 12 }}>{error}</div>}
        {okMsg && <div className="alert alert--success" style={{ marginBottom: 12 }}>{okMsg}</div>}

        <div className="form-group">
          <label className="form-label">عکس {kind === 'story' ? '(اجباری)' : '(اختیاری)'} — حداکثر ۸ مگابایت</label>
          <input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" className="form-input" onChange={pick} disabled={uploading} />
          {uploading && <span className="cm-muted">در حال آپلود…</span>}
        </div>

        {imageUrl && (
          <div className="cm-preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="پیش‌نمایش" />
            <button type="button" onClick={() => { setImageUrl(''); setImageKind(''); }} aria-label="حذف عکس"><Icon name="close" size={14} /></button>
          </div>
        )}

        {kind === 'post' && (
          <div className="form-group">
            <label className="form-label">لینک ویدیوی آپارات (اختیاری)</label>
            <input
              className="form-input"
              dir="ltr"
              value={aparatUrl}
              onChange={(e) => setAparatUrl(e.target.value)}
              placeholder="https://www.aparat.com/v/..."
            />
            <span className="cm-muted">ویدیو روی سرور ما ذخیره نمی‌شود؛ فقط لینک آپارات نمایش داده می‌شود.</span>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">متن (اختیاری)</label>
          <textarea
            className="form-input"
            rows={3}
            maxLength={600}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="چند خط دربارهٔ این کار…"
          />
        </div>

        <button className="btn btn--dark" type="submit" disabled={busy || uploading}>
          {busy ? 'در حال ثبت…' : 'انتشار'}
        </button>
      </form>

      <h2 className="heading" style={{ fontSize: '1.1rem', marginBottom: 14 }}>مطالب من</h2>
      {loading ? (
        <p className="cm-muted">در حال بارگذاری…</p>
      ) : items.length === 0 ? (
        <p className="cm-muted">هنوز مطلبی نفرستاده‌اید.</p>
      ) : (
        <ul className="cm-mine">
          {items.map((p) => (
            <li key={p.id}>
              <span className="cm-mine__thumb">
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt="" />
                ) : (
                  <Icon name="video" size={20} />
                )}
              </span>
              <div className="cm-mine__body">
                <span className="cm-mine__kind">{p.kind === 'story' ? 'استوری' : 'پست'}</span>
                {p.caption && <p>{p.caption}</p>}
              </div>
              <button type="button" className="cm-iconbtn" onClick={() => remove(p.id)} aria-label="حذف">
                <Icon name="trash" size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <p style={{ marginTop: 20 }}>
        <Link href="/community" className="btn btn--hero-secondary">دیدن صفحهٔ برداشتگرام</Link>
      </p>
    </div>
  );
}
