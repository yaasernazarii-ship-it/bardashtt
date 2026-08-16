'use client';

import { useEffect, useState } from 'react';
import LiveStatusBadge from './LiveStatusBadge';

const dateFmt = new Intl.DateTimeFormat('fa-IR', { weekday: 'long', month: 'long', day: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' });

// ترتیب نمایش: کلاسِ در حال پخش اول، بعد نزدیک‌ترین کلاسِ برنامه‌ریزی‌شده، در آخر جلسات پایان‌یافته.
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

  async function load() {
    const res = await fetch('/api/admin/live-classes');
    const d = await res.json();
    if (d.ok) setSessions(d.sessions);
    else setError(d.error || 'خطا در بارگذاری.');
  }
  useEffect(() => { load(); }, []);

  async function act(id, action, confirmMsg) {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusyId(id); setError('');
    const res = await fetch(`/api/admin/sessions/${id}/live/${action}`, { method: 'POST' });
    const d = await res.json();
    setBusyId(null);
    if (!d.ok) { setError(d.error || 'خطا'); return; }
    load();
  }

  async function saveRecording(id, url) {
    setBusyId(id); setError('');
    const res = await fetch(`/api/admin/sessions/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recordingUrl: url }),
    });
    const d = await res.json();
    setBusyId(null);
    if (d.ok) load();
    else setError(d.error || 'خطا');
  }

  if (sessions === null) return <p style={{ color: 'var(--muted)' }}>در حال بارگذاری…</p>;

  const sorted = sortSessions(sessions);

  return (
    <div>
      {error && <div className="alert alert--error" style={{ marginBottom: 16 }}>{error}</div>}
      {sorted.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 28, textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)' }}>هنوز جلسه‌ای ثبت نشده است. جلسات را از «کلاس‌ها و تقویم» بسازید.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {sorted.map((s) => (
            <SessionRow
              key={s.id}
              s={s}
              isAdmin={isAdmin}
              busy={busyId === s.id}
              onStart={() => act(s.id, 'start')}
              onFinish={() => act(s.id, 'finish', 'آیا مطمئن هستید که می‌خواهید کلاس را به پایان برسانید؟')}
              onReopen={() => act(s.id, 'reopen', 'این جلسهٔ پایان‌یافته دوباره باز شود؟')}
              onSaveRecording={(url) => saveRecording(s.id, url)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SessionRow({ s, isAdmin, busy, onStart, onFinish, onReopen, onSaveRecording }) {
  const d = new Date(s.startsAt);
  const [recording, setRecording] = useState(s.recordingUrl || '');
  const isLive = s.liveStatus === 'live';

  return (
    <div style={{ background: '#fff', border: isLive ? '2px solid #DC2626' : '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <strong style={{ fontSize: '1rem' }}>{s.group.name} — {s.title}</strong>
        <span style={{ fontSize: '.78rem', color: 'var(--muted)' }}>
          {s.group.branch}{s.group.teacherName ? ` · استاد ${s.group.teacherName}` : ''}
        </span>
        <span style={{ marginRight: 'auto' }}><LiveStatusBadge status={s.liveStatus} /></span>
      </div>
      <div style={{ fontSize: '.85rem', color: 'var(--muted)', marginBottom: 10 }}>
        {dateFmt.format(d)} — ساعت {timeFmt.format(d)} · {s.group.memberCount.toLocaleString('fa-IR')} هنرجوی مجاز
        {s.liveStartedAt && <> · شروع واقعی: {timeFmt.format(new Date(s.liveStartedAt))}</>}
        {s.liveFinishedAt && <> · پایان واقعی: {timeFmt.format(new Date(s.liveFinishedAt))}</>}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {s.liveStatus === 'scheduled' && (
          <button type="button" className="btn btn--dark btn--sm" onClick={onStart} disabled={busy}>{busy ? '...' : 'شروع کلاس'}</button>
        )}
        {isLive && (
          <button type="button" className="btn btn--danger btn--sm" onClick={onFinish} disabled={busy}>{busy ? '...' : 'پایان کلاس'}</button>
        )}
        {s.liveStatus === 'finished' && isAdmin && (
          <button type="button" className="btn btn--outline btn--sm" onClick={onReopen} disabled={busy}>بازگشایی جلسه</button>
        )}
      </div>
      {s.liveStatus === 'finished' && (
        <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input className="form-input" style={{ maxWidth: 340 }} placeholder="لینک/کد ویدیوی ضبط‌شده (اختیاری)"
            value={recording} onChange={(e) => setRecording(e.target.value)} />
          <button type="button" className="btn btn--sm btn--outline" onClick={() => onSaveRecording(recording)} disabled={busy}>
            ذخیره ویدیوی ضبط‌شده
          </button>
        </div>
      )}
    </div>
  );
}
