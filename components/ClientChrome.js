'use client';

import { useState, useEffect } from 'react';
import Nav from './Nav';
import Footer from './Footer';
import SupportChat from './SupportChat';
import MobileBottomNav from './MobileBottomNav';

export default function ClientChrome({ children, logo, nav, footer }) {
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    const open = () => setChatOpen(true);
    window.addEventListener('bardasht:open-chat', open);
    return () => window.removeEventListener('bardasht:open-chat', open);
  }, []);

  return (
    <>
      <Nav onOpenChat={() => setChatOpen(true)} logo={logo} content={nav} />
      <main>{children}</main>
      <Footer content={footer} />
      <MobileBottomNav />
      <SupportChat isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}
