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

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const pathname = usePathname();
  const backdropRef = useRef(null);

  useEffect(() => {
    setMenuOpen(false);
    setOpenDropdown(null);
    setOpenSubmenu(null);
  }, [pathname]);

  useEffect(() => {
    if (menuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const isActive = (href) => pathname === href || (href !== '/' && pathname.startsWith(href));

  return (
    <>
      <nav className="nav">
        <div className="nav__inner">
          <Link href="/" className="nav__logo">
            <Image src="/imgg.png" alt="خانواده برداشت" width={90} height={30} style={{ height: 30, width: 'auto' }} />
          </Link>
          <ul className={`nav__links${menuOpen ? ' nav__links--open' : ''}`}>
            <li className="nav__drawer-head">
              <div>
                <strong>منوی سایت</strong>
                <span>خانواده برداشت</span>
              </div>
              <button type="button" onClick={() => setMenuOpen(false)} aria-label="بستن منو">✕</button>
            </li>
            {navLinks.map((item, i) => (
              item.children ? (
                <li key={i} className={`has-dropdown${openDropdown === i ? ' is-open' : ''}`}>
                  <button
                    type="button"
                    className={`nav__dropdown-toggle${openDropdown === i ? ' active' : ''}`}
                    onClick={() => {
                      if (window.innerWidth <= 900) {
                        setOpenDropdown(openDropdown === i ? null : i);
                        setOpenSubmenu(null);
                      }
                    }}
                  >
                    <span>{item.label}</span>
                    <span className="nav__caret" aria-hidden="true">{openDropdown === i ? '−' : '+'}</span>
                  </button>
                  <ul className="dropdown" style={item.label === 'آثار' ? { minWidth: 210 } : {}}>
                    {item.children.map((child, j) => (
                      child.type === 'sep' ? (
                        <li key={j} className="drop-sep" />
                      ) : child.sub ? (
                        <li key={j} className={`has-submenu${openSubmenu === `${i}-${j}` ? ' is-open' : ''}`}>
                          <button
                            type="button"
                            className="nav__submenu-toggle"
                            onClick={() => {
                              if (window.innerWidth <= 900) {
                                const key = `${i}-${j}`;
                                setOpenSubmenu(openSubmenu === key ? null : key);
                              }
                            }}
                          >
                            <span>{child.label}</span>
                            <span className="nav__caret nav__caret--sub" aria-hidden="true">{openSubmenu === `${i}-${j}` ? '−' : '+'}</span>
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
                  <Link href={item.href} className={isActive(item.href) ? 'active' : ''}>
                    {item.label}
                  </Link>
                </li>
              )
            ))}
            <li className="nav__drawer-actions visible" style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '20px 24px', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
              <Link href="/auth" className="btn btn--outline">ورود</Link>
              <Link href="/register" className="btn btn--dark">ثبت‌نام</Link>
            </li>
          </ul>
          <div className="nav__actions">
            <Link href="/auth" className="btn btn--outline btn--sm">ورود</Link>
            <Link href="/register" className="btn btn--dark btn--sm">ثبت‌نام</Link>
          </div>
          <button className="nav__menu-btn" onClick={() => setMenuOpen(p => !p)} aria-label="منو">
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>
      <div
        ref={backdropRef}
        className={`nav__backdrop${menuOpen ? ' active' : ''}`}
        onClick={() => setMenuOpen(false)}
      />
    </>
  );
}
