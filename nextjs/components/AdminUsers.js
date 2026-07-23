'use client';

import { useEffect, useState } from 'react';

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

  async function resetPassword(u) {
    const pass = window.prompt(`رمز عبور جدید برای «${u.displayName || u.username}» را وارد کنید (حداقل ۶ کاراکتر):`);
    if (pass === null) return;
    if (pass.trim().length < 6) { setError('رمز عبور حداقل ۶ کاراکتر باشد.'); return; }
    await patch(u.id, { password: pass.trim() });
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

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>نام</th>
              <th>موبایل</th>
              <th>نام کاربری</th>
              <th>رمز عبور</th>
              <th>عضویت</th>
              <th>نقش</th>
              <th>وضعیت</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} style={u.active === false ? { opacity: 0.55 } : undefined}>
                <td>{u.displayName || '—'}</td>
                <td dir="ltr" style={{ textAlign: 'right' }}>{u.phone}</td>
                <td dir="ltr" style={{ textAlign: 'right' }}>{u.username || '—'}</td>
                <td dir="ltr" style={{ textAlign: 'right', fontFamily: 'monospace' }}>{u.passwordPlain || '—'}</td>
                <td>{dateFmt.format(new Date(u.createdAt))}</td>
                <td>
                  {u.id === currentUserId ? (
                    <span className="role-tag">{ROLE_LABEL[u.role] || u.role} (شما)</span>
                  ) : (
                    <select
                      className="form-input role-select"
                      value={u.role}
                      disabled={savingId === u.id}
                      onChange={(e) => changeRole(u.id, e.target.value)}
                    >
                      <option value="member">عضو</option>
                      <option value="student">هنرجو</option>
                      <option value="filmmaker">فیلمساز</option>
                      <option value="editor">ادیتور</option>
                      <option value="admin">ادمین</option>
                    </select>
                  )}
                </td>
                <td>
                  <span style={{
                    background: u.active === false ? '#FEE2E2' : '#DCFCE7',
                    color: u.active === false ? '#B91C1C' : '#166534',
                    borderRadius: 999, padding: '3px 10px', fontSize: '.78rem', fontWeight: 700,
                  }}>{u.active === false ? 'غیرفعال' : 'فعال'}</span>
                </td>
                <td>
                  {u.id === currentUserId ? (
                    <span style={{ color: 'var(--muted)', fontSize: '.8rem' }}>—</span>
                  ) : (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button type="button" className="btn btn--sm btn--outline" onClick={() => setPanelId(u.id)}>مشاهده پنل</button>
                      {u.username && (
                        <button type="button" className="btn btn--sm btn--outline" disabled={savingId === u.id} onClick={() => resetPassword(u)}>رمز جدید</button>
                      )}
                      <button type="button" className={`btn btn--sm ${u.active === false ? 'btn--dark' : 'btn--danger'}`}
                        disabled={savingId === u.id} onClick={() => toggleActive(u)}>
                        {u.active === false ? 'فعال‌سازی' : 'غیرفعال'}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {panelId && <UserPanel userId={panelId} onClose={() => setPanelId(null)} />}
    </div>
  );
}

function UserPanel({ userId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/admin/users/${userId}`);
    const d = await res.json();
    if (d.ok) setData(d);
    else setError(d.error || 'خطا در بارگذاری.');
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

  const u = data?.user;
  const r = u?.resume;
  const signup = data?.signup;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1300, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: 20, overflowY: 'auto' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: 'min(680px,100%)', maxHeight: '92vh', overflowY: 'auto', padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 className="heading" style={{ fontSize: '1.15rem', margin: 0 }}>پنل کاربر</h2>
          <button type="button" className="btn btn--sm btn--ghost" onClick={onClose}>✕ بستن</button>
        </div>

        {loading ? <p style={{ color: 'var(--muted)' }}>در حال بارگذاری…</p> : error ? <div className="alert alert--error">{error}</div> : (
          <div style={{ display: 'grid', gap: 18 }}>
            {/* هویت */}
            <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 14, lineHeight: 2 }}>
              <div><b>{u.displayName || '—'}</b> · {ROLE_LABEL[u.role] || u.role} {u.active === false && <span style={{ color: '#B91C1C' }}>(غیرفعال)</span>}</div>
              <div style={{ fontSize: '.88rem', color: 'var(--muted)' }}>
                موبایل: <span dir="ltr">{u.phone}</span>
                {u.username && <> · نام کاربری: <b dir="ltr">{u.username}</b></>}
                {u.passwordPlain && <> · رمز: <b dir="ltr">{u.passwordPlain}</b></>}
              </div>
              {u.branch && <div style={{ fontSize: '.88rem', color: 'var(--muted)' }}>شعبه: {u.branch}{u.courseTitle ? ` · دوره: ${u.courseTitle}` : ''}</div>}
              {u.nationalId && <div style={{ fontSize: '.88rem', color: 'var(--muted)' }}>کد ملی: <span dir="ltr">{u.nationalId}</span></div>}
            </div>

            {/* رزومه و بارگذاری‌ها */}
            <div>
              <h3 style={{ fontWeight: 800, marginBottom: 10 }}>رزومه‌ی بازیگری و بارگذاری‌ها</h3>
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
