'use client';

import { useEffect, useState } from 'react';

const GENDER = { male: 'آقا', female: 'خانم' };
const faNum = (n) => (n || n === 0 ? Number(n).toLocaleString('fa-IR') : '');

export default function StudentResumeView() {
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videoUrl, setVideoUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/resume');
      const data = await res.json();
      if (data.ok) {
        setResume(data.resume);
        setVideoUrl(data.resume?.selfVideoUrl || '');
      }
      setLoading(false);
    })();
  }, []);

  async function saveVideo(e) {
    e.preventDefault();
    setBusy(true); setMsg(''); setError('');
    const res = await fetch('/api/resume/video', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selfVideoUrl: videoUrl.trim() }),
    });
    const data = await res.json();
    setBusy(false);
    if (!data.ok) { setError(data.error || 'ذخیره نشد.'); return; }
    setResume((r) => ({ ...(r || {}), selfVideoUrl: data.selfVideoUrl }));
    setMsg(data.selfVideoUrl ? 'ویدیوی معرفی شما ذخیره شد ✅' : 'ویدیوی معرفی حذف شد.');
  }

  if (loading) return <p style={{ color: 'var(--muted)' }}>در حال بارگذاری…</p>;

  const r = resume;
  const hasResume = r && (r.fullName || r.headline || r.bio || r.experience || r.photoUrl);

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* رزومه‌ی فقط‌خواندنی که خانواده برداشت ساخته است */}
      <div className="form-shell" style={{ margin: 0 }}>
        <h2 className="heading" style={{ fontSize: '1.1rem', marginBottom: 4 }}>رزومه‌ی من</h2>
        <p style={{ color: 'var(--muted)', fontSize: '.85rem', marginBottom: 16 }}>
          این رزومه توسط خانواده برداشت برای شما تنظیم می‌شود. برای ویرایش یا اصلاح آن با پشتیبانی هماهنگ کنید.
        </p>

        {!hasResume ? (
          <p style={{ color: 'var(--muted)' }}>هنوز رزومه‌ای برای شما ثبت نشده است. پس از تنظیم توسط خانواده برداشت، اینجا نمایش داده می‌شود.</p>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {r.photoUrl && (
              <img src={r.photoUrl} alt="" style={{ maxWidth: 220, borderRadius: 12, border: '1px solid var(--border)' }} />
            )}
            <div style={{ display: 'grid', gap: 6, lineHeight: 2 }}>
              {r.fullName && <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{r.fullName}</div>}
              {r.headline && <div style={{ color: 'var(--muted)' }}>{r.headline}</div>}
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', color: 'var(--muted)', fontSize: '.9rem' }}>
                {r.gender && <span>جنسیت: {GENDER[r.gender] || r.gender}</span>}
                {r.city && <span>شهر: {r.city}</span>}
                {r.birthYear && <span>سال تولد: {faNum(r.birthYear)}</span>}
                {r.heightCm && <span>قد: {faNum(r.heightCm)} سانتی‌متر</span>}
              </div>
              {r.skills && <div><b style={{ fontSize: '.9rem' }}>مهارت‌ها:</b> <span style={{ color: 'var(--muted)' }}>{r.skills}</span></div>}
              {r.bio && <div><b style={{ fontSize: '.9rem' }}>معرفی:</b> <p style={{ color: 'var(--muted)', margin: '4px 0', whiteSpace: 'pre-wrap' }}>{r.bio}</p></div>}
              {r.experience && <div><b style={{ fontSize: '.9rem' }}>سوابق:</b> <p style={{ color: 'var(--muted)', margin: '4px 0', whiteSpace: 'pre-wrap' }}>{r.experience}</p></div>}
              {r.showreelUrl && <div><b style={{ fontSize: '.9rem' }}>شوریل/نمونه‌کار:</b> <a href={r.showreelUrl} target="_blank" rel="noopener noreferrer" dir="ltr">{r.showreelUrl}</a></div>}
              <div style={{ fontSize: '.82rem', color: 'var(--muted)' }}>
                وضعیت نمایش عمومی: {r.isPublic ? <b style={{ color: '#166534' }}>نمایش داده می‌شود</b> : <b>مخفی</b>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* تنها بخشی که خودِ هنرجو می‌تواند تغییر دهد: ویدیوی معرفی */}
      <form onSubmit={saveVideo} className="form-shell" style={{ margin: 0 }}>
        <h2 className="heading" style={{ fontSize: '1.05rem', marginBottom: 4 }}>🎬 ویدیوی معرفی من</h2>
        <p style={{ color: 'var(--muted)', fontSize: '.85rem', marginBottom: 14 }}>
          می‌توانید لینک ویدیوی معرفی خودتان (آپارات، اینستاگرام، گوگل‌درایو و…) را اینجا ثبت کنید. این تنها بخشی است که خودتان می‌توانید به‌روزرسانی کنید.
        </p>
        {error && <div className="alert alert--error" style={{ marginBottom: 12 }}>{error}</div>}
        {msg && <div className="alert alert--success" style={{ marginBottom: 12 }}>{msg}</div>}

        {resume?.selfVideoUrl && (
          <p style={{ fontSize: '.88rem', marginBottom: 10 }}>
            ویدیوی فعلی: <a href={resume.selfVideoUrl} target="_blank" rel="noopener noreferrer" dir="ltr">{resume.selfVideoUrl}</a>
          </p>
        )}
        <div className="form-group">
          <label className="form-label">نشانی ویدیوی معرفی (URL)</label>
          <input className="form-input" dir="ltr" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://aparat.com/…" />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn--dark" type="submit" disabled={busy}>{busy ? 'در حال ذخیره…' : 'ذخیره ویدیو'}</button>
          {resume?.selfVideoUrl && (
            <button type="button" className="btn btn--outline" disabled={busy} onClick={() => { setVideoUrl(''); }}>پاک‌کردن نشانی</button>
          )}
        </div>
      </form>
    </div>
  );
}
