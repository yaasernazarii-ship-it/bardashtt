'use client';

import { useEffect, useState } from 'react';
import Icon from './Icon';
import AdminStaffReports from './AdminStaffReports';
import AdminStaffChat from './AdminStaffChat';

// دو نمای یک بخش: تابلوی تیکت/گزارش کار، و گفت‌وگوی زندهٔ تیم.
// هر دو پشت همان سدِ نقشِ صفحه (ادمین/ادیتور) هستند و روت‌های سرورشان هم جداگانه بررسی می‌کنند.
export default function AdminStaffHub({ initialChatUnread = 0 }) {
  const [tab, setTab] = useState('reports');
  const [chatUnread, setChatUnread] = useState(initialChatUnread);

  // اگر از اعلان یا لینک با ?tab=chat آمده باشیم، مستقیم روی گفت‌وگو باز می‌شود.
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get('tab');
    if (wanted === 'chat') setTab('chat');
  }, []);

  function go(next) {
    setTab(next);
    const url = new URL(window.location.href);
    if (next === 'chat') url.searchParams.set('tab', 'chat');
    else url.searchParams.delete('tab');
    window.history.replaceState(null, '', url);
  }

  return (
    <div>
      <div className="staff-tabs">
        <button type="button" className={`staff-tab${tab === 'reports' ? ' is-active' : ''}`} onClick={() => go('reports')}>
          <Icon name="clipboard" size={16} /> تیکت و گزارش کار
        </button>
        <button type="button" className={`staff-tab${tab === 'chat' ? ' is-active' : ''}`} onClick={() => go('chat')}>
          <Icon name="chat" size={16} /> گفت‌وگوی تیمی
          {chatUnread > 0 && <span className="staff-chat__badge">{chatUnread.toLocaleString('fa-IR')}</span>}
        </button>
      </div>

      {/* هر دو نما در DOM می‌مانند تا با جابه‌جایی تب، متنِ نیمه‌نوشته و جای اسکرول از دست نرود. */}
      <div style={{ display: tab === 'reports' ? 'block' : 'none' }}>
        <AdminStaffReports />
      </div>
      <div style={{ display: tab === 'chat' ? 'block' : 'none' }}>
        <AdminStaffChat onUnread={setChatUnread} active={tab === 'chat'} />
      </div>
    </div>
  );
}
