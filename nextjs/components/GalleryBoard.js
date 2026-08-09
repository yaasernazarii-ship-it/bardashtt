'use client';

import { useEffect, useState } from 'react';
import Icon from './Icon';
import { uploadFile } from '@/lib/uploadClient';
import { isImageUrl } from '@/lib/uploadUrl';

export default function GalleryBoard() {
  const [items, setItems] = useState([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function upload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError('');
    const data = await uploadFile(file);
    setUploading(false);
    if (data.ok) setImageUrl(data.url); else setError(data.error || 'آپلود ناموفق بود.');
  }

  async function load() {
    const res = await fetch('/api/gallery');
    const data = await res.json();
    if (data.ok) { setItems(data.items); setCanManage(data.canManage); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function add(e) {
    e.preventDefault();
    setError('');
    if (!isImageUrl(imageUrl)) { setError('اول عکسی آپلود کنید یا نشانی کامل تصویر را وارد کنید.'); return; }
    setBusy(true);
    const res = await fetch('/api/gallery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl, caption }),
    });
    const data = await res.json();
    setBusy(false);
    if (!data.ok) { setError(data.error || 'خطا در افزودن.'); return; }
    setImageUrl(''); setCaption('');
    setItems((prev) => [data.item, ...prev]);
  }

  async function remove(id) {
    if (!window.confirm('این تصویر حذف شود؟')) return;
    const res = await fetch(`/api/gallery/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.ok) setItems((prev) => prev.filter((i) => i.id !== id));
  }

  if (loading) return <p style={{ color: 'var(--muted)' }}>در حال بارگذاری…</p>;

  return (
    <div>
      {canManage && (
        <form onSubmit={add} className="form-shell" style={{ marginBottom: 28 }}>
          <h2 className="heading" style={{ fontSize: '1.15rem', marginBottom: 16 }}>افزودن تصویر</h2>
          {error && <div className="alert alert--error" style={{ marginBottom: 12 }}>{error}</div>}
          <div className="cal-form-grid">
            <div className="form-group">
              <label className="form-label">آپلود عکس از دستگاه</label>
              <input type="file" accept="image/*" className="form-input" onChange={upload} />
              {uploading && <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>در حال آپلود…</span>}
            </div>
            <div className="form-group">
              <label className="form-label">یا نشانی تصویر (URL)</label>
              <input className="form-input" dir="ltr" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" />
            </div>
            <div className="form-group">
              <label className="form-label">توضیح (اختیاری)</label>
              <input className="form-input" value={caption} onChange={(e) => setCaption(e.target.value)} />
            </div>
          </div>
          <button className="btn btn--dark" type="submit" disabled={busy}>{busy ? 'در حال افزودن…' : 'افزودن به گالری'}</button>
        </form>
      )}

      {items.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 40, textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)' }}>هنوز تصویری در گالری ثبت نشده است.</p>
        </div>
      ) : (
        <div className="gallery-grid">
          {items.map((it) => (
            <figure key={it.id} className="gallery-cell">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.imageUrl} alt={it.caption || 'تصویر گالری خانواده برداشت'} loading="lazy" />
              {it.caption && <figcaption>{it.caption}</figcaption>}
              {canManage && (
                <button type="button" className="gallery-del" onClick={() => remove(it.id)} aria-label="حذف تصویر"><Icon name="close" size={14} /></button>
              )}
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
