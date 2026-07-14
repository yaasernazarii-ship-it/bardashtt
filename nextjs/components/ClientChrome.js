'use client';

import { useState } from 'react';
import Nav from './Nav';
import Footer from './Footer';
import SupportChat from './SupportChat';
import MobileBottomNav from './MobileBottomNav';

export default function ClientChrome({ children }) {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <>
      <Nav onOpenChat={() => setChatOpen(true)} />
      <main>{children}</main>
      <Footer />
      <MobileBottomNav />
      <SupportChat isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}
