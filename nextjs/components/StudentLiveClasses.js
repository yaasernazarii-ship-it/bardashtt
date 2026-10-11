'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import LiveStatusBadge from './LiveStatusBadge';

const dateFmt = new Intl.DateTimeFormat('fa-IR', { weekday: 'long', month: 'long', day: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' });

export default function StudentLiveClasses() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      const res = await fetch('/api/student/live-classes');
      const d = await res.json();
      if (!alive) return;
      if (d.ok) setData(d);
      setLoading(false);
    }
    load();
    // بدون رفرش دستی هم وضعیت SCHEDULED → LIVE دیده شود.
    const t = setInterval(load, 20000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  if (loading) return <p style={{ color: 'var(--muted)' }}>در حال بارگذاری…</p>;

  if (!data || !data.group) {
    return (
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 32, textAlign: 'center' }}>
        <p style={{ color: 'var(--muted)', lineHeight: 2 }}>هنوز کلاسی برای شما تعیین نشده است.</p>
      </div>
    );
  }

  const { group, sessions } = data;

  if (sessions.length === 0) {
    return (
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 32, textAlign: 'center' }}>
        <p style={{ color: 'var(--muted)' }}>هنوز جلسه‌ای برای کلاس شما ثبت نشده است.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {sessions.map((s) => {
        const d = new Date(s.startsAt);
        const isLive = s.liveStatus === 'live';
        return (
          <div key={s.id} style={{ background: '#fff', border: isLive ? '2px solid #DC2626' : '1px solid var(--border)', borderRadius: 16, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginBottom: 4 }}>
                  {group.name}{group.teacherName ? ` · استاد ${group.teacherName}` : ''}
                </div>
                <h3 style={{ margin: 0, fontWeight: 800 }}>{s.title}</h3>
                <div style={{ color: 'var(--muted)', fontSize: '.85rem', marginTop: 4 }}>{dateFmt.format(d)} — ساعت {timeFmt.format(d)}</div>
              </div>
              <LiveStatusBadge status={s.liveStatus} />
            </div>
            <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              {isLive && <Link href={`/dashboard/live-classes/${s.id}`} className="btn btn--dark btn--sm">ورود به کلاس</Link>}
              {s.liveStatus === 'finished' && s.hasRecording && (
                <Link href={`/dashboard/live-classes/${s.id}`} className="btn btn--outline btn--sm">مشاهدهٔ جلسهٔ ضبط‌شده</Link>
              )}
              {s.liveStatus === 'finished' && !s.hasRecording && (
                <span style={{ fontSize: '.82rem', color: 'var(--muted)' }}>این جلسه به پایان رسیده است.</span>
              )}
              {s.liveStatus === 'scheduled' && <span style={{ fontSize: '.82rem', color: 'var(--muted)' }}>کلاس هنوز شروع نشده است.</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
