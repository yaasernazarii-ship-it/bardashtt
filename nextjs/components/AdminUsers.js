'use client';

import { useEffect, useState } from 'react';
import Icon from './Icon';
import UserPhotoThumb from './UserPhotoThumb';

const ROLE_LABEL = { member: 'عضو', student: 'هنرجو', filmmaker: 'فیلمساز', editor: 'ادیتور', admin: 'ادمین' };
const dateFmt = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [query, setQuery] = useState('');
  const [panelId, setPanelId] = useState(null);
  const [openId, setOpenId] = useState('');

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/users');
    const data = await res.json();
    if (data.ok) {
      setUsers(data.users);
      setCurrentUserId(data.currentUserId);
    } else {
      setError(data.error || 'خطا در بارگذاری.');
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function patch(id, payload) {
    setSavingId(id);
    setError('');
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSavingId(null);
    if (!data.ok) { setError(data.error || 'خطا در ذخیره.'); return null; }
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...data.user } : u)));
    return data.user;
  }

  function changeRole(id, role) { patch(id, { role }); }

  function toggleActive(u) {
    const next = !u.active;
    if (!next && !window.confirm(`حساب «${u.displayName || u.username || u.phone}» غیرفعال شود؟ این فرد دیگر نمی‌تواند وارد شود.`)) return;
    patch(u.id, { active: next });
  }

  function toggleGraduated(u) {
    const next = !u.graduated;
    const name = u.displayName || u.username || u.phone;
    if (next && !window.confirm(`«${name}» فارغ‌التحصیل شود؟ تقویم کلاس از داشبورد او حذف و نامش از انتخاب اسامیِ تقویم کنار می‌رود.`)) return;
    patch(u.id, { graduated: next });
  }

  async function resetPassword(u) {
    const name = u.displayName || u.username || u.phone;
    const pass = window.prompt(`رمز عبور جدید برای «${name}» را وارد کنید (حداقل ۶ کاراکتر):`);
    if (pass === null) return;
    if (pass.trim().length < 6) { setError('رمز عبور حداقل ۶ کاراکتر باشد.'); return; }
    await patch(u.id, { password: pass.trim() });
  }

  // بدون نام کاربری، رمز عبور بی‌فایده است؛ چون ورود با «نام کاربری + رمز» انجام می‌شود.
  async function setUsername(u) {
    const name = u.displayName || u.phone;
    const val = window.prompt(`نام کاربری برای «${name}» (حروف انگلیسی کوچک، عدد، نقطه، خط تیره — ۳ تا ۳۲ نویسه):`, u.username || '');
    if (val === null) return;
    const clean = val.trim().toLowerCase();
    if (clean && !/^[a-z0-9._-]{3,32}$/.test(clean)) {
      setError('نام کاربری فقط حروف انگلیسی کوچک، عدد، نقطه، خط تیره و زیرخط (۳ تا ۳۲ نویسه).');
      return;
    }
    await patch(u.id, { username: clean });
  }

  if (loading) return <p style={{ color: 'var(--muted)' }}>در حال بارگذاری…</p>;

  const q = query.trim().toLowerCase();
  const filtered = q
    ? users.filter((u) => [u.displayName, u.username, u.phone].some((v) => (v || '').toLowerCase().includes(q)))
    : users;

  return (
    <div>
      {error && <div className="alert alert--error" style={{ marginBottom: 14 }}>{error}</div>}

      <div style={{ marginBottom: 14 }}>
        <input className="form-input" placeholder="جستجو بر اساس نام، نام کاربری یا موبایل…" value={query}
          onChange={(e) => setQuery(e.target.value)} style={{ maxWidth: 360 }} />
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>کاربری یافت نشد.</p>
      ) : (
        <div className="su-list">
          {filtered.map((u) => {
            const open = openId === u.id;
            const isSelf = u.id === currentUserId;
            return (
              <div key={u.id} className="su-item" style={u.active === false ? { opacity: 0.7 } : undefined}>
                <button type="button" className="su-head" aria-expanded={open}
                  onClick={() => setOpenId(open ? '' : u.id)}>
                  <UserPhotoThumb src={u.photoUrl} name={u.displayName || u.username || u.phone} />
                  <span className="su-head__name">{u.displayName || u.username || u.phone}</span>
                  <span className="su-tags">
                    <span className="su-tag su-tag--muted">{ROLE_LABEL[u.role] || u.role}{isSelf ? ' (شما)' : ''}</span>
                    <span className={`su-tag ${u.active === false ? 'su-tag--off' : 'su-tag--ok'}`}>{u.active === false ? 'غیرفعال' : 'فعال'}</span>
                    {u.role === 'student' && (
                      <span className={`su-tag ${u.graduated ? 'su-tag--grad' : 'su-tag--enrolled'}`}>{u.graduated ? 'فارغ‌التحصیل' : 'در حال تحصیل'}</span>
                    )}
                  </span>
                  <svg className={`su-chev ${open ? 'is-open' : ''}`} width="16" height="16" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {open && (
                  <div className="su-body">
                    <div style={{ color: 'var(--muted)', fontSize: '.88rem', lineHeight: 2 }}>
                      <div>موبایل: <span dir="ltr">{u.phone}</span></div>
                      <div>نام کاربری: <b dir="ltr">{u.username || '—'}</b></div>
                      <div>رمز عبور: <b dir="ltr" style={{ fontFamily: 'monospace' }}>{u.passwordPlain || '—'}</b></div>
                      <div>تاریخ عضویت: {dateFmt.format(new Date(u.createdAt))}</div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                      <button type="button" className="btn btn--sm btn--dark" onClick={() => setPanelId(u.id)}>مشاهدهٔ پنل کامل</button>

                      {/* نام کاربری و رمز عبور برای هر حسابی — از جمله حساب خودتان — قابل تغییر است،
                          چون کاربر دیگر از پروفایلش رمز عوض نمی‌کند و تنها راه، همین‌جاست. */}
                      <button type="button" className="btn btn--sm btn--outline" disabled={savingId === u.id} onClick={() => setUsername(u)}>
                        {u.username ? 'تغییر نام کاربری' : 'تعیین نام کاربری'}
                      </button>
                      <button type="button" className="btn btn--sm btn--outline" disabled={savingId === u.id} onClick={() => resetPassword(u)}>
                        {u.username ? 'رمز جدید' : 'تعیین رمز'}
                      </button>

                      {isSelf ? (
                        <span style={{ color: 'var(--muted)', fontSize: '.82rem' }}>نقش و فعال/غیرفعال‌کردنِ حساب خودتان از این‌جا قابل تغییر نیست.</span>
                      ) : (
                        <>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.82rem', color: 'var(--muted)' }}>
                            نقش:
                            <select className="form-input role-select" value={u.role} disabled={savingId === u.id}
                              onChange={(e) => changeRole(u.id, e.target.value)}>
                              <option value="member">عضو</option>
                              <option value="student">هنرجو</option>
                              <option value="filmmaker">فیلمساز</option>
                              <option value="editor">ادیتور</option>
                              <option value="admin">ادمین</option>
                            </select>
                          </label>
                          {u.role === 'student' && (
                            <button type="button" className={`btn btn--sm ${u.graduated ? 'btn--dark' : 'btn--outline'}`}
                              disabled={savingId === u.id} onClick={() => toggleGraduated(u)}>
                              {u.graduated ? 'بازگرداندن به تحصیل' : 'فارغ‌التحصیل'}
                            </button>
                          )}
                          <button type="button" className={`btn btn--sm ${u.active === false ? 'btn--dark' : 'btn--danger'}`}
                            disabled={savingId === u.id} onClick={() => toggleActive(u)}>
                            {u.active === false ? 'فعال‌سازی' : 'غیرفعال'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {panelId && <UserPanel userId={panelId} onClose={() => setPanelId(null)} />}
    </div>
  );
}

const EMPTY_RESUME = { fullName: '', headline: '', gender: '', city: '', birthYear: '', heightCm: '', skills: '', bio: '', experience: '', photoUrl: '', showreelUrl: '', selfVideoUrl: '', isPublic: false };

function UserPanel({ userId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [editResume, setEditResume] = useState(false);
  const [form, setForm] = useState(EMPTY_RESUME);
  const [savedMsg, setSavedMsg] = useState('');

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/admin/users/${userId}`);
    const d = await res.json();
    if (d.ok) {
      setData(d);
      const r = d.user?.resume;
      setForm(r ? {
        fullName: r.fullName || d.user?.displayName || '', headline: r.headline || '', gender: r.gender || '',
        city: r.city || '', birthYear: r.birthYear || '', heightCm: r.heightCm || '', skills: r.skills || '',
        bio: r.bio || '', experience: r.experience || '', photoUrl: r.photoUrl || '', showreelUrl: r.showreelUrl || '',
        selfVideoUrl: r.selfVideoUrl || '', isPublic: !!r.isPublic,
      } : { ...EMPTY_RESUME, fullName: d.user?.displayName || '' });
    } else setError(d.error || 'خطا در بارگذاری.');
    setLoading(false);
  }
  useEffect(() => { load(); }, [userId]);

  async function moderate(action, confirmText) {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true); setError('');
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ moderate: action }),
    });
    const d = await res.json();
    setBusy(false);
    if (d.ok) load();
    else setError(d.error || 'عملیات انجام نشد.');
  }

  function setField(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function saveResume(e) {
    e.preventDefault();
    if (!form.fullName.trim()) { setError('نام و نام خانوادگی رزومه الزامی است.'); return; }
    setBusy(true); setError(''); setSavedMsg('');
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resume: form }),
    });
    const d = await res.json();
    setBusy(false);
    if (!d.ok) { setError(d.error || 'ذخیره نشد.'); return; }
    setSavedMsg('رزومه ذخیره شد.');
    setEditResume(false);
    load();
  }

  const u = data?.user;
  const r = u?.resume;
  const signup = data?.signup;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1300, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: 20, overflowY: 'auto' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: 'min(680px,100%)', maxHeight: '92vh', overflowY: 'auto', padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 className="heading" style={{ fontSize: '1.15rem', margin: 0 }}>پنل کاربر</h2>
          <button type="button" className="btn btn--sm btn--ghost" onClick={onClose}><Icon name="close" size={14} /> بستن</button>
        </div>

        {loading ? <p style={{ color: 'var(--muted)' }}>در حال بارگذاری…</p> : error ? <div className="alert alert--error">{error}</div> : (
          <div style={{ display: 'grid', gap: 18 }}>
            {/* هویت */}
            <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 14, lineHeight: 2, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <UserPhotoThumb src={u.photoUrl} name={u.displayName} size={66} />
              <div>
              <div><b>{u.displayName || '—'}</b> · {ROLE_LABEL[u.role] || u.role} {u.active === false && <span style={{ color: '#B91C1C' }}>(غیرفعال)</span>}</div>
              <div style={{ fontSize: '.88rem', color: 'var(--muted)' }}>
                موبایل: <span dir="ltr">{u.phone}</span>
                {u.username && <> · نام کاربری: <b dir="ltr">{u.username}</b></>}
                {u.passwordPlain && <> · رمز: <b dir="ltr">{u.passwordPlain}</b></>}
              </div>
              {u.branch && <div style={{ fontSize: '.88rem', color: 'var(--muted)' }}>شعبه: {u.branch}{u.courseTitle ? ` · دوره: ${u.courseTitle}` : ''}</div>}
              {u.nationalId && <div style={{ fontSize: '.88rem', color: 'var(--muted)' }}>کد ملی: <span dir="ltr">{u.nationalId}</span></div>}
              </div>
            </div>

            {/* رزومه و بارگذاری‌ها */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 8 }}>
                <h3 style={{ fontWeight: 800, margin: 0 }}>رزومه‌ی بازیگری و بارگذاری‌ها</h3>
                <button type="button" className="btn btn--sm btn--dark" disabled={busy} onClick={() => setEditResume((v) => !v)}>
                  {editResume ? 'بستن ویرایش' : (r ? 'ویرایش رزومه' : 'ساخت رزومه')}
                </button>
              </div>
              {savedMsg && <div className="alert alert--success" style={{ marginBottom: 10 }}>{savedMsg}</div>}

              {editResume && (
                <form onSubmit={saveResume} style={{ background: 'var(--surface)', borderRadius: 12, padding: 14, marginBottom: 14, display: 'grid', gap: 10 }}>
                  <p style={{ fontSize: '.82rem', color: 'var(--muted)', margin: 0 }}>ساخت، ویرایش و بارگذاری تمام اجزای رزومه فقط از همین پنل مدیریت انجام می‌شود و هنرجو به رزومه دسترسی ندارد.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div className="form-group" style={{ margin: 0 }}><label className="form-label">نام و نام خانوادگی *</label><input className="form-input" value={form.fullName} onChange={(e) => setField('fullName', e.target.value)} /></div>
                    <div className="form-group" style={{ margin: 0 }}><label className="form-label">عنوان/تیتر</label><input className="form-input" value={form.headline} onChange={(e) => setField('headline', e.target.value)} /></div>
                    <div className="form-group" style={{ margin: 0 }}><label className="form-label">جنسیت</label>
                      <select className="form-input" value={form.gender} onChange={(e) => setField('gender', e.target.value)}>
                        <option value="">—</option><option value="male">آقا</option><option value="female">خانم</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}><label className="form-label">شهر</label><input className="form-input" value={form.city} onChange={(e) => setField('city', e.target.value)} /></div>
                    <div className="form-group" style={{ margin: 0 }}><label className="form-label">سال تولد</label><input className="form-input" dir="ltr" value={form.birthYear} onChange={(e) => setField('birthYear', e.target.value)} placeholder="1380" /></div>
                    <div className="form-group" style={{ margin: 0 }}><label className="form-label">قد (سانتی‌متر)</label><input className="form-input" dir="ltr" value={form.heightCm} onChange={(e) => setField('heightCm', e.target.value)} placeholder="175" /></div>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}><label className="form-label">مهارت‌ها</label><input className="form-input" value={form.skills} onChange={(e) => setField('skills', e.target.value)} /></div>
                  <div className="form-group" style={{ margin: 0 }}><label className="form-label">نشانی عکس رزومه (URL)</label><input className="form-input" dir="ltr" value={form.photoUrl} onChange={(e) => setField('photoUrl', e.target.value)} /></div>
                  <div className="form-group" style={{ margin: 0 }}><label className="form-label">لینک شوریل/نمونه‌کار (URL)</label><input className="form-input" dir="ltr" value={form.showreelUrl} onChange={(e) => setField('showreelUrl', e.target.value)} /></div>
                  <div className="form-group" style={{ margin: 0 }}><label className="form-label">لینک ویدیوی معرفی (URL)</label><input className="form-input" dir="ltr" value={form.selfVideoUrl} onChange={(e) => setField('selfVideoUrl', e.target.value)} /></div>
                  <div className="form-group" style={{ margin: 0 }}><label className="form-label">معرفی</label><textarea className="form-input" rows={3} value={form.bio} onChange={(e) => setField('bio', e.target.value)} /></div>
                  <div className="form-group" style={{ margin: 0 }}><label className="form-label">سوابق</label><textarea className="form-input" rows={3} value={form.experience} onChange={(e) => setField('experience', e.target.value)} /></div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.9rem' }}>
                    <input type="checkbox" checked={form.isPublic} onChange={(e) => setField('isPublic', e.target.checked)} /> نمایش عمومی در فهرست بازیگران
                  </label>
                  <div><button type="submit" className="btn btn--dark" disabled={busy}>{busy ? 'در حال ذخیره…' : 'ذخیره رزومه'}</button></div>
                </form>
              )}

              {!r ? (
                <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>این کاربر هنوز رزومه‌ای نساخته است.</p>
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ fontSize: '.88rem', color: 'var(--muted)' }}>
                    وضعیت نمایش عمومی: {r.isPublic ? <b style={{ color: '#166534' }}>نمایش داده می‌شود</b> : <b>مخفی</b>}
                  </div>
                  {r.headline && <div style={{ fontSize: '.9rem' }}>{r.headline}</div>}
                  {r.photoUrl && (
                    <div>
                      <p style={{ fontSize: '.82rem', color: 'var(--muted)', marginBottom: 6 }}>عکس رزومه:</p>
                      <img src={r.photoUrl} alt="" style={{ maxWidth: '100%', maxHeight: 240, borderRadius: 10, border: '1px solid var(--border)' }} />
                      <div style={{ marginTop: 6 }}>
                        <button type="button" className="btn btn--sm btn--danger" disabled={busy} onClick={() => moderate('deleteResumePhoto', 'عکس رزومه‌ی این کاربر حذف شود؟')}>حذف عکس</button>
                      </div>
                    </div>
                  )}
                  {r.showreelUrl && (
                    <div style={{ fontSize: '.9rem' }}>
                      شوریل/ویدیو: <a href={r.showreelUrl} target="_blank" rel="noopener noreferrer" dir="ltr">{r.showreelUrl}</a>
                      <button type="button" className="btn btn--sm btn--danger" style={{ marginRight: 8 }} disabled={busy} onClick={() => moderate('deleteShowreel', 'لینک شوریل حذف شود؟')}>حذف</button>
                    </div>
                  )}
                  {r.selfVideoUrl && (
                    <div style={{ fontSize: '.9rem' }}>
                      <Icon name="clapperboard" size={14} /> ویدیوی معرفی: <a href={r.selfVideoUrl} target="_blank" rel="noopener noreferrer" dir="ltr">{r.selfVideoUrl}</a>
                      <button type="button" className="btn btn--sm btn--danger" style={{ marginRight: 8 }} disabled={busy} onClick={() => moderate('deleteSelfVideo', 'ویدیوی معرفی حذف شود؟')}>حذف</button>
                    </div>
                  )}
                  {r.bio && <div><b style={{ fontSize: '.85rem' }}>معرفی:</b> <p style={{ color: 'var(--muted)', margin: '4px 0', whiteSpace: 'pre-wrap' }}>{r.bio}</p></div>}
                  {r.experience && <div><b style={{ fontSize: '.85rem' }}>سوابق:</b> <p style={{ color: 'var(--muted)', margin: '4px 0', whiteSpace: 'pre-wrap' }}>{r.experience}</p></div>}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', borderTop: '1px dashed var(--border)', paddingTop: 10 }}>
                    {r.isPublic && <button type="button" className="btn btn--sm btn--outline" disabled={busy} onClick={() => moderate('hideResume', 'رزومه‌ی این کاربر از نمایش عمومی خارج شود؟')}>مخفی‌کردن از سایت</button>}
                    <button type="button" className="btn btn--sm btn--danger" disabled={busy} onClick={() => moderate('deleteResume', 'کل رزومه‌ی این کاربر حذف شود؟ این کار قابل بازگشت نیست.')}>حذف کامل رزومه</button>
                  </div>
                </div>
              )}
            </div>

            {/* مدارک ثبت‌نام */}
            {signup?.idCardImage && (
              <div>
                <h3 style={{ fontWeight: 800, marginBottom: 8 }}>مدرک بارگذاری‌شده (شناسنامه/کارت ملی)</h3>
                <a href={signup.idCardImage} target="_blank" rel="noopener noreferrer">
                  <img src={signup.idCardImage} alt="" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 10, border: '1px solid var(--border)' }} />
                </a>
              </div>
            )}

            {/* ثبت‌نام دوره‌ها و ویدیوها */}
            {u.enrollments?.length > 0 && (
              <div>
                <h3 style={{ fontWeight: 800, marginBottom: 8 }}>ثبت‌نام دوره‌ها</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
                  {u.enrollments.map((en) => (
                    <li key={en.id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '8px 12px', fontSize: '.88rem' }}>
                      <b>{en.courseTitle}</b> — {en.status}
                      {en.videoUrl && <> · <a href={en.videoUrl} target="_blank" rel="noopener noreferrer" dir="ltr">ویدیوی ارسالی</a></>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
