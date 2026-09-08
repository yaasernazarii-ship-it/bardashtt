'use client';

import { useEffect, useState } from 'react';
import LiveStatusBadge from './LiveStatusBadge';

const dateFmt = new Intl.DateTimeFormat('fa-IR', { weekday: 'long', month: 'long', day: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' });
const STATUS_LABEL = { all: 'همه', live: 'در حال پخش', scheduled: 'برنامه‌ریزی‌شده', finished: 'پایان‌یافته' };

function sortSessions(list) {
  const rank = { live: 0, scheduled: 1, finished: 2 };
  return [...list].sort((a, b) => {
    const ra = rank[a.liveStatus] ?? 1;
    const rb = rank[b.liveStatus] ?? 1;
    if (ra !== rb) return ra - rb;
    const ta = new Date(a.startsAt).getTime();
    const tb = new Date(b.startsAt).getTime();
    return ra === 2 ? tb - ta : ta - tb;
  });
}

export default function AdminLiveClasses({ isAdmin }) {
  const [sessions, setSessions] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState('');

  async function load() {
    const res = await fetch('/api/admin/live-classes');
    const data = await res.json();
    if (data.ok) setSessions(data.sessions);
    else setError(data.error || 'خطا در بارگذاری.');
  }
  useEffect(() => { load(); }, []);

  async function act(id, action, confirmMsg) {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusyId(id); setError('');
    const res = await fetch(`/api/admin/sessions/${id}/live/${action}`, { method: 'POST' });
    const data = await res.json();
    setBusyId(null);
    if (!data.ok) { setError(data.error || 'خطا'); return; }
    load();
  }

  async function saveEmbed(id, field, url) {
    setBusyId(id); setError('');
    const res = await fetch(`/api/admin/sessions/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [field]: url }),
    });
    const data = await res.json();
    setBusyId(null);
    if (data.ok) load();
    else setError(data.error || 'خطا');
  }

  if (sessions === null) return <div className="su-loading">در حال بارگذاری کلاس‌های آنلاین…</div>;

  const counts = {
    all: sessions.length,
    live: sessions.filter((s) => s.liveStatus === 'live').length,
    scheduled: sessions.filter((s) => s.liveStatus === 'scheduled').length,
    finished: sessions.filter((s) => s.liveStatus === 'finished').length,
  };
  const needle = query.trim().toLowerCase();
  const visible = sortSessions(sessions).filter((s) => {
    if (filter !== 'all' && s.liveStatus !== filter) return false;
    if (!needle) return true;
    return [s.title, s.group?.name, s.group?.branch, s.group?.teacherName].filter(Boolean).join(' ').toLowerCase().includes(needle);
  });

  return (
    <div className="admin-operation-page live-admin">
      {error && <div className="alert alert--error">{error}</div>}

      <div className="admin-stat-grid">
        {Object.entries(STATUS_LABEL).map(([key, label]) => (
          <button type="button" key={key} onClick={() => setFilter(key)}
            className={`admin-stat admin-stat--${key === 'live' ? 'danger' : key === 'scheduled' ? 'warning' : key === 'finished' ? 'success' : 'all'} ${filter === key ? 'is-active' : ''}`}>
            <strong>{counts[key].toLocaleString('fa-IR')}</strong><span>{label}</span>
          </button>
        ))}
      </div>

      <div className="admin-list-toolbar">
        <label className="admin-search"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="جست‌وجوی کلاس، شعبه یا استاد…" /></label>
        <span className="admin-list-toolbar__count">{visible.length.toLocaleString('fa-IR')} جلسه</span>
        <a href="/dashboard/admin/classes" className="btn btn--outline btn--sm">مدیریت تقویم کلاس‌ها</a>
      </div>

      {sessions.length === 0 ? (
        <div className="su-empty">هنوز جلسه‌ای ثبت نشده است. جلسات را از «کلاس‌ها و تقویم» بسازید.</div>
      ) : visible.length === 0 ? (
        <div className="su-empty">جلسه‌ای مطابق جست‌وجو یا فیلتر انتخاب‌شده پیدا نشد.</div>
      ) : (
        <div className="live-admin__table">
          <div className="live-admin__head"><span>کلاس و جلسه</span><span>زمان</span><span>هنرجویان</span><span>وضعیت</span><span>عملیات</span></div>
          {visible.map((session) => (
            <SessionRow key={session.id} session={session} isAdmin={isAdmin} busy={busyId === session.id}
              open={openId === session.id} onToggle={() => setOpenId(openId === session.id ? '' : session.id)}
              onStart={() => act(session.id, 'start')}
              onFinish={() => act(session.id, 'finish', 'آیا مطمئن هستید که می‌خواهید کلاس را به پایان برسانید؟')}
              onReopen={() => act(session.id, 'reopen', 'این جلسهٔ پایان‌یافته دوباره باز شود؟')}
              onSaveLiveUrl={(url) => saveEmbed(session.id, 'liveUrl', url)}
              onSaveRecording={(url) => saveEmbed(session.id, 'recordingUrl', url)} />
          ))}
        </div>
      )}
    </div>
  );
}

function SessionRow({ session: s, isAdmin, busy, open, onToggle, onStart, onFinish, onReopen, onSaveLiveUrl, onSaveRecording }) {
  const date = new Date(s.startsAt);
  const [liveUrl, setLiveUrl] = useState(s.liveUrl || '');
  const [recording, setRecording] = useState(s.recordingUrl || '');
  const isLive = s.liveStatus === 'live';

  return (
    <div className={`live-admin__item live-admin__item--${s.liveStatus}`}>
      <div className="live-admin__row">
        <button type="button" className="live-admin__identity" onClick={onToggle} aria-expanded={open}>
          <strong>{s.group.name} — {s.title}</strong>
          <small>{s.group.branch}{s.group.teacherName ? ` · استاد ${s.group.teacherName}` : ''}</small>
        </button>
        <span className="live-admin__date"><strong>{dateFmt.format(date)}</strong><small>ساعت {timeFmt.format(date)}</small></span>
        <span className="live-admin__members">{s.group.memberCount.toLocaleString('fa-IR')} نفر</span>
        <LiveStatusBadge status={s.liveStatus} />
        <div className="live-admin__actions">
          {s.liveStatus === 'scheduled' && <button type="button" className="btn btn--dark btn--sm" onClick={onStart} disabled={busy}>{busy ? '…' : 'شروع'}</button>}
          {isLive && <button type="button" className="btn btn--danger btn--sm" onClick={onFinish} disabled={busy}>{busy ? '…' : 'پایان'}</button>}
          {s.liveStatus === 'finished' && isAdmin && <button type="button" className="btn btn--outline btn--sm" onClick={onReopen} disabled={busy}>بازگشایی</button>}
          <button type="button" className="live-admin__expand" onClick={onToggle} aria-label="نمایش جزئیات">{open ? '−' : '+'}</button>
        </div>
      </div>
      {open && (
        <div className="live-admin__details">
          <div><span>زمان شروع واقعی</span><strong>{s.liveStartedAt ? timeFmt.format(new Date(s.liveStartedAt)) : '—'}</strong></div>
          <div><span>زمان پایان واقعی</span><strong>{s.liveFinishedAt ? timeFmt.format(new Date(s.liveFinishedAt)) : '—'}</strong></div>
          <label className="live-admin__recording"><span>لینک یا iframe کلاس آنلاین</span><input className="form-input" dir="ltr" placeholder="https://… یا کد iframe سرویس کلاس" value={liveUrl} onChange={(e) => setLiveUrl(e.target.value)} /><button type="button" className="btn btn--outline btn--sm" onClick={() => onSaveLiveUrl(liveUrl)} disabled={busy}>ذخیره</button></label>
          {s.liveStatus === 'finished' && (
            <label className="live-admin__recording"><span>ویدیوی ضبط‌شده</span><input className="form-input" placeholder="لینک یا کد ویدیوی ضبط‌شده" value={recording} onChange={(e) => setRecording(e.target.value)} /><button type="button" className="btn btn--outline btn--sm" onClick={() => onSaveRecording(recording)} disabled={busy}>ذخیره</button></label>
          )}
        </div>
      )}
    </div>
  );
}
