'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Icon from './Icon';

const STATUS_LABEL = { active: 'فعال', needs_attention: 'نیازمند توجه', inactive: 'غیرفعال' };
const STATUS_TAG = { active: 'tag--green', needs_attention: 'tag--gold', inactive: 'tag--wine' };
const dateText = (v) => (v ? new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(new Date(v)) : 'بدون سابقهٔ فعالیت');
const fa = (n) => Number(n || 0).toLocaleString('fa-IR');

export default function AdminGrowthDashboard() {
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page: String(page), pageSize: '20' });
    if (name.trim()) params.set('name', name.trim());
    if (status) params.set('status', status);
    fetch(`/api/admin/growth/students?${params.toString()}`)
      .then((r) => r.json())
      .then((body) => {
        if (cancelled) return;
        if (!body.ok) { setError(body.error || 'خطا در دریافت اطلاعات.'); setData(null); return; }
        setData(body.data);
      })
      .catch(() => { if (!cancelled) setError('ارتباط با سرور برقرار نشد.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [name, status, page]);

  const counts = data?.statusCounts || { active: 0, needs_attention: 0, inactive: 0 };
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div>
      <div className="dash-stats">
        <button type="button" className="dash-stat" style={{ textAlign: 'start', cursor: 'pointer' }} onClick={() => { setStatus(''); setPage(1); }}>
          <div className="dash-stat__head"><span className="dash-stat__label">همهٔ هنرجویان</span><span className="dash-stat__ico dash-stat__ico--blue"><Icon name="users" size={18} /></span></div>
          <p className="dash-stat__value">{fa(counts.active + counts.needs_attention + counts.inactive)}</p>
        </button>
        <button type="button" className="dash-stat" style={{ textAlign: 'start', cursor: 'pointer' }} onClick={() => { setStatus('active'); setPage(1); }}>
          <div className="dash-stat__head"><span className="dash-stat__label">روند فعالیت مطلوب</span><span className="dash-stat__ico dash-stat__ico--green"><Icon name="checkMark" size={18} /></span></div>
          <p className="dash-stat__value dash-stat__value--green">{fa(counts.active)}</p>
        </button>
        <button type="button" className="dash-stat" style={{ textAlign: 'start', cursor: 'pointer' }} onClick={() => { setStatus('needs_attention'); setPage(1); }}>
          <div className="dash-stat__head"><span className="dash-stat__label">نیازمند توجه</span><span className="dash-stat__ico dash-stat__ico--amber"><Icon name="alertTriangle" size={18} /></span></div>
          <p className="dash-stat__value">{fa(counts.needs_attention)}</p>
        </button>
        <button type="button" className="dash-stat" style={{ textAlign: 'start', cursor: 'pointer' }} onClick={() => { setStatus('inactive'); setPage(1); }}>
          <div className="dash-stat__head"><span className="dash-stat__label">غیرفعال</span><span className="dash-stat__ico dash-stat__ico--muted"><Icon name="clock" size={18} /></span></div>
          <p className="dash-stat__value dash-stat__value--muted">{fa(counts.inactive)}</p>
        </button>
      </div>

      <div className="growth-form-row" style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input
          type="text" placeholder="جست‌وجوی نام هنرجو…" value={name}
          onChange={(e) => { setName(e.target.value); setPage(1); }}
          style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 10, padding: 11, background: 'var(--white)', color: 'var(--dark)', font: 'inherit' }}
        />
        <select
          value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 11, background: 'var(--white)', color: 'var(--dark)', font: 'inherit' }}
        >
          <option value="">همهٔ وضعیت‌ها</option>
          <option value="active">فعال</option>
          <option value="needs_attention">نیازمند توجه</option>
          <option value="inactive">غیرفعال</option>
        </select>
      </div>

      {error && <div className="alert alert--error">{error}<button type="button" className="btn btn--gold" style={{ marginRight: 10 }} onClick={() => setPage((p) => p)}>تلاش مجدد</button></div>}

      {loading && <div className="growth-state"><Icon name="sparkles" size={24} /><p>در حال بارگذاری…</p></div>}

      {!loading && !error && data && data.students.length === 0 && (
        <div className="growth-state"><Icon name="sparkles" size={24} /><p>هیچ هنرجویی با این فیلتر یافت نشد.</p></div>
      )}

      {!loading && !error && data && data.students.length > 0 && (
        <>
          <div className="growth-list">
            {data.students.map((s) => (
              <Link key={s.id} href={`/dashboard/admin/growth/${s.id}`} className="growth-list-item">
                <div>
                  <strong>{s.displayName}</strong>
                  <small>{s.courseTitle || 'بدون دوره'}{s.classGroup ? ` · ${s.classGroup.name}` : ''} · آخرین فعالیت: {dateText(s.lastActivityAt)}</small>
                </div>
                <span className={`tag ${STATUS_TAG[s.status] || 'tag--dark'}`}>{STATUS_LABEL[s.status] || s.status}</span>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 18 }}>
              <button type="button" className="btn btn--gold" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>قبلی</button>
              <span style={{ alignSelf: 'center', color: 'var(--muted)', fontSize: '.85rem' }}>صفحهٔ {fa(page)} از {fa(totalPages)}</span>
              <button type="button" className="btn btn--gold" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>بعدی</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
