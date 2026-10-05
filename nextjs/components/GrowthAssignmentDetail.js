'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function GrowthAssignmentDetail({ id }) {
  const [assignment, setAssignment] = useState(null);
  const [content, setContent] = useState('');
  const [error, setError] = useState(false);
  const load = () => fetch('/api/growth/assignments').then((r) => r.json()).then((body) => setAssignment(body.data.assignments.find((item) => item.id === id) || null)).catch(() => setError(true));
  useEffect(load, [id]);
  const submit = async (event) => { event.preventDefault(); if (!content.trim()) return; const response = await fetch(`/api/growth/assignments/${id}/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) }); if (response.ok) { setContent(''); load(); } };
  if (error) return <div className="growth-state growth-state--error">دریافت تمرین با مشکل مواجه شد.</div>;
  if (!assignment) return <div className="growth-state">در حال دریافت تمرین…</div>;
  const latest = assignment.submissions?.[0];
  return <><div className="growth-page-title"><div><Link className="growth-back" href="/dashboard/growth/assignments">← تمرین‌های من</Link><h1>{assignment.title}</h1><p>مهلت: {assignment.dueDate ? new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(new Date(assignment.dueDate)) : 'بدون مهلت'}</p></div></div><article className="dash-card growth-assignment-detail"><p>{assignment.description || 'برای این تمرین توضیحی ثبت نشده است.'}</p>{latest?.feedback && <div className="alert alert--info">بازخورد استاد: {latest.feedback}</div>}<form className="growth-form" onSubmit={submit}><textarea placeholder="پاسخ تمرینت را اینجا بنویس…" value={content} onChange={(e) => setContent(e.target.value)} /><button className="btn btn--gold">ارسال پاسخ</button></form></article></>;
}
