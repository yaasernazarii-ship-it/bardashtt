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

const SORTS = [
  { key: 'new', label: 'تازه‌ترین رزومه‌ها' },
  { key: 'ageAsc', label: 'کم‌سن‌ترین' },
  { key: 'ageDesc', label: 'مسن‌ترین' },
  { key: 'name', label: 'ترتیب الفبا' },
];

const splitSkills = (s) => (s ? s.split(/[,،]/).map((x) => x.trim()).filter(Boolean) : []);

// ورودی‌های عددی ممکن است با رقم فارسی/عربی تایپ شوند؛ همه را به عدد لاتین تبدیل می‌کنیم.
const toNum = (v) => {
  const s = String(v ?? '').replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/\D/g, '');
  return s ? Number(s) : null;
};

// سن یا مستقیم در رزومه ثبت شده، یا از سال تولد شمسی حساب می‌شود.
const ageOf = (a) => a.age ?? (a.birthYear ? CURRENT_YEAR - a.birthYear : null);

export default function ActorsBank({ actors, shortlistIds = [], emptyText }) {
  const [q, setQ] = useState('');
  const [gender, setGender] = useState('');
  const [city, setCity] = useState('');
  const [skill, setSkill] = useState('');
  const [sort, setSort] = useState('new');
  const [ageMin, setAgeMin] = useState('');
  const [ageMax, setAgeMax] = useState('');
  const [heightMin, setHeightMin] = useState('');
  const [heightMax, setHeightMax] = useState('');
  const [hasPhoto, setHasPhoto] = useState(false);
  const [hasVideo, setHasVideo] = useState(false);
  const [hasShowreel, setHasShowreel] = useState(false);
  const [onlySaved, setOnlySaved] = useState(false);
  const [advanced, setAdvanced] = useState(false);

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
    const aMin = toNum(ageMin);
    const aMax = toNum(ageMax);
    const hMin = toNum(heightMin);
    const hMax = toNum(heightMax);

    const list = actors.filter((a) => {
      if (gender && a.gender !== gender) return false;
      if (city && a.city !== city) return false;
      if (skill && !splitSkills(a.skills).includes(skill)) return false;
      if (onlySaved && !savedSet.has(a.id)) return false;
      if (hasPhoto && !a.photoUrl) return false;
      if (hasVideo && !a.hasVideo) return false;
      if (hasShowreel && !a.showreelUrl) return false;
      if (aMin != null || aMax != null) {
        const years = ageOf(a);
        if (years == null) return false;
        if (aMin != null && years < aMin) return false;
        if (aMax != null && years > aMax) return false;
      }
      if (hMin != null || hMax != null) {
        if (!a.heightCm) return false;
        if (hMin != null && a.heightCm < hMin) return false;
        if (hMax != null && a.heightCm > hMax) return false;
      }
      if (term) {
        const hay = [a.fullName, a.headline, a.city, a.skills, a.experience].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });

    // «تازه‌ترین» همان ترتیبی است که سرور بر اساس updatedAt داده؛ پس مرتب‌سازی دوباره لازم ندارد.
    if (sort === 'name') return [...list].sort((x, y) => x.fullName.localeCompare(y.fullName, 'fa'));
    if (sort === 'ageAsc' || sort === 'ageDesc') {
      const dir = sort === 'ageAsc' ? 1 : -1;
      // رزومه‌های بدون سال تولد همیشه ته فهرست می‌مانند تا نتیجهٔ مرتب‌سازی گمراه‌کننده نشود.
      return [...list].sort((x, y) => {
        const ax = ageOf(x); const ay = ageOf(y);
        if (ax == null) return 1;
        if (ay == null) return -1;
        return (ax - ay) * dir;
      });
    }
    return list;
  }, [actors, q, gender, city, skill, sort, ageMin, ageMax, heightMin, heightMax, hasPhoto, hasVideo, hasShowreel, onlySaved, savedSet]);

  const hasFilter = q || gender || city || skill || ageMin || ageMax || heightMin || heightMax
    || hasPhoto || hasVideo || hasShowreel || onlySaved || sort !== 'new';

  function reset() {
    setQ(''); setGender(''); setCity(''); setSkill(''); setSort('new');
    setAgeMin(''); setAgeMax(''); setHeightMin(''); setHeightMax('');
    setHasPhoto(false); setHasVideo(false); setHasShowreel(false); setOnlySaved(false);
  }

  if (actors.length === 0) {
    return (
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 40, textAlign: 'center' }}>
        <p style={{ color: 'var(--muted)' }}>{emptyText}</p>
      </div>
    );
  }

  const chip = (active, on, iconName, label) => (
    <button type="button" className={`btn btn--sm ${active ? 'btn--gold' : 'btn--outline'}`} onClick={on}>
      <Icon name={iconName} size={15} /> {label}
    </button>
  );

  const numField = (label, value, set, placeholder) => (
    <div className="form-group" style={{ margin: 0 }}>
      <label className="form-label" style={{ fontSize: '0.8rem' }}>{label}</label>
      <input
        className="form-input"
        dir="ltr"
        inputMode="numeric"
        style={{ width: 110 }}
        value={value}
        onChange={(e) => set(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <>
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, marginBottom: 18 }}>
        <div className="form-group" style={{ margin: 0 }}>
          <input
            className="form-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="جست‌وجو در نام، عنوان، شهر، مهارت یا سوابق کاری…"
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
          {skills.length > 0 && (
            <select className="form-input" style={{ width: 'auto', minWidth: 130 }} value={skill} onChange={(e) => setSkill(e.target.value)}>
              <option value="">همهٔ مهارت‌ها</option>
              {skills.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
          <select className="form-input" style={{ width: 'auto', minWidth: 150 }} value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          {chip(onlySaved, () => setOnlySaved((v) => !v), 'trophy', 'فقط لیست کوتاه')}
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setAdvanced((v) => !v)}>
            <Icon name="settings" size={15} /> {advanced ? 'بستن فیلترهای بیشتر' : 'فیلترهای بیشتر'}
          </button>
          {hasFilter && <button type="button" className="btn btn--ghost btn--sm" onClick={reset}>پاک کردن فیلترها</button>}
        </div>

        {advanced && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              {numField('سن از', ageMin, setAgeMin, '18')}
              {numField('سن تا', ageMax, setAgeMax, '35')}
              {numField('قد از (سانتی‌متر)', heightMin, setHeightMin, '160')}
              {numField('قد تا (سانتی‌متر)', heightMax, setHeightMax, '190')}
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
              {chip(hasPhoto, () => setHasPhoto((v) => !v), 'image', 'دارای عکس')}
              {chip(hasVideo, () => setHasVideo((v) => !v), 'video', 'دارای ویدیو')}
              {chip(hasShowreel, () => setHasShowreel((v) => !v), 'clapperboard', 'دارای نمونه‌کار')}
            </div>
          </div>
        )}

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
                {ageOf(a) && <span className="tag">{ageOf(a).toLocaleString('fa-IR')} ساله</span>}
                {a.heightCm && <span className="tag">{a.heightCm.toLocaleString('fa-IR')} سانتی‌متر</span>}
                {a.hasVideo && <span className="tag"><Icon name="video" size={13} /> ویدیو دارد</span>}
                {a.showreelUrl && <span className="tag"><Icon name="clapperboard" size={13} /> نمونه‌کار</span>}
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
