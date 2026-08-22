'use client';

import { useState } from 'react';
import StudentChatGroups from './StudentChatGroups';
import StudentDirectChats from './StudentDirectChats';

export default function StudentChatHub({ initialGroupId = '', initialChatId = '' }) {
  const [mode, setMode] = useState(initialChatId ? 'direct' : 'groups');
  return (
    <>
      <div className="chat-hub-tabs">
        <button type="button" className={mode === 'groups' ? 'is-active' : ''} onClick={() => setMode('groups')}>گفت‌وگوی گروهی</button>
        <button type="button" className={mode === 'direct' ? 'is-active' : ''} onClick={() => setMode('direct')}>پیام خصوصی</button>
      </div>
      {mode === 'groups'
        ? <StudentChatGroups initialGroupId={initialGroupId} />
        : <StudentDirectChats initialChatId={initialChatId} />}
    </>
  );
}
