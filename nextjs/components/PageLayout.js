'use client';
import { useState, useCallback } from 'react';
import SiteHeader from './SiteHeader';
import Nav from './Nav';
import Footer from './Footer';
import SupportChat from './SupportChat';
import MobileBottomNav from './MobileBottomNav';

export default function PageLayout({ children, noHeader = false }) {
  const [chatOpen, setChatOpen] = useState(false);

  const handleMenuClick = useCallback(() => {
    document.querySelector('.nav__menu-btn')?.click();
  }, []);

  return (
    <>
      {!noHeader && <SiteHeader onOpenChat={() => setChatOpen(true)} />}
      <Nav />
      <main>{children}</main>
      <Footer />
      <MobileBottomNav onMenuClick={handleMenuClick} />
      <SupportChat isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}
