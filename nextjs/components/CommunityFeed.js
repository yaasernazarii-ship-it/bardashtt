'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import VideoEmbed from './VideoEmbed';

// فاصلهٔ زمانی به زبان آدمیزاد («۳ ساعت پیش»).
function relTime(value) {
  if (!value) return '';
  const diff = Date.now() - new Date(value).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'همین حالا';
  if (min < 60) return `${min} دقیقه پیش`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ساعت پیش`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} روز پیش`;
  return new Date(value).toLocaleDateString('fa-IR');
}

function Avatar({ author, size = 44 }) {
  return (
    <span className="cm-avatar" style={{ width: size, height: size }}>
      {author.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={author.photoUrl} alt={author.name} loading="lazy" />
      ) : (
        <Icon name="user" size={Math.round(size * 0.55)} />
      )}
    </span>
  );
}

// ── نمایشگر استوری (تمام‌صفحه) ───────────────────────────────────────────
function StoryViewer({ groups, start, onClose, onDeleted }) {
  const [gi, setGi] = useState(start);
  const [si, setSi] = useState(0);
  const group = groups[gi];
  const item = group?.items[si];

  // حرکت بین استوری‌ها: تا آخرِ استوری‌های یک نفر جلو می‌رود، بعد به نفر بعدی،
  // و در انتهای فهرست نمایشگر بسته می‌شود.
  const next = useCallback(() => {
    const g = groups[gi];
    if (!g) { onClose(); return; }
    if (si + 1 < g.items.length) { setSi(si + 1); return; }
    if (gi + 1 < groups.length) { setGi(gi + 1); setSi(0); return; }
    onClose();
  }, [gi, si, groups, onClose]);

  const prev = useCallback(() => {
    if (si > 0) { setSi(si - 1); return; }
    if (gi > 0) {
      const back = gi - 1;
      setGi(back);
      setSi(Math.max(0, groups[back].items.length - 1));
    }
  }, [gi, si, groups]);

  useEffect(() => {
    const timer = setTimeout(next, 6000);
    return () => clearTimeout(timer);
  }, [gi, si, next]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') next();
      if (e.key === 'ArrowRight') prev();
    }
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [next, prev, onClose]);

  if (!item) return null;

  async function remove() {
    if (!window.confirm('این استوری حذف شود؟')) return;
    const res = await fetch(`/api/social/posts/${item.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.ok) { onDeleted(item.id); onClose(); }
  }

  return (
    <div className="cm-story-view" role="dialog" aria-modal="true">
      <div className="cm-story-view__bars">
        {group.items.map((s, i) => (
          <span key={s.id} className={`cm-story-bar${i < si ? ' done' : ''}${i === si ? ' now' : ''}`} />
        ))}
      </div>
      <div className="cm-story-view__head">
        <Avatar author={group.author} size={38} />
        <div>
          <strong>{group.author.name}</strong>
          <span>{relTime(item.publishedAt)}</span>
        </div>
        <div className="cm-story-view__tools">
          {item.canDelete && (
            <button type="button" onClick={remove} aria-label="حذف استوری"><Icon name="trash" size={18} /></button>
          )}
          <button type="button" onClick={onClose} aria-label="بستن"><Icon name="close" size={20} /></button>
        </div>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="cm-story-view__img" src={item.imageUrl} alt={item.caption || 'استوری'} />
      {item.caption && <p className="cm-story-view__cap">{item.caption}</p>}
      <button type="button" className="cm-story-view__zone cm-story-view__zone--next" onClick={next} aria-label="بعدی" />
      <button type="button" className="cm-story-view__zone cm-story-view__zone--prev" onClick={prev} aria-label="قبلی" />
    </div>
  );
}

// ── بخش نظرات یک پست ─────────────────────────────────────────────────────
function Comments({ postId, canPost, onCountChange }) {
  const [items, setItems] = useState(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    fetch(`/api/social/posts/${postId}/comments`)
      .then((r) => r.json())
      .then((d) => { if (alive && d.ok) setItems(d.items); })
      .catch(() => { if (alive) setItems([]); });
    return () => { alive = false; };
  }, [postId]);

  async function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true); setError('');
    const res = await fetch(`/api/social/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: text }),
    });
    const data = await res.json();
    setBusy(false);
    if (!data.ok) { setError(data.error || 'ثبت نظر ناموفق بود.'); return; }
    setItems((prev) => [...(prev || []), data.item]);
    setText('');
    onCountChange(1);
  }

  async function remove(id) {
    if (!window.confirm('این نظر حذف شود؟')) return;
    const res = await fetch(`/api/social/comments/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.ok) { setItems((prev) => prev.filter((c) => c.id !== id)); onCountChange(-1); }
  }

  return (
    <div className="cm-comments">
      {items === null ? (
        <p className="cm-muted">در حال بارگذاری نظرها…</p>
      ) : items.length === 0 ? (
        <p className="cm-muted">هنوز نظری ثبت نشده است.</p>
      ) : (
        <ul className="cm-comment-list">
          {items.map((c) => (
            <li key={c.id}>
              <Avatar author={c.author} size={32} />
              <div>
                <Link href={`/community/u/${c.author.handle}`} className="cm-comment__name">{c.author.name}</Link>
                <p>{c.body}</p>
                <span className="cm-muted">{relTime(c.createdAt)}</span>
              </div>
              {c.canDelete && (
                <button type="button" className="cm-comment__del" onClick={() => remove(c.id)} aria-label="حذف نظر">
                  <Icon name="close" size={14} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canPost ? (
        <form onSubmit={send} className="cm-comment-form">
          <input
            className="form-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="نظرت را بنویس…"
            maxLength={400}
          />
          <button className="btn btn--dark" type="submit" disabled={busy}>{busy ? '…' : 'ارسال'}</button>
        </form>
      ) : (
        <p className="cm-muted">برای گذاشتن نظر باید هنرجو یا فیلم‌ساز خانواده برداشت باشید.</p>
      )}
      {error && <div className="alert alert--error" style={{ marginTop: 10 }}>{error}</div>}
    </div>
  );
}

// ── کارت پست ─────────────────────────────────────────────────────────────
function PostCard({ post, canPost, loggedIn, onDeleted }) {
  const [liked, setLiked] = useState(post.liked);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [openComments, setOpenComments] = useState(false);
  const [note, setNote] = useState('');

  async function toggleLike() {
    if (!loggedIn) { setNote('برای پسندیدن وارد حسابت شو.'); return; }
    const res = await fetch(`/api/social/posts/${post.id}/like`, { method: 'POST' });
    const data = await res.json();
    if (!data.ok) { setNote(data.error || 'انجام نشد.'); return; }
    setLiked(data.liked);
    setLikeCount(data.likeCount);
  }

  async function report() {
    if (!loggedIn) { setNote('برای گزارش تخلف وارد حسابت شو.'); return; }
    const reason = window.prompt('مشکل این مطلب چیست؟ (کوتاه بنویسید)');
    if (reason === null) return;
    const res = await fetch('/api/social/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId: post.id, reason }),
    });
    const data = await res.json();
    setNote(data.ok ? 'گزارش شما ثبت شد و مدیریت بررسی می‌کند.' : (data.error || 'ثبت گزارش ناموفق بود.'));
  }

  async function remove() {
    if (!window.confirm('این مطلب حذف شود؟')) return;
    const res = await fetch(`/api/social/posts/${post.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.ok) onDeleted(post.id);
  }

  return (
    <article className="cm-card">
      <header className="cm-card__head">
        <Link href={`/community/u/${post.author.handle}`} className="cm-card__author">
          <Avatar author={post.author} />
          <span>
            <strong>{post.author.name}</strong>
            <em>{post.author.roleLabel}</em>
          </span>
        </Link>
        <div className="cm-card__meta">
          <span className="cm-muted">{relTime(post.publishedAt || post.createdAt)}</span>
          {post.canDelete && (
            <button type="button" onClick={remove} aria-label="حذف مطلب" className="cm-iconbtn"><Icon name="trash" size={16} /></button>
          )}
        </div>
      </header>

      {post.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="cm-card__img" src={post.imageUrl} alt={post.caption || 'مطلب شبکهٔ اجتماعی برداشت'} loading="lazy" />
      )}
      {post.aparatUrl && <VideoEmbed url={post.aparatUrl} title={post.caption || 'ویدیو'} />}

      {post.caption && <p className="cm-card__cap">{post.caption}</p>}

      <footer className="cm-card__foot">
        <button type="button" className={`cm-act${liked ? ' cm-act--on' : ''}`} onClick={toggleLike}>
          <Icon name="heart" size={18} /> {likeCount > 0 ? likeCount.toLocaleString('fa-IR') : 'پسندیدن'}
        </button>
        <button type="button" className="cm-act" onClick={() => setOpenComments((o) => !o)}>
          <Icon name="chat" size={18} /> {commentCount > 0 ? commentCount.toLocaleString('fa-IR') : 'نظر'}
        </button>
        <button type="button" className="cm-act cm-act--quiet" onClick={report}>
          <Icon name="flag" size={16} /> گزارش
        </button>
      </footer>

      {note && <p className="cm-note">{note}</p>}
      {openComments && (
        <Comments postId={post.id} canPost={canPost} onCountChange={(d) => setCommentCount((c) => Math.max(0, c + d))} />
      )}
    </article>
  );
}

// ── فید ──────────────────────────────────────────────────────────────────
export default function CommunityFeed({ handle = null, showStories = true }) {
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [canPost, setCanPost] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [groups, setGroups] = useState([]);
  const [viewer, setViewer] = useState(null);
  const started = useRef(false);

  const query = handle ? `scope=user&handle=${encodeURIComponent(handle)}` : 'scope=feed';

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    fetch(`/api/social/posts?${query}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) return;
        setItems(d.items);
        setCursor(d.nextCursor);
        setCanPost(!!d.canPost);
        setLoggedIn(!!d.me);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    if (showStories) {
      fetch('/api/social/posts?scope=stories')
        .then((r) => r.json())
        .then((d) => { if (d.ok) setGroups(d.groups); })
        .catch(() => {});
    }
  }, [query, showStories]);

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    const res = await fetch(`/api/social/posts?${query}&cursor=${cursor}`);
    const data = await res.json();
    setLoadingMore(false);
    if (!data.ok) return;
    setItems((prev) => [...prev, ...data.items]);
    setCursor(data.nextCursor);
  }

  function onDeleted(id) {
    setItems((prev) => prev.filter((p) => p.id !== id));
  }

  function onStoryDeleted(id) {
    setGroups((prev) =>
      prev.map((g) => ({ ...g, items: g.items.filter((s) => s.id !== id) })).filter((g) => g.items.length > 0),
    );
  }

  if (loading) return <p className="cm-muted">در حال بارگذاری…</p>;

  return (
    <div className="cm-wrap">
      {canPost && (
        <Link href="/dashboard/social" className="cm-compose-cta">
          <Icon name="plus" size={18} /> ثبت پست یا استوری تازه
        </Link>
      )}

      {showStories && groups.length > 0 && (
        <div className="cm-stories" role="list">
          {groups.map((g, i) => (
            <button type="button" key={g.author.handle || i} className="cm-story" onClick={() => setViewer(i)}>
              <span className="cm-story__ring"><Avatar author={g.author} size={62} /></span>
              <span className="cm-story__name">{g.author.name}</span>
            </button>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <div className="cm-empty">
          <Icon name="image" size={30} />
          <p>هنوز مطلبی منتشر نشده است.</p>
          {canPost && <p className="cm-muted">اولین نفر باش — از دکمهٔ بالا یک پست بگذار.</p>}
        </div>
      ) : (
        <div className="cm-feed">
          {items.map((p) => (
            <PostCard key={p.id} post={p} canPost={canPost} loggedIn={loggedIn} onDeleted={onDeleted} />
          ))}
        </div>
      )}

      {cursor && (
        <div style={{ textAlign: 'center', marginTop: 22 }}>
          <button type="button" className="btn btn--dark" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? 'در حال بارگذاری…' : 'مطالب بیشتر'}
          </button>
        </div>
      )}

      {viewer !== null && groups[viewer] && (
        <StoryViewer groups={groups} start={viewer} onClose={() => setViewer(null)} onDeleted={onStoryDeleted} />
      )}
    </div>
  );
}
