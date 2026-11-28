'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Icon from './Icon';

// دکمهٔ شناور پشتیبانی — از نوار بالای سایت جدا شده تا منوی اصلی فضای کافی داشته باشد
// و روی آیتم‌های پایانی منو (مثل «مسئولیت اجتماعی») نیفتد.
export default function SupportFab({ onOpenChat, labels }) {
  const L = labels || {};
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    function onDown(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const phone = String(L.phoneText || '').replace(/[^0-9+]/g, '');

  return (
    <div className={`sup-fab${open ? ' open' : ''}`} ref={boxRef}>
      <ul className="sup-fab__menu" role="menu">
        <li>
          <Link href="/faq" role="menuitem" onClick={() => setOpen(false)}>
            <span className="sup-fab__ico"><Icon name="clipboard" size={17} /></span>
            {L.faq || 'سؤالات متداول'}
          </Link>
        </li>
        <li>
          <button
            type="button"
            role="menuitem"
            onClick={() => { onOpenChat?.(); setOpen(false); }}
          >
            <span className="sup-fab__ico"><Icon name="chat" size={17} /></span>
            <span>
              {L.chat || 'پشتیبانی آنلاین'}
              <small>{L.chatHint || 'گفت‌وگوی زنده با تیم ما'}</small>
            </span>
            <span className="sup-fab__dot" aria-hidden="true" />
          </button>
        </li>
        {phone ? (
          <li>
            <a href={`tel:${phone}`} role="menuitem">
              <span className="sup-fab__ico"><Icon name="phone" size={17} /></span>
              <span>
                {L.call || 'تماس با ما'}
                <small dir="ltr">{L.phoneText}</small>
              </span>
            </a>
          </li>
        ) : null}
      </ul>

      <button
        type="button"
        className="sup-fab__btn"
        onClick={() => setOpen((p) => !p)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={L.button || 'پشتیبانی'}
      >
        <Icon name={open ? 'close' : 'chat'} size={22} />
        <span className="sup-fab__label">{L.button || 'پشتیبانی'}</span>
      </button>
    </div>
  );
}
