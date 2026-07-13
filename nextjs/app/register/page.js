'use client';
import { useState } from 'react';
import PageLayout from '@/components/PageLayout';

export default function RegisterPage() {
  const [sent, setSent] = useState(false);
  return (
    <PageLayout>
      <div className="page-header"><h1>ثبت‌نام رایگان</h1><p>عضویت در خانواده برداشت</p></div>
      <section style={{ background: 'var(--surface)' }}>
        <div className="container--sm">
          <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 32 }}>
            {sent && <div className="alert alert--success">درخواست شما ثبت شد. تیم پشتیبانی با شما تماس می‌گیرد.</div>}
            <div className="form-group"><label className="form-label">نام و نام خانوادگی</label><input className="form-input" required /></div>
            <div className="form-group"><label className="form-label">شماره موبایل</label><input className="form-input" dir="ltr" type="tel" required /></div>
            <div className="form-group"><label className="form-label">شهر</label><select className="form-input"><option>تهران</option><option>مازندران</option><option>سایر</option></select></div>
            <div className="form-group"><label className="form-label">سن</label><input className="form-input" dir="ltr" type="number" min="4" /></div>
            <button className="btn btn--dark btn--full">ارسال درخواست ثبت‌نام</button>
          </form>
        </div>
      </section>
    </PageLayout>
  );
}
