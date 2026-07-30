'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/', label: 'خانه' },
  { href: '/about', label: 'درباره ما' },
  { href: '/courses', label: 'دوره‌ها' },
  {
    label: 'آموزش',
    children: [
      { href: '/online-learning', label: 'یادگیری آنلاین' },
      { href: '/certificate', label: 'آزمون فارغ‌التحصیلی' },
      { href: '/verify', label: 'استعلام گواهینامه' },
      { href: '/dashboard', label: 'داشبورد هنرجو' },
      { href: '/podcast', label: 'پادکست' },
    ],
  },
  { href: '/actors', label: 'بازیگران' },
  { href: '/gallery', label: 'گالری' },
  {
    label: 'آثار',
    children: [
      { href: '/works/output', label: 'خروجی خانواده برداشت' },
      { type: 'sep' },
      {
        label: 'تولید ما',
        sub: [
          { href: '/works/cinema', label: 'تولیدات سینمایی' },
          { href: '/works/advertising', label: 'تولیدات تبلیغاتی' },
        ],
      },
      { type: 'sep' },
      { href: '/works/resume', label: 'پشتوانه علمی و هنری' },
    ],
  },
  { href: '/news', label: 'اخبار' },
  { href: '/blog', label: 'وبلاگ' },
];

export default function Nav({ onOpenChat }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [user, setUser] = useState(null);
  const pathname = usePathname();
  const supportRef = useRef(null);

  useEffect(() => {
    setMenuOpen(false);
    setSupportOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handler(e) {
      if (supportRef.current && !supportRef.current.contains(e.target)) setSupportOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    let alive = true;
    fetch('/api/me').then((r) => r.json()).then((d) => { if (alive) setUser(d.ok ? d.user : null); }).catch(() => {});
    return () => { alive = false; };
  }, [pathname]);

  async function logout() {
    try { await fetch('/api/logout', { method: 'POST' }); } catch { /* ignore */ }
    window.location.href = '/';
  }

  useEffect(() => {
    document.body.classList.toggle('nav-open', menuOpen);
    document.documentElement.classList.toggle('nav-open', menuOpen);
    if (menuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('nav-open');
      document.documentElement.classList.remove('nav-open');
    };
  }, [menuOpen]);

  const isActive = (href) => pathname === href || (href !== '/' && pathname.startsWith(href));

  return (
    <>
      <nav className="nav" aria-label="ناوبری اصلی">
        <div className="nav__inner">
          <Link href="/" className="nav__logo">
            <Image src="/imgg.png" alt="خانواده برداشت" width={90} height={30} style={{ height: 30, width: 'auto' }} />
          </Link>
          <ul className="nav__links">
            {navLinks.map((item, i) => (
              item.children ? (
                <li key={i} className="has-dropdown">
                  <button type="button" className="nav__dropdown-toggle">
                    <span>{item.label}</span>
                    <span className="nav__caret" aria-hidden="true" />
                  </button>
                  <ul className="dropdown" style={item.label === 'آثار' ? { minWidth: 210 } : {}}>
                    {item.children.map((child, j) => (
                      child.type === 'sep' ? (
                        <li key={j} className="drop-sep" />
                      ) : child.sub ? (
                        <li key={j} className="has-submenu">
                          <button type="button" className="nav__submenu-toggle">
                            <span>{child.label}</span>
                            <span className="nav__caret nav__caret--sub" aria-hidden="true" />
                          </button>
                          <ul className="submenu">
                            {child.sub.map((s, k) => (
                              <li key={k}><Link href={s.href}>{s.label}</Link></li>
                            ))}
                          </ul>
                        </li>
                      ) : (
                        <li key={j}><Link href={child.href}>{child.label}</Link></li>
                      )
                    ))}
                  </ul>
                </li>
              ) : (
                <li key={i}>
                  <Link href={item.href} className={isActive(item.href) ? 'active' : ''} aria-current={isActive(item.href) ? 'page' : undefined}>{item.label}</Link>
                </li>
              )
            ))}
          </ul>
          <div className="nav__actions">
            <div className={`nav__support${supportOpen ? ' open' : ''}`} ref={supportRef}>
              <button type="button" className="nav__support-btn" onClick={() => setSupportOpen(p => !p)} aria-haspopup="true" aria-expanded={supportOpen}>
                <span className="nav__support-dot" />پشتیبانی
                <span className="nav__caret" aria-hidden="true" />
              </button>
              <ul className="hdr-support-drop">
                <li><Link href="/faq" onClick={() => setSupportOpen(false)}><span className="drop-icon">📋</span>سوالات متداول</Link></li>
                <li className="drop-sep" />
                <li>
                  <button type="button" onClick={() => { onOpenChat?.(); setSupportOpen(false); }}>
                    <span className="drop-icon">💬</span>
                    <span>پشتیبانی آنلاین<span className="drop-phone">گفت‌وگوی زنده با تیم ما</span></span>
                    <span className="drop-online-dot" />
                  </button>
                </li>
                <li className="drop-sep" />
                <li><a href="tel:02191090934"><span className="drop-icon">📞</span><span>تماس با ما<span className="drop-phone">021-91090934</span></span></a></li>
              </ul>
            </div>
            {user ? (
              <>
                <Link href="/dashboard" className="btn btn--dark btn--sm">داشبورد</Link>
                <button type="button" className="btn btn--outline btn--sm" onClick={logout}>خروج</button>
              </>
            ) : (
              <Link href="/auth" className="btn btn--outline btn--sm">ورود</Link>
            )}
          </div>
          <button
            type="button"
            className="nav__menu-btn"
            onClick={() => setMenuOpen(p => !p)}
            aria-label={menuOpen ? 'بستن منو' : 'باز کردن منو'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>
      <div
        className={`nav__backdrop${menuOpen ? ' active' : ''}`}
        onClick={() => setMenuOpen(false)}
      />
      <aside id="mobile-menu" className={`mobile-drawer${menuOpen ? ' mobile-drawer--open' : ''}`} aria-hidden={!menuOpen}>
        <div className="mobile-drawer__head">
          <div>
            <strong>منوی سایت</strong>
            <span>خانواده برداشت</span>
          </div>
          <button type="button" onClick={() => setMenuOpen(false)} aria-label="بستن منو">✕</button>
        </div>
        <div className="mobile-drawer__links">
          {navLinks.map((item, i) => (
            item.children ? (
              <details key={i} className="mobile-drawer__group">
                <summary>{item.label}</summary>
                <div className="mobile-drawer__sub">
                  {item.children.map((child, j) => (
                    child.type === 'sep' ? null : child.sub ? (
                      <details key={j} className="mobile-drawer__group mobile-drawer__group--nested">
                        <summary>{child.label}</summary>
                        <div className="mobile-drawer__sub">
                          {child.sub.map((s, k) => <Link key={k} href={s.href}>{s.label}</Link>)}
                        </div>
                      </details>
                    ) : <Link key={j} href={child.href}>{child.label}</Link>
                  ))}
                </div>
              </details>
            ) : <Link key={i} href={item.href} className={isActive(item.href) ? 'active' : ''} aria-current={isActive(item.href) ? 'page' : undefined}>{item.label}</Link>
          ))}
        </div>
        <div className="mobile-drawer__actions">
          <button type="button" className="btn btn--outline" onClick={onOpenChat}>پشتیبانی آنلاین</button>
          {user ? (
            <>
              <Link href="/dashboard" className="btn btn--dark">داشبورد</Link>
              <button type="button" className="btn btn--outline" onClick={logout}>خروج از حساب</button>
            </>
          ) : (
            <Link href="/auth" className="btn btn--outline">ورود</Link>
          )}
        </div>
      </aside>
    </>
  );
}
