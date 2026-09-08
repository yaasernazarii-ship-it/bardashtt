'use client';

import { useCallback, useEffect, useState } from 'react';
import Icon from './Icon';
import AdminResumeEditor from './AdminResumeEditor';
import AdminResumeFields from './AdminResumeFields';

const dateFmt = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });

export default function AdminResumes() {
  const [tab, setTab] = useState('list');
  const [resumes, setResumes] = useState([]);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [editorFor, setEditorFor] = useState(null); // { id } یا { id: null } برای رزومهٔ تازه
  const [busyId, setBusyId] = useState('');

  const loadFields = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/resume-fields');
      const d = await res.json();
      if (d.ok) setFields(d.fields);
      else setError(d.error || 'خطا در بارگذاری فیلدها.');
    } catch {
      setError('ارتباط با سرور برقرار نشد.');
    }
  }, []);

  const loadResumes = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/resumes');
      const d = await res.json();
      if (d.ok) setResumes(d.resumes);
      else setError(d.error || 'خطا در بارگذاری رزومه‌ها.');
    } catch {
      setError('ارتباط با سرور برقرار نشد.');
    }
  }, []);

  // اگر خواندن از سرور شکست بخورد باید پیام خطا دیده شود، نه «در حال بارگذاری…»ِ همیشگی.
  useEffect(() => {
    (async () => {
      await Promise.all([loadResumes(), loadFields()]);
      setLoading(false);
    })();
  }, [loadResumes, loadFields]);

  async function remove(r) {
    if (!window.confirm(`رزومهٔ «${r.fullName}» و همهٔ عکس‌ها و ویدیوهایش حذف شود؟ این کار قابل بازگشت نیست.`)) return;
    setBusyId(r.id);
    setError('');
    const res = await fetch(`/api/admin/resumes/${r.id}`, { method: 'DELETE' });
    const d = await res.json();
    setBusyId('');
    if (!d.ok) { setError(d.error || 'حذف انجام نشد.'); return; }
    setResumes((prev) => prev.filter((it) => it.id !== r.id));
  }

  async function togglePublic(r) {
    setBusyId(r.id);
    setError('');
    const res = await fetch(`/api/admin/resumes/${r.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ setPublic: !r.isPublic }),
    });
    const d = await res.json();
    setBusyId('');
    if (!d.ok) { setError(d.error || 'تغییر وضعیت انجام نشد.'); return; }
    setResumes((prev) => prev.map((it) => (it.id === r.id ? { ...it, isPublic: d.resume.isPublic } : it)));
  }

  if (loading) return <p style={{ color: 'var(--muted)' }}>در حال بارگذاری…</p>;

  if (editorFor) {
    return (
      <AdminResumeEditor
        resumeId={editorFor.id}
        fields={fields}
        onClose={() => setEditorFor(null)}
        onSaved={async () => { setEditorFor(null); await loadResumes(); }}
      />
    );
  }

  const q = query.trim().toLowerCase();
  const filtered = q
    ? resumes.filter((r) => [r.fullName, r.headline, r.city].some((v) => (v || '').toLowerCase().includes(q)))
    : resumes;

  return (
    <div>
      {error && <div className="alert alert--error" style={{ marginBottom: 14 }}>{error}</div>}

      <div className="rz-tabs">
        <button type="button" className={`rz-tab ${tab === 'list' ? 'is-active' : ''}`} onClick={() => setTab('list')}>
          رزومه‌ها <span>{resumes.length.toLocaleString('fa-IR')}</span>
        </button>
        <button type="button" className={`rz-tab ${tab === 'fields' ? 'is-active' : ''}`} onClick={() => setTab('fields')}>
          فیلدهای رزومه <span>{fields.length.toLocaleString('fa-IR')}</span>
        </button>
      </div>

      {tab === 'fields' ? (
        <AdminResumeFields fields={fields} onChanged={loadFields} />
      ) : (
        <>
          <div className="rz-toolbar">
            <input className="form-input" placeholder="جست‌وجو بر اساس نام، عنوان یا شهر…" value={query}
              onChange={(e) => setQuery(e.target.value)} />
            <button type="button" className="btn btn--dark" onClick={() => setEditorFor({ id: null })}>+ رزومهٔ جدید</button>
          </div>

          {filtered.length === 0 ? (
            <p className="rz-empty">{resumes.length === 0 ? 'هنوز رزومه‌ای ساخته نشده است. با دکمهٔ «رزومهٔ جدید» شروع کنید.' : 'رزومه‌ای با این مشخصات پیدا نشد.'}</p>
          ) : (
            <div className="rz-cards">
              {filtered.map((r) => (
                <article key={r.id} className="rz-card-item">
                  <div className="rz-card-item__cover" style={r.coverUrl ? { backgroundImage: `url(${r.coverUrl})` } : undefined}>
                    {!r.coverUrl && <Icon name="masks" size={30} strokeWidth={1.3} />}
                  </div>
                  <div className="rz-card-item__body">
                    <strong>{r.fullName}</strong>
                    {r.headline && <small>{r.headline}</small>}
                    <div className="su-tags rz-card-item__tags">
                      <span className={`su-tag ${r.isPublic ? 'su-tag--ok' : 'su-tag--muted'}`}>{r.isPublic ? 'در بانک بازیگران' : 'منتشرنشده'}</span>
                      <span className="su-tag su-tag--muted">{r.photoCount.toLocaleString('fa-IR')} عکس</span>
                      <span className="su-tag su-tag--muted">{r.videoCount.toLocaleString('fa-IR')} ویدیو</span>
                      {r.city && <span className="su-tag su-tag--muted">{r.city}</span>}
                    </div>
                    <span className="rz-card-item__date">آخرین ویرایش: {dateFmt.format(new Date(r.updatedAt))}</span>
                  </div>
                  <div className="rz-card-item__actions">
                    <button type="button" className="btn btn--sm btn--dark" onClick={() => setEditorFor({ id: r.id })}>ویرایش</button>
                    <button type="button" className="btn btn--sm btn--outline" disabled={busyId === r.id} onClick={() => togglePublic(r)}>
                      {r.isPublic ? 'خارج‌کردن از بانک' : 'انتشار در بانک'}
                    </button>
                    <button type="button" className="btn btn--sm btn--danger" disabled={busyId === r.id} onClick={() => remove(r)}>حذف</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
