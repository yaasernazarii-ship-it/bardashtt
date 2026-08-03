'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Icon from './Icon';

export default function SiteHeader({ onOpenChat }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <div className="site-header__logo">
          <Link href="/">
            <Image src="/imgg.png" alt="خانواده برداشت — آموزشگاه رایگان بازیگری سینما" width={120} height={36} priority style={{ height: 36, width: 'auto' }} />
          </Link>
        </div>
        <div className={`site-header__support${open ? ' open' : ''}`} ref={ref}>
          <button className="hdr-support-btn" onClick={() => setOpen(p => !p)}>
            <span className="nav__support-dot" />
            پشتیبانی
          </button>
          <ul className="hdr-support-drop">
            <li><Link href="/faq"><span className="drop-icon"><Icon name="clipboard" size={18} /></span>سوالات متداول</Link></li>
            <li className="drop-sep" />
            <li>
              <button onClick={() => { onOpenChat?.(); setOpen(false); }}>
                <span className="drop-icon"><Icon name="chat" size={18} /></span>
                <span>چت آنلاین<span className="drop-phone">پاسخ سریع از تیم ما</span></span>
                <span className="drop-online-dot" />
              </button>
            </li>
            <li className="drop-sep" />
            <li><a href="tel:02191090934"><span className="drop-icon"><Icon name="phone" size={18} /></span><span>تماس با ما<span className="drop-phone">02191090934</span></span></a></li>
          </ul>
        </div>
      </div>
    </header>
  );
}
