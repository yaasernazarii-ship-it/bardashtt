'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

// ورودی تاریخ شمسی: هنرجو تاریخ را روی تقویم فارسی انتخاب می‌کند، ولی مقدارِ بیرونی
// همان «YYYY-MM-DD» میلادی می‌ماند تا API و دیتابیس بدون تغییر بمانند.
const jParts = new Intl.DateTimeFormat('en-US-u-ca-persian', { year: 'numeric', month: 'numeric', day: 'numeric' });
const jFull = new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'long', year: 'numeric' });
const jMonthTitle = new Intl.DateTimeFormat('fa-IR', { month: 'long', year: 'numeric' });
const faNum = (n) => Number(n).toLocaleString('fa-IR');
const WEEKDAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

const noon = (date) => { const x = new Date(date); x.setHours(12, 0, 0, 0); return x; };
const addDays = (date, n) => { const x = noon(date); x.setDate(x.getDate() + n); return x; };
const isoKey = (date) => new Intl.DateTimeFormat('en-CA').format(noon(date));

function toJalali(date) {
  const o = {};
  for (const p of jParts.formatToParts(date)) if (p.type !== 'literal') o[p.type] = parseInt(p.value, 10);
  return { jy: o.year, jm: o.month, jd: o.day };
}

function buildMonth(viewDate) {
  const ref = noon(viewDate);
  const first = addDays(ref, -(toJalali(ref).jd - 1));
  const firstJ = toJalali(first);
  const days = [];
  let cur = first;
  for (let i = 0; i < 40; i++) {
    const j = toJalali(cur);
    if (j.jm !== firstJ.jm || j.jy !== firstJ.jy) break;
    days.push({ date: cur, jd: j.jd, iso: isoKey(cur) });
    cur = addDays(cur, 1);
  }
  return { days, startCol: (first.getDay() + 1) % 7, firstDate: first };
}

export default function ShamsiDateField({ value, onChange, label = 'تاریخ' }) {
  const selected = value ? noon(new Date(`${String(value).slice(0, 10)}T12:00:00`)) : null;
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => selected || noon(new Date()));
  const boxRef = useRef(null);

  // با باز شدن دوباره، تقویم روی تاریخِ انتخاب‌شده بنشیند نه ماهی که قبلاً ورق خورده بود.
  useEffect(() => { if (open) setViewDate(selected || noon(new Date())); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [open, value]);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    const onEsc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => { document.removeEventListener('mousedown', onDocClick); document.removeEventListener('keydown', onEsc); };
  }, [open]);

  const month = useMemo(() => buildMonth(viewDate), [viewDate]);
  const todayIso = isoKey(new Date());
  const selectedIso = selected ? isoKey(selected) : '';

  const pick = (iso) => { onChange(iso); setOpen(false); };

  return (
    <div className="shamsi-field" ref={boxRef}>
      <button
        type="button"
        className={`shamsi-field__button${selected ? '' : ' is-empty'}`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {selected ? jFull.format(selected) : label}
      </button>

      {open && (
        <div className="shamsi-pop" role="dialog" aria-label={label}>
          <div className="shamsi-pop__head">
            <button type="button" onClick={() => setViewDate(addDays(month.firstDate, -1))}>‹</button>
            <strong>{jMonthTitle.format(month.firstDate)}</strong>
            <button type="button" onClick={() => setViewDate(addDays(month.days[month.days.length - 1].date, 1))}>›</button>
          </div>
          <div className="shamsi-pop__grid">
            {WEEKDAYS.map((w) => <span key={w} className="shamsi-pop__wd">{w}</span>)}
            {Array.from({ length: month.startCol }, (_, i) => <span key={`pad-${i}`} />)}
            {month.days.map((day) => (
              <button
                key={day.iso}
                type="button"
                onClick={() => pick(day.iso)}
                className={`shamsi-pop__day${day.iso === todayIso ? ' is-today' : ''}${day.iso === selectedIso ? ' is-selected' : ''}`}
              >
                {faNum(day.jd)}
              </button>
            ))}
          </div>
          <div className="shamsi-pop__foot">
            <button type="button" onClick={() => pick(todayIso)}>امروز</button>
            {selected && <button type="button" onClick={() => pick('')}>پاک کردن</button>}
          </div>
        </div>
      )}
    </div>
  );
}
