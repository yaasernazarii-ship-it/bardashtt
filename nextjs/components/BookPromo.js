'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// مسیرهایی که پنجرهٔ پیشنهاد در آن‌ها مزاحم است یا معنا ندارد.
const SKIP_PREFIXES = ['/dashboard', '/auth', '/register', '/payment', '/profile', '/social-responsibility'];
const UNTIL_KEY = 'bookPromo.hiddenUntil';
const SHOWN_KEY = 'bookPromo.shownThisVisit';

// پنجرهٔ کوتاهِ پیشنهاد کتاب که کمی بعد از ورودِ بازدیدکننده به سایت باز می‌شود.
// یک بار در هر بازدید و پس از بستن، تا چند روز دیگر نمایش داده نمی‌شود.
export default function BookPromo() {
  const pathname = usePathname();
  const [promo, setPromo] = useState(null);
  const [open, setOpen] = useState(false);
  const closeRef = useRef(null);

  useEffect(() => {
    if (SKIP_PREFIXES.some((p) => pathname.startsWith(p))) return;
    try {
      if (sessionStorage.getItem(SHOWN_KEY)) return;
      const until = Number(localStorage.getItem(UNTIL_KEY) || 0);
      if (until > Date.now()) return;
    } catch {
      // اگر مرورگر اجازهٔ ذخیره‌سازی ندهد، فقط یک بار در همین صفحه نشان می‌دهیم.
    }

    let timer;
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/books/featured');
        const data = await res.json();
        if (!alive || !data.ok || !data.promo) return;
        timer = setTimeout(() => {
          if (!alive) return;
          setPromo(data.promo);
          setOpen(true);
          try { sessionStorage.setItem(SHOWN_KEY, '1'); } catch { /* بی‌اهمیت */ }
        }, data.promo.delaySeconds * 1000);
      } catch {
        // اگر دریافت نشد، هیچ پنجره‌ای باز نمی‌شود.
      }
    })();

    return () => { alive = false; clearTimeout(timer); };
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function close() {
    setOpen(false);
    try {
      const days = promo?.repeatDays ?? 7;
      localStorage.setItem(UNTIL_KEY, String(Date.now() + days * 86400000));
    } catch { /* بی‌اهمیت */ }
  }

  if (!open || !promo) return null;
  const b = promo.book;

  return (
    <div className="promo-backdrop" onClick={close}>
      <div
        className="promo-card"
        role="dialog"
        aria-modal="true"
        aria-label={promo.heading}
        onClick={(e) => e.stopPropagation()}
      >
        <button ref={closeRef} type="button" className="promo-close" onClick={close} aria-label="بستن">×</button>
        <div className="promo-body">
          {b.coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="promo-cover" src={b.coverImage} alt={b.title} />
          )}
          <div className="promo-info">
            {promo.badge && <span className="promo-badge">{promo.badge}</span>}
            <h2 className="promo-heading">{promo.heading}</h2>
            <p className="promo-book-title">{b.title}</p>
            {b.author && <p className="promo-author">نویسنده: {b.author}</p>}
            {promo.text && <p className="promo-text">{promo.text}</p>}
            {b.summary && <p className="promo-text promo-text--sm">{b.summary}</p>}
            <p className="promo-price">{b.price > 0 ? `${b.price.toLocaleString('fa-IR')} تومان` : 'رایگان'}</p>
            <div className="promo-actions">
              <Link href="/social-responsibility" className="btn btn--dark" onClick={close}>{promo.cta}</Link>
              <button type="button" className="btn btn--ghost" onClick={close}>{promo.dismiss}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
