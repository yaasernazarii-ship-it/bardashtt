'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

function timeAgo(iso) {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return 'همین حالا';
  if (diff < 3600) return `${Math.floor(diff / 60)} دقیقه پیش`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ساعت پیش`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} روز پیش`;
  return d.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
}

const KIND_ICON = { content: '📢', class: '📅', system: '🔔' };

export default function NotificationBell() {
  const [ready, setReady] = useState(false); // آیا کاربر واردشده و باید زنگ نمایش داده شود؟
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/notifications', { cache: 'no-store' });
      const d = await r.json();
      if (d.ok) {
        setReady(true);
        setItems(d.items || []);
        setUnread(d.unread || 0);
      } else {
        setReady(false);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60000); // هر یک دقیقه بررسی اعلان تازه
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      setUnread(0);
      try { await fetch('/api/notifications/read', { method: 'POST' }); } catch { /* ignore */ }
    }
  }

  if (!ready) return null;

  return (
    <div className={`notif${open ? ' notif--open' : ''}`} ref={ref}>
      <button type="button" className="notif__btn" onClick={toggle} aria-haspopup="true" aria-expanded={open} aria-label="اعلان‌ها">
        <span className="notif__ico" aria-hidden="true">🔔</span>
        {unread > 0 && <span className="notif__badge">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="notif__panel" role="menu">
          <div className="notif__head">اعلان‌ها</div>
          {items.length === 0 ? (
            <div className="notif__empty">اعلانی ندارید.</div>
          ) : (
            <ul className="notif__list">
              {items.map((n) => {
                const inner = (
                  <>
                    <span className="notif__item-ico" aria-hidden="true">{KIND_ICON[n.kind] || '🔔'}</span>
                    <span className="notif__item-main">
                      <span className="notif__item-title">{n.title}</span>
                      {n.body && <span className="notif__item-body">{n.body}</span>}
                      <span className="notif__item-time">{timeAgo(n.createdAt)}</span>
                    </span>
                  </>
                );
                return (
                  <li key={n.id} className="notif__item">
                    {n.href ? (
                      <Link href={n.href} onClick={() => setOpen(false)}>{inner}</Link>
                    ) : (
                      <div className="notif__item-static">{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
