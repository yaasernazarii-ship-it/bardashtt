'use client';

import { useState } from 'react';
import AdminChatGroups from './AdminChatGroups';
import AdminDirectChats from './AdminDirectChats';

export default function AdminChatHub() {
  const [mode, setMode] = useState('groups');
  return (
    <>
      <div className="chat-hub-tabs">
        <button type="button" className={mode === 'groups' ? 'is-active' : ''} onClick={() => setMode('groups')}>گروه‌ها و اعضا</button>
        <button type="button" className={mode === 'direct' ? 'is-active' : ''} onClick={() => setMode('direct')}>پیام‌های خصوصی هنرجویان</button>
      </div>
      {mode === 'groups' ? <AdminChatGroups /> : <AdminDirectChats />}
    </>
  );
}
