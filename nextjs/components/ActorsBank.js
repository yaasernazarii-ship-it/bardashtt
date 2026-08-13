'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Icon from './Icon';
import ShortlistButton from './ShortlistButton';

// سالِ جاری شمسی برای محاسبهٔ سن از «سال تولد» (که در پروفایل هم شمسی ذخیره می‌شود).
const CURRENT_YEAR = Number(
  new Intl.DateTimeFormat('en-u-ca-persian', { year: 'numeric' }).format(new Date()).replace(/\D/g, ''),
);

const GENDER = { male: 'آقا', female: 'خانم' };

const AGE_RANGES = [
  { key: 'u20', label: 'زیر ۲۰ سال', min: 0, max: 19 },
  { key: '20-30', label: '۲۰ تا ۳۰ سال', min: 20, max: 30 },
  { key: '30-45', label: '۳۰ تا ۴۵ سال', min: 30, max: 45 },
  { key: 'o45', label: 'بالای ۴۵ سال', min: 45, max: 200 },
];

const splitSkills = (s) => (s ? s.split(/[,،]/).map((x) => x.trim()).filter(Boolean) : []);

export default function ActorsBank({ actors, shortlistIds = [], emptyText }) {
  const [q, setQ] = useState('');
  const [gender, setGender] = useState('');
  const [city, setCity] = useState('');
  const [age, setAge] = useState('');
  const [skill, setSkill] = useState('');
  const [onlySaved, setOnlySaved] = useState(false);

  // وضعیت لیست کوتاه اینجا نگه داشته می‌شود تا فیلترِ «فقط لیست کوتاه» با کلیک کاربر هم‌گام بماند.
  const [savedSet, setSavedSet] = useState(() => new Set(shortlistIds));
  const onShortlistChange = (actorId, saved) => {
    setSavedSet((prev) => {
      const next = new Set(prev);
      if (saved) next.add(actorId); else next.delete(actorId);
      return next;
    });
  };

  const cities = useMemo(
    () => [...new Set(actors.map((a) => a.city).filter(Boolean))].sort((x, y) => x.localeCompare(y, 'fa')),
    [actors],
  );
  const skills = useMemo(
    () => [...new Set(actors.flatMap((a) => splitSkills(a.skills)))].sort((x, y) => x.localeCompare(y, 'fa')),
    [actors],
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const range = AGE_RANGES.find((r) => r.key === age);
    return actors.filter((a) => {
      if (gender && a.gender !== gender) return false;
      if (city && a.city !== city) return false;
      if (skill && !splitSkills(a.skills).includes(skill)) return false;
      if (onlySaved && !savedSet.has(a.id)) return false;
      if (range) {
        if (!a.birthYear) return false;
        const years = CURRENT_YEAR - a.birthYear;
        if (years < range.min || years > range.max) return false;
      }
      if (term) {
        const hay = [a.fullName, a.headline, a.city, a.skills].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [actors, q, gender, city, age, skill, onlySaved, savedSet]);

  const hasFilter = q || gender || city || age || skill || onlySaved;

  function reset() {
    setQ(''); setGender(''); setCity(''); setAge(''); setSkill(''); setOnlySaved(false);
  }

  if (actors.length === 0) {
    return (
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 40, textAlign: 'center' }}>
        <p style={{ color: 'var(--muted)' }}>{emptyText}</p>
      </div>
    );
  }

  return (
    <>
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, marginBottom: 18 }}>
        <div className="form-group" style={{ margin: 0 }}>
          <input
            className="form-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="جست‌وجو در نام، عنوان، شهر یا مهارت…"
          />
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
          <select className="form-input" style={{ width: 'auto', minWidth: 130 }} value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="">همهٔ جنسیت‌ها</option>
            <option value="male">آقا</option>
            <option value="female">خانم</option>
          </select>
          {cities.length > 0 && (
            <select className="form-input" style={{ width: 'auto', minWidth: 130 }} value={city} onChange={(e) => setCity(e.target.value)}>
              <option value="">همهٔ شهرها</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          <select className="form-input" style={{ width: 'auto', minWidth: 130 }} value={age} onChange={(e) => setAge(e.target.value)}>
            <option value="">همهٔ سنین</option>
            {AGE_RANGES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
          {skills.length > 0 && (
            <select className="form-input" style={{ width: 'auto', minWidth: 130 }} value={skill} onChange={(e) => setSkill(e.target.value)}>
              <option value="">همهٔ مهارت‌ها</option>
              {skills.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
          <button
            type="button"
            className={`btn btn--sm ${onlySaved ? 'btn--gold' : 'btn--outline'}`}
            onClick={() => setOnlySaved((v) => !v)}
          >
            <Icon name="trophy" size={15} /> فقط لیست کوتاه
          </button>
          {hasFilter && <button type="button" className="btn btn--ghost btn--sm" onClick={reset}>پاک کردن فیلترها</button>}
        </div>
        <p style={{ margin: '12px 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
          {filtered.length.toLocaleString('fa-IR')} بازیگر از {actors.length.toLocaleString('fa-IR')} رزومه
        </p>
      </div>

      {filtered.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 40, textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', margin: 0 }}>با این فیلترها بازیگری پیدا نشد. شرط‌ها را ساده‌تر کنید.</p>
        </div>
      ) : (
        <div className="responsive-grid-3">
          {filtered.map((a) => (
            <div key={a.id} className="content-card actor-card">
              <Link href={`/actors/${a.id}`}>
                <div className="actor-photo" style={a.photoUrl ? { backgroundImage: `url(${a.photoUrl})` } : undefined}>
                  {!a.photoUrl && <Icon name="masks" size={40} strokeWidth={1.4} />}
                </div>
                <h3 style={{ margin: '12px 0 4px' }}>{a.fullName}</h3>
                {a.headline && <p style={{ color: 'var(--muted)', margin: 0 }}>{a.headline}</p>}
              </Link>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                {a.city && <span className="tag tag--gold">{a.city}</span>}
                {a.gender && <span className="tag">{GENDER[a.gender]}</span>}
                {a.birthYear && <span className="tag">{(CURRENT_YEAR - a.birthYear).toLocaleString('fa-IR')} ساله</span>}
                {a.selfVideoUrl && <span className="tag"><Icon name="video" size={13} /> ویدیوی معرفی</span>}
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Link href={`/actors/${a.id}`} className="btn btn--gold btn--sm">مشاهده رزومه</Link>
                <ShortlistButton actorId={a.id} initial={savedSet.has(a.id)} onChange={onShortlistChange} />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
