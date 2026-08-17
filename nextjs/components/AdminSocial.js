'use client';

import { useEffect, useState } from 'react';
import Icon from './Icon';
import VideoEmbed from './VideoEmbed';

const TABS = [
  { key: 'pending', label: 'صف بررسی' },
  { key: 'reports', label: 'گزارش‌های تخلف' },
  { key: 'published', label: 'پست‌های منتشرشده' },
  { key: 'stories', label: 'استوری‌های فعال' },
];

function Media({ post, small = false }) {
  return (
    <div className={small ? 'cm-adm__media cm-adm__media--sm' : 'cm-adm__media'}>
      {post.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.imageUrl} alt={post.caption || 'محتوای کاربر'} loading="lazy" />
      )}
      {post.aparatUrl && !small && <VideoEmbed url={post.aparatUrl} title="ویدیو" />}
      {!post.imageUrl && post.aparatUrl && small && <Icon name="video" size={22} />}
    </div>
  );
}

export default function AdminSocial() {
  const [tab, setTab] = useState('pending');
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  async function load() {
    const res = await fetch('/api/social/admin');
    const d = await res.json();
    if (d.ok) setData(d);
    else setError(d.error || 'بارگذاری ناموفق بود.');
  }

  useEffect(() => { load(); }, []);

  async function review(id, action) {
    let reason = '';
    if (action === 'reject') {
      const r = window.prompt('دلیل رد شدن (به خودِ کاربر نشان داده می‌شود):', '');
      if (r === null) return;
      reason = r;
    }
    setBusy(id);
    const res = await fetch(`/api/social/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, reason }),
    });
    const d = await res.json();
    setBusy('');
    if (!d.ok) { setError(d.error || 'انجام نشد.'); return; }
    await load();
  }

  async function removePost(id) {
    if (!window.confirm('این مطلب برای همیشه حذف شود؟')) return;
    setBusy(id);
    const res = await fetch(`/api/social/posts/${id}`, { method: 'DELETE' });
    const d = await res.json();
    setBusy('');
    if (!d.ok) { setError(d.error || 'حذف نشد.'); return; }
    await load();
  }

  async function removeComment(id) {
    if (!window.confirm('این نظر حذف شود؟')) return;
    setBusy(id);
    await fetch(`/api/social/comments/${id}`, { method: 'DELETE' });
    setBusy('');
    await load();
  }

  async function closeReport(id) {
    setBusy(id);
    await fetch(`/api/social/reports/${id}`, { method: 'DELETE' });
    setBusy('');
    await load();
  }

  async function setMember(userId, patch) {
    setBusy(userId);
    const res = await fetch('/api/social/admin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...patch }),
    });
    const d = await res.json();
    setBusy('');
    if (!d.ok) { setError(d.error || 'انجام نشد.'); return; }
    await load();
  }

  if (!data) return <p className="cm-muted">{error || 'در حال بارگذاری…'}</p>;

  const counts = {
    pending: data.pending.length,
    reports: data.reports.length,
    published: data.published.length,
    stories: data.stories.length,
  };

  return (
    <div>
      {error && <div className="alert alert--error" style={{ marginBottom: 14 }}>{error}</div>}

      <div className="cm-adm__tabs">
        {TABS.map((t) => (
          <button key={t.key} type="button" className={tab === t.key ? 'active' : undefined} onClick={() => setTab(t.key)}>
            {t.label}
            {counts[t.key] > 0 && <span className="cm-adm__count">{counts[t.key].toLocaleString('fa-IR')}</span>}
          </button>
        ))}
      </div>

      {tab === 'pending' && (
        data.pending.length === 0 ? <p className="cm-muted">چیزی در صف بررسی نیست.</p> : (
          <ul className="cm-adm__list">
            {data.pending.map((p) => (
              <li key={p.id} className="cm-adm__item">
                <Media post={p} />
                <div className="cm-adm__body">
                  <strong>{p.author.name}</strong>
                  <span className="cm-muted"> · {p.author.roleLabel} · {p.kind === 'story' ? 'استوری' : 'پست'}</span>
                  {p.caption && <p>{p.caption}</p>}
                  <div className="cm-adm__actions">
                    <button type="button" className="btn btn--gold" disabled={busy === p.id} onClick={() => review(p.id, 'approve')}>
                      <Icon name="check" size={16} /> تأیید و انتشار
                    </button>
                    <button type="button" className="btn btn--hero-secondary" disabled={busy === p.id} onClick={() => review(p.id, 'reject')}>
                      رد کردن
                    </button>
                    <button type="button" className="btn btn--hero-secondary" disabled={busy === p.id} onClick={() => removePost(p.id)}>
                      حذف
                    </button>
                  </div>
                  <div className="cm-adm__member">
                    <label>
                      <input
                        type="checkbox"
                        checked={p.authorTrusted}
                        onChange={(e) => setMember(p.authorId, { trusted: e.target.checked })}
                      />
                      انتشار بدون بررسی برای این کاربر
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={p.authorBlocked}
                        onChange={(e) => setMember(p.authorId, { blocked: e.target.checked })}
                      />
                      محرومیت از انتشار
                    </label>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )
      )}

      {tab === 'reports' && (
        data.reports.length === 0 ? <p className="cm-muted">گزارش تخلفی ثبت نشده است.</p> : (
          <ul className="cm-adm__list">
            {data.reports.map((r) => (
              <li key={r.id} className="cm-adm__item">
                {r.post && <Media post={r.post} small />}
                <div className="cm-adm__body">
                  <span className="cm-badge cm-badge--no">گزارش تخلف</span>
                  <p><strong>دلیل:</strong> {r.reason}</p>
                  <p className="cm-muted">گزارش‌دهنده: {r.reporter?.name || 'نامشخص'}</p>
                  {r.post && <p className="cm-muted">پستِ {r.post.author.name}{r.post.caption ? ` — ${r.post.caption}` : ''}</p>}
                  {r.comment && <p className="cm-muted">نظرِ {r.comment.author.name}: «{r.comment.body}»</p>}
                  <div className="cm-adm__actions">
                    {r.post && (
                      <button type="button" className="btn btn--dark" disabled={busy === r.id} onClick={() => removePost(r.post.id)}>
                        حذف پست
                      </button>
                    )}
                    {r.comment && (
                      <button type="button" className="btn btn--dark" disabled={busy === r.id} onClick={() => removeComment(r.comment.id)}>
                        حذف نظر
                      </button>
                    )}
                    <button type="button" className="btn btn--hero-secondary" disabled={busy === r.id} onClick={() => closeReport(r.id)}>
                      مشکلی ندارد
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )
      )}

      {(tab === 'published' || tab === 'stories') && (
        (tab === 'published' ? data.published : data.stories).length === 0 ? (
          <p className="cm-muted">موردی نیست.</p>
        ) : (
          <ul className="cm-adm__list">
            {(tab === 'published' ? data.published : data.stories).map((p) => (
              <li key={p.id} className="cm-adm__item">
                <Media post={p} small />
                <div className="cm-adm__body">
                  <strong>{p.author.name}</strong>
                  <span className="cm-muted"> · {p.author.roleLabel}</span>
                  {p.caption && <p>{p.caption}</p>}
                  <p className="cm-muted">
                    {p.likeCount.toLocaleString('fa-IR')} پسند · {p.commentCount.toLocaleString('fa-IR')} نظر
                    {p.expiresAt && ` · تا ${new Date(p.expiresAt).toLocaleString('fa-IR')}`}
                  </p>
                  <div className="cm-adm__actions">
                    <button type="button" className="btn btn--hero-secondary" disabled={busy === p.id} onClick={() => removePost(p.id)}>
                      <Icon name="trash" size={15} /> حذف
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}
