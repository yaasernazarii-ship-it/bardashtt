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
    <div className="shamsi-cal">
      <div className="shamsi-cal__head">
        <button type="button" className="shamsi-cal__nav" title="ماه قبل" aria-label="ماه قبل"
          onClick={() => setViewDate(addDays(month.firstDate, -1))}>‹</button>
        <strong>{jTitleFmt.format(month.firstDate)}</strong>
        <button type="button" className="shamsi-cal__nav" title="ماه بعد" aria-label="ماه بعد"
          onClick={() => setViewDate(addDays(month.days[month.days.length - 1].date, 1))}>›</button>
      </div>
      <div className="shamsi-cal__grid">
        {WEEKDAYS.map((w) => <span key={w} className="shamsi-cal__weekday">{w}</span>)}
        {Array.from({ length: month.startCol }).map((_, i) => <span key={`b${i}`} className="shamsi-cal__blank" />)}
        {month.days.map((day) => {
          const list = byDay[day.key];
          const has = !!list;
          const isSelected = has && selectedId && list.some((s) => s.id === selectedId);
          const cls = ['shamsi-cal__day'];
          if (has) cls.push('has-session');
          if (day.key === todayKey) cls.push('is-today');
          if (isSelected) cls.push('is-selected');
          return (
            <button key={day.key} type="button" className={cls.join(' ')} disabled={!has}
              onClick={() => has && onSelectDay && onSelectDay(list)}
              title={has ? list.map((s) => s.title).join('، ') : ''}>
              {faNum(day.jd)}
            </button>
          );
        })}
      </div>
      <div className="shamsi-cal__legend">
        <span><i className="shamsi-cal__chip" /> روز جلسه</span>
        <span><i className="shamsi-cal__chip shamsi-cal__chip--today" /> امروز</span>
      </div>
    </div>
  );
}
