'use client';

import { useMemo, useState } from 'react';

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

// تقویم شمسیِ تصویریِ فقط-خواندنی. sessions: [{ id, title, startsAt }]
export default function ShamsiCalendar({ sessions = [], onSelectDay, selectedId }) {
  const initial = sessions.length ? noon(new Date(sessions[0].startsAt)) : noon(new Date());
  const [viewDate, setViewDate] = useState(initial);

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

  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button type="button" onClick={() => setViewDate(addDays(month.firstDate, -1))} style={navBtn}>‹ ماه قبل</button>
        <strong style={{ fontSize: '1rem' }}>{jTitleFmt.format(month.firstDate)}</strong>
        <button type="button" onClick={() => setViewDate(addDays(month.days[month.days.length - 1].date, 1))} style={navBtn}>ماه بعد ›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 5 }}>
        {WEEKDAYS.map((w) => (
          <div key={w} style={{ textAlign: 'center', fontSize: '.72rem', color: 'var(--muted)', fontWeight: 700, padding: '3px 0' }}>{w}</div>
        ))}
        {Array.from({ length: month.startCol }).map((_, i) => <div key={`b${i}`} />)}
        {month.days.map((day) => {
          const list = byDay[day.key];
          const has = !!list;
          const isToday = day.key === todayKey;
          const isSelected = has && selectedId && list.some((s) => s.id === selectedId);
          return (
            <button key={day.key} type="button" onClick={() => has && onSelectDay && onSelectDay(list)} disabled={!has}
              title={has ? list.map((s) => s.title).join('، ') : ''}
              style={{
                aspectRatio: '1', borderRadius: 9, border: isToday ? '2px solid var(--dark)' : '1px solid var(--border)',
                cursor: has ? 'pointer' : 'default',
                background: isSelected ? 'var(--dark)' : has ? 'rgba(22,163,74,.12)' : 'var(--surface)',
                color: isSelected ? '#fff' : 'var(--text)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                fontWeight: has ? 800 : 500, fontSize: '.82rem', padding: 0,
              }}>
              <span>{faNum(day.jd)}</span>
              {has && <span style={{ width: 5, height: 5, borderRadius: 999, background: isSelected ? '#fff' : '#16A34A' }} />}
            </button>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap', fontSize: '.74rem', color: 'var(--muted)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(22,163,74,.4)' }} /> روز جلسه</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, border: '2px solid var(--dark)' }} /> امروز</span>
      </div>
    </div>
  );
}

const navBtn = {
  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10,
  padding: '5px 11px', cursor: 'pointer', fontSize: '.8rem', fontWeight: 700, color: 'var(--text)',
};
