'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Icon from './Icon';
import LiveClassPlayer from './LiveClassPlayer';
import LiveStatusBadge from './LiveStatusBadge';

const dateFmt = new Intl.DateTimeFormat('fa-IR', { weekday: 'long', month: 'long', day: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' });

function Section({ icon, title, text }) {
  if (!text) return null;
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }} className="icon-inline"><Icon name={icon} size={16} /> {title}</div>
      <p style={{ color: 'var(--muted)', lineHeight: 1.9, whiteSpace: 'pre-wrap', margin: 0 }}>{text}</p>
    </div>
  );
}

export default function LiveClassRoom({ sessionId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch(`/api/student/live/${sessionId}`);
        const d = await res.json();
        if (!alive) return;
        if (d.ok) {
          setData(d);
          setError(null);
        } else {
          setError(d.error || 'خطا در دریافت اطلاعات کلاس.');
        }
      } catch {
        if (alive) setError('ارتباط با سرور برقرار نشد.');
      }
      if (alive) setLoading(false);
    }
    load();
    // وضعیت SCHEDULED → LIVE → FINISHED بدون رفرش دستی هم به‌روز شود.
    const t = setInterval(load, 15000);
    return () => { alive = false; clearInterval(t); };
  }, [sessionId]);

  if (loading) return <p style={{ color: 'var(--muted)' }}>در حال بارگذاری…</p>;

  if (error) {
    return (
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 32, textAlign: 'center' }}>
        <p style={{ color: 'var(--muted)', lineHeight: 2 }}>{error}</p>
        <Link href="/dashboard/live-classes" className="btn btn--outline btn--sm" style={{ marginTop: 12 }}>بازگشت به کلاس‌های آنلاین</Link>
      </div>
    );
  }

  if (!data) return null;

  const { group, session } = data;
  const d = new Date(session.startsAt);
  const isLive = session.liveStatus === 'live';
  const isFinished = session.liveStatus === 'finished';

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginBottom: 4 }}>
              {group.name}{group.teacherName ? ` · استاد ${group.teacherName}` : ''}
            </div>
            <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>{session.title}</h1>
            <div style={{ color: 'var(--muted)', fontSize: '.85rem', marginTop: 4 }}>{dateFmt.format(d)} — ساعت {timeFmt.format(d)}</div>
          </div>
          <LiveStatusBadge status={session.liveStatus} />
        </div>
      </div>

      {isLive && (
        <div>
          <LiveClassPlayer src={data.embedSrc} title={session.title} />
          <p style={{ color: 'var(--muted)', fontSize: '.8rem', marginTop: 10, textAlign: 'center' }}>
            اگر تصویر پخش نمی‌شود، چند لحظه صبر کنید یا صفحه را رفرش کنید؛ کلاس همچنان در حال برگزاری است.
          </p>
        </div>
      )}

      {!isLive && session.liveStatus === 'scheduled' && (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 32, textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', lineHeight: 2 }}>کلاس هنوز شروع نشده است. کمی نزدیک به زمان شروع دوباره سر بزنید.</p>
        </div>
      )}

      {isFinished && session.recordingSrc && (
        <LiveClassPlayer src={session.recordingSrc} title={session.title} />
      )}

      {isFinished && !session.recordingSrc && (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 32, textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', lineHeight: 2 }}>این جلسه به پایان رسیده است.</p>
        </div>
      )}

      {(session.chartDescription || session.tools || session.homework) && (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
          <Section icon="bookOpen" title="چارت درسی این جلسه" text={session.chartDescription} />
          <Section icon="toolbox" title="ابزار لازم" text={session.tools} />
          <Section icon="pencil" title="تمرین و اتود" text={session.homework} />
        </div>
      )}

      <div>
        <Link href="/dashboard/live-classes" className="btn btn--outline btn--sm">بازگشت به کلاس‌های آنلاین</Link>
      </div>
    </div>
  );
}
