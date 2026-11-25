'use client';

import { useState } from 'react';

export default function RegisterForm() {
  const [sent, setSent] = useState(false);

  return (
    <form className="form-shell" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
      <div className="form-shell__head">
        <h2>فرم ثبت درخواست</h2>
        <p>اطلاعات خود را وارد کنید تا ثبت‌نام شما بررسی و برای مراحل بعدی با شما تماس گرفته شود.</p>
      </div>
      {sent && <div className="alert alert--success">درخواست شما ثبت شد. تیم پشتیبانی با شما تماس می‌گیرد.</div>}
      <div className="form-group"><label className="form-label">نام و نام خانوادگی</label><input className="form-input" required autoComplete="name" /></div>
      <div className="form-group"><label className="form-label">شماره موبایل</label><input className="form-input" dir="ltr" type="tel" required placeholder="09xxxxxxxxx" autoComplete="tel" inputMode="tel" /></div>
      <div className="form-group"><label className="form-label">شهر</label><select className="form-input" defaultValue="تهران"><option>تهران</option><option>مازندران</option><option>سایر</option></select></div>
      <div className="form-group"><label className="form-label">سن</label><input className="form-input" dir="ltr" type="number" min="4" inputMode="numeric" /></div>
      <button className="btn btn--dark btn--full">ارسال درخواست ثبت‌نام</button>
    </form>
  );
}
