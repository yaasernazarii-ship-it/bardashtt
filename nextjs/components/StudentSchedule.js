'use client';

import { useEffect, useMemo, useState } from 'react';
import Icon from './Icon';

const dateFmt = new Intl.DateTimeFormat('fa-IR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' });
const jNumFmt = new Intl.DateTimeFormat('en-US-u-ca-persian', { year: 'numeric', month: 'numeric', day: 'numeric' });
const jTitleFmt = new Intl.DateTimeFormat('fa-IR', { month: 'long', year: 'numeric' });
const faNum = (n) => Number(n).toLocaleString('fa-IR');

const WEEKDAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

function toJalali(date) {
  const o = {};
  for (const p of jNumFmt.formatToParts(date)) if (p.type !== 'literal') o[p.type] = parseInt(p.value, 10);
  return { jy: o.year, jm: o.month, jd: o.day };
}
function noon(d) { const x = new Date(d); x.setHours(12, 0, 0, 0); return x; }
function addDays(d, n) { const x = noon(d); x.setDate(x.getDate() + n); return x; }
function jKey(date) { const j = toJalali(date); return `${j.jy}-${j.jm}-${j.jd}`; }

function buildMonth(viewDate) {
  const ref = noon(viewDate);
  const { jd } = toJalali(ref);
  const first = addDays(ref, -(jd - 1));
  const firstJ = toJalali(first);
  const days = [];
  let cur = first;
  for (let g = 0; g < 40; g++) {
    const j = toJalali(cur);
    if (j.jm !== firstJ.jm || j.jy !== firstJ.jy) break;
    days.push({ date: cur, jd: j.jd, key: `${j.jy}-${j.jm}-${j.jd}` });
    cur = addDays(cur, 1);
  }
  const startCol = (first.getDay() + 1) % 7; // شنبه = ۰
  return { days, startCol, firstDate: first };
}

export default function StudentSchedule() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [viewDate, setViewDate] = useState(() => noon(new Date()));

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/my/schedule');
        const d = await res.json();
        if (d.ok) {
          setData(d);
          const next = (d.sessions || []).find((s) => !s.past) || d.sessions?.[0];
          if (next) { setOpenId(next.id); setViewDate(noon(new Date(next.startsAt))); }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const sessions = data?.sessions || [];

  // نگاشت روزِ شمسی → جلسات همان روز
  const byDay = useMemo(() => {
    const m = {};
    for (const s of sessions) {
      const k = jKey(new Date(s.startsAt));
      (m[k] = m[k] || []).push(s);
    }
    return m;
  }, [sessions]);

  const month = useMemo(() => buildMonth(viewDate), [viewDate]);
  const todayKey = jKey(new Date());

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

  const { group, progress, progressComment, presentCount, totalSessions, hasUpdate } = data;

  function selectDay(day) {
    const list = byDay[day.key];
    if (!list || !list.length) return;
    setOpenId(list[0].id);
    const el = document.getElementById(`sess-${list[0].id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return (
    <div>
      {hasUpdate && (
        <div className="alert alert--info icon-inline" style={{ marginBottom: 18 }}><Icon name="bell" size={16} /> برنامه‌ی کلاس شما به‌روزرسانی شده است.</div>
      )}

      {/* دوره و پیشرفت */}
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', marginBottom: 24 }}>
        <div style={{ background: 'var(--dark)', color: '#fff', borderRadius: 16, padding: 20 }}>
          {group.coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={group.coverImage} alt={group.name}
              style={{ width: '100%', height: 132, objectFit: 'cover', borderRadius: 12, marginBottom: 14, display: 'block' }} />
          )}
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
            <span style={{ fontWeight: 800 }}>{faNum(progress)}٪</span>
          </div>
          <div style={{ height: 12, background: 'var(--surface)', borderRadius: 999, overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg,#16A34A,#22C55E)', transition: 'width .4s' }} />
          </div>
          <div style={{ color: 'var(--muted)', fontSize: '.82rem', marginTop: 10 }}>{faNum(presentCount)} جلسه حضور از {faNum(totalSessions)} جلسه دوره.</div>
          {progressComment && (
            <div className="student-progress-comment">
              <strong>نظر استاد دربارهٔ پیشرفت شما</strong>
              <p>{progressComment.content}</p>
              <small>{dateFmt.format(new Date(progressComment.createdAt))}</small>
            </div>
          )}
        </div>
      </div>

      {/* تقویم شمسی تصویری */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: 18, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <button type="button" onClick={() => setViewDate(addDays(month.firstDate, -1))}
            style={navBtn}>‹ ماه قبل</button>
          <strong style={{ fontSize: '1.05rem' }}>{jTitleFmt.format(month.firstDate)}</strong>
          <button type="button" onClick={() => setViewDate(addDays(month.days[month.days.length - 1].date, 1))}
            style={navBtn}>ماه بعد ›</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6 }}>
          {WEEKDAYS.map((w) => (
            <div key={w} style={{ textAlign: 'center', fontSize: '.78rem', color: 'var(--muted)', fontWeight: 700, padding: '4px 0' }}>{w}</div>
          ))}
          {Array.from({ length: month.startCol }).map((_, i) => <div key={`b${i}`} />)}
          {month.days.map((day) => {
            const has = !!byDay[day.key];
            const isToday = day.key === todayKey;
            const isSelected = has && byDay[day.key].some((s) => s.id === openId);
            return (
              <button key={day.key} type="button" onClick={() => selectDay(day)} disabled={!has}
                title={has ? byDay[day.key].map((s) => s.title).join('، ') : ''}
                style={{
                  aspectRatio: '1', borderRadius: 10, border: isToday ? '2px solid var(--dark)' : '1px solid var(--border)',
                  cursor: has ? 'pointer' : 'default',
                  background: isSelected ? 'var(--dark)' : has ? 'rgba(22,163,74,.12)' : 'var(--surface)',
                  color: isSelected ? '#fff' : 'var(--text)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                  fontWeight: has ? 800 : 500, fontSize: '.9rem', position: 'relative', padding: 0,
                }}>
                <span>{faNum(day.jd)}</span>
                {has && <span style={{ width: 6, height: 6, borderRadius: 999, background: isSelected ? '#fff' : '#16A34A' }} />}
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 14, flexWrap: 'wrap', fontSize: '.78rem', color: 'var(--muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(22,163,74,.4)' }} /> روز جلسه</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, border: '2px solid var(--dark)' }} /> امروز</span>
        </div>
      </div>

      {/* جزئیات جلسات (زیر تقویم، در همین بخش) */}
      <h2 className="heading" style={{ fontSize: '1.15rem', marginBottom: 14 }}>جزئیات جلسات</h2>
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
              <li id={`sess-${s.id}`} key={s.id} style={{ background: '#fff', border: open ? '1px solid var(--dark)' : '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', opacity: s.past ? .75 : 1 }}>
                <button type="button" onClick={() => setOpenId(open ? null : s.id)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'right' }}>
                  <span style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center', fontWeight: 800, background: s.past ? 'var(--surface)' : 'var(--dark)', color: s.past ? 'var(--muted)' : '#fff' }}>{faNum(i + 1)}</span>
                  <span style={{ flex: 1 }}>
                    <span style={{ display: 'block', fontWeight: 800 }}>{s.title}</span>
                    <span style={{ display: 'block', color: 'var(--muted)', fontSize: '.82rem', marginTop: 2 }}>{dateFmt.format(d)} — ساعت {timeFmt.format(d)}</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {s.attendance === 'present' && (
                      <span style={{ fontSize: '.72rem', fontWeight: 700, color: '#16A34A', background: 'rgba(22,163,74,.1)', borderRadius: 999, padding: '3px 10px' }}>حاضر بودید</span>
                    )}
                    {s.attendance === 'absent' && (
                      <span style={{ fontSize: '.72rem', fontWeight: 700, color: '#DC2626', background: 'rgba(220,38,38,.1)', borderRadius: 999, padding: '3px 10px' }}>غایب بودید</span>
                    )}
                    {!s.attendance && s.past && (
                      <span style={{ fontSize: '.72rem', color: 'var(--muted)' }}>حضور ثبت نشده</span>
                    )}
                    {!s.past && <span style={{ fontSize: '.75rem', color: 'var(--muted)' }}>{open ? '▲' : '▼'}</span>}
                  </span>
                </button>
                {open && (
                  <div style={{ padding: '0 16px 16px', borderTop: '1px dashed var(--border)' }}>
                    <Section icon="bookOpen" title="چارت درسی این جلسه" text={s.chartDescription} />
                    <Section icon="toolbox" title="ابزار لازم" text={s.tools} />
                    <Section icon="pencil" title="تمرین و اتود" text={s.homework} />
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

const navBtn = {
  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10,
  padding: '6px 12px', cursor: 'pointer', fontSize: '.82rem', fontWeight: 700, color: 'var(--text)',
};

function Section({ icon, title, text }) {
  if (!text) return null;
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }} className="icon-inline"><Icon name={icon} size={16} /> {title}</div>
      <p style={{ color: 'var(--muted)', lineHeight: 1.9, whiteSpace: 'pre-wrap', margin: 0 }}>{text}</p>
    </div>
  );
}
