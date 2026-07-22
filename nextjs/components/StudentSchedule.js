'use client';

import { useEffect, useState } from 'react';

const dateFmt = new Intl.DateTimeFormat('fa-IR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' });

export default function StudentSchedule() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/my/schedule');
        const d = await res.json();
        if (d.ok) {
          setData(d);
          // اولین جلسه‌ی پیش‌رو به‌صورت پیش‌فرض باز باشد
          const next = (d.sessions || []).find((s) => !s.past);
          setOpenId(next ? next.id : (d.sessions?.[0]?.id || null));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p style={{ color: 'var(--muted)' }}>در حال بارگذاری…</p>;

  if (!data || !data.group) {
    return (
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 32, textAlign: 'center' }}>
        <p style={{ color: 'var(--muted)', lineHeight: 2 }}>
          هنوز کلاسی برای شما تعیین نشده است. پس از تعیین کلاس و دوره توسط خانواده برداشت، برنامه و تقویم جلسات شما اینجا نمایش داده می‌شود.
        </p>
      </div>
    );
  }

  const { group, progress, passed, total, sessions, hasUpdate } = data;

  return (
    <div>
      {hasUpdate && (
        <div className="alert alert--info" style={{ marginBottom: 18 }}>
          🔔 برنامه‌ی کلاس شما به‌روزرسانی شده است.
        </div>
      )}

      {/* کارت دوره و پیشرفت */}
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', marginBottom: 24 }}>
        <div style={{ background: 'var(--dark)', color: '#fff', borderRadius: 16, padding: 20 }}>
          <div style={{ opacity: .75, fontSize: '.85rem', marginBottom: 6 }}>دوره‌ی شما</div>
          <div style={{ fontWeight: 800, fontSize: '1.15rem' }}>{group.courseTitle || 'تعیین‌نشده'}</div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ background: 'rgba(255,255,255,.15)', borderRadius: 999, padding: '4px 12px', fontSize: '.8rem' }}>کلاس: {group.name}</span>
            <span style={{ background: 'rgba(255,255,255,.15)', borderRadius: 999, padding: '4px 12px', fontSize: '.8rem' }}>شعبه: {group.branch}</span>
          </div>
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ color: 'var(--muted)', fontSize: '.85rem' }}>میزان پیشرفت</span>
            <span style={{ fontWeight: 800 }}>{progress}%</span>
          </div>
          <div style={{ height: 12, background: 'var(--surface)', borderRadius: 999, overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg,#16A34A,#22C55E)', transition: 'width .4s' }} />
          </div>
          <div style={{ color: 'var(--muted)', fontSize: '.82rem', marginTop: 10 }}>{passed} جلسه از {total} جلسه برگزار شده است.</div>
        </div>
      </div>

      {/* تقویم جلسات */}
      <h2 className="heading" style={{ fontSize: '1.15rem', marginBottom: 14 }}>تقویم جلسات</h2>
      {sessions.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 28, textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)' }}>هنوز جلسه‌ای برای کلاس شما ثبت نشده است.</p>
        </div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
          {sessions.map((s, i) => {
            const d = new Date(s.startsAt);
            const open = openId === s.id;
            return (
              <li key={s.id} style={{
                background: '#fff', border: '1px solid var(--border)', borderRadius: 14,
                overflow: 'hidden', opacity: s.past ? .72 : 1,
              }}>
                <button type="button" onClick={() => setOpenId(open ? null : s.id)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'right' }}>
                  <span style={{
                    flexShrink: 0, width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center',
                    fontWeight: 800, background: s.past ? 'var(--surface)' : 'var(--dark)', color: s.past ? 'var(--muted)' : '#fff',
                  }}>{i + 1}</span>
                  <span style={{ flex: 1 }}>
                    <span style={{ display: 'block', fontWeight: 800 }}>{s.title}</span>
                    <span style={{ display: 'block', color: 'var(--muted)', fontSize: '.82rem', marginTop: 2 }}>
                      {dateFmt.format(d)} — ساعت {timeFmt.format(d)}
                    </span>
                  </span>
                  {s.past
                    ? <span style={{ fontSize: '.75rem', color: '#16A34A', fontWeight: 700 }}>برگزار شد ✓</span>
                    : <span style={{ fontSize: '.75rem', color: 'var(--muted)' }}>{open ? '▲' : '▼'}</span>}
                </button>
                {open && (
                  <div style={{ padding: '0 16px 16px', borderTop: '1px dashed var(--border)', display: 'grid', gap: 12 }}>
                    <Section icon="📘" title="چارت درسی این جلسه" text={s.chartDescription} />
                    <Section icon="🧰" title="ابزار لازم" text={s.tools} />
                    <Section icon="✏️" title="تمرین و اتود" text={s.homework} />
                    {!s.chartDescription && !s.tools && !s.homework && (
                      <p style={{ color: 'var(--muted)', fontSize: '.85rem', marginTop: 12 }}>جزئیات این جلسه هنوز ثبت نشده است.</p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Section({ icon, title, text }) {
  if (!text) return null;
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{icon} {title}</div>
      <p style={{ color: 'var(--muted)', lineHeight: 1.9, whiteSpace: 'pre-wrap', margin: 0 }}>{text}</p>
    </div>
  );
}
