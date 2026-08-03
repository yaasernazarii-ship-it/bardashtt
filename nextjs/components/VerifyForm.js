'use client';
import { useState } from 'react';

export default function VerifyForm() {
  const [code, setCode] = useState('');
  const [done, setDone] = useState(false);
  return (
    <>
      <div className="page-header"><h1>استعلام گواهینامه</h1><p>تأیید صحت گواهی فارغ‌التحصیلی</p></div>
      <section style={{ background: 'var(--bg)' }}>
        <div className="container--sm">
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: 32, boxShadow: 'var(--shadow-md)' }}>
            <h3 style={{ marginBottom: 16 }}>کد گواهینامه را وارد کنید</h3>
            <div style={{ display: 'flex', gap: 10 }}><input className="form-input" value={code} onChange={e=>setCode(e.target.value)} placeholder="مثلاً BR-1403-001" dir="ltr" /><button className="btn btn--dark" onClick={()=>setDone(true)}>استعلام</button></div>
          </div>
          {done && <div className="alert alert--info" style={{ marginTop: 20 }}>در نسخه نمایشی، اتصال به پایگاه داده گواهینامه فعال نشده است.</div>}
        </div>
      </section>
    </>
  );
}
